import { randomUUID } from "crypto"

export const dynamic = "force-dynamic"

// In-memory fallback store. In production with Supabase, this would query that instead.
// Keyed by userId (from cookie aegis_uid) -> progress records.

type ProgressRecord = {
  id: string
  userId: string
  labId?: string | null
  challengeId?: string | null
  pathId?: string | null
  status: "not_started" | "in_progress" | "completed"
  progress: number
  updatedAt: string
}

const progressStore = new Map<string, ProgressRecord[]>() // userId -> records

function getUserId(request: Request): string | null {
  const cookie = request.headers.get("cookie") ?? ""
  const match = cookie.match(/(?:^|;\s*)aegis_uid=([^;]+)/)
  return match ? decodeURIComponent(match[1]) : null
}

function buildSetCookieHeader(userId: string): string {
  // 1 year, lax, httpOnly not set here because Next Response cookies are easier via header, but we set basics
  return `aegis_uid=${encodeURIComponent(userId)}; Path=/; Max-Age=${60 * 60 * 24 * 365}; SameSite=Lax`
}

export async function GET(request: Request) {
  const existingUid = getUserId(request)
  let userId = existingUid
  const headers: Record<string, string> = {
    "Cache-Control": "no-store, must-revalidate",
  }

  // If no cookie, create one and return empty progress (first visit)
  if (!userId) {
    userId = `anon_${randomUUID()}`
    headers["Set-Cookie"] = buildSetCookieHeader(userId)
    return Response.json({ userId, progress: [] as ProgressRecord[], source: "mock" as const }, { headers })
  }

  // Try Supabase if configured (non-blocking fallback)
  // We intentionally do not import getSupabase here at top to keep this route lightweight;
  // but we can attempt dynamic check without crashing if env missing.
  try {
    // Lazy import to avoid crashing when Supabase env absent at build time
    const { getSupabase } = await import("@/lib/supabase")
    const supabase = getSupabase()
    if (supabase) {
      const { data, error } = await supabase
        .from("progress")
        .select("*")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false })

      if (!error && data) {
        return Response.json(
          {
            userId,
            progress: data,
            source: "supabase" as const,
          },
          { headers }
        )
      }
    }
  } catch {
    // ignore and fall back
  }

  const records = progressStore.get(userId) ?? []
  return Response.json({ userId, progress: records, source: "mock" as const }, { headers })
}

export async function POST(request: Request) {
  let userId = getUserId(request)
  const headers: Record<string, string> = {
    "Cache-Control": "no-store",
  }
  let setCookieHeader: string | null = null

  if (!userId) {
    userId = `anon_${randomUUID()}`
    setCookieHeader = buildSetCookieHeader(userId)
    headers["Set-Cookie"] = setCookieHeader
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400, headers })
  }

  const b = body as Record<string, unknown>
  const labId = typeof b.labId === "string" ? b.labId : null
  const challengeId = typeof b.challengeId === "string" ? b.challengeId : null
  const pathId = typeof b.pathId === "string" ? b.pathId : null
  const statusRaw = typeof b.status === "string" ? b.status : "in_progress"
  const progressRaw = typeof b.progress === "number" ? b.progress : typeof b.progress === "string" ? parseInt(b.progress, 10) : 0

  const allowedStatus = new Set(["not_started", "in_progress", "completed"])
  const status = allowedStatus.has(statusRaw) ? (statusRaw as ProgressRecord["status"]) : "in_progress"
  const progress = Math.min(100, Math.max(0, isNaN(progressRaw) ? 0 : progressRaw))

  if (!labId && !challengeId && !pathId) {
    return Response.json({ error: "At least one of labId, challengeId, pathId is required" }, { status: 400, headers })
  }

  const record: ProgressRecord = {
    id: randomUUID(),
    userId: userId!,
    labId,
    challengeId,
    pathId,
    status,
    progress,
    updatedAt: new Date().toISOString(),
  }

  // Try Supabase upsert if available
  try {
    const { getSupabase } = await import("@/lib/supabase")
    const supabase = getSupabase()
    if (supabase) {
      const payload: Record<string, unknown> = {
        user_id: userId,
        lab_id: labId,
        challenge_id: challengeId,
        status,
        progress,
        updated_at: record.updatedAt,
      }
      const { error } = await supabase.from("progress").upsert(payload as never)
      if (!error) {
        return Response.json({ ok: true, progress: record, source: "supabase" as const }, { headers })
      }
      console.warn("[api/progress] Supabase upsert failed, using mock:", error.message)
    }
  } catch (err) {
    console.warn("[api/progress] Supabase not available, using mock:", err)
  }

  // Mock fallback: store in-memory
  const list = progressStore.get(userId!) ?? []
  // Upsert by labId/challengeId/pathId match
  const idx = list.findIndex(
    (r) => r.labId === labId && r.challengeId === challengeId && r.pathId === pathId
  )
  if (idx >= 0) {
    list[idx] = { ...list[idx], status, progress, updatedAt: record.updatedAt }
  } else {
    list.push(record)
  }
  progressStore.set(userId!, list)

  const saved = idx >= 0 ? list[idx] : record

  return Response.json({ ok: true, progress: saved, source: "mock" as const }, { headers })
}
