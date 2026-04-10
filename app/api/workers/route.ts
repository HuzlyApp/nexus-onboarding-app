import { createClient } from "@supabase/supabase-js";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase-env";

type WorkerStatus = "new" | "pending" | "approved" | "disapproved";
type SbErr = { message: string; code?: string };

function parseStatus(v: string | null): WorkerStatus | null {
  if (!v) return null;
  const s = v.trim().toLowerCase();
  if (s === "new" || s === "pending" || s === "approved" || s === "disapproved") return s;
  return null;
}

function statusVariants(s: WorkerStatus): string[] {
  // Some DBs store enum/text values in Title Case (e.g. "New") instead of lowercase.
  const title = s.slice(0, 1).toUpperCase() + s.slice(1);
  return Array.from(new Set([s, title]));
}

export async function GET(req: Request) {
  try {
    const urlObj = new URL(req.url);
    const status = parseStatus(urlObj.searchParams.get("status"));
    const headOnly = urlObj.searchParams.get("head") === "1";

    const url = getSupabaseUrl();
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
    const anonKey = getSupabaseAnonKey();
    /** Prefer service role; fall back to anon if missing or rejected (e.g. wrong key in .env). */
    const keys = [serviceKey, anonKey].filter(
      (k): k is string => Boolean(k)
    );

    if (!url || keys.length === 0) {
      return Response.json(
        { error: "Supabase is not configured" },
        { status: 503 }
      );
    }

    let lastMessage = "Failed to load workers";

    const isMissingColumnErr = (e: unknown) => {
      const err = e as { code?: string; message?: string } | null;
      if (!err) return false;
      // Postgres undefined_column
      if (err.code === "42703") return true;
      return typeof err.message === "string" && err.message.includes(" does not exist");
    };

    for (const key of keys) {
      const supabase = createClient(url, key);
      const baseCols =
        "id, first_name, last_name, job_role, email, phone, address1, city, state, created_at";

      // Some DBs have `status` (text) while others have `worker_status` (enum) with constraint `worker_status_chk`.
      // Try `status` first; if the column is missing, retry with `worker_status`.
      const attempts = [
        { col: "status", select: `${baseCols}, status` },
        { col: "worker_status", select: `${baseCols}, worker_status` },
      ] as const;

      let data: unknown[] | null = null;
      let error: SbErr | null = null;
      let count: number | null = null;

      for (const a of attempts) {
        let q = supabase.from("worker").select(a.select, { count: "exact", head: headOnly });
        if (status) q = q.in(a.col, statusVariants(status));
        const res = await q.order("created_at", { ascending: false });
        data = (res.data as unknown[] | null) ?? null;
        error = res.error ? { message: res.error.message, code: (res.error as { code?: string }).code } : null;
        count = typeof res.count === "number" ? res.count : null;
        if (!error) break;
        if (!isMissingColumnErr(error)) break;
      }

      if (!error) {
        const normalized = (data ?? []).map((row) => {
          const r = row as Record<string, unknown>;
          const statusVal = (r.status ?? r.worker_status) as unknown;
          const s =
            typeof statusVal === "string" && statusVal.trim()
              ? statusVal.trim().toLowerCase()
              : statusVal;
          return { ...r, status: s };
        });
        return Response.json({
          total: count ?? 0,
          workers: headOnly ? [] : normalized,
        });
      }

      const errMsg = error?.message || "Supabase query failed";
      lastMessage = errMsg;
      console.error("Supabase error:", error);
      const retry =
        errMsg === "Invalid API key" && key === serviceKey && anonKey;
      if (!retry) {
        return Response.json({ error: errMsg }, { status: 500 });
      }
    }

    return Response.json({ error: lastMessage }, { status: 500 });
  } catch (err: unknown) {
    console.error("API ERROR:", err);
    const message = err instanceof Error ? err.message : "Unexpected error";
    return Response.json({ error: message }, { status: 500 });
  }
}