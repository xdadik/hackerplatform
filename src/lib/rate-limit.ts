// client rate limit

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

export function checkRateLimit(key: string, max = 5, windowMs = 60_000): { limited: boolean; remaining: number; resetMs: number } {
  const attempts = loadAttempts(key).filter(t => now() - t < windowMs)
  saveAttempts(key, attempts)
  const limited = attempts.length >= max
  const remaining = Math.max(0, max - attempts.length)
  const oldest = attempts[0] ?? now()
  const resetMs = limited ? (oldest + windowMs - now()) : 0
  return { limited, remaining, resetMs }
}

export function recordAttempt(key: string, success = false): void {
  if (success) {
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

export const loginLimiter = {
  key: "login",
  max: 5,
  windowMs: 15 * 60 * 1000,
  check: () => checkRateLimit("login", 5, 15 * 60 * 1000),
  record: (success: boolean) => recordAttempt("login", success),
  reset: () => resetRateLimit("login"),
}

// Signup gets its OWN bucket — sharing loginLimiter meant a failed signup
// could lock a user out of logging in (and vice versa) for 15 minutes.
export const signupLimiter = {
  key: "signup",
  max: 5,
  windowMs: 15 * 60 * 1000,
  check: () => checkRateLimit("signup", 5, 15 * 60 * 1000),
  record: (success: boolean) => recordAttempt("signup", success),
  reset: () => resetRateLimit("signup"),
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
