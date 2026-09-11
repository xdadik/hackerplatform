import { getServiceSupabase } from "@/lib/supabase"

export const dynamic = "force-dynamic"

export async function GET() {
  const version =
    process.env.NEXT_PUBLIC_APP_VERSION ??
    process.env.npm_package_version ??
    "0.1.0"

  const nodeEnv = process.env.NODE_ENV === "production" ? "production" : "dev"

  // Database connectivity check (service-role, 3s budget).
  // - "ok"            : DB reachable
  // - "unconfigured"  : env keys missing (build/dev without secrets)
  // - "error"         : keys set but DB unreachable / migration not run
  let db: "ok" | "unconfigured" | "error" = "unconfigured"
  const supabase = getServiceSupabase()
  if (supabase) {
    try {
      const { error } = await supabase.from("users").select("id").limit(1)
      db = error ? "error" : "ok"
      if (error) {
        // Hint at the most common cause: migration not run yet
        const hint = /relation|does not exist|schema/i.test(error.message)
          ? "Run supabase/migrations/0001_init.sql in the Supabase SQL Editor."
          : error.message
        console.warn("[api/health] DB check failed:", hint)
      }
    } catch {
      db = "error"
    }
  }

  return Response.json(
    {
      status: "ok" as const,
      timestamp: new Date().toISOString(),
      version,
      env: nodeEnv,
      db,
    },
    {
      headers: {
        "Cache-Control": "no-store, must-revalidate",
      },
    }
  )
}
