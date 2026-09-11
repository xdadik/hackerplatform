// Edge-safe admin session helpers (middleware / edge runtime compatible).
// Uses Web Crypto (crypto.subtle) instead of node:crypto so it can run in
// Next.js middleware (Edge runtime).

const ADMIN_TTL_MS = 3600 * 1000

async function hmacHex(data: string, secret: string): Promise<string> {
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  )
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data))
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

export async function verifyAdminTokenEdge(
  token: string | null | undefined,
  secret: string
): Promise<boolean> {
  if (!token || !secret) return false
  const parts = token.split(".")
  if (parts.length !== 3) return false
  const [nonce, expiresAtStr, sig] = parts
  const expiresAt = Number(expiresAtStr)
  if (!Number.isFinite(expiresAt) || Date.now() >= expiresAt) return false
  const unsigned = `${nonce}.${expiresAt}.admin`
  const expected = await hmacHex(unsigned, secret)
  if (expected.length !== sig.length) return false
  // constant-time compare
  let diff = 0
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ sig.charCodeAt(i)
  return diff === 0
}

export function getAdminSessionTokenFromCookie(cookieHeader: string): string | null {
  if (!cookieHeader) return null
  const match = cookieHeader.match(/(?:^|;\s*)aegis_admin_session=([^;]+)/)
  if (!match) return null
  try {
    return decodeURIComponent(match[1])
  } catch {
    // malformed %-sequences (e.g. %ZZ) must not crash the middleware
    return match[1]
  }
}