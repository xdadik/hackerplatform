import { getSessionToken, getUserBySession } from "@/lib/auth-server"
import { getServiceSupabase } from "@/lib/supabase"
import { sanitizeInput } from "@/lib/sanitize"

export const runtime = "nodejs"

export async function PATCH(request: Request) {
  const token = getSessionToken(request)
  const user = token ? await getUserBySession(token) : null
  if (!user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 })
  }

  let body: { name?: unknown } | null = null
  try { body = await request.json() } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const name = typeof body?.name === "string" ? sanitizeInput(body.name.trim(), 64).trim() : ""
  if (!name) {
    return Response.json({ error: "Name is required" }, { status: 400 })
  }

  const supabase = getServiceSupabase()
  if (!supabase) {
    return Response.json({ error: "Database is not configured" }, { status: 503 })
  }

  const { data, error } = await supabase
    .from("users")
    .update({ name })
    .eq("id", user.id)
    .select("id,email,name,plan,role,reputation,provider,created_at")
    .single()

  if (error || !data) {
    return Response.json({ error: "Could not update profile" }, { status: 500 })
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
