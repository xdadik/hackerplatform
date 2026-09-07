import { buildAdminSetCookie, buildAdminToken } from "@/lib/auth-server"
import { env } from "@/lib/env"
import { getClientIp, checkRateLimitServer, recordAttemptServer } from "@/lib/rate-limit-server"

export const runtime = "nodejs"

export async function POST(request: Request) {
  const ip = getClientIp(request)
  const rl = checkRateLimitServer(`admin_login:${ip}`, 5, 900_000)
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

  const userOk = username.trim().toLowerCase() === expectedUser.trim().toLowerCase()
  const passOk = password === pass

  if (!userOk || !passOk) {
    recordAttemptServer(`admin_login:${ip}`, 900_000)
    return Response.json({ error: "Invalid credentials" }, { status: 401 })
  }

  const token = buildAdminToken(pass)
  return Response.json(
    { ok: true },
    { headers: { "Set-Cookie": buildAdminSetCookie(token) } }
  )
}