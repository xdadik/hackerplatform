export const dynamic = "force-dynamic"

import { getServiceSupabase } from "@/lib/supabase"
import { verifyPassword } from "@/lib/auth-server"

// In-memory rate limit (per server instance).

type RateEntry = { count: number; resetAt: number }
const rateMap = new Map<string, RateEntry>()

const FLAG_REGEX = /^(flag|aegis)\{[^}]+\}$/
function isValidFlagFormat(flag: string): boolean {
  const trimmed = flag.trim()
  return FLAG_REGEX.test(trimmed)
}

function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")
  if (forwarded) return forwarded.split(",")[0].trim()
  const realIp = request.headers.get("x-real-ip")
  if (realIp) return realIp.trim()
  return "unknown"
}

function checkRateLimit(key: string, max = 5, windowMs = 60_000): { limited: boolean; remaining: number; resetMs: number } {
  const now = Date.now()
  const entry = rateMap.get(key)
  if (!entry || now > entry.resetAt) {
    return { limited: false, remaining: max, resetMs: 0 }
  }
  const limited = entry.count >= max
  const remaining = Math.max(0, max - entry.count)
  const resetMs = entry.resetAt - now
  return { limited, remaining, resetMs }
}

function recordAttempt(key: string, windowMs = 60_000) {
  const now = Date.now()
  const entry = rateMap.get(key)
  if (!entry || now > entry.resetAt) {
    rateMap.set(key, { count: 1, resetAt: now + windowMs })
  } else {
    entry.count += 1
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const ip = getClientIp(request)
  const rateKey = `flag:${id}:${ip}`

  const { limited, resetMs } = checkRateLimit(rateKey, 5, 60_000)
  if (limited) {
    return Response.json(
      { correct: false, error: "Rate limited. Try again soon.", retryAfterMs: resetMs },
      {
        status: 429,
        headers: {
          "Retry-After": Math.ceil(resetMs / 1000).toString(),
        },
      }
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    recordAttempt(rateKey)
    return Response.json({ correct: false, error: "Invalid JSON body" }, { status: 400 })
  }

  const flag = (body as { flag?: unknown })?.flag

  if (typeof flag !== "string" || flag.trim().length === 0) {
    recordAttempt(rateKey)
    return Response.json({ correct: false, error: "Missing 'flag' field" }, { status: 400 })
  }

  const trimmed = flag.trim()

  // Enforce format validation before checking correctness
  if (!isValidFlagFormat(trimmed)) {
    recordAttempt(rateKey)
    return Response.json(
      { correct: false, error: "Invalid flag format. Expected flag{...} or aegis{...}" },
      { status: 400 }
    )
  }

  // Determine correctness against the scrypt-hashed flag stored in the database.
  // Flags are never stored or compared in plaintext.
  const supabase = getServiceSupabase()
  if (!supabase) {
    recordAttempt(rateKey)
    return Response.json(
      { correct: false, error: "Flag verification unavailable. Database is not configured." },
      { status: 503 }
    )
  }

  let flagHash: string | null = null
  try {
    const { data: lab } = await supabase
      .from("labs")
      .select("flag_hash")
      .eq("id", id)
      .limit(1)
    if (lab && lab.length > 0) flagHash = (lab[0].flag_hash as string) ?? null
    if (!flagHash) {
      const { data: ch } = await supabase
        .from("challenges")
        .select("flag_hash")
        .eq("id", id)
        .limit(1)
      if (ch && ch.length > 0) flagHash = (ch[0].flag_hash as string) ?? null
    }
  } catch {
    recordAttempt(rateKey)
    return Response.json(
      { correct: false, error: "Flag verification failed. Try again." },
      { status: 500 }
    )
  }

  if (!flagHash) {
    recordAttempt(rateKey)
    return Response.json(
      { correct: false, error: "No flag is configured for this lab or challenge." },
      { status: 404 }
    )
  }

  const correct = await verifyPassword(trimmed, flagHash)

  if (!correct) {
    recordAttempt(rateKey)
  }

  return Response.json(
    {
      correct,
      message: correct ? "Correct flag!" : "Incorrect flag. Try again.",
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    }
  )
}
