import { getServiceSupabase } from "@/lib/supabase"

export type EntitlementType = "lab" | "lesson" | "video" | "challenge"

export type Entitlement = {
  resource_type: string
  resource_id: string
}

const RESOURCE_TYPES: readonly string[] = ["lab", "lesson", "video", "challenge"]

function isPaidPlan(plan: string | undefined): boolean {
  const p = (plan ?? "").toLowerCase()
  return p === "go" || p === "plus"
}

/**
 * Per-user access check for a single resource.
 * Granted when: caller is admin, OR plan is go/plus, OR an explicit
 * entitlements row exists for (user, type, id). Fail-closed on DB errors.
 */
export async function canAccess(
  userId: string | null,
  type: EntitlementType,
  resourceId: string,
  userPlan?: string,
  userRole?: string
): Promise<boolean> {
  if (userRole === "admin") return true
  if (!userId || !resourceId) return false
  if (!RESOURCE_TYPES.includes(type)) return false

  let plan = userPlan
  let role = userRole
  if ((plan === undefined || role === undefined) && userId) {
    try {
      const supabase = getServiceSupabase()
      if (supabase) {
        const { data, error } = await supabase
          .from("users")
          .select("plan,role")
          .eq("id", userId)
          .limit(1)
        if (!error && data && data.length > 0) {
          const row = data[0] as { plan?: unknown; role?: unknown }
          if (plan === undefined && typeof row.plan === "string") plan = row.plan
          if (role === undefined && typeof row.role === "string") role = row.role
        }
      }
    } catch {
      /* fall through to entitlement check — fail closed below */
    }
  }

  if (role === "admin") return true
  if (isPaidPlan(plan)) return true

  try {
    const supabase = getServiceSupabase()
    if (!supabase) return false
    const { data, error } = await supabase
      .from("entitlements")
      .select("id")
      .eq("user_id", userId)
      .eq("resource_type", type)
      .eq("resource_id", resourceId)
      .limit(1)
    if (error) return false
    return Array.isArray(data) && data.length > 0
  } catch {
    return false
  }
}

/** List all explicit entitlements for a user. Returns [] on error. */
export async function getUserEntitlements(
  userId: string | null | undefined
): Promise<Entitlement[]> {
  if (!userId) return []
  try {
    const supabase = getServiceSupabase()
    if (!supabase) return []
    const { data, error } = await supabase
      .from("entitlements")
      .select("resource_type,resource_id")
      .eq("user_id", userId)
      .limit(1000)
    if (error || !data) return []
    const rows = data as unknown as Array<Record<string, unknown>>
    return rows
      .filter(
        (r) => typeof r.resource_type === "string" && typeof r.resource_id === "string"
      )
      .map((r) => ({
        resource_type: r.resource_type as string,
        resource_id: r.resource_id as string,
      }))
  } catch {
    return []
  }
}

/** Grant a user access to a resource (idempotent via upsert). False on DB error. */
export async function grantAccess(
  userId: string,
  type: EntitlementType,
  resourceId: string,
  grantedBy = "admin"
): Promise<boolean> {
  if (!userId || !resourceId) return false
  if (!RESOURCE_TYPES.includes(type)) return false
  try {
    const supabase = getServiceSupabase()
    if (!supabase) return false
    const { error } = await supabase.from("entitlements").upsert(
      {
        user_id: userId,
        resource_type: type,
        resource_id: resourceId,
        granted_by: grantedBy || "admin",
      },
      { onConflict: "user_id,resource_type,resource_id" }
    )
    return !error
  } catch {
    return false
  }
}

/** Revoke a user's access to a resource. True when the delete succeeds. */
export async function revokeAccess(
  userId: string,
  type: EntitlementType,
  resourceId: string
): Promise<boolean> {
  if (!userId || !resourceId) return false
  if (!RESOURCE_TYPES.includes(type)) return false
  try {
    const supabase = getServiceSupabase()
    if (!supabase) return false
    const { error } = await supabase
      .from("entitlements")
      .delete()
      .eq("user_id", userId)
      .eq("resource_type", type)
      .eq("resource_id", resourceId)
    return !error
  } catch {
    return false
  }
}
