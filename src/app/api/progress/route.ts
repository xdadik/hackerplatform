import { getServiceSupabase } from "@/lib/supabase"
import { getSessionToken, getUserBySession, type SessionUser } from "@/lib/auth-server"

export const dynamic = "force-dynamic"

// Progress is persisted in the Supabase `progress` table, keyed by the real
// authenticated user (httpOnly aegis_session cookie -> sessions row -> user).
// The service-role client is used because RLS policies rely on Supabase
// auth.uid(), which is null for our custom session tokens — user identity is
// resolved server-side before any query.

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

  const payload = {
    user_id: user.id,
    lab_id: clean.labId,
    challenge_id: clean.challengeId,
    status: clean.status,
    progress: clean.progress,
    updated_at: clean.updatedAt,
  }

  // Upsert by (user, item) via select-then-write — the progress table has no
  // unique constraint covering NULL lab/challenge ids, so ON CONFLICT cannot
  // be inferred. Single-writer per user makes this safe in practice.
  try {
    let query = supabase.from("progress").select("id").eq("user_id", user.id)
    if (clean.labId) query = query.eq("lab_id", clean.labId)
    else query = query.is("lab_id", null)
    if (clean.challengeId) query = query.eq("challenge_id", clean.challengeId)
    else query = query.is("challenge_id", null)
    const { data: existing, error: selectErr } = await query.limit(1)

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
    if (insertErr) throw new Error(insertErr.message)
    return Response.json({ ok: true, progress: inserted, source: "supabase" }, { headers })
  } catch (err) {
    console.error("[api/progress] write failed:", err)
    return Response.json({ error: "Failed to save progress" }, { status: 500, headers })
  }
}
