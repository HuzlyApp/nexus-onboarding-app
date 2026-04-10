import { createClient } from "@supabase/supabase-js";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase-env";

export async function GET() {
  try {
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

    for (const key of keys) {
      const supabase = createClient(url, key);
      const { data, error, count } = await supabase
        .from("worker")
        .select(
          "id, first_name, last_name, job_role, email, phone, address1, city, state, created_at",
          { count: "exact" }
        )
        .order("created_at", { ascending: false });

      if (!error) {
        return Response.json({
          total: count ?? 0,
          workers: data ?? [],
        });
      }

      lastMessage = error.message;
      console.error("Supabase error:", error);
      const retry =
        error.message === "Invalid API key" && key === serviceKey && anonKey;
      if (!retry) {
        return Response.json({ error: error.message }, { status: 500 });
      }
    }

    return Response.json({ error: lastMessage }, { status: 500 });
  } catch (err: unknown) {
    console.error("API ERROR:", err);
    const message = err instanceof Error ? err.message : "Unexpected error";
    return Response.json({ error: message }, { status: 500 });
  }
}