import { getServiceSupabase } from "@/lib/supabase"
import { getSessionToken, getUserBySession, verifyPassword } from "@/lib/auth-server"
import { rateLimitCheck, rateLimitRecord, getClientIp } from "@/lib/rate-limit-server"

export const dynamic = "force-dynamic"

// Challenge flag verification — mirrors /api/labs/[id]/flag but reads the
// challenges table. Unlike the old client-side check (which accepted ANY
// "flag{...}" text and faked the solve), the decision is made here against
// the scrypt flag_hash stored by the admin panel. There is intentionally NO
// demo-flag fallback: a challenge that is not in the DB has no valid flag.

const FLAG_REGEX = /^(flag|aegis)\{[^}]+\}$/
const FLAG_MAX = 5
const FLAG_WINDOW = 60_000

function isValidFlagFormat(flag: string): boolean {
  return FLAG_REGEX.test(flag.trim())
}

/** Upsert completed progress, retrying once if the 0003 unique index races us. */
async function saveProgress(
  supabase: NonNullable<ReturnType<typeof getServiceSupabase>>,
  userId: string,
  challengeId: string
): Promise<boolean> {
  const now = new Date().toISOString()
  try {
    const existing = await supabase
      .from("progress")
      .select("id")
      .eq("user_id", userId)
      .eq("challenge_id", challengeId)
      .limit(1)
    if (existing.data && existing.data.length > 0) {
      await supabase
        .from("progress")
        .update({ status: "completed", progress: 100, updated_at: now })
        .eq("id", existing.data[0].id as string)
      return true
    }
    const inserted = await supabase.from("progress").insert({
      user_id: userId,
      challenge_id: challengeId,
      status: "completed",
      progress: 100,
      updated_at: now,
    })
    if (inserted.error && /duplicate|unique/i.test(inserted.error.message)) {
      const raced = await supabase
        .from("progress")
        .select("id")
        .eq("user_id", userId)
        .eq("challenge_id", challengeId)
        .limit(1)
      if (raced.data && raced.data.length > 0) {
        await supabase
          .from("progress")
          .update({ status: "completed", progress: 100, updated_at: now })
          .eq("id", raced.data[0].id as string)
        return true
      }
    }
    return !inserted.error
  } catch {
    return false
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const ip = getClientIp(request)
  const rateKey = `cflag:${id}:${ip}`

  const rl = await rateLimitCheck(rateKey, FLAG_MAX, FLAG_WINDOW)
  if (rl.limited) {
    return Response.json(
      { correct: false, error: "Rate limited. Try again soon.", retryAfterMs: rl.resetMs },
      {
        status: 429,
        headers: { "Retry-After": Math.ceil(rl.resetMs / 1000).toString() },
      }
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    await rateLimitRecord(rateKey, FLAG_MAX, FLAG_WINDOW)
    return Response.json({ correct: false, error: "Invalid JSON body" }, { status: 400 })
  }

  const flag = (body as { flag?: unknown })?.flag
  if (typeof flag !== "string" || flag.trim().length === 0) {
    await rateLimitRecord(rateKey, FLAG_MAX, FLAG_WINDOW)
    return Response.json({ correct: false, error: "Missing 'flag' field" }, { status: 400 })
  }

  const trimmed = flag.trim()
  if (!isValidFlagFormat(trimmed)) {
    await rateLimitRecord(rateKey, FLAG_MAX, FLAG_WINDOW)
    return Response.json(
      { correct: false, error: "Invalid flag format. Expected flag{...} or aegis{...}" },
      { status: 400 }
    )
  }

  const supabase = getServiceSupabase()
  if (!supabase) {
    await rateLimitRecord(rateKey, FLAG_MAX, FLAG_WINDOW)
    return Response.json(
      { correct: false, message: "Challenge verification is unavailable (database not configured)." },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    )
  }

  let challengeRow: Record<string, unknown> | null = null
  try {
    const { data, error } = await supabase
      .from("challenges")
      .select("id,name,flag_hash")
      .eq("id", id)
      .limit(1)
    if (!error && data && data.length > 0) challengeRow = data[0] as Record<string, unknown>
  } catch (err) {
    console.warn("[api/challenges/flag] DB lookup failed:", err)
  }

  const storedHash = challengeRow && typeof challengeRow.flag_hash === "string" && challengeRow.flag_hash
    ? challengeRow.flag_hash
    : null
  const correct = storedHash ? await verifyPassword(trimmed, storedHash) : false

  if (!correct) {
    await rateLimitRecord(rateKey, FLAG_MAX, FLAG_WINDOW)
    return Response.json(
      {
        correct: false,
        message: challengeRow
          ? storedHash
            ? "Incorrect flag. Try again."
            : "Flag not configured for this challenge yet."
          : "Challenge not found.",
      },
      { headers: { "Cache-Control": "no-store" } }
    )
  }

  // Correct: record progress for logged-in users (best-effort)
  let progressSaved = false
  const token = getSessionToken(request)
  const user = token ? await getUserBySession(token) : null
  if (user && challengeRow) {
    progressSaved = await saveProgress(supabase, user.id, String(challengeRow.id))
  }

  return Response.json(
    { correct: true, message: "Correct flag!", progressSaved },
    { headers: { "Cache-Control": "no-store" } }
  )
}
