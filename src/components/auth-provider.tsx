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
  refresh: () => Promise<void>
}

const AuthContext = React.createContext<AuthContextType | null>(null)

function normalizePlan(raw: unknown): AegisUser["plan"] {
  if (raw === "go" || raw === "plus") return raw
  return "free"
}

function toUser(body: unknown): AegisUser | null {
  if (!body || typeof body !== "object") return null
  const u = (body as { user?: Record<string, unknown> }).user
  if (!u || typeof u !== "object") return null
  if (typeof u.email !== "string" || typeof u.name !== "string") return null
  return {
    id: String(u.id ?? ""),
    email: u.email,
    name: u.name,
    plan: normalizePlan(u.plan),
    role: typeof u.role === "string" ? u.role : "user",
    reputation: typeof u.reputation === "number" ? u.reputation : 0,
    createdAt: typeof u.createdAt === "string" ? u.createdAt : new Date().toISOString(),
    provider: u.provider === "google" ? "google" : "email",
  }
}

async function readError(res: Response): Promise<string> {
  try {
    const body = await res.json()
    if (body && typeof body.error === "string" && body.error) return body.error
  } catch {}
  return `Request failed (${res.status})`
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<AegisUser | null>(null)
  const [isLoggedIn, setIsLoggedIn] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(true)
  const router = useRouter()

  const refresh = React.useCallback(async () => {
    try {
      const res = await fetch("/api/auth/session", { cache: "no-store" })
      if (!res.ok) {
        setUser(null)
        setIsLoggedIn(false)
        return
      }
      const next = toUser(await res.json())
      setUser(next)
      setIsLoggedIn(!!next)
    } catch {
      setUser(null)
      setIsLoggedIn(false)
    }
  }, [])

  React.useEffect(() => {
    let cancelled = false
    async function init() {
      await refresh()
      if (!cancelled) setIsLoading(false)
    }
    init()
    return () => { cancelled = true }
  }, [refresh])

  const login = React.useCallback(async (email: string, password: string): Promise<AuthResult> => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })
      if (!res.ok) return { ok: false, error: await readError(res) }
      const next = toUser(await res.json())
      if (!next) return { ok: false, error: "Login failed. Try again." }
      setUser(next)
      setIsLoggedIn(true)
      return { ok: true }
    } catch {
      return { ok: false, error: "Could not reach the server. Check your connection." }
    }
  }, [])

  const signup = React.useCallback(async (name: string, email: string, password: string): Promise<AuthResult> => {
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      })
      if (!res.ok) return { ok: false, error: await readError(res) }
      const next = toUser(await res.json())
      if (!next) return { ok: false, error: "Signup failed. Try again." }
      setUser(next)
      setIsLoggedIn(true)
      return { ok: true }
    } catch {
      return { ok: false, error: "Could not reach the server. Check your connection." }
    }
  }, [])

  const logout = React.useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
    } catch {}
    try {
      localStorage.removeItem("aegis_admin_auth")
      sessionStorage.removeItem("aegis_csrf_token")
      document.cookie = "aegis_csrf_token=; Path=/; Max-Age=0; SameSite=Strict"
      document.cookie = "aegis_admin_session=; Path=/; Max-Age=0; SameSite=Strict"
    } catch {}
    setUser(null)
    setIsLoggedIn(false)
    router.push("/login")
  }, [router])

  const value = React.useMemo(
    () => ({ isLoggedIn, isLoading, user, login, signup, logout, refresh }),
    [isLoggedIn, isLoading, user, login, signup, logout, refresh]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = React.useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be within AuthProvider")
  return ctx
}
