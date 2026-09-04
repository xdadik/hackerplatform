/**
 * Auth security notes & helpers — documents httpOnly cookie migration and RBAC.
 *
 * CURRENT STATE (insecure, localStorage-based):
 *   auth-provider.tsx stores aegis_auth, aegis_user, aegis_plan in localStorage.
 *   This is XSS-exfiltratable and client-trusts plan/role.
 *
 * TARGET STATE (secure):
 *   - access_token in httpOnly Secure SameSite=Strict cookie (Set via API route)
 *   - refresh_token httpOnly, 30d, hashed server-side (Redis)
 *   - RBAC verified server-side per-request; client only displays role, never authorizes.
 *   - CSRF double-submit for cookie auth.
 *
 * This file provides client-side RBAC helpers that MUST be mirrored server-side.
 * Never rely solely on these checks for authorization.
 */

export type UserRole = "user" | "moderator" | "admin"
export type Plan = "free" | "go" | "plus"

export type SecureUser = {
  id: string
  email: string
  name: string
  role: UserRole
  plan: Plan
}

/** Client-side role check — for UI only, server must re-check */
export function hasRole(user: { role?: string } | null, required: UserRole[]): boolean {
  if (!user?.role) return false
  return required.includes(user.role as UserRole)
}

export function isAdmin(user: { role?: string; plan?: string } | null): boolean {
  return hasRole(user, ["admin"])
}

export function isModeratorOrAdmin(user: { role?: string } | null): boolean {
  return hasRole(user, ["moderator", "admin"])
}

/** Check plan gate — server must verify entitlements, client just hides UI */
export function hasPaidPlan(user: { plan?: string } | null): boolean {
  return user?.plan === "go" || user?.plan === "plus"
}

/**
 * SECURITY NOTICE for developers:
 * Do NOT trust localStorage for auth decisions. Example of insecure pattern:
 *   if (localStorage.getItem("aegis_auth") === "1") allowAdmin()
 * Replace with:
 *   const me = await fetch("/api/auth/me", { credentials: "include" }).then(r=>r.json())
 *   if (me.role !== "admin") redirect 403
 *
 * httpOnly cookie setup (Next.js route handler example):
 *   // app/api/auth/login/route.ts
 *   export async function POST(req: Request) {
 *     const { accessToken, refreshToken } = await authBackend(req)
 *     const res = NextResponse.json({ ok: true })
 *     res.cookies.set("access_token", accessToken, {
 *       httpOnly: true, secure: process.env.NODE_ENV === "production",
 *       sameSite: "strict", path: "/", maxAge: 15*60
 *     })
 *     res.cookies.set("refresh_token", refreshToken, {
 *       httpOnly: true, secure: true, sameSite: "strict", path: "/api/auth/refresh", maxAge: 30*24*3600
 *     })
 *     return res
 *   }
 */
export const AUTH_SECURITY_NOTES = `
- Move from localStorage to httpOnly cookies immediately when backend exists (see docs/backend-architecture.md §4).
- Add middleware.ts to protect /admin, /labs/[id], /settings/billing etc.
- Rate limit login at edge (Vercel Firewall or Redis).
- Never expose ADMIN_PASS in client bundle — keep in env via server route.
`
