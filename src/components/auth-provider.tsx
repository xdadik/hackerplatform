"use client"
import * as React from "react"
import { useRouter } from "next/navigation"

export type AegisUser = {
  id: string
  email: string
  name: string
  plan: "free" | "go" | "plus"
  role: string
  reputation: number
  createdAt: string
  provider?: "email" | "google"
}

type AuthResult = { ok: boolean; error?: string }

type AuthContextType = {
  isLoggedIn: boolean
  isLoading: boolean
  user: AegisUser | null
  login: (email: string, password: string) => Promise<AuthResult>
  signup: (name: string, email: string, password: string) => Promise<AuthResult>
  logout: () => Promise<void>
  loginWithGoogle: () => Promise<AuthResult>
  refresh: () => Promise<void>
}

const AuthContext = React.createContext<AuthContextType | null>(null)

// ---------------------------------------------------------------------------
// Server payload -> AegisUser (never trust blindly: normalize every field)
// ---------------------------------------------------------------------------

function normalizePlan(raw: unknown): AegisUser["plan"] {
  return raw === "go" || raw === "plus" ? raw : "free"
}

function normalizeUser(payload: unknown): AegisUser | null {
  if (!payload || typeof payload !== "object") return null
  const o = payload as Record<string, unknown>
  const email = typeof o.email === "string" ? o.email.trim().toLowerCase() : ""
  const name = typeof o.name === "string" ? o.name.trim() : ""
  if (!email.includes("@") || !name) return null
  return {
    id: typeof o.id === "string" ? o.id : "",
    email,
    name: name.slice(0, 64),
    plan: normalizePlan(o.plan),
    role: typeof o.role === "string" ? o.role : "user",
    reputation: typeof o.reputation === "number" ? o.reputation : 0,
    createdAt: typeof o.createdAt === "string" ? o.createdAt : new Date().toISOString(),
    provider: o.provider === "google" ? "google" : "email",
  }
}

// Mirror the authenticated user into localStorage for legacy readers
// (settings, billing, labs, profile pages). Auth itself is server-side
// via the httpOnly aegis_session cookie — localStorage is UI-only.
function mirrorUserToStorage(user: AegisUser | null) {
  try {
    if (user) {
      localStorage.setItem("aegis_user", JSON.stringify(user))
      localStorage.setItem("aegis_auth", "1")
      localStorage.setItem("aegis_email", user.email)
      localStorage.setItem("aegis_plan", user.plan)
      if (user.provider) localStorage.setItem("aegis_provider", user.provider)
    } else {
      localStorage.removeItem("aegis_user")
      localStorage.removeItem("aegis_auth")
      localStorage.removeItem("aegis_email")
      localStorage.removeItem("aegis_plan")
      localStorage.removeItem("aegis_provider")
    }
  } catch {
    /* storage may be unavailable — non-fatal */
  }
}

function clearLegacyAuth() {
  try {
    mirrorUserToStorage(null)
    localStorage.removeItem("aegis_admin_auth")
    sessionStorage.removeItem("aegis_csrf_token")
    document.cookie = "aegis_csrf_token=; Path=/; Max-Age=0; SameSite=Strict"
    document.cookie = "aegis_admin_session=; Path=/; Max-Age=0; SameSite=Strict"
  } catch {
    /* non-fatal */
  }
}

async function parseAuthResponse(res: Response): Promise<{ user: AegisUser | null; error?: string }> {
  let body: unknown = null
  try {
    body = await res.json()
  } catch {
    return { user: null, error: "Unexpected server response" }
  }
  const o = (body ?? {}) as Record<string, unknown>
  const user = normalizeUser(o.user)
  if (res.ok && user) return { user }
  const error = typeof o.error === "string" ? o.error : `Request failed (${res.status})`
  return { user: null, error }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<AegisUser | null>(null)
  const [isLoggedIn, setIsLoggedIn] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(true)
  const router = useRouter()

  const applyUser = React.useCallback((next: AegisUser | null) => {
    setUser(next)
    setIsLoggedIn(Boolean(next))
    mirrorUserToStorage(next)
  }, [])

  // Load the real session from the server on mount (httpOnly cookie -> user)
  React.useEffect(() => {
    let cancelled = false
    async function loadSession() {
      try {
        const res = await fetch("/api/auth/session", { credentials: "same-origin" })
        const { user: u } = await parseAuthResponse(res)
        if (!cancelled) applyUser(res.ok ? u : null)
      } catch {
        if (!cancelled) applyUser(null)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    loadSession()
    return () => {
      cancelled = true
    }
  }, [applyUser])

  // Cross-tab sync: another tab logged in/out -> mirror here
  React.useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === "aegis_user" || e.key === "aegis_auth" || e.key === null) {
        if (e.key === null) {
          applyUser(null)
          return
        }
        try {
          if (e.newValue === null) {
            applyUser(null)
          } else {
            const parsed = normalizeUser(JSON.parse(e.newValue))
            applyUser(parsed)
          }
        } catch {
          applyUser(null)
        }
      }
    }
    window.addEventListener("storage", onStorage)
    return () => window.removeEventListener("storage", onStorage)
  }, [applyUser])

  const refresh = React.useCallback(async () => {
    try {
      const res = await fetch("/api/auth/session", { credentials: "same-origin" })
      const { user: u } = await parseAuthResponse(res)
      applyUser(res.ok ? u : null)
    } catch {
      applyUser(null)
    }
  }, [applyUser])

  const login = React.useCallback(
    async (email: string, password: string): Promise<AuthResult> => {
      const trimmedEmail = email.trim().toLowerCase()
      if (!trimmedEmail.includes("@")) return { ok: false, error: "Enter a valid email address." }
      if (password.length < 8) return { ok: false, error: "Password must be at least 8 characters." }
      try {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ email: trimmedEmail, password }),
        })
        const { user: u, error } = await parseAuthResponse(res)
        if (!res.ok || !u) return { ok: false, error: error ?? "Invalid email or password." }
        applyUser(u)
        return { ok: true }
      } catch {
        return { ok: false, error: "Network error. Please try again." }
      }
    },
    [applyUser]
  )

  const signup = React.useCallback(
    async (name: string, email: string, password: string): Promise<AuthResult> => {
      const trimmedName = name.trim().slice(0, 64)
      const trimmedEmail = email.trim().toLowerCase()
      if (!trimmedName) return { ok: false, error: "Enter your full name." }
      if (!trimmedEmail.includes("@")) return { ok: false, error: "Enter a valid email address." }
      if (password.length < 8) return { ok: false, error: "Password must be at least 8 characters." }
      try {
        const res = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ name: trimmedName, email: trimmedEmail, password }),
        })
        const { user: u, error } = await parseAuthResponse(res)
        if (!res.ok || !u) return { ok: false, error: error ?? "Signup failed. Please try again." }
        applyUser(u)
        return { ok: true }
      } catch {
        return { ok: false, error: "Network error. Please try again." }
      }
    },
    [applyUser]
  )

  const loginWithGoogle = React.useCallback(async (): Promise<AuthResult> => {
    // OAuth (Google) is not configured on the backend yet — no fake login.
    return {
      ok: false,
      error: "Google sign-in is not configured yet. Use email and password instead.",
    }
  }, [])

  const logout = React.useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" })
    } catch {
      /* server unreachable — clear local state anyway */
    }
    clearLegacyAuth()
    setUser(null)
    setIsLoggedIn(false)
    router.push("/login")
  }, [router])

  const value = React.useMemo(
    () => ({ isLoggedIn, isLoading, user, login, signup, logout, loginWithGoogle, refresh }),
    [isLoggedIn, isLoading, user, login, signup, logout, loginWithGoogle, refresh]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = React.useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be within AuthProvider")
  return ctx
}
