import { createSession, createUser, validatePasswordPolicy } from "@/lib/auth-server"
import { sanitizeEmail } from "@/lib/sanitize"
import { getClientIp, rateLimitCheck, rateLimitRecord } from "@/lib/rate-limit-server"

export const runtime = "nodejs"

const NAME_MAX = 64
// 5 signups / 15 min per IP, 3 accounts / 24 h per email address.
const SIGNUP_MAX = 5
const SIGNUP_WINDOW = 900_000
const EMAIL_MAX = 3
const EMAIL_WINDOW = 86_400_000

function tooManyAttempts(resetMs: number): Response {
  return Response.json(
    { error: "Too many attempts. Try again later." },
    { status: 429, headers: { "Retry-After": String(Math.ceil(resetMs / 1000)) } }
  )
}

export async function POST(request: Request) {
  const ip = getClientIp(request)
  const ipBucket = `signup:ip:${ip}`

  let body: { email?: unknown; password?: unknown; name?: unknown } | null = null
  try { body = await request.json() } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const email = sanitizeEmail(String(body?.email ?? ""))
  const password = typeof body?.password === "string" ? body.password : ""
  const name = typeof body?.name === "string" ? body.name.trim().slice(0, NAME_MAX) : ""

  if (!email || !email.includes("@") || email.length > 254) {
    return Response.json({ error: "Valid email required" }, { status: 400 })
  }
  const policy = validatePasswordPolicy(password)
  if (!policy.ok) {
    return Response.json({ error: policy.error }, { status: 400 })
  }
  if (!name) {
    return Response.json({ error: "Name required" }, { status: 400 })
  }

  const rlIp = await rateLimitCheck(ipBucket, SIGNUP_MAX, SIGNUP_WINDOW)
  if (rlIp.limited) return tooManyAttempts(rlIp.resetMs)
  // Per-email cap — a taken-email probe does not count here (it counts on
  // the IP bucket) so honest users are never blocked by this limit.
  const emailBucket = `signup:email:${email}`
  const rlEmail = await rateLimitCheck(emailBucket, EMAIL_MAX, EMAIL_WINDOW)
  if (rlEmail.limited) return tooManyAttempts(rlEmail.resetMs)

  try {
    const user = await createUser({ email, password, name })
    const token = await createSession(user.id)
    // Only actually-created accounts count against the email cap.
    await rateLimitRecord(emailBucket, EMAIL_MAX, EMAIL_WINDOW)
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
      // Enumeration probes hit the IP bucket, not the email bucket.
      await rateLimitRecord(ipBucket, SIGNUP_MAX, SIGNUP_WINDOW)
      return Response.json({ error: "An account with this email already exists" }, { status: 409 })
    }
    console.error("[signup] failed:", err)
    return Response.json({ error: "Signup failed" }, { status: 500 })
  }
}
