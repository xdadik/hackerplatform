/**
 * Client-side rate limiting — defense-in-depth for login, flag submit, comments.
 * Server must enforce authoritative limits (PHP admin.php does 5/15min, FastAPI will do Redis).
 * This prevents brute-force UI abuse and gives immediate UX feedback.
 */

type AttemptMap = Record<string, number[]>

const STORAGE_PREFIX = "aegis_rl_"

function now(): number { return Date.now() }

function loadAttempts(key: string): number[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key)
    if (!raw) return []
    const parsed = JSON.parse(raw) as number[]
    return Array.isArray(parsed) ? parsed : []
  } catch { return [] }
}

function saveAttempts(key: string, arr: number[]): void {
  if (typeof window === "undefined") return
  try { localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(arr)) } catch {}
}

/**
 * Check if action is rate limited.
 * @param key e.g. "login", "flag_challenge123"
 * @param max max attempts
 * @param windowMs window in ms
 * @returns { limited: boolean, remaining: number, resetMs: number }
 */
export function checkRateLimit(key: string, max = 5, windowMs = 60_000): { limited: boolean; remaining: number; resetMs: number } {
  const attempts = loadAttempts(key).filter(t => now() - t < windowMs)
  // persist pruned list
  saveAttempts(key, attempts)
  const limited = attempts.length >= max
  const remaining = Math.max(0, max - attempts.length)
  const oldest = attempts[0] ?? now()
  const resetMs = limited ? (oldest + windowMs - now()) : 0
  return { limited, remaining, resetMs }
}

export function recordAttempt(key: string, success = false): void {
  if (success) {
    // On success, optionally clear? For login, clear on success to allow retry
    // We keep attempts but could clear — here we keep for audit, clear only if explicitly reset
    return
  }
  const attempts = loadAttempts(key).filter(t => now() - t < 60_000 * 15)
  attempts.push(now())
  saveAttempts(key, attempts)
}

export function resetRateLimit(key: string): void {
  if (typeof window === "undefined") return
  try { localStorage.removeItem(STORAGE_PREFIX + key) } catch {}
}

export function formatReset(ms: number): string {
  const s = Math.ceil(ms / 1000)
  if (s < 60) return `${s}s`
  const m = Math.ceil(s / 60)
  return `${m}m`
}

// Preset limiters
export const loginLimiter = {
  key: "login",
  max: 5,
  windowMs: 15 * 60 * 1000, // 15 min — matches PHP
  check: () => checkRateLimit("login", 5, 15 * 60 * 1000),
  record: (success: boolean) => recordAttempt("login", success),
  reset: () => resetRateLimit("login"),
}

export const adminLoginLimiter = {
  key: "admin_login",
  max: 5,
  windowMs: 15 * 60 * 1000,
  check: () => checkRateLimit("admin_login", 5, 15 * 60 * 1000),
  record: (success: boolean) => recordAttempt("admin_login", success),
  reset: () => resetRateLimit("admin_login"),
}

export const flagLimiter = {
  check: (id: string) => checkRateLimit(`flag_${id}`, 5, 60_000),
  record: (id: string) => recordAttempt(`flag_${id}`, false),
}

export const commentLimiter = {
  check: () => checkRateLimit("comment", 10, 60_000),
  record: () => recordAttempt("comment", false),
}
