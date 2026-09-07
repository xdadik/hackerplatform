import { getServiceSupabase } from "@/lib/supabase"
import { getSessionToken, getUserBySession, type SessionUser } from "@/lib/auth-server"
import { rateLimitCheck, rateLimitRecord } from "@/lib/rate-limit-server"

export const dynamic = "force-dynamic"

// Progress is persisted in the Supabase `progress` table, keyed by the real
// authenticated user (httpOnly aegis_session cookie -> sessions row -> user).
// The service-role client is used because RLS policies rely on Supabase
// auth.uid(), which is null for our custom session tokens — user identity is
// resolved server-side before any query.

const PROGRESS_MAX = 30 // writes per minute per user
const PROGRESS_WINDOW = 60_000

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

type ProgressPayload = {
  labId?: string | null
  challengeId?: string | null
  pathId?: string | null
  status: "not_started" | "in_progress" | "completed"
  progress: number
  updatedAt: string
}

async function requireUser(request: Request): Promise<SessionUser | null> {
  const token = getSessionToken(request)
  if (!token) return null
  return getUserBySession(token)
}

function sanitizeBody(b: Record<string, unknown>): ProgressPayload | null {
  const labId = typeof b.labId === "string" && b.labId.trim() ? b.labId.trim() : null
  const challengeId = typeof b.challengeId === "string" && b.challengeId.trim() ? b.challengeId.trim() : null
  const pathId = typeof b.pathId === "string" && b.pathId.trim() ? b.pathId.trim() : null
  if (!labId && !challengeId && !pathId) return null

  const statusRaw = typeof b.status === "string" ? b.status : "in_progress"
  const allowedStatus = new Set(["not_started", "in_progress", "completed"])
  const status = (allowedStatus.has(statusRaw) ? statusRaw : "in_progress") as ProgressPayload["status"]

  const progressRaw =
    typeof b.progress === "number" ? b.progress : typeof b.progress === "string" ? parseInt(b.progress, 10) : 0
  const progress = Math.min(100, Math.max(0, Number.isNaN(progressRaw) ? 0 : progressRaw))

  return { labId, challengeId, pathId, status, progress, updatedAt: new Date().toISOString() }
}

export async function GET(request: Request) {
  const headers: Record<string, string> = { "Cache-Control": "no-store, must-revalidate" }

  const user = await requireUser(request)
  if (!user) {
    return Response.json({ error: "Login required to track progress" }, { status: 401, headers })
  }

  const supabase = getServiceSupabase()
  if (!supabase) {
    return Response.json({ error: "Database is not configured" }, { status: 503, headers })
  }

  const { data, error } = await supabase
    .from("progress")
    .select("id,lab_id,challenge_id,status,progress,updated_at")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })

  if (error) {
    console.error("[api/progress] read failed:", error.message)
    return Response.json({ error: "Failed to load progress" }, { status: 500, headers })
  }

  return Response.json({ userId: user.id, progress: data ?? [], source: "supabase" }, { headers })
}

export async function POST(request: Request) {
  const headers: Record<string, string> = { "Cache-Control": "no-store" }

  const user = await requireUser(request)
  if (!user) {
    return Response.json({ error: "Login required to track progress" }, { status: 401, headers })
  }

  const supabase = getServiceSupabase()
  if (!supabase) {
    return Response.json({ error: "Database is not configured" }, { status: 503, headers })
  }

  // This route is an unthrottled authenticated write endpoint otherwise —
  // 30 writes/min per user is generous for real UIs and hostile to scripts.
  const bucket = `progress:${user.id}`
  const rl = await rateLimitCheck(bucket, PROGRESS_MAX, PROGRESS_WINDOW)
  if (rl.limited) {
    return Response.json(
      { error: "Too many progress updates. Try again shortly." },
      { status: 429, headers: { ...headers, "Retry-After": String(Math.ceil(rl.resetMs / 1000)) } }
    )
  }
  await rateLimitRecord(bucket, PROGRESS_MAX, PROGRESS_WINDOW)

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400, headers })
  }

  const clean = sanitizeBody((body ?? {}) as Record<string, unknown>)
  if (!clean) {
    return Response.json(
      { error: "At least one of labId, challengeId, pathId is required" },
      { status: 400, headers }
    )
  }

  // Reject non-UUID ids with a clean 400 instead of an opaque DB 500.
  if (clean.labId && !UUID_RE.test(clean.labId)) {
    return Response.json({ error: "labId must be a UUID" }, { status: 400, headers })
  }
  if (clean.challengeId && !UUID_RE.test(clean.challengeId)) {
    return Response.json({ error: "challengeId must be a UUID" }, { status: 400, headers })
  }

  const payload = {
    user_id: user.id,
    lab_id: clean.labId,
    challenge_id: clean.challengeId,
    status: clean.status,
    progress: clean.progress,
    updated_at: clean.updatedAt,
  }

  // Upsert by (user, item) via select-then-write. The progress table has no
  // ON CONFLICT target covering NULL lab/challenge ids, so we select first,
  // and if the 0003 unique index turns a concurrent insert into a duplicate
  // error we retry once as an update.
  const buildSelect = () => {
    let q = supabase.from("progress").select("id").eq("user_id", user.id as string)
    if (clean.labId) q = q.eq("lab_id", clean.labId)
    else q = q.is("lab_id", null)
    if (clean.challengeId) q = q.eq("challenge_id", clean.challengeId)
    else q = q.is("challenge_id", null)
    return q
  }

  try {
    const { data: existing, error: selectErr } = await buildSelect().limit(1)

    if (selectErr) throw new Error(selectErr.message)

    if (existing && existing.length > 0) {
      const { data: updated, error: updateErr } = await supabase
        .from("progress")
        .update({ status: clean.status, progress: clean.progress, updated_at: clean.updatedAt })
        .eq("id", existing[0].id as string)
        .select("id,lab_id,challenge_id,status,progress,updated_at")
        .single()
      if (updateErr) throw new Error(updateErr.message)
      return Response.json({ ok: true, progress: updated, source: "supabase" }, { headers })
    }

    const { data: inserted, error: insertErr } = await supabase
      .from("progress")
      .insert(payload)
      .select("id,lab_id,challenge_id,status,progress,updated_at")
      .single()

    if (insertErr && /duplicate|unique/i.test(insertErr.message)) {
      // Raced a concurrent write — the row now exists, so update it.
      const { data: raced } = await buildSelect().limit(1)
      const racedId = raced && raced.length > 0 ? (raced[0].id as string) : null
      if (racedId) {
        const { data: updated, error: updateErr } = await supabase
          .from("progress")
          .update({ status: clean.status, progress: clean.progress, updated_at: clean.updatedAt })
          .eq("id", racedId)
          .select("id,lab_id,challenge_id,status,progress,updated_at")
          .single()
        if (updateErr) throw new Error(updateErr.message)
        return Response.json({ ok: true, progress: updated, source: "supabase" }, { headers })
      }
    }
    if (insertErr) throw new Error(insertErr.message)
    return Response.json({ ok: true, progress: inserted, source: "supabase" }, { headers })
  } catch (err) {
    console.error("[api/progress] write failed:", err)
    return Response.json({ error: "Failed to save progress" }, { status: 500, headers })
  }
}
