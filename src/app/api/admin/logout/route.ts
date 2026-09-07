import { buildAdminClearCookie } from "@/lib/auth-server"

export const runtime = "nodejs"

export async function POST() {
  return Response.json({ ok: true }, { headers: { "Set-Cookie": buildAdminClearCookie() } })
}