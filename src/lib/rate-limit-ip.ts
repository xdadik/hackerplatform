// server request IP helper — spoof-resistant.
//
// Trust order:
//  1. cf-connecting-ip  — set by Cloudflare's edge; client-supplied values
//     are overwritten, so this cannot be forged on Cloudflare deployments.
//  2. x-real-ip         — set by our own proxy layer, not by clients.
//  3. x-forwarded-for   — RIGHTMOST entry only. Clients can forge entries at
//     the LEFT of the list (XFF: fake-ip, real-ip), and proxies append the
//     real peer IP at the right — so the last hop is the only trustworthy
//     one. Trusting forwarded.split(",")[0] let attackers rotate fake IPs
//     and bypass rate limits (and frame victims).
//  4. "unknown"         — local dev (no proxy headers present).

export function getClientIp(request: Request): string {
  const cf = request.headers.get("cf-connecting-ip")
  if (cf && cf.trim()) return cf.trim()

  const realIp = request.headers.get("x-real-ip")
  if (realIp && realIp.trim()) return realIp.trim()

  const forwarded = request.headers.get("x-forwarded-for")
  if (forwarded) {
    const hops = forwarded.split(",").map(p => p.trim()).filter(Boolean)
    if (hops.length > 0) return hops[hops.length - 1]
  }

  return "unknown"
}
