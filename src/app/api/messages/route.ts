import { getSessionToken, getUserBySession } from "@/lib/auth-server"
import { getServiceSupabase } from "@/lib/supabase"
import { sanitizeInput } from "@/lib/sanitize"
import { getClientIp, checkRateLimitServer, recordAttemptServer } from "@/lib/rate-limit-server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const token = getSessionToken(request)
  const user = token ? await getUserBySession(token) : null
  if (!user) return Response.json({ error: "Not authenticated" }, { status: 401 })
  const supabase = getServiceSupabase()
  if (!supabase) return Response.json({ error: "Database is not configured" }, { status: 503 })
  const { data, error } = await supabase
    .from("messages")
    .select("id,from_role,text,read,created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(200)
  if (error) return Response.json({ error: "Failed to load messages" }, { status: 500 })
  try {
    await supabase.from("messages").update({ read: true }).eq("user_id", user.id).eq("from_role", "admin").eq("read", false)
  } catch {}
  return Response.json({
    messages: (data ?? []).map((m) => ({
      id: String(m.id),
      from: m.from_role === "admin" ? "them" : "me",
      text: String(m.text ?? ""),
      at: String(m.created_at ?? ""),
      read: !!m.read,
    })),
  })
}

export async function POST(request: Request) {
  const ip = getClientIp(request)
  if (checkRateLimitServer(`msg:${ip}`, 10, 60_000).limited) {
    return Response.json({ error: "Too many messages. Slow down." }, { status: 429 })
  }
  const token = getSessionToken(request)
  const user = token ? await getUserBySession(token) : null
  if (!user) return Response.json({ error: "Not authenticated" }, { status: 401 })
  let body: { text?: unknown } | null = null
  try { body = await request.json() } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 })
  }
  const text = sanitizeInput(typeof body?.text === "string" ? body.text : "", 1000).trim()
  if (!text) return Response.json({ error: "Message is required" }, { status: 400 })
  const supabase = getServiceSupabase()
  if (!supabase) return Response.json({ error: "Database is not configured" }, { status: 503 })
  const { data, error } = await supabase
    .from("messages")
    .insert({ user_id: user.id, from_role: "user", text })
    .select("id,from_role,text,created_at")
    .single()
  if (error || !data) return Response.json({ error: "Could not send message" }, { status: 500 })
  recordAttemptServer(`msg:${ip}`, 60_000)
  return Response.json({
    message: { id: String(data.id), from: "me", text: String(data.text ?? ""), at: String(data.created_at ?? "") },
    ok: true,
  }, { status: 201 })
}
