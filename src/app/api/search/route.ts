import { labs as mockLabs, challenges as mockChallenges, learningPaths } from "@/lib/data"
import { getSupabase } from "@/lib/supabase"

export const dynamic = "force-dynamic"

type SearchResult = {
  id: string
  type: "lab" | "challenge" | "path" | "research" | "news" | "cve"
  title: string
  description: string
  category: string
  score: number
  href: string
}

function scoreMatch(query: string, fields: string[]): number {
  const q = query.toLowerCase()
  let score = 0
  for (const field of fields) {
    if (!field) continue
    const f = field.toLowerCase()
    if (f === q) score += 10
    else if (f.startsWith(q)) score += 7
    else if (f.includes(q)) score += 5
    const tokens = q.split(/\s+/).filter(Boolean)
    for (const tok of tokens) {
      if (tok.length > 1 && f.includes(tok)) score += 2
    }
  }
  return score
}

// ---------------------------------------------------------------------------
// Supabase-backed search — queries labs, challenges, news, cves tables.
// Falls back to static data only when Supabase is not configured at all
// (local dev without env keys). When the DB is configured but empty, the
// honest result is an empty list — seed content via the admin panel.
// ---------------------------------------------------------------------------

async function searchDb(query: string): Promise<SearchResult[] | null> {
  const supabase = getSupabase()
  if (!supabase) return null
  const like = `%${query}%`
  const results: SearchResult[] = []
  const errors: string[] = []

  const [labsRes, challengesRes, newsRes, cvesRes] = await Promise.all([
    supabase
      .from("labs")
      .select("id,title,category,difficulty,duration,description")
      .or(`title.ilike.${like},description.ilike.${like},category.ilike.${like}`)
      .limit(25),
    supabase
      .from("challenges")
      .select("id,name,category,difficulty,points,solves,tags")
      .or(`name.ilike.${like},category.ilike.${like}`)
      .limit(25),
    supabase
      .from("news")
      .select("id,title,excerpt,author,tags")
      .or(`title.ilike.${like},excerpt.ilike.${like},tags.ilike.${like}`)
      .limit(25),
    supabase
      .from("cves")
      .select("id,cve_id,title,severity")
      .or(`cve_id.ilike.${like},title.ilike.${like}`)
      .limit(25),
  ])

  if (labsRes.error) errors.push(`labs: ${labsRes.error.message}`)
  else if (labsRes.data) {
    for (const row of labsRes.data as Record<string, unknown>[]) {
      const score = scoreMatch(query, [String(row.title ?? ""), String(row.description ?? ""), String(row.category ?? "")])
      if (score > 0) {
        results.push({
          id: String(row.id),
          type: "lab",
          title: String(row.title ?? ""),
          description: String(row.description ?? "").slice(0, 200),
          category: String(row.category ?? ""),
          score,
          href: `/labs/${row.id}`,
        })
      }
    }
  }

  if (challengesRes.error) errors.push(`challenges: ${challengesRes.error.message}`)
  else if (challengesRes.data) {
    for (const row of challengesRes.data as Record<string, unknown>[]) {
      const tags = Array.isArray(row.tags) ? (row.tags as unknown[]).map(String).join(", ") : ""
      const score = scoreMatch(query, [String(row.name ?? ""), String(row.category ?? ""), tags])
      if (score > 0) {
        results.push({
          id: String(row.id),
          type: "challenge",
          title: String(row.name ?? ""),
          description: `${row.category ?? ""} • ${row.difficulty ?? ""} • ${row.points ?? 0} pts${tags ? ` • ${tags}` : ""}`,
          category: String(row.category ?? ""),
          score,
          href: `/challenges/${row.id}`,
        })
      }
    }
  }

  if (newsRes.error) errors.push(`news: ${newsRes.error.message}`)
  else if (newsRes.data) {
    for (const row of newsRes.data as Record<string, unknown>[]) {
      const score = scoreMatch(query, [String(row.title ?? ""), String(row.excerpt ?? ""), String(row.tags ?? "")])
      if (score > 0) {
        results.push({
          id: String(row.id),
          type: "news",
          title: String(row.title ?? ""),
          description: String(row.excerpt ?? "").slice(0, 200),
          category: "News & Research",
          score,
          href: `/research/${row.id}`,
        })
      }
    }
  }

  if (cvesRes.error) errors.push(`cves: ${cvesRes.error.message}`)
  else if (cvesRes.data) {
    for (const row of cvesRes.data as Record<string, unknown>[]) {
      const score = scoreMatch(query, [String(row.cve_id ?? ""), String(row.title ?? "")])
      if (score > 0) {
        results.push({
          id: String(row.id),
          type: "cve",
          title: `${row.cve_id ?? ""} — ${row.title ?? ""}`,
          description: `Severity: ${row.severity ?? "Unknown"}`,
          category: "CVE",
          score,
          href: `/cve`,
        })
      }
    }
  }

  // Every table errored (e.g. migration not run yet) -> signal fallback
  if (errors.length === 4) {
    console.warn("[api/search] all DB queries failed, falling back to static data:", errors.join("; "))
    return null
  }
  if (errors.length > 0) console.warn("[api/search] partial DB errors:", errors.join("; "))

  return results
}

function searchStatic(query: string): SearchResult[] {
  const results: SearchResult[] = []

  for (const lab of mockLabs) {
    const score = scoreMatch(query, [lab.title, lab.description, lab.category, lab.difficulty, lab.id])
    if (score > 0) {
      results.push({
        id: lab.id,
        type: "lab",
        title: lab.title,
        description: lab.description,
        category: lab.category,
        score,
        href: `/labs/${lab.id}`,
      })
    }
  }

  for (const ch of mockChallenges) {
    const score = scoreMatch(query, [ch.name, ch.category, ch.difficulty, ch.tags.join(" "), ch.id])
    if (score > 0) {
      results.push({
        id: ch.id,
        type: "challenge",
        title: ch.name,
        description: `${ch.category} • ${ch.difficulty} • ${ch.points} pts • ${ch.tags.join(", ")}`,
        category: ch.category,
        score,
        href: `/challenges/${ch.id}`,
      })
    }
  }

  for (const p of learningPaths) {
    const score = scoreMatch(query, [p.name, p.level, p.id])
    if (score > 0) {
      results.push({
        id: p.id,
        type: "path",
        title: p.name,
        description: `${p.lessons} lessons • ${p.duration} • ${p.level}`,
        category: "Learning Path",
        score,
        href: `/learn/${p.id}`,
      })
    }
  }

  return results
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = (searchParams.get("q") ?? "").trim()
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1)
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10) || 20))

  if (!q) {
    return Response.json({ results: [], total: 0, page, limit, query: q, source: "none" })
  }

  // Cap query length to avoid abuse
  const query = q.slice(0, 100)

  let results = await searchDb(query)
  let source: "supabase" | "mock" = "supabase"
  if (results === null) {
    results = searchStatic(query)
    source = "mock"
  }

  // Sort by score desc
  results.sort((a, b) => b.score - a.score)

  const total = results.length
  const start = (page - 1) * limit
  const paginated = results.slice(start, start + limit)

  return Response.json(
    {
      results: paginated,
      total,
      page,
      limit,
      query,
      totalPages: Math.ceil(total / limit),
      source,
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
    }
  )
}
