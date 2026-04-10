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
  const upper = s.toUpperCase();
  return Array.from(new Set([s, title, upper]));
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
      const baseColsOptions = [
        "id, first_name, last_name, job_role, email, phone, address1, city, state, zip, created_at",
        "id, first_name, last_name, job_role, email, phone, address1, city, state, created_at",
      ] as const;

      // Some DBs have `status` (text) while others have `worker_status` (enum) with constraint `worker_status_chk`.
      // Try `status` first; if the column is missing, retry with `worker_status`.
      const attempts = [
        { col: "status" as const, extra: "status" as const },
        { col: "worker_status" as const, extra: "worker_status" as const },
      ];

      let data: unknown[] | null = null;
      let error: SbErr | null = null;
      let count: number | null = null;

      outer: for (const baseCols of baseColsOptions) {
        for (const a of attempts) {
          const select = `${baseCols}, ${a.extra}`;

          if (status === "new") {
            const variants = statusVariants(status);
            const [rIn, rNull] = await Promise.all([
              headOnly
                ? supabase
                    .from("worker")
                    .select(select, { count: "exact", head: true })
                    .in(a.col, variants)
                : supabase
                    .from("worker")
                    .select(select)
                    .in(a.col, variants)
                    .order("created_at", { ascending: false }),
              headOnly
                ? supabase
                    .from("worker")
                    .select(select, { count: "exact", head: true })
                    .is(a.col, null)
                : supabase
                    .from("worker")
                    .select(select)
                    .is(a.col, null)
                    .order("created_at", { ascending: false }),
            ]);

            if (rIn.error || rNull.error) {
              const e = rIn.error ?? rNull.error!;
              error = {
                message: e.message || "Supabase query failed",
                code: (e as { code?: string }).code,
              };
              data = null;
              count = null;
              if (!isMissingColumnErr(error)) break outer;
              continue;
            }

            if (headOnly) {
              data = [];
              count = (rIn.count ?? 0) + (rNull.count ?? 0);
              error = null;
            } else {
              const map = new Map<string, unknown>();
              const combined = [
                ...((rIn.data as unknown[] | null) ?? []),
                ...((rNull.data as unknown[] | null) ?? []),
              ];
              for (const row of combined) {
                const rec = row as Record<string, unknown>;
                const id = rec.id != null ? String(rec.id) : "";
                if (!id) continue;
                if (!map.has(id)) map.set(id, row);
              }
              const merged = [...map.values()].sort((x, y) => {
                const ax = new Date(
                  String((x as { created_at?: string }).created_at ?? 0)
                ).getTime();
                const ay = new Date(
                  String((y as { created_at?: string }).created_at ?? 0)
                ).getTime();
                return ay - ax;
              });
              data = merged;
              count = merged.length;
              error = null;
            }
          } else {
            let q = supabase.from("worker").select(select, { count: "exact", head: headOnly });
            if (status) q = q.in(a.col, statusVariants(status));
            const res = await q.order("created_at", { ascending: false });
            data = (res.data as unknown[] | null) ?? null;
            error = res.error
              ? { message: res.error.message, code: (res.error as { code?: string }).code }
              : null;
            count = typeof res.count === "number" ? res.count : null;
          }

          if (!error) break outer;
          if (!isMissingColumnErr(error)) break outer;
        }
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