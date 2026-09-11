import { createHash, createHmac, randomBytes, randomUUID, scrypt as scryptCb, timingSafeEqual, type ScryptOptions } from "crypto"
import { promisify } from "util"
import { getServiceSupabase as getSupabase } from "@/lib/supabase"
import { env } from "@/lib/env"

const scrypt = promisify(scryptCb) as (
  password: string,
  salt: string,
  keylen: number,
  options?: ScryptOptions
) => Promise<Buffer>

const SCRYPT_KEYLEN = 64
// v2 parameters (OWASP-recommended cost 2^15). Hashes created before this
// hardening used Node's defaults (N=16384) and keep verifying through the
// legacy branch of verifyPassword; new hashes embed their parameters so a
// future cost upgrade never breaks existing hashes.
const SCRYPT_N = 1 << 15
const SCRYPT_R = 8
const SCRYPT_P = 1
const SCRYPT_MAXMEM = 64 * 1024 * 1024
const SESSION_TTL_DAYS = 30

export type SessionUser = {
  id: string
  email: string
  name: string
  plan: string
  role: string
  provider: string
  reputation: number
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex")
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex")
  const derived = await scrypt(password, salt, SCRYPT_KEYLEN, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
    maxmem: SCRYPT_MAXMEM,
  })
  // scrypt2$N$r$p$salt$hash — self-describing format (v1 was scrypt$salt$hash)
  return `scrypt2$${SCRYPT_N}$${SCRYPT_R}$${SCRYPT_P}$${salt}$${derived.toString("hex")}`
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  try {
    const parts = stored.split("$")
    let N = 16384 // v1 hashes used Node's default parameters
    let r = 8
    let p = 1
    let salt: string
    let hashHex: string
    if (parts[0] === "scrypt2" && parts.length === 6) {
      N = parseInt(parts[1], 10)
      r = parseInt(parts[2], 10)
      p = parseInt(parts[3], 10)
      salt = parts[4]
      hashHex = parts[5]
      if (!Number.isFinite(N) || !Number.isFinite(r) || !Number.isFinite(p) || N <= 0 || r <= 0 || p <= 0) return false
    } else if (parts[0] === "scrypt" && parts.length === 3) {
      salt = parts[1]
      hashHex = parts[2]
    } else {
      return false
    }
    if (!salt || !hashHex) return false
    const derived = await scrypt(password, salt, SCRYPT_KEYLEN, { N, r, p, maxmem: SCRYPT_MAXMEM })
    const expected = Buffer.from(hashHex, "hex")
    return expected.length === derived.length && timingSafeEqual(expected, derived)
  } catch {
    return false
  }
}

export function getCookieOptions(maxAgeSeconds: number): string[] {
  const parts = [
    `Path=/`,
    `HttpOnly`,
    `SameSite=Strict`,
    `Max-Age=${maxAgeSeconds}`,
  ]
  if (env.IS_PRODUCTION) parts.push("Secure")
  return parts
}

async function getUserByEmail(email: string) {
  const supabase = getSupabase()
  if (!supabase) return null
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("email", email.toLowerCase().trim())
    .limit(1)
  if (error || !data || data.length === 0) return null
  return data[0] as Record<string, unknown> & { id: string }
}

export async function createUser(input: {
  email: string
  name: string
  password: string
  provider?: string
}): Promise<SessionUser> {
  const supabase = getSupabase()
  if (!supabase) throw new Error("Supabase is not configured")
  const userId = randomUUID()
  const passwordHash = await hashPassword(input.password)
  const email = input.email.toLowerCase().trim()
  const { data, error } = await supabase
    .from("users")
    .insert({
      id: userId,
      email,
      name: input.name.trim(),
      plan: "free",
      provider: input.provider ?? "email",
      role: "user",
      reputation: 0,
      status: "Active",
      password_hash: passwordHash,
    })
    .select("*")
    .single()
  if (error) {
    if (String(error).toLowerCase().includes("duplicate")) {
      throw new Error("EMAIL_TAKEN")
    }
    throw error
  }
  return rowToSessionUser(data as Record<string, unknown>)
}

// Dummy hash used when the email does not exist — running the same scrypt
// work as a real check keeps login timing flat so attackers cannot enumerate
// which emails have accounts by measuring response times.
let dummyHashPromise: Promise<string> | null = null
function getDummyHash(): Promise<string> {
  if (!dummyHashPromise) {
    dummyHashPromise = hashPassword(`dummy-${randomBytes(16).toString("hex")}`)
  }
  return dummyHashPromise
}

export async function authenticateUser(email: string, password: string): Promise<SessionUser | null> {
  const user = await getUserByEmail(email)
  if (!user || typeof user.password_hash !== "string" || !user.password_hash) {
    const dummy = await getDummyHash()
    await verifyPassword(password, dummy) // equal work, result discarded
    return null
  }
  const ok = await verifyPassword(password, user.password_hash)
  if (!ok) return null
  if (user.status === "Banned") return null
  return rowToSessionUser(user)
}

export async function createSession(userId: string): Promise<string> {
  const supabase = getSupabase()
  if (!supabase) throw new Error("Supabase is not configured")
  const token = randomBytes(32).toString("base64url")
  const tokenHash = sha256(token)
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 3600 * 1000).toISOString()
  const { error } = await supabase.from("sessions").insert({
    user_id: userId,
    token_hash: tokenHash,
    expires_at: expiresAt,
    last_seen_at: new Date().toISOString(),
  })
  if (error) throw error
  return token
}

export async function deleteSession(token: string): Promise<void> {
  const supabase = getSupabase()
  if (!supabase) return
  const tokenHash = sha256(token)
  await supabase.from("sessions").delete().eq("token_hash", tokenHash)
}

export async function getUserBySession(token: string | null | undefined): Promise<SessionUser | null> {
  if (!token) return null
  const supabase = getSupabase()
  if (!supabase) return null
  const tokenHash = sha256(token)
  const { data, error } = await supabase
    .from("sessions")
    .select("id, user_id, expires_at, last_seen_at")
    .eq("token_hash", tokenHash)
    .limit(1)
  if (error || !data || data.length === 0) return null
  const row = data[0]
  if (new Date(row.expires_at).getTime() < Date.now()) {
    await supabase.from("sessions").delete().eq("token_hash", tokenHash)
    return null
  }

  // Sliding expiration: extend the session when it was last seen > 1h ago.
  // Also opportunistically clean up this user's expired sessions.
  try {
    const lastSeen = new Date(row.last_seen_at).getTime()
    const oneHour = 3600 * 1000
    if (Number.isFinite(lastSeen) && Date.now() - lastSeen > oneHour) {
      const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 3600 * 1000).toISOString()
      await supabase.from("sessions").update({ last_seen_at: new Date().toISOString(), expires_at: expiresAt }).eq("id", row.id)
      await supabase.from("sessions").delete().eq("user_id", row.user_id).lt("expires_at", new Date().toISOString())
    }
  } catch {
    /* sliding refresh is best-effort — never block auth on it */
  }

  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("*")
    .eq("id", row.user_id)
    .limit(1)
  if (userError || !userData || userData.length === 0) return null
  const user = userData[0]
  if (user.status === "Banned") return null
  return rowToSessionUser(user)
}

function safeDecodeCookieValue(raw: string): string {
  try {
    return decodeURIComponent(raw)
  } catch {
    // malformed %-sequences (e.g. %ZZ) must not 500 the whole route
    return raw
  }
}

export function getSessionToken(request: Request): string | null {
  const cookieHeader = request.headers.get("cookie") ?? ""
  const match = cookieHeader.match(/(?:^|;\s*)aegis_session=([^;]+)/)
  return match ? safeDecodeCookieValue(match[1]) : null
}

export function buildSetCookie(token: string): string {
  return `aegis_session=${token}; ${getCookieOptions(SESSION_TTL_DAYS * 24 * 3600).join("; ")}`
}

export function buildClearCookie(): string {
  const parts = ["aegis_session=", "Path=/", "HttpOnly", "SameSite=Strict", "Max-Age=0"]
  if (env.IS_PRODUCTION) parts.push("Secure")
  return parts.join("; ")
}

export function rowToSessionUser(row: Record<string, unknown>): SessionUser {
  return {
    id: String(row.id),
    email: String(row.email ?? ""),
    name: String(row.name ?? ""),
    plan: String(row.plan ?? "free"),
    role: String(row.role ?? "user"),
    provider: String(row.provider ?? "email"),
    reputation: Number(row.reputation ?? 0),
  }
}

// ---------------------------------------------------------------------------
// Password policy — shared by signup (and future password reset)
// ---------------------------------------------------------------------------

const COMMON_PASSWORDS = new Set([
  "password", "password1", "password123", "passw0rd", "p@ssw0rd",
  "12345678", "123456789", "1234567890", "qwerty123", "qwertyuiop",
  "letmein", "letmein123", "iloveyou", "admin123", "admin1234",
  "welcome1", "welcome123", "abc12345", "test1234", "testtest",
  "hackerman", "hackme123", "aegis123", "cybersecurity",
])

export function validatePasswordPolicy(password: string): { ok: boolean; error?: string } {
  if (password.length < 8) return { ok: false, error: "Password must be at least 8 characters" }
  if (password.length > 128) return { ok: false, error: "Password must be at most 128 characters" }
  if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
    return { ok: false, error: "Password must contain both letters and numbers" }
  }
  if (COMMON_PASSWORDS.has(password.toLowerCase())) {
    return { ok: false, error: "This password is too common — choose something stronger" }
  }
  return { ok: true }
}

// ---------------------------------------------------------------------------
// Admin session (signed httpOnly cookie, no DB row needed)
//
// SIGNING SECRET: pass NEXTAUTH_SECRET (never ADMIN_PASS). The signing key
// must be safe to expose to an HMAC oracle — the admin password is not,
// because a leaked/brute-forced token would then reveal it. Callers keep
// ADMIN_PASS strictly for the login comparison. (See /api/admin/login,
// src/lib/admin-api.ts and middleware.ts for the shared fallback chain:
// NEXTAUTH_SECRET || ADMIN_PASS.)
// ---------------------------------------------------------------------------

const ADMIN_TTL_MS = 3600 * 1000

function hmacSign(data: string, secret: string): string {
  return createHmac("sha256", secret).update(data).digest("hex")
}

/**
 * Build an admin session token: nonce.expiresAt.signature
 * Signature covers nonce + expiry + a constant admin context string.
 */
export function buildAdminToken(secret: string): string {
  const issuedAt = Date.now()
  const expiresAt = issuedAt + ADMIN_TTL_MS
  const nonce = randomBytes(16).toString("hex")
  const unsigned = `${nonce}.${expiresAt}.admin`
  return `${nonce}.${expiresAt}.${hmacSign(unsigned, secret)}`
}

/**
 * Verify + decode an admin session token. Returns true when valid & unexpired.
 */
export function verifyAdminToken(token: string | null | undefined, secret: string): boolean {
  if (!token) return false
  const parts = token.split(".")
  if (parts.length !== 3) return false
  const [nonce, expiresAtStr, sig] = parts
  const expiresAt = Number(expiresAtStr)
  if (!Number.isFinite(expiresAt)) return false
  const unsigned = `${nonce}.${expiresAt}.admin`
  const expected = hmacSign(unsigned, secret)
  const a = Buffer.from(sig, "utf8")
  const b = Buffer.from(expected, "utf8")
  if (a.length !== b.length) return false
  if (!timingSafeEqual(a, b)) return false
  return Date.now() < expiresAt
}

export function getAdminSessionToken(request: Request): string | null {
  const cookieHeader = request.headers.get("cookie") ?? ""
  const match = cookieHeader.match(/(?:^|;\s*)aegis_admin_session=([^;]+)/)
  return match ? safeDecodeCookieValue(match[1]) : null
}

export function buildAdminSetCookie(token: string): string {
  return `aegis_admin_session=${token}; ${getCookieOptions(3600).join("; ")}`
}

export function buildAdminClearCookie(): string {
  const parts = ["aegis_admin_session=", "Path=/", "HttpOnly", "SameSite=Strict", "Max-Age=0"]
  if (env.IS_PRODUCTION) parts.push("Secure")
  return parts.join("; ")
}