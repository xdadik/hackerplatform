import { buildClearCookie, deleteSession, getSessionToken } from "@/lib/auth-server"

export const runtime = "nodejs"

export async function POST(request: Request) {
  const token = getSessionToken(request)
  if (token) await deleteSession(token)
  return Response.json({ ok: true }, { headers: { "Set-Cookie": buildClearCookie() } })
}