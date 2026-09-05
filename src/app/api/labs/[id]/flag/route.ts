export const dynamic = "force-dynamic"

// In-memory rate limit + flag store (per server instance).
// For demo / before Supabase persistence.

type RateEntry = { count: number; resetAt: number }
const rateMap = new Map<string, RateEntry>()

// Demo flag answers – in production these would live in DB / env secrets.
// For unknown lab ids, any flag matching the regex is considered correct if it contains "aegis" prefix.
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

  // Determine correctness
  const expected = DEMO_FLAGS[id]
  let correct = false

  if (expected) {
    correct = trimmed === expected
    // also allow case-insensitive aegis/flag prefix swap for demo convenience
    if (!correct) {
      const normalizedSubmitted = trimmed.replace(/^aegis\{/i, "flag{")
      const normalizedExpected = expected.replace(/^aegis\{/i, "flag{")
      correct = normalizedSubmitted.toLowerCase() === normalizedExpected.toLowerCase()
    }
  } else {
    // For unknown labs: any valid-format flag is considered correct if it doesn't look like garbage?
    // Keep demo behavior: accept any valid flag as correct for non-demo labs so platform is testable
    correct = true
  }

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
