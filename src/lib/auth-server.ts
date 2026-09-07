import { createHash, createHmac, randomBytes, randomUUID, scrypt as scryptCb, timingSafeEqual } from "crypto"
import { promisify } from "util"
import { getServiceSupabase as getSupabase } from "@/lib/supabase"
import { env } from "@/lib/env"

const scrypt = promisify(scryptCb) as (password: string, salt: string, keylen: number) => Promise<Buffer>

const SCRYPT_KEYLEN = 64
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
  const derived = await scrypt(password, salt, SCRYPT_KEYLEN)
  return `scrypt$${salt}$${derived.toString("hex")}`
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  try {
    const [algo, salt, hashHex] = stored.split("$")
    if (algo !== "scrypt" || !salt || !hashHex) return false
    const derived = await scrypt(password, salt, SCRYPT_KEYLEN)
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

export async function authenticateUser(email: string, password: string): Promise<SessionUser | null> {
  const user = await getUserByEmail(email)
  if (!user || typeof user.password_hash !== "string") return null
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
    .select("user_id, expires_at")
    .eq("token_hash", tokenHash)
    .limit(1)
  if (error || !data || data.length === 0) return null
  const row = data[0]
  if (new Date(row.expires_at).getTime() < Date.now()) {
    await supabase.from("sessions").delete().eq("token_hash", tokenHash)
    return null
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

export function getSessionToken(request: Request): string | null {
  const cookieHeader = request.headers.get("cookie") ?? ""
  const match = cookieHeader.match(/(?:^|;\s*)aegis_session=([^;]+)/)
  return match ? decodeURIComponent(match[1]) : null
}

export function buildSetCookie(token: string): string {
  return `aegis_session=${token}; ${getCookieOptions(SESSION_TTL_DAYS * 24 * 3600).join("; ")}`
}

export function buildClearCookie(): string {
  return `aegis_session=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0`
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
// Admin session (signed httpOnly cookie, no DB row needed)
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
  return match ? decodeURIComponent(match[1]) : null
}

export function buildAdminSetCookie(token: string): string {
  return `aegis_admin_session=${token}; ${getCookieOptions(3600).join("; ")}`
}

export function buildAdminClearCookie(): string {
  return `aegis_admin_session=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0`
}