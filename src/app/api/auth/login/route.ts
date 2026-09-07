import { authenticateUser, createSession, buildSetCookie } from "@/lib/auth-server"
import { sanitizeEmail } from "@/lib/sanitize"
import { getClientIp, checkRateLimitServer, recordAttemptServer } from "@/lib/rate-limit-server"

export const runtime = "nodejs"

const PASS_MIN = 8

export async function POST(request: Request) {
  const ip = getClientIp(request)
  const rl = checkRateLimitServer(`login:${ip}`, 5, 900_000)
  if (rl.limited) {
    return Response.json(
      { error: "Too many attempts. Try again later." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rl.resetMs / 1000)) } }
    )
  }

  let body: { email?: unknown; password?: unknown } | null = null
  try { body = await request.json() } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const email = sanitizeEmail(String(body?.email ?? ""))
  const password = typeof body?.password === "string" ? body.password : ""

  if (!email || !email.includes("@")) {
    recordAttemptServer(`login:${ip}`)
    return Response.json({ error: "Valid email required" }, { status: 400 })
  }
  if (password.length < PASS_MIN) {
    recordAttemptServer(`login:${ip}`)
    return Response.json({ error: "Password must be at least 8 characters" }, { status: 400 })
  }

  const user = await authenticateUser(email, password)
  if (!user) {
    recordAttemptServer(`login:${ip}`)
    return Response.json({ error: "Invalid email or password" }, { status: 401 })
  }

  try {
    const token = await createSession(user.id)
    return Response.json(
      { user: { id: user.id, email: user.email, name: user.name, plan: user.plan, role: user.role }, ok: true },
      { headers: { "Set-Cookie": buildSetCookie(token) } }
    )
  } catch (err) {
    console.error("[login] session creation failed:", err)
    return Response.json({ error: "Login failed" }, { status: 500 })
  }
}