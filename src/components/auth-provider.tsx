"use client"
import * as React from "react"
import { sanitizeInput, sanitizeEmail } from "@/lib/sanitize"
// SECURITY NOTICE: This provider currently uses localStorage for demo only.
// In production, replace with httpOnly Secure cookies (see src/lib/auth-security.ts).
// Never trust localStorage for authorization — server must validate JWT on every request.

export type AegisUser = {
  email: string
  name: string
  plan: "free" | "go" | "plus"
  createdAt: string
  provider?: "email" | "google"
}

type AuthContextType = {
  isLoggedIn: boolean
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
  if (!email) return "Notva Laka"
  const local = email.split("@")[0] || ""
  const parts = local.split(/[._-]+/).filter(Boolean)
  if (parts.length === 0) return "User"
  return sanitizeInput(parts.map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(" "), 64)
}

function normalizePlan(raw: string | null): AegisUser["plan"] {
  if (raw === "go" || raw === "plus") return raw
  return "free"
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<AegisUser | null>(null)
  const [isLoggedIn, setIsLoggedIn] = React.useState(false)

  React.useEffect(() => {
    try {
      const rawUser = localStorage.getItem("aegis_user")
      if (rawUser) {
        const parsed = JSON.parse(rawUser) as AegisUser
        if (parsed?.email && parsed?.name) {
          setUser(parsed)
          setIsLoggedIn(true)
          // keep legacy keys in sync for paid checks
          localStorage.setItem("aegis_auth", "1")
          localStorage.setItem("aegis_email", parsed.email)
          localStorage.setItem("aegis_plan", parsed.plan)
          if (parsed.provider) localStorage.setItem("aegis_provider", parsed.provider)
          return
        }
      }
      // migrate legacy aegis_auth / aegis_email
      const legacyAuth = localStorage.getItem("aegis_auth")
      const legacyEmail = localStorage.getItem("aegis_email")
      const legacyPlan = normalizePlan(localStorage.getItem("aegis_plan"))
      const legacyProvider = localStorage.getItem("aegis_provider") as AegisUser["provider"] | null
      if (legacyAuth === "1") {
        const email = legacyEmail || "xdadikuz@gmail.com"
        const name = deriveName(email)
        const migrated: AegisUser = {
          email,
          name,
          plan: legacyPlan,
          createdAt: new Date().toISOString(),
          provider: legacyProvider === "google" ? "google" : "email",
        }
        localStorage.setItem("aegis_user", JSON.stringify(migrated))
        setUser(migrated)
        setIsLoggedIn(true)
      }
    } catch {}
  }, [])

  const login = React.useCallback((email?: string, name?: string) => {
    try {
      const existingPlan = normalizePlan(localStorage.getItem("aegis_plan"))
      const prevUserRaw = localStorage.getItem("aegis_user")
      let prevUser: AegisUser | null = null
      try { prevUser = prevUserRaw ? JSON.parse(prevUserRaw) : null } catch {}
      // Sanitize email — validate format, fallback to safe default
      const rawEmail = (email?.trim() || prevUser?.email || localStorage.getItem("aegis_email") || "").trim() || "user@aegis.local"
      const sanitizedEmail = sanitizeEmail(rawEmail) || "user@aegis.local"
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
      localStorage.setItem("aegis_auth", "1")
      if (email) {
        const safe = sanitizeEmail(email) || "user@aegis.local"
        localStorage.setItem("aegis_email", safe)
      }
      setIsLoggedIn(true)
    }
  }, [])

  const loginWithGoogle = React.useCallback(() => {
    try {
      const existingPlan = normalizePlan(localStorage.getItem("aegis_plan"))
      const prevUserRaw = localStorage.getItem("aegis_user")
      let prevUser: AegisUser | null = null
      try { prevUser = prevUserRaw ? JSON.parse(prevUserRaw) : null } catch {}
      const legacyEmail = localStorage.getItem("aegis_email")
      const rawEmail = prevUser?.email || legacyEmail || "user@aegis.local"
      const email = sanitizeEmail(rawEmail) || "user@aegis.local"
      const name = prevUser?.name ? sanitizeInput(prevUser.name, 64) : deriveName(email)
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
      localStorage.setItem("aegis_auth", "1")
      localStorage.setItem("aegis_provider", "google")
      setIsLoggedIn(true)
    }
    window.location.href = "/dashboard"
  }, [])

  const logout = React.useCallback(() => {
    localStorage.removeItem("aegis_auth")
    localStorage.removeItem("aegis_email")
    localStorage.removeItem("aegis_provider")
    localStorage.removeItem("aegis_user")
    setUser(null)
    setIsLoggedIn(false)
    window.location.href = "/login"
  }, [])

  const value = React.useMemo(() => ({ isLoggedIn, user, login, logout, loginWithGoogle }), [isLoggedIn, user, login, logout, loginWithGoogle])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = React.useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be within AuthProvider")
  return ctx
}
