import { getSupabase } from "@/lib/supabase"

export const dynamic = "force-dynamic"

type SearchResult = {
  id: string
  type: "lab" | "challenge" | "path" | "research"
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
    const f = field.toLowerCase()
    if (f === q) score += 10
    else if (f.startsWith(q)) score += 7
    else if (f.includes(q)) score += 5
    const tokens = q.split(/\s+/).filter(Boolean)
    for (const tok of tokens) {
      if (f.includes(tok)) score += 2
    }
  }
  return score
}

function escLike(s: string): string {
  return s.replace(/[%_\\]/g, (c) => `\\${c}`)
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = (searchParams.get("q") ?? "").trim()
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1)
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10) || 20))

  if (!q) {
    return Response.json({ results: [], total: 0, page, limit, query: q })
  }

  const query = q.slice(0, 100)
  const results: SearchResult[] = []
  const supabase = getSupabase()

  if (supabase) {
    try {
      const pattern = `%${escLike(query)}%`
      const [labsRes, chRes, newsRes] = await Promise.all([
        supabase.from("labs").select("id,title,description,category,difficulty").ilike("title", pattern).limit(20),
        supabase.from("challenges").select("id,name,category,difficulty,points").ilike("name", pattern).limit(20),
        supabase.from("news").select("id,title,excerpt,category").eq("status", "Published").ilike("title", pattern).limit(20),
      ])

      for (const lab of labsRes.data ?? []) {
        const score = scoreMatch(query, [lab.title, lab.description ?? "", lab.category ?? ""])
        if (score > 0) {
          results.push({
            id: String(lab.id),
            type: "lab",
            title: lab.title,
            description: lab.description ?? "",
            category: lab.category ?? "",
            score,
            href: `/labs/${lab.id}`,
          })
        }
      }

      for (const ch of chRes.data ?? []) {
        const score = scoreMatch(query, [ch.name, ch.category ?? ""])
        if (score > 0) {
          results.push({
            id: String(ch.id),
            type: "challenge",
            title: ch.name,
            description: `${ch.category ?? ""} • ${ch.difficulty ?? ""} • ${ch.points ?? 0} pts`,
            category: ch.category ?? "",
            score,
            href: `/challenges/${ch.id}`,
          })
        }
      }

      for (const n of newsRes.data ?? []) {
        const score = scoreMatch(query, [n.title, n.excerpt ?? ""])
        if (score > 0) {
          results.push({
            id: String(n.id),
            type: "research",
            title: n.title,
            description: n.excerpt ?? "",
            category: "Research",
            score,
            href: `/research/${n.id}`,
          })
        }
      }
    } catch (err) {
      console.warn("[api/search] Supabase search failed, returning empty results:", err)
    }
  }

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
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
    }
  )
}
