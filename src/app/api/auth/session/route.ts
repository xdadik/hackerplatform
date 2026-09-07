import { getSessionToken, getUserBySession } from "@/lib/auth-server"

export const runtime = "nodejs"

export async function GET(request: Request) {
  const token = getSessionToken(request)
  const user = token ? await getUserBySession(token) : null
  if (!user) {
    return Response.json({ user: null, ok: false }, { status: 401 })
  }
  return Response.json({ user, ok: true })
}