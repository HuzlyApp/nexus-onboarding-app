import { createClient } from "@supabase/supabase-js";

export async function GET() {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
      return Response.json(
        { error: "Supabase is not configured" },
        { status: 503 }
      );
    }

    const supabase = createClient(url, key);

    // ✅ Fetch workers + count
    const { data, error, count } = await supabase
      .from("worker")
      .select(
        "id, first_name, last_name, job_role, email, phone, address1, city, state, created_at",
        { count: "exact" } // 🔥 important for total workers
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase error:", error);
      return Response.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return Response.json({
      total: count || 0,   // ✅ total workers
      workers: data || [], // ✅ list of workers
    });

  } catch (err: any) {
    console.error("API ERROR:", err);
    return Response.json(
      { error: err.message || "Unexpected error" },
      { status: 500 }
    );
  }
}