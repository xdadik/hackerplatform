import { getAdminSessionToken, verifyAdminToken, hashPassword } from "@/lib/auth-server"
import { getServiceSupabase } from "@/lib/supabase"
import { env } from "@/lib/env"

export const runtime = "nodejs"

const TABLES = ["users", "videos", "events", "news", "cves", "labs", "challenges", "settings", "messages"] as const
type Table = (typeof TABLES)[number]

function isTable(t: string): t is Table {
  return (TABLES as readonly string[]).includes(t)
}

function checkAdmin(request: Request): boolean {
  const token = getAdminSessionToken(request)
  const secret = env.ADMIN_PASS
  if (!secret || secret === "change-me") return false
  return verifyAdminToken(token, secret)
}

function str(v: unknown, max = 500): string {
  return typeof v === "string" ? v.slice(0, max).trim() : ""
}

function num(v: unknown, fallback = 0): number {
  const n = typeof v === "number" ? v : parseInt(String(v ?? ""), 10)
  return Number.isFinite(n) ? n : fallback
}

function oneOf<T extends string>(v: unknown, allowed: readonly T[]): T | undefined {
  return typeof v === "string" && (allowed as readonly string[]).includes(v) ? (v as T) : undefined
}

/** Map admin-UI partial payload → DB patch. */
async function toPatch(table: Table, body: Record<string, unknown>): Promise<Record<string, unknown>> {
  const row: Record<string, unknown> = {}
  const put = (dbKey: string, v: unknown) => { if (v !== undefined) row[dbKey] = v }
  switch (table) {
    case "users": {
      const name = str(body.username ?? body.name, 64)
      if (name) row.name = name
      const email = str(body.email, 254).toLowerCase()
      if (email && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) row.email = email
      if (body.reputation !== undefined) row.reputation = Math.max(0, num(body.reputation))
      const status = oneOf(body.status, ["Active", "Pending", "Banned"] as const)
      if (status) row.status = status
      const role = oneOf(body.role, ["user", "moderator", "admin"] as const)
      if (role) row.role = role
      if (typeof body.password === "string" && body.password.length > 0) {
        if (body.password.length < 8) throw new Error("Password must be at least 8 characters")
        row.password_hash = await hashPassword(body.password)
      }
      break
    }
    case "videos": {
      if (body.title !== undefined) { const t = str(body.title, 200); if (t) row.title = t }
      put("subtitle", body.subtitle !== undefined ? str(body.subtitle, 200) : undefined)
      put("duration", body.duration !== undefined ? str(body.duration, 20) || "00:00" : undefined)
      if (body.module !== undefined || body.category !== undefined) {
        const module = str(body.module ?? body.category, 64) || "General"
        row.module = module
        row.category = str(body.category, 64) || module
      }
      if (body.path !== undefined) row.path = str(body.path, 80).toLowerCase().replace(/[^a-z0-9-]/g, "-") || "general"
      if (body.youtubeId !== undefined) row.youtube_id = str(body.youtubeId, 20) || null
      if (body.description !== undefined) row.description = str(body.description, 2000)
      if (body.featured !== undefined) row.featured = !!body.featured
      break
    }
    case "events": {
      if (body.title !== undefined) { const t = str(body.title, 200); if (t) row.title = t }
      const type = oneOf(body.type, ["CTF", "Workshop", "Competition"] as const)
      if (type) row.type = type
      if (body.date !== undefined) row.date = str(body.date, 40)
      const status = oneOf(body.status, ["Live", "Upcoming", "Ended"] as const)
      if (status) row.status = status
      if (body.participants !== undefined) row.participants = Math.max(0, num(body.participants))
      break
    }
    case "news": {
      if (body.title !== undefined) { const t = str(body.title, 200); if (t) row.title = t }
      if (body.excerpt !== undefined) row.excerpt = str(body.excerpt, 500)
      if (body.author !== undefined) row.author = str(body.author, 64) || "Admin"
      if (body.tags !== undefined) row.tags = str(body.tags, 200)
      if (body.views !== undefined) row.views = Math.max(0, num(body.views))
      const status = oneOf(body.status, ["Published", "Draft", "Pending"] as const)
      if (status) row.status = status
      if (body.content !== undefined) row.content = str(body.content, 50000)
      break
    }
    case "cves": {
      if (body.cveId !== undefined || body.cve_id !== undefined) {
        const cveId = str(body.cveId ?? body.cve_id, 20).toUpperCase()
        if (cveId && !/^CVE-\d{4}-\d{4,7}$/.test(cveId)) throw new Error("Invalid CVE ID format (CVE-YYYY-XXXX)")
        if (cveId) row.cve_id = cveId
      }
      if (body.title !== undefined) { const t = str(body.title, 200); if (t) row.title = t }
      const severity = oneOf(body.severity, ["Critical", "High", "Medium", "Low"] as const)
      if (severity) row.severity = severity
      const status = oneOf(body.status, ["Published", "Draft"] as const)
      if (status) row.status = status
      if (body.publishDate !== undefined || body.publish_date !== undefined) {
        row.publish_date = str(body.publishDate ?? body.publish_date, 20)
      }
      break
    }
    case "labs": {
      if (body.title !== undefined) { const t = str(body.title, 200); if (t) row.title = t }
      if (body.category !== undefined) row.category = str(body.category, 64) || "Web Security"
      const difficulty = oneOf(body.difficulty, ["Beginner", "Intermediate", "Advanced", "Expert"] as const)
      if (difficulty) row.difficulty = difficulty
      if (body.duration !== undefined) row.duration = str(body.duration, 20) || "60 min"
      if (body.description !== undefined) row.description = str(body.description, 2000)
      if (body.objectives !== undefined) row.objectives = Math.max(1, num(body.objectives, 1))
      if (body.youtubeId !== undefined) row.youtube_id = str(body.youtubeId, 20) || null
      if (typeof body.flag === "string" && body.flag.length > 0) {
        row.flag_hash = await hashPassword(body.flag.trim())
      }
      break
    }
    case "challenges": {
      if (body.name !== undefined || body.title !== undefined) {
        const n = str(body.name ?? body.title, 200)
        if (n) row.name = n
      }
      if (body.category !== undefined) row.category = str(body.category, 64) || "Web"
      const difficulty = oneOf(body.difficulty, ["Easy", "Medium", "Hard", "Insane"] as const)
      if (difficulty) row.difficulty = difficulty
      if (body.points !== undefined) row.points = Math.max(0, num(body.points, 100))
      if (body.solves !== undefined) row.solves = Math.max(0, num(body.solves))
      if (body.tags !== undefined) {
        row.tags = Array.isArray(body.tags)
          ? body.tags.map((t) => str(t, 40)).filter(Boolean)
          : str(body.tags, 200).split(",").map((t) => t.trim()).filter(Boolean)
      }
      if (typeof body.flag === "string" && body.flag.length > 0) {
        row.flag_hash = await hashPassword(body.flag.trim())
      }
      break
    }
    case "settings": {
      if (body.value !== undefined) row.value = str(body.value, 5000)
      break
    }
    case "messages": {
      if (body.read !== undefined) row.read = !!body.read
      break
    }
  }
  return row
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ table: string; id: string }> }
) {
  const { table, id } = await params
  if (!isTable(table)) return Response.json({ error: "Unknown table" }, { status: 404 })
  if (!checkAdmin(request)) return Response.json({ error: "Unauthorized" }, { status: 401 })
  const supabase = getServiceSupabase()
  if (!supabase) return Response.json({ error: "Database is not configured" }, { status: 503 })
  let body: Record<string, unknown> | null = null
  try { body = await request.json() } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 })
  }
  let patch: Record<string, unknown>
  try {
    patch = await toPatch(table, body ?? {})
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : "Validation failed" }, { status: 400 })
  }
  if (Object.keys(patch).length === 0) {
    return Response.json({ error: "Nothing to update" }, { status: 400 })
  }
  const { data, error } = await supabase.from(table).update(patch).eq("id", id).select("*").limit(1)
  if (error) return Response.json({ error: "Failed to update" }, { status: 500 })
  if (!data || data.length === 0) return Response.json({ error: "Not found" }, { status: 404 })
  return Response.json({ item: data[0], ok: true })
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ table: string; id: string }> }
) {
  const { table, id } = await params
  if (!isTable(table)) return Response.json({ error: "Unknown table" }, { status: 404 })
  if (!checkAdmin(request)) return Response.json({ error: "Unauthorized" }, { status: 401 })
  const supabase = getServiceSupabase()
  if (!supabase) return Response.json({ error: "Database is not configured" }, { status: 503 })
  const { error, count } = await supabase.from(table).delete({ count: "exact" }).eq("id", id)
  if (error) return Response.json({ error: "Failed to delete" }, { status: 500 })
  if (!count) return Response.json({ error: "Not found" }, { status: 404 })
  return Response.json({ ok: true })
}
