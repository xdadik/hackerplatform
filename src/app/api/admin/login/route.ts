import { createHash, timingSafeEqual } from "crypto"
import { buildAdminSetCookie, buildAdminToken } from "@/lib/auth-server"
import { env } from "@/lib/env"
import { getClientIp, rateLimitCheck, rateLimitRecord, rateLimitReset } from "@/lib/rate-limit-server"

export const runtime = "nodejs"

const ADMIN_LOGIN_MAX = 5
const ADMIN_LOGIN_WINDOW = 900_000

/** Constant-time string comparison (hash first so lengths never leak). */
function safeEqual(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a, "utf8").digest()
  const hb = createHash("sha256").update(b, "utf8").digest()
  return timingSafeEqual(ha, hb)
}

export async function POST(request: Request) {
  const ip = getClientIp(request)
  const bucket = `admin_login:ip:${ip}`

  const rl = await rateLimitCheck(bucket, ADMIN_LOGIN_MAX, ADMIN_LOGIN_WINDOW)
  if (rl.limited) {
    return Response.json(
      { error: "Too many attempts. Try again later." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rl.resetMs / 1000)) } }
    )
  }

  let body: { username?: unknown; password?: unknown } | null = null
  try { body = await request.json() } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const username = String(body?.username ?? "")
  const password = String(body?.password ?? "")
  const pass = env.ADMIN_PASS
  const expectedUser = env.ADMIN_USER || "admin"

  if (!pass || pass === "change-me") {
    return Response.json(
      { error: "ADMIN_PASS is not configured. Set ADMIN_PASS in .env.local before using the admin panel." },
      { status: 500 }
    )
  }

  const userOk = safeEqual(username.trim().toLowerCase(), expectedUser.trim().toLowerCase())
  const passOk = password.length > 0 && safeEqual(password, pass)

  if (!userOk || !passOk) {
    await rateLimitRecord(bucket, ADMIN_LOGIN_MAX, ADMIN_LOGIN_WINDOW)
    return Response.json({ error: "Invalid credentials" }, { status: 401 })
  }

  // Sign the admin cookie with NEXTAUTH_SECRET (never with the password —
  // a signing key double as an offline brute-force oracle for ADMIN_PASS).
  // The fallback keeps local dev working when NEXTAUTH_SECRET is unset;
  // middleware + admin-api use the identical chain so tokens always match.
  const signingSecret = env.NEXTAUTH_SECRET || env.ADMIN_PASS
  const token = buildAdminToken(signingSecret)
  await rateLimitReset(bucket)
  return Response.json(
    { ok: true },
    { headers: { "Set-Cookie": buildAdminSetCookie(token) } }
  )
}
