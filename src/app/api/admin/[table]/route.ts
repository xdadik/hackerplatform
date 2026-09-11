import { getAdminSessionToken, verifyAdminToken, hashPassword } from "@/lib/auth-server"
import { getServiceSupabase } from "@/lib/supabase"
import { env } from "@/lib/env"
import { randomUUID } from "crypto"

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

function oneOf<T extends string>(v: unknown, allowed: readonly T[], fallback: T): T {
  return typeof v === "string" && (allowed as readonly string[]).includes(v) ? (v as T) : fallback
}

/** Map admin-UI payload → DB row. Throws on validation errors. */
async function toRow(table: Table, body: Record<string, unknown>, isCreate: boolean): Promise<Record<string, unknown>> {
  switch (table) {
    case "users": {
      const email = str(body.email, 254).toLowerCase()
      if (isCreate && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error("Valid email required")
      const row: Record<string, unknown> = {}
      if (isCreate) row.id = randomUUID()
      const name = str(body.username ?? body.name, 64)
      if (name) row.name = name
      if (email && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) row.email = email
      if (body.reputation !== undefined) row.reputation = Math.max(0, num(body.reputation))
      if (body.status !== undefined) row.status = oneOf(body.status, ["Active", "Pending", "Banned"] as const, "Active")
      if (body.role !== undefined) row.role = oneOf(body.role, ["user", "moderator", "admin"] as const, "user")
      if (typeof body.password === "string" && body.password.length > 0) {
        if (body.password.length < 8) throw new Error("Password must be at least 8 characters")
        row.password_hash = await hashPassword(body.password)
      } else if (isCreate) {
        throw new Error("Password is required for new users")
      }
      if (isCreate && !row.name) throw new Error("Username is required")
      return row
    }
    case "videos": {
      const title = str(body.title, 200)
      if (isCreate && !title) throw new Error("Title required")
      const row: Record<string, unknown> = {}
      if (title) row.title = title
      if (body.subtitle !== undefined) row.subtitle = str(body.subtitle, 200)
      if (body.duration !== undefined) row.duration = str(body.duration, 20) || "00:00"
      const module = str(body.module ?? body.category, 64) || "General"
      row.module = module
      if (body.category !== undefined || isCreate) row.category = str(body.category, 64) || module
      if (body.path !== undefined) row.path = str(body.path, 80).toLowerCase().replace(/[^a-z0-9-]/g, "-") || "general"
      else if (isCreate) row.path = "general"
      if (body.youtubeId !== undefined) row.youtube_id = str(body.youtubeId, 20) || null
      if (body.description !== undefined) row.description = str(body.description, 2000)
      if (body.featured !== undefined) row.featured = !!body.featured
      return row
    }
    case "events": {
      const title = str(body.title, 200)
      if (isCreate && !title) throw new Error("Title required")
      const row: Record<string, unknown> = {}
      if (title) row.title = title
      if (body.type !== undefined) row.type = oneOf(body.type, ["CTF", "Workshop", "Competition"] as const, "CTF")
      if (body.date !== undefined) row.date = str(body.date, 40)
      else if (isCreate) row.date = new Date().toISOString().slice(0, 10)
      if (body.status !== undefined) row.status = oneOf(body.status, ["Live", "Upcoming", "Ended"] as const, "Upcoming")
      if (body.participants !== undefined) row.participants = Math.max(0, num(body.participants))
      return row
    }
    case "news": {
      const title = str(body.title, 200)
      if (isCreate && !title) throw new Error("Title required")
      const row: Record<string, unknown> = {}
      if (title) row.title = title
      if (body.excerpt !== undefined) row.excerpt = str(body.excerpt, 500)
      if (body.author !== undefined) row.author = str(body.author, 64) || "Admin"
      if (body.tags !== undefined) row.tags = str(body.tags, 200)
      if (body.views !== undefined) row.views = Math.max(0, num(body.views))
      if (body.status !== undefined) row.status = oneOf(body.status, ["Published", "Draft", "Pending"] as const, "Draft")
      if (body.content !== undefined) row.content = str(body.content, 50000)
      return row
    }
    case "cves": {
      const cveId = str(body.cveId ?? body.cve_id, 20).toUpperCase()
      if (isCreate) {
        if (!/^CVE-\d{4}-\d{4,7}$/.test(cveId)) throw new Error("Invalid CVE ID format (CVE-YYYY-XXXX)")
      }
      const title = str(body.title, 200)
      if (isCreate && !title) throw new Error("Title required")
      const row: Record<string, unknown> = {}
      if (cveId && /^CVE-\d{4}-\d{4,7}$/.test(cveId)) row.cve_id = cveId
      if (title) row.title = title
      if (body.severity !== undefined) row.severity = oneOf(body.severity, ["Critical", "High", "Medium", "Low"] as const, "High")
      if (body.status !== undefined) row.status = oneOf(body.status, ["Published", "Draft"] as const, "Draft")
      const pd = str(body.publishDate ?? body.publish_date, 20)
      if (pd) row.publish_date = pd
      else if (isCreate) row.publish_date = new Date().toISOString().slice(0, 10)
      return row
    }
    case "labs": {
      const title = str(body.title, 200)
      if (isCreate && !title) throw new Error("Title required")
      const row: Record<string, unknown> = {}
      if (title) row.title = title
      if (body.category !== undefined) row.category = str(body.category, 64) || "Web Security"
      if (body.difficulty !== undefined) row.difficulty = oneOf(body.difficulty, ["Beginner", "Intermediate", "Advanced", "Expert"] as const, "Beginner")
      if (body.duration !== undefined) row.duration = str(body.duration, 20) || "60 min"
      if (body.description !== undefined) row.description = str(body.description, 2000)
      if (body.objectives !== undefined) row.objectives = Math.max(1, num(body.objectives, 1))
      if (body.youtubeId !== undefined) row.youtube_id = str(body.youtubeId, 20) || null
      if (typeof body.flag === "string" && body.flag.length > 0) {
        row.flag_hash = await hashPassword(body.flag.trim())
      }
      return row
    }
    case "challenges": {
      const name = str(body.name ?? body.title, 200)
      if (isCreate && !name) throw new Error("Name required")
      const row: Record<string, unknown> = {}
      if (name) row.name = name
      if (body.category !== undefined) row.category = str(body.category, 64) || "Web"
      if (body.difficulty !== undefined) row.difficulty = oneOf(body.difficulty, ["Easy", "Medium", "Hard", "Insane"] as const, "Easy")
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
      return row
    }
    case "settings": {
      const key = str(body.key, 64)
      if (!key) throw new Error("Key required")
      return { key, value: str(body.value, 5000) }
    }
    case "messages": {
      // Admin reply: requires target user_id + text. from_role is always admin here.
      const userId = str(body.user_id ?? body.userId, 80)
      if (!userId) throw new Error("user_id required")
      const text = str(body.text, 2000)
      if (!text) throw new Error("Message text required")
      return { user_id: userId, from_role: "admin", text, read: false }
    }
  }
}

/** Map DB row → admin-UI shape. */
function fromRow(table: Table, row: Record<string, unknown>): Record<string, unknown> {
  const s = (v: unknown) => (v === null || v === undefined ? "" : String(v))
  switch (table) {
    case "users":
      return { id: s(row.id), username: s(row.name), email: s(row.email), reputation: num(row.reputation), status: s(row.status) || "Active", role: s(row.role) || "user" }
    case "videos":
      return { id: s(row.id), title: s(row.title), subtitle: s(row.subtitle), duration: s(row.duration) || "00:00", module: s(row.module) || "General", category: s(row.category), path: s(row.path) || "general", youtubeId: s(row.youtube_id), description: s(row.description), featured: !!row.featured }
    case "events":
      return { id: s(row.id), title: s(row.title), type: s(row.type) || "CTF", date: s(row.date), status: s(row.status) || "Upcoming", participants: num(row.participants) }
    case "news":
      return { id: s(row.id), title: s(row.title), excerpt: s(row.excerpt), author: s(row.author), tags: s(row.tags), views: num(row.views), status: s(row.status) || "Draft", content: s(row.content) }
    case "cves":
      return { id: s(row.id), cveId: s(row.cve_id), title: s(row.title), severity: s(row.severity) || "High", status: s(row.status) || "Draft", publishDate: s(row.publish_date) }
    case "labs":
      return { id: s(row.id), title: s(row.title), category: s(row.category) || "Web Security", difficulty: s(row.difficulty) || "Beginner", duration: s(row.duration) || "60 min", description: s(row.description), objectives: num(row.objectives, 1), participants: num(row.participants), youtubeId: s(row.youtube_id), hasFlag: !!(row.flag_hash as string) }
    case "challenges":
      return { id: s(row.id), name: s(row.name), category: s(row.category) || "Web", difficulty: s(row.difficulty) || "Easy", points: num(row.points, 100), solves: num(row.solves), tags: (row.tags as string[]) ?? [], hasFlag: !!(row.flag_hash as string) }
    case "settings":
      return { key: s(row.key), value: s(row.value) }
    case "messages": {
      const u = (row.users as Record<string, unknown> | null) ?? null
      return {
        id: s(row.id),
        user_id: s(row.user_id),
        userEmail: u ? s(u.email) : "",
        userName: u ? s(u.name) : "",
        from_role: s(row.from_role) || "user",
        text: s(row.text),
        read: !!row.read,
        created_at: s(row.created_at),
      }
    }
  }
}

const ORDER_COLUMN: Record<Table, string> = {
  users: "created_at",
  videos: "created_at",
  events: "date",
  news: "created_at",
  cves: "publish_date",
  labs: "created_at",
  challenges: "created_at",
  settings: "key",
  messages: "created_at",
}

export async function GET(request: Request, { params }: { params: Promise<{ table: string }> }) {
  const { table } = await params
  if (!isTable(table)) return Response.json({ error: "Unknown table" }, { status: 404 })
  if (!checkAdmin(request)) return Response.json({ error: "Unauthorized" }, { status: 401 })
  const supabase = getServiceSupabase()
  if (!supabase) return Response.json({ error: "Database is not configured" }, { status: 503 })
  const select = table === "users"
    ? "id,email,name,plan,provider,role,reputation,status,created_at"
    : table === "messages"
      ? "id,user_id,from_role,text,read,created_at,users(email,name)"
      : "*"
  const { data, error } = await supabase.from(table).select(select).order(ORDER_COLUMN[table], { ascending: false }).limit(200)
  if (error) return Response.json({ error: "Failed to load" }, { status: 500 })
  const rows = (data ?? []) as unknown as Record<string, unknown>[]
  return Response.json({ items: rows.map((r) => fromRow(table, r)) })
}

export async function POST(request: Request, { params }: { params: Promise<{ table: string }> }) {
  const { table } = await params
  if (!isTable(table)) return Response.json({ error: "Unknown table" }, { status: 404 })
  if (!checkAdmin(request)) return Response.json({ error: "Unauthorized" }, { status: 401 })
  const supabase = getServiceSupabase()
  if (!supabase) return Response.json({ error: "Database is not configured" }, { status: 503 })
  let body: Record<string, unknown> | null = null
  try { body = await request.json() } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 })
  }
  let row: Record<string, unknown>
  try {
    row = await toRow(table, body ?? {}, true)
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : "Validation failed" }, { status: 400 })
  }
  if (table === "settings") {
    const { data, error } = await supabase.from(table).upsert(row, { onConflict: "key" }).select("*").single()
    if (error) return Response.json({ error: "Failed to save" }, { status: 500 })
    return Response.json({ item: fromRow(table, data as Record<string, unknown>) }, { status: 200 })
  }
  const { data, error } = await supabase.from(table).insert(row).select("*").single()
  if (error) {
    const msg = String(error.message || error).toLowerCase()
    if (msg.includes("duplicate") || msg.includes("unique")) {
      return Response.json({ error: "A record with these unique values already exists" }, { status: 409 })
    }
    return Response.json({ error: "Failed to create" }, { status: 500 })
  }
  return Response.json({ item: fromRow(table, data as Record<string, unknown>) }, { status: 201 })
}
