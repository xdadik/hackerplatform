import { getServiceSupabase } from "@/lib/supabase"
import { getSessionToken, getUserBySession, verifyPassword } from "@/lib/auth-server"
import { checkRateLimitServer, recordAttemptServer, getClientIp } from "@/lib/rate-limit-server"

export const dynamic = "force-dynamic"

// Flag verification against the labs table (flag_hash column, scrypt).
// Flags are never stored in plaintext — the admin panel hashes the flag with
// scrypt before persisting. DEMO_FLAGS is kept as a fallback for the six
// bundled demo labs (lab-1..lab-6) so the platform works before the DB is
// seeded. When a lab exists in the DB, its flag_hash is authoritative.

const DEMO_FLAGS: Record<string, string> = {
  "lab-1": "flag{sqli_fundamentals_2026}",
  "lab-2": "flag{privesc_linux_2026}",
  "lab-3": "flag{ad_enumeration_master}",
  "lab-4": "flag{iam_misconfig_pwned}",
  "lab-5": "flag{volatility_memory_win}",
  "lab-6": "flag{wireshark_traffic_hunter}",
}

const FLAG_REGEX = /^(flag|aegis)\{[^}]+\}$/
function isValidFlagFormat(flag: string): boolean {
  return FLAG_REGEX.test(flag.trim())
}

function normalizeFlag(flag: string): string {
  // allow aegis{...} / flag{...} prefix swap, case-insensitive compare
  return flag.trim().replace(/^aegis\{/i, "flag{").toLowerCase()
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const ip = getClientIp(request)
  const rateKey = `flag:${id}:${ip}`

  const { limited, resetMs } = checkRateLimitServer(rateKey, 5, 60_000)
  if (limited) {
    return Response.json(
      { correct: false, error: "Rate limited. Try again soon.", retryAfterMs: resetMs },
      {
        status: 429,
        headers: { "Retry-After": Math.ceil(resetMs / 1000).toString() },
      }
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    recordAttemptServer(rateKey)
    return Response.json({ correct: false, error: "Invalid JSON body" }, { status: 400 })
  }

  const flag = (body as { flag?: unknown })?.flag
  if (typeof flag !== "string" || flag.trim().length === 0) {
    recordAttemptServer(rateKey)
    return Response.json({ correct: false, error: "Missing 'flag' field" }, { status: 400 })
  }

  const trimmed = flag.trim()
  if (!isValidFlagFormat(trimmed)) {
    recordAttemptServer(rateKey)
    return Response.json(
      { correct: false, error: "Invalid flag format. Expected flag{...} or aegis{...}" },
      { status: 400 }
    )
  }

  // 1) DB lab (authoritative) — verify against scrypt flag_hash
  let correct = false
  let labRow: Record<string, unknown> | null = null
  const supabase = getServiceSupabase()
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("labs")
        .select("id,title,flag_hash")
        .eq("id", id)
        .limit(1)
      if (!error && data && data.length > 0) labRow = data[0] as Record<string, unknown>
    } catch (err) {
      console.warn("[api/labs/flag] DB lookup failed, using demo fallback:", err)
    }
  }

  if (labRow && typeof labRow.flag_hash === "string" && labRow.flag_hash) {
    correct = await verifyPassword(trimmed, labRow.flag_hash)
  } else if (labRow) {
    // Lab exists in DB but no flag configured
    correct = false
  } else {
    // 2) Demo labs fallback (DB unconfigured or lab not migrated yet)
    const expected = DEMO_FLAGS[id]
    if (expected) {
      correct = normalizeFlag(trimmed) === normalizeFlag(expected)
    } else {
      correct = false
    }
  }

  if (!correct) {
    recordAttemptServer(rateKey)
    return Response.json(
      { correct: false, message: "Incorrect flag. Try again.", ...(labRow && !labRow.flag_hash ? { hint: "Flag not configured for this lab yet." } : {}) },
      { headers: { "Cache-Control": "no-store" } }
    )
  }

  // Correct: record progress for logged-in users (best-effort, non-blocking failure)
  let progressSaved = false
  if (labRow && supabase) {
    const token = getSessionToken(request)
    const user = token ? await getUserBySession(token) : null
    if (user) {
      try {
        const labId = String(labRow.id)
        const now = new Date().toISOString()
        const existing = await supabase
          .from("progress")
          .select("id")
          .eq("user_id", user.id)
          .eq("lab_id", labId)
          .limit(1)
        if (existing.data && existing.data.length > 0) {
          await supabase
            .from("progress")
            .update({ status: "completed", progress: 100, updated_at: now })
            .eq("id", existing.data[0].id as string)
        } else {
          await supabase.from("progress").insert({
            user_id: user.id,
            lab_id: labId,
            status: "completed",
            progress: 100,
            updated_at: now,
          })
        }
        progressSaved = true
      } catch (err) {
        console.warn("[api/labs/flag] progress save failed:", err)
      }
    }
  }

  return Response.json(
    { correct: true, message: "Correct flag!", progressSaved },
    { headers: { "Cache-Control": "no-store" } }
  )
}
