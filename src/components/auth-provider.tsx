"use client"
import * as React from "react"
import { useRouter } from "next/navigation"
import { sanitizeInput, sanitizeEmail } from "@/lib/sanitize"

export type AegisUser = {
  email: string
  name: string
  plan: "free" | "go" | "plus"
  createdAt: string
  provider?: "email" | "google"
}

type AuthContextType = {
  isLoggedIn: boolean
  isLoading: boolean
  user: AegisUser | null
  login: (email?: string, name?: string) => void
  logout: () => void
  loginWithGoogle: () => void
}

const AuthContext = React.createContext<AuthContextType | null>(null)

function deriveName(email?: string, explicitName?: string): string {
  if (explicitName?.trim()) {
    const sanitized = sanitizeInput(explicitName, 64)
    if (sanitized) return sanitized
  }
  if (!email) return "Guest"
  const trimmed = email.trim()
  if (!trimmed) return "Guest"
  const local = trimmed.split("@")[0] || ""
  const parts = local.split(/[._-]+/).filter(Boolean)
  if (parts.length === 0) return "Guest"
  const joined = parts.map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(" ")
  const sanitized = sanitizeInput(joined, 64)
  return sanitized || "Guest"
}

function normalizePlan(raw: string | null): AegisUser["plan"] {
  if (raw === "go" || raw === "plus") return raw
  return "free"
}

function isValidAegisUser(obj: unknown): obj is AegisUser {
  if (!obj || typeof obj !== "object") return false
  const o = obj as Record<string, unknown>
  return typeof o.email === "string" && !!sanitizeEmail(o.email) && typeof o.name === "string" && !!o.name.trim()
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<AegisUser | null>(null)
  const [isLoggedIn, setIsLoggedIn] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(true)
  const router = useRouter()

  // Hydration-safe: only read localStorage inside useEffect
  React.useEffect(() => {
    let cancelled = false

    function syncFromStorage() {
      try {
        const rawUser = localStorage.getItem("aegis_user")
        if (rawUser) {
          const parsed = JSON.parse(rawUser) as unknown
          if (isValidAegisUser(parsed)) {
            const email = sanitizeEmail((parsed as AegisUser).email)
            if (!email) {
              // Invalid email -> not logged in, clear poisoned data
              if (!cancelled) {
                setUser(null)
                setIsLoggedIn(false)
              }
              return
            }
            const normalized: AegisUser = {
              email,
              name: sanitizeInput((parsed as AegisUser).name, 64) || deriveName(email),
              plan: normalizePlan((parsed as AegisUser).plan ?? localStorage.getItem("aegis_plan")),
              createdAt: (parsed as AegisUser).createdAt || new Date().toISOString(),
              provider: (parsed as AegisUser).provider === "google" ? "google" : "email",
            }
            if (!cancelled) {
              setUser(normalized)
              setIsLoggedIn(true)
            }
            // keep legacy keys in sync for paid checks (but only when valid)
            try {
              localStorage.setItem("aegis_auth", "1")
              localStorage.setItem("aegis_email", email)
              localStorage.setItem("aegis_plan", normalized.plan)
              if (normalized.provider) localStorage.setItem("aegis_provider", normalized.provider)
              else localStorage.removeItem("aegis_provider")
            } catch {}
            return
          } else {
            // invalid structure -> clear
            try {
              localStorage.removeItem("aegis_user")
            } catch {}
          }
        }

        // migrate legacy aegis_auth / aegis_email — but STRICT: require valid email
        const legacyAuth = localStorage.getItem("aegis_auth")
        const legacyEmailRaw = localStorage.getItem("aegis_email")
        const legacyPlan = normalizePlan(localStorage.getItem("aegis_plan"))
        const legacyProvider = localStorage.getItem("aegis_provider") as AegisUser["provider"] | null

        if (legacyAuth === "1") {
          const sanitizedLegacyEmail = legacyEmailRaw ? sanitizeEmail(legacyEmailRaw) : null
          if (!sanitizedLegacyEmail) {
            // No valid email -> do NOT auto-bypass. Clear stale auth flag and remain logged out.
            try {
              localStorage.removeItem("aegis_auth")
              localStorage.removeItem("aegis_email")
              localStorage.removeItem("aegis_provider")
            } catch {}
            if (!cancelled) {
              setUser(null)
              setIsLoggedIn(false)
            }
            return
          }
          const name = deriveName(sanitizedLegacyEmail)
          const migrated: AegisUser = {
            email: sanitizedLegacyEmail,
            name,
            plan: legacyPlan,
            createdAt: new Date().toISOString(),
            provider: legacyProvider === "google" ? "google" : "email",
          }
          try {
            localStorage.setItem("aegis_user", JSON.stringify(migrated))
          } catch {}
          if (!cancelled) {
            setUser(migrated)
            setIsLoggedIn(true)
          }
          return
        }

        // No valid session found
        if (!cancelled) {
          setUser(null)
          setIsLoggedIn(false)
        }
      } catch {
        if (!cancelled) {
          setUser(null)
          setIsLoggedIn(false)
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    syncFromStorage()

    // Cross-tab sync: if auth changes in another tab, update this tab
    function onStorage(e: StorageEvent) {
      if (
        e.key === "aegis_user" ||
        e.key === "aegis_auth" ||
        e.key === "aegis_email" ||
        e.key === "aegis_plan" ||
        e.key === "aegis_provider" ||
        e.key === null // clear()
      ) {
        syncFromStorage()
      }
    }
    window.addEventListener("storage", onStorage)
    return () => {
      cancelled = true
      window.removeEventListener("storage", onStorage)
    }
  }, [])

  const login = React.useCallback((email?: string, name?: string) => {
    try {
      const existingPlan = normalizePlan(localStorage.getItem("aegis_plan"))
      const prevUserRaw = localStorage.getItem("aegis_user")
      let prevUser: AegisUser | null = null
      try {
        const parsed = prevUserRaw ? (JSON.parse(prevUserRaw) as unknown) : null
        if (isValidAegisUser(parsed)) prevUser = parsed as AegisUser
      } catch {}

      // STRICT: require a valid email from explicit arg, prevUser, or stored email — no hardcoded fallback
      const rawEmailCandidate = (email?.trim() || prevUser?.email || localStorage.getItem("aegis_email") || "").trim()
      const sanitizedEmail = rawEmailCandidate ? sanitizeEmail(rawEmailCandidate) : null
      if (!sanitizedEmail) {
        // Do not auto-bypass with fake email
        setUser(null)
        setIsLoggedIn(false)
        return
      }
      const finalEmail = sanitizedEmail
      const finalName = deriveName(finalEmail, name ? sanitizeInput(name, 64) : prevUser?.name)
      const plan = prevUser?.plan || existingPlan || "free"
      const createdAt = prevUser?.createdAt || new Date().toISOString()
      const next: AegisUser = { email: finalEmail, name: finalName, plan, createdAt, provider: "email" }
      localStorage.setItem("aegis_user", JSON.stringify(next))
      localStorage.setItem("aegis_auth", "1")
      localStorage.setItem("aegis_email", finalEmail)
      localStorage.setItem("aegis_plan", plan)
      localStorage.removeItem("aegis_provider")
      setUser(next)
      setIsLoggedIn(true)
    } catch {
      // Harden: failure should NOT leave user authenticated
      setUser(null)
      setIsLoggedIn(false)
    }
  }, [])

  const loginWithGoogle = React.useCallback(() => {
    try {
      const existingPlan = normalizePlan(localStorage.getItem("aegis_plan"))
      const prevUserRaw = localStorage.getItem("aegis_user")
      let prevUser: AegisUser | null = null
      try {
        const parsed = prevUserRaw ? (JSON.parse(prevUserRaw) as unknown) : null
        if (isValidAegisUser(parsed)) prevUser = parsed as AegisUser
      } catch {}
      const legacyEmail = localStorage.getItem("aegis_email")
      const rawEmailCandidate = (prevUser?.email || legacyEmail || "").trim()
      const sanitized = rawEmailCandidate ? sanitizeEmail(rawEmailCandidate) : null
      if (!sanitized) {
        // Google flow requires a valid email; without it do not create a fake user
        setUser(null)
        setIsLoggedIn(false)
        return
      }
      const email = sanitized
      const name = prevUser?.name ? sanitizeInput(prevUser.name, 64) || deriveName(email) : deriveName(email)
      const plan = prevUser?.plan || existingPlan || "free"
      const createdAt = prevUser?.createdAt || new Date().toISOString()
      const next: AegisUser = { email, name, plan, createdAt, provider: "google" }
      localStorage.setItem("aegis_user", JSON.stringify(next))
      localStorage.setItem("aegis_auth", "1")
      localStorage.setItem("aegis_email", email)
      localStorage.setItem("aegis_plan", plan)
      localStorage.setItem("aegis_provider", "google")
      setUser(next)
      setIsLoggedIn(true)
    } catch {
      setUser(null)
      setIsLoggedIn(false)
      return
    }
    router.push("/dashboard")
  }, [router])

  const logout = React.useCallback(() => {
    try {
      localStorage.removeItem("aegis_auth")
      localStorage.removeItem("aegis_email")
      localStorage.removeItem("aegis_provider")
      localStorage.removeItem("aegis_user")
      localStorage.removeItem("aegis_plan")
      // Remove legacy/admin artifacts if present (client-side only)
      localStorage.removeItem("aegis_admin_auth")
      sessionStorage.removeItem("aegis_csrf_token")
      document.cookie = "aegis_csrf_token=; Path=/; Max-Age=0; SameSite=Strict"
      // Clear admin session cookie if set without HttpOnly (best-effort)
      document.cookie = "aegis_admin_session=; Path=/; Max-Age=0; SameSite=Strict"
    } catch {}
    setUser(null)
    setIsLoggedIn(false)
    router.push("/login")
  }, [router])

  const value = React.useMemo(
    () => ({ isLoggedIn, isLoading, user, login, logout, loginWithGoogle }),
    [isLoggedIn, isLoading, user, login, logout, loginWithGoogle]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = React.useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be within AuthProvider")
  return ctx
}
