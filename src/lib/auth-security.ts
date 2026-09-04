// auth helpers — server re-checks roles

export type UserRole = "user" | "moderator" | "admin"
export type Plan = "free" | "go" | "plus"

export type SecureUser = {
  id: string
  email: string
  name: string
  role: UserRole
  plan: Plan
}

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

export function hasPaidPlan(user: { plan?: string } | null): boolean {
  return user?.plan === "go" || user?.plan === "plus"
}
