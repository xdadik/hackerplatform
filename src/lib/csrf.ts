// csrf — double-submit

const CSRF_KEY = "aegis_csrf_token"
const CSRF_HEADER = "x-csrf-token"

export function generateCsrfToken(): string {
  try {
    const arr = new Uint8Array(32)
    crypto.getRandomValues(arr)
    return Array.from(arr).map(b => b.toString(16).padStart(2, "0")).join("")
  } catch {
    if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID()
    return Date.now().toString(36) + Math.random().toString(36).slice(2)
  }
}

export function getOrCreateCsrfToken(): string {
  if (typeof window === "undefined") return ""
  try {
    let t = sessionStorage.getItem(CSRF_KEY)
    if (!t) {
      t = generateCsrfToken()
      sessionStorage.setItem(CSRF_KEY, t)
      document.cookie = `${CSRF_KEY}=${t}; Path=/; SameSite=Strict`
    }
    return t
  } catch {
    return generateCsrfToken()
  }
}

export function validateCsrfToken(token: string): boolean {
  if (typeof window === "undefined") return false
  try {
    const stored = sessionStorage.getItem(CSRF_KEY)
    return !!stored && !!token && stored === token
  } catch {
    return false
  }
}

export function csrfHeaders(): Record<string, string> {
  const token = getOrCreateCsrfToken()
  return { [CSRF_HEADER]: token }
}

export async function csrfFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers || {})
  const token = getOrCreateCsrfToken()
  headers.set(CSRF_HEADER, token)
  headers.set("X-Requested-With", "XMLHttpRequest")
  return fetch(input, { ...init, headers, credentials: "same-origin" })
}

export const CSRF_HEADER_NAME = CSRF_HEADER
export const CSRF_STORAGE_KEY = CSRF_KEY
