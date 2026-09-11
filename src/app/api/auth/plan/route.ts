import { getSessionToken, getUserBySession } from "@/lib/auth-server"
import { getServiceSupabase } from "@/lib/supabase"

export const runtime = "nodejs"

const PLANS = ["free", "go", "plus"] as const

export async function PATCH(request: Request) {
  const token = getSessionToken(request)
  const user = token ? await getUserBySession(token) : null
  if (!user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 })
  }

  let body: { plan?: unknown } | null = null
  try { body = await request.json() } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const plan = typeof body?.plan === "string" ? body.plan : ""
  if (!(PLANS as readonly string[]).includes(plan)) {
    return Response.json({ error: "Invalid plan" }, { status: 400 })
  }

  const supabase = getServiceSupabase()
  if (!supabase) {
    return Response.json({ error: "Database is not configured" }, { status: 503 })
  }

  const { data, error } = await supabase
    .from("users")
    .update({ plan })
    .eq("id", user.id)
    .select("id,email,name,plan,role,reputation,provider,created_at")
    .single()

  if (error || !data) {
    return Response.json({ error: "Could not update plan" }, { status: 500 })
  }

  return Response.json({
    user: {
      id: String(data.id),
      email: String(data.email),
      name: String(data.name),
      plan: data.plan,
      role: String(data.role ?? "user"),
      reputation: Number(data.reputation ?? 0),
      createdAt: String(data.created_at ?? new Date().toISOString()),
      provider: String(data.provider ?? "email"),
    },
    ok: true,
  })
}
