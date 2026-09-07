import { randomUUID } from "crypto"
import { getServiceSupabase } from "@/lib/supabase"
import { env } from "@/lib/env"
import { getAdminSessionToken, verifyAdminToken, hashPassword } from "@/lib/auth-server"

// ---------------------------------------------------------------------------
// Admin resource CRUD (service-role + admin cookie verification).
// Routes: /api/admin/[resource] -> GET (list) | POST (create) | PATCH (update)
// | DELETE (remove). Every mutating request must pass:
//   1. valid aegis_admin_session cookie (HMAC, re-verified server-side even
//      though middleware already checks it — defense in depth)
//   2. CSRF double-submit: x-csrf-token header === aegis_csrf_token cookie
// Every mutation is written to the audit_logs table (best-effort).
// ---------------------------------------------------------------------------

export type FieldRule = {
  type: "string" | "number" | "boolean"
  maxLen?: number
  optional?: boolean
  transform?: (value: string) => unknown
}

export type ResourceConfig = {
  table: string
  create: Record<string, FieldRule>
  update: Record<string, FieldRule>
  listColumns: string
  listOrder: { column: string; ascending: boolean }
  // Extra server-side transforms applied to the payload before insert/update
  beforeWrite?: (payload: Record<string, unknown>, mode: "create" | "update") => Promise<Record<string, unknown>> | Record<string, unknown>
}

const str = (maxLen: number, optional = false): FieldRule => ({ type: "string", maxLen, optional })
const num = (optional = false): FieldRule => ({ type: "number", optional })
const bool = (optional = false): FieldRule => ({ type: "boolean", optional })

export const ADMIN_RESOURCES: Record<string, ResourceConfig> = {
  users: {
    table: "users",
    create: {
      email: str(254),
      name: str(64),
      password: { type: "string", maxLen: 128, optional: true },
      role: { ...str(16, true), transform: (v) => (["user", "moderator", "admin"].includes(v) ? v : "user") },
      plan: { ...str(8, true), transform: (v) => (["free", "go", "plus"].includes(v) ? v : "free") },
      status: { ...str(16, true), transform: (v) => (["Active", "Pending", "Banned"].includes(v) ? v : "Active") },
      reputation: num(true),
    },
    update: {
      name: str(64, true),
      role: { ...str(16, true), transform: (v) => (["user", "moderator", "admin"].includes(v) ? v : undefined) },
      plan: { ...str(8, true), transform: (v) => (["free", "go", "plus"].includes(v) ? v : undefined) },
      status: { ...str(16, true), transform: (v) => (["Active", "Pending", "Banned"].includes(v) ? v : undefined) },
      reputation: num(true),
    },
    listColumns: "id,email,name,role,plan,status,provider,reputation,created_at,updated_at",
    listOrder: { column: "created_at", ascending: false },
    // never expose or accept password_hash directly; password -> scrypt hash
    beforeWrite: async (payload, mode) => {
      const next = { ...payload }
      if (typeof next.password === "string" && next.password.length > 0) {
        // A short password would previously be silently ignored, creating a
        // user that can NEVER log in (password_hash stays null) — reject it.
        if (next.password.length < 8 || next.password.length > 128) {
          throw new Error("ADMIN_INPUT:Password must be 8-128 characters")
        }
        next.password_hash = await hashPassword(next.password)
      } else if (mode === "create") {
        // admin-created users without a password cannot log in until reset
        next.password_hash = null
      }
      delete next.password
      if (mode === "create" && !next.id) next.id = randomUUID()
      return next
    },
  },
  videos: {
    table: "videos",
    create: {
      title: str(200),
      subtitle: str(200, true),
      duration: { ...str(20, true), transform: (v) => v || "00:00" },
      module: { ...str(64, true), transform: (v) => v || "General" },
      path: str(64, true),
      youtube_id: str(32, true),
      description: str(2000, true),
      category: str(64, true),
      featured: bool(true),
    },
    update: {
      title: str(200, true),
      subtitle: str(200, true),
      duration: str(20, true),
      module: str(64, true),
      path: str(64, true),
      youtube_id: str(32, true),
      description: str(2000, true),
      category: str(64, true),
      featured: bool(true),
    },
    listColumns: "id,title,subtitle,duration,module,path,youtube_id,description,category,featured,created_at",
    listOrder: { column: "created_at", ascending: false },
  },
  labs: {
    table: "labs",
    create: {
      title: str(200),
      category: { ...str(64, true), transform: (v) => v || "Web Security" },
      difficulty: { ...str(20, true), transform: (v) => (["Beginner", "Intermediate", "Advanced", "Expert"].includes(v) ? v : "Beginner") },
      duration: { ...str(20, true), transform: (v) => v || "30 min" },
      description: str(2000, true),
      objectives: num(true),
      participants: num(true),
      youtube_id: str(32, true),
      // plaintext flag accepted from the admin UI -> stored as scrypt hash
      flag: str(200, true),
    },
    update: {
      title: str(200, true),
      category: str(64, true),
      difficulty: { ...str(20, true), transform: (v) => (["Beginner", "Intermediate", "Advanced", "Expert"].includes(v) ? v : undefined) },
      duration: str(20, true),
      description: str(2000, true),
      objectives: num(true),
      participants: num(true),
      youtube_id: str(32, true),
      flag: str(200, true),
    },
    listColumns: "id,title,category,difficulty,duration,description,objectives,participants,youtube_id,created_at",
    listOrder: { column: "created_at", ascending: false },
    beforeWrite: async (payload) => {
      const next = { ...payload }
      if (typeof next.flag === "string" && next.flag.trim().length >= 6) {
        next.flag_hash = await hashPassword(next.flag.trim())
      }
      delete next.flag // never persist plaintext
      return next
    },
  },
  challenges: {
    table: "challenges",
    create: {
      name: str(200),
      category: { ...str(64, true), transform: (v) => v || "Web" },
      difficulty: { ...str(16, true), transform: (v) => (["Easy", "Medium", "Hard", "Insane"].includes(v) ? v : "Easy") },
      points: num(true),
      solves: num(true),
      flag: str(200, true),
    },
    update: {
      name: str(200, true),
      category: str(64, true),
      difficulty: { ...str(16, true), transform: (v) => (["Easy", "Medium", "Hard", "Insane"].includes(v) ? v : undefined) },
      points: num(true),
      solves: num(true),
      flag: str(200, true),
    },
    listColumns: "id,name,category,difficulty,points,solves,tags,created_at",
    listOrder: { column: "created_at", ascending: false },
    beforeWrite: async (payload) => {
      const next = { ...payload }
      if (typeof next.flag === "string" && next.flag.trim().length >= 6) {
        next.flag_hash = await hashPassword(next.flag.trim())
      }
      delete next.flag
      return next
    },
  },
  events: {
    table: "events",
    create: {
      title: str(200),
      type: { ...str(32, true), transform: (v) => (["CTF", "Workshop", "Competition"].includes(v) ? v : "CTF") },
      date: str(32, true),
      status: { ...str(16, true), transform: (v) => (["Live", "Upcoming", "Ended"].includes(v) ? v : "Upcoming") },
      participants: num(true),
    },
    update: {
      title: str(200, true),
      type: { ...str(32, true), transform: (v) => (["CTF", "Workshop", "Competition"].includes(v) ? v : undefined) },
      date: str(32, true),
      status: { ...str(16, true), transform: (v) => (["Live", "Upcoming", "Ended"].includes(v) ? v : undefined) },
      participants: num(true),
    },
    listColumns: "id,title,type,date,status,participants,created_at",
    listOrder: { column: "created_at", ascending: false },
  },
  news: {
    table: "news",
    create: {
      title: str(250),
      excerpt: str(1000, true),
      author: { ...str(64, true), transform: (v) => v || "Admin" },
      tags: { ...str(200, true), transform: (v) => v || "general" },
      content: str(20000, true),
      status: { ...str(16, true), transform: (v) => (["Draft", "Published", "Pending"].includes(v) ? v : "Draft") },
      views: num(true),
    },
    update: {
      title: str(250, true),
      excerpt: str(1000, true),
      author: str(64, true),
      tags: str(200, true),
      content: str(20000, true),
      status: { ...str(16, true), transform: (v) => (["Draft", "Published", "Pending"].includes(v) ? v : undefined) },
      views: num(true),
    },
    listColumns: "id,title,excerpt,author,tags,views,status,content,created_at",
    listOrder: { column: "created_at", ascending: false },
  },
  cves: {
    table: "cves",
    create: {
      cve_id: { ...str(20, true), transform: (v) => (v || "").trim().toUpperCase() },
      title: str(250),
      severity: { ...str(16, true), transform: (v) => (["Critical", "High", "Medium", "Low"].includes(v) ? v : "High") },
      status: { ...str(16, true), transform: (v) => (["Draft", "Published"].includes(v) ? v : "Draft") },
      publish_date: str(20, true),
    },
    update: {
      cve_id: { ...str(20, true), transform: (v) => (v || "").trim().toUpperCase() },
      title: str(250, true),
      severity: { ...str(16, true), transform: (v) => (["Critical", "High", "Medium", "Low"].includes(v) ? v : undefined) },
      status: { ...str(16, true), transform: (v) => (["Draft", "Published"].includes(v) ? v : undefined) },
      publish_date: str(20, true),
    },
    listColumns: "id,cve_id,title,severity,status,publish_date,created_at",
    listOrder: { column: "created_at", ascending: false },
  },
}

// ---------------------------------------------------------------------------
// Guards
// ---------------------------------------------------------------------------

export function isAdminRequestAuthorized(request: Request): boolean {
  const token = getAdminSessionToken(request)
  // NEXTAUTH_SECRET signs the admin cookie (see auth-server.ts header);
  // ADMIN_PASS is the local-dev fallback and must match /api/admin/login.
  const secret = env.NEXTAUTH_SECRET || env.ADMIN_PASS
  if (!secret || secret === "change-me") return false
  return verifyAdminToken(token, secret)
}

/** Double-submit CSRF: header token must equal the non-httpOnly cookie. */
export function csrfOk(request: Request): boolean {
  const cookieHeader = request.headers.get("cookie") ?? ""
  const match = cookieHeader.match(/(?:^|;\s*)aegis_csrf_token=([^;]+)/)
  const cookieToken = match ? decodeURIComponent(match[1]) : null
  const headerToken = request.headers.get("x-csrf-token")
  if (!cookieToken || !headerToken) return false
  if (cookieToken.length !== headerToken.length) return false
  let diff = 0
  for (let i = 0; i < cookieToken.length; i++) diff |= cookieToken.charCodeAt(i) ^ headerToken.charCodeAt(i)
  return diff === 0
}

async function writeAudit(action: string, resource: string, targetId: string | null, detail: unknown) {
  const supabase = getServiceSupabase()
  if (!supabase) return
  try {
    await supabase.from("audit_logs").insert({
      actor: "admin",
      action,
      resource,
      target_id: targetId,
      detail: detail === undefined ? null : (detail as Record<string, unknown>),
    })
  } catch {
    /* audit table may not exist yet (0002 migration) — non-fatal */
  }
}

// ---------------------------------------------------------------------------
// Field extraction & validation
// ---------------------------------------------------------------------------

function applyRules(
  body: Record<string, unknown>,
  rules: Record<string, FieldRule>
): { payload: Record<string, unknown>; errors: string[] } {
  const payload: Record<string, unknown> = {}
  const errors: string[] = []
  for (const [field, rule] of Object.entries(rules)) {
    const value = body[field]
    const present = value !== undefined && value !== null && value !== ""
    if (!present) {
      if (!rule.optional) errors.push(`Field '${field}' is required`)
      continue
    }
    if (rule.type === "string") {
      let s = String(value).trim().slice(0, rule.maxLen ?? 500)
      if (!s) {
        if (!rule.optional) errors.push(`Field '${field}' is required`)
        continue
      }
      if (rule.transform) {
        const transformed = rule.transform(s)
        if (transformed === undefined) continue // invalid enum -> silently drop on optional fields
        s = transformed as string
      }
      payload[field] = s
    } else if (rule.type === "number") {
      const n = typeof value === "number" ? value : parseInt(String(value), 10)
      if (Number.isNaN(n)) {
        errors.push(`Field '${field}' must be a number`)
        continue
      }
      payload[field] = n
    } else if (rule.type === "boolean") {
      payload[field] = value === true || value === "true" || value === 1
    }
  }
  return { payload, errors }
}

function jsonError(message: string, status: number, extra: Record<string, unknown> = {}) {
  return Response.json({ error: message, ...extra }, { status, headers: { "Cache-Control": "no-store" } })
}

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

export async function handleAdminList(resource: string, request: Request): Promise<Response> {
  const config = ADMIN_RESOURCES[resource]
  if (!config) return jsonError("Unknown admin resource", 404)
  const supabase = getServiceSupabase()
  if (!supabase) return jsonError("Database is not configured (SUPABASE_SERVICE_ROLE_KEY missing)", 503)

  const { searchParams } = new URL(request.url)
  const limit = Math.min(500, Math.max(1, parseInt(searchParams.get("limit") ?? "200", 10) || 200))

  let query = supabase.from(config.table).select(config.listColumns).limit(limit)
  if (config.listOrder) query = query.order(config.listOrder.column, { ascending: config.listOrder.ascending })
  const { data, error } = await query
  if (error) {
    console.error(`[admin-api] list ${resource} failed:`, error.message)
    return jsonError(`Failed to list ${resource}`, 500)
  }
  return Response.json({ data: data ?? [], resource }, { headers: { "Cache-Control": "no-store" } })
}

export async function handleAdminCreate(resource: string, request: Request): Promise<Response> {
  const config = ADMIN_RESOURCES[resource]
  if (!config) return jsonError("Unknown admin resource", 404)

  let body: Record<string, unknown>
  try {
    body = (await request.json()) as Record<string, unknown>
  } catch {
    return jsonError("Invalid JSON body", 400)
  }

  const { payload, errors } = applyRules(body, config.create)
  if (errors.length > 0) return jsonError(errors.join("; "), 400)

  let finalPayload = payload
  if (config.beforeWrite) {
    try {
      finalPayload = await config.beforeWrite(payload, "create")
    } catch (err) {
      const msg = err instanceof Error && err.message.startsWith("ADMIN_INPUT:")
        ? err.message.slice("ADMIN_INPUT:".length)
        : "Invalid input"
      return jsonError(msg, 400)
    }
  }

  const supabase = getServiceSupabase()
  if (!supabase) return jsonError("Database is not configured (SUPABASE_SERVICE_ROLE_KEY missing)", 503)

  const { data, error } = await supabase
    .from(config.table)
    .insert(finalPayload)
    .select(config.listColumns)
    .single()
  if (error) {
    console.error(`[admin-api] create ${resource} failed:`, error.message)
    const duplicate = /duplicate|unique/i.test(error.message)
    // Never echo raw DB error text to the client — details stay in server logs
    return jsonError(duplicate ? "An entry with this unique field already exists" : `Failed to create ${resource}`, duplicate ? 409 : 500)
  }

  await writeAudit("create", resource, String(((data as unknown as Record<string, unknown>) ?? {})?.id ?? ""), { fields: Object.keys(payload) })
  return Response.json({ data, resource, ok: true }, { status: 201, headers: { "Cache-Control": "no-store" } })
}

export async function handleAdminUpdate(resource: string, request: Request): Promise<Response> {
  const config = ADMIN_RESOURCES[resource]
  if (!config) return jsonError("Unknown admin resource", 404)

  let body: Record<string, unknown>
  try {
    body = (await request.json()) as Record<string, unknown>
  } catch {
    return jsonError("Invalid JSON body", 400)
  }

  const id = typeof body.id === "string" ? body.id.trim() : ""
  if (!id) return jsonError("Field 'id' is required", 400)

  const { payload, errors } = applyRules(body, config.update)
  if (errors.length > 0) return jsonError(errors.join("; "), 400)
  if (Object.keys(payload).length === 0) return jsonError("No valid fields to update", 400)

  let finalPayload = payload
  if (config.beforeWrite) {
    try {
      finalPayload = await config.beforeWrite(payload, "update")
    } catch (err) {
      const msg = err instanceof Error && err.message.startsWith("ADMIN_INPUT:")
        ? err.message.slice("ADMIN_INPUT:".length)
        : "Invalid input"
      return jsonError(msg, 400)
    }
  }

  const supabase = getServiceSupabase()
  if (!supabase) return jsonError("Database is not configured (SUPABASE_SERVICE_ROLE_KEY missing)", 503)

  const { data, error } = await supabase
    .from(config.table)
    .update(finalPayload)
    .eq("id", id)
    .select(config.listColumns)
    .single()
  if (error) {
    console.error(`[admin-api] update ${resource} ${id} failed:`, error.message)
    return jsonError(`Failed to update ${resource}`, 500)
  }

  await writeAudit("update", resource, id, { fields: Object.keys(payload) })
  return Response.json({ data, resource, ok: true }, { headers: { "Cache-Control": "no-store" } })
}

export async function handleAdminDelete(resource: string, request: Request): Promise<Response> {
  const config = ADMIN_RESOURCES[resource]
  if (!config) return jsonError("Unknown admin resource", 404)

  const { searchParams } = new URL(request.url)
  const id = (searchParams.get("id") ?? "").trim()
  if (!id) return jsonError("Query param 'id' is required", 400)

  const supabase = getServiceSupabase()
  if (!supabase) return jsonError("Database is not configured (SUPABASE_SERVICE_ROLE_KEY missing)", 503)

  const { error } = await supabase.from(config.table).delete().eq("id", id)
  if (error) {
    console.error(`[admin-api] delete ${resource} ${id} failed:`, error.message)
    return jsonError(`Failed to delete ${resource}`, 500)
  }

  await writeAudit("delete", resource, id, null)
  return Response.json({ ok: true, id, resource }, { headers: { "Cache-Control": "no-store" } })
}

/** Guard chain shared by all admin route handlers. Returns null when OK, or an error Response. */
export function guardAdminMutation(request: Request): Response | null {
  if (!isAdminRequestAuthorized(request)) {
    return jsonError("Unauthorized — admin session required", 401)
  }
  if (!csrfOk(request)) {
    return jsonError("CSRF validation failed", 403)
  }
  return null
}

export function guardAdminRead(request: Request): Response | null {
  if (!isAdminRequestAuthorized(request)) {
    return jsonError("Unauthorized — admin session required", 401)
  }
  return null
}
