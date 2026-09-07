import { createSession, createUser, validatePasswordPolicy } from "@/lib/auth-server"
import { sanitizeEmail } from "@/lib/sanitize"
import { getClientIp, checkRateLimitServer, recordAttemptServer } from "@/lib/rate-limit-server"

export const runtime = "nodejs"

const NAME_MAX = 64

export async function POST(request: Request) {
  const ip = getClientIp(request)
  const rl = checkRateLimitServer(`signup:${ip}`, 5, 900_000)
  if (rl.limited) {
    return Response.json(
      { error: "Too many attempts. Try again later." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rl.resetMs / 1000)) } }
    )
  }

  let body: { email?: unknown; password?: unknown; name?: unknown } | null = null
  try { body = await request.json() } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const email = sanitizeEmail(String(body?.email ?? ""))
  const password = typeof body?.password === "string" ? body.password : ""
  const name = typeof body?.name === "string" ? body.name.trim().slice(0, NAME_MAX) : ""

  if (!email || !email.includes("@") || email.length > 254) {
    recordAttemptServer(`signup:${ip}`)
    return Response.json({ error: "Valid email required" }, { status: 400 })
  }
  const policy = validatePasswordPolicy(password)
  if (!policy.ok) {
    recordAttemptServer(`signup:${ip}`)
    return Response.json({ error: policy.error }, { status: 400 })
  }
  if (!name) {
    recordAttemptServer(`signup:${ip}`)
    return Response.json({ error: "Name required" }, { status: 400 })
  }

  try {
    const user = await createUser({ email, password, name })
    const token = await createSession(user.id)
    const isSecure = process.env.NODE_ENV === "production"
    return Response.json(
      { user: { id: user.id, email: user.email, name: user.name, plan: user.plan, role: user.role, provider: user.provider, reputation: user.reputation }, ok: true },
      {
        status: 201,
        headers: {
          "Set-Cookie": `aegis_session=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=2592000${isSecure ? "; Secure" : ""}`,
        },
      }
    )
  } catch (err) {
    if (err instanceof Error && err.message === "EMAIL_TAKEN") {
      recordAttemptServer(`signup:${ip}`)
      return Response.json({ error: "An account with this email already exists" }, { status: 409 })
    }
    console.error("[signup] failed:", err)
    return Response.json({ error: "Signup failed" }, { status: 500 })
  }
}