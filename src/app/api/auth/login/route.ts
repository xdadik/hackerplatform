import { authenticateUser, createSession, buildSetCookie } from "@/lib/auth-server"
import { getServiceSupabase } from "@/lib/supabase"
import { sanitizeEmail } from "@/lib/sanitize"
import { getClientIp, rateLimitCheck, rateLimitRecord, rateLimitReset } from "@/lib/rate-limit-server"

export const runtime = "nodejs"

const PASS_MIN = 8
// 10 attempts / 15 min per IP AND per account, counting only real credential
// failures (401s) — typos in the email/password format do not burn attempts,
// and a successful login resets the counters.
const LOGIN_MAX = 10
const LOGIN_WINDOW = 900_000

function tooManyAttempts(resetMs: number): Response {
  return Response.json(
    { error: "Too many attempts. Try again later." },
    { status: 429, headers: { "Retry-After": String(Math.ceil(resetMs / 1000)) } }
  )
}

export async function POST(request: Request) {
  const ip = getClientIp(request)
  const ipBucket = `login:ip:${ip}`

  let body: { email?: unknown; password?: unknown } | null = null
  try { body = await request.json() } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const email = sanitizeEmail(String(body?.email ?? ""))
  const password = typeof body?.password === "string" ? body.password : ""

  if (!email || !email.includes("@")) {
    return Response.json({ error: "Valid email required" }, { status: 400 })
  }
  if (password.length < PASS_MIN) {
    return Response.json({ error: `Password must be at least ${PASS_MIN} characters` }, { status: 400 })
  }

  // Per-account bucket stops one account from being hammered from many IPs.
  const accountBucket = `login:acct:${email}`

  const rlIp = await rateLimitCheck(ipBucket, LOGIN_MAX, LOGIN_WINDOW)
  if (rlIp.limited) return tooManyAttempts(rlIp.resetMs)
  const rlAcct = await rateLimitCheck(accountBucket, LOGIN_MAX, LOGIN_WINDOW)
  if (rlAcct.limited) return tooManyAttempts(rlAcct.resetMs)

  const user = await authenticateUser(email, password)
  if (!user) {
    await rateLimitRecord(ipBucket, LOGIN_MAX, LOGIN_WINDOW)
    await rateLimitRecord(accountBucket, LOGIN_MAX, LOGIN_WINDOW)
    return Response.json({ error: "Invalid email or password" }, { status: 401 })
  }

  try {
    const token = await createSession(user.id)
    // Successful login clears the failed-attempt counters for this IP+account.
    await rateLimitReset(ipBucket)
    await rateLimitReset(accountBucket)
    // Best-effort: stamp last_login_at (column added by 0002 migration)
    try {
      const svc = getServiceSupabase()
      if (svc) await svc.from("users").update({ last_login_at: new Date().toISOString() }).eq("id", user.id)
    } catch {
      /* non-fatal */
    }
    return Response.json(
      { user: { id: user.id, email: user.email, name: user.name, plan: user.plan, role: user.role, provider: user.provider, reputation: user.reputation }, ok: true },
      { headers: { "Set-Cookie": buildSetCookie(token) } }
    )
  } catch (err) {
    console.error("[login] session creation failed:", err)
    return Response.json({ error: "Login failed" }, { status: 500 })
  }
}
