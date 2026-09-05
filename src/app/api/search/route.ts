import { labs, challenges, learningPaths } from "@/lib/data"

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

// Mock research entries (until real DB). Searchable in-memory.
const research = [
  {
    id: "res-1",
    title: "Abusing Overly Permissive IAM Trust Policies in AWS Organizations",
    description: "We analyze 1,200 real trust policies and demonstrate a privilege escalation path from cross-account role assumption.",
    category: "Vulnerability Analysis",
    tags: ["aws", "iam", "detection-engineering"],
    href: "/research/res-1",
  },
  {
    id: "res-2",
    title: "Heap Feng Shui in Modern glibc 2.39",
    description: "A reproducible exploit primer for tcache poisoning with mitigations.",
    category: "Pwn",
    tags: ["heap", "glibc", "exploit"],
    href: "/research/res-2",
  },
  {
    id: "res-3",
    title: "Volatility 3: Hunting Cobalt Strike in Memory",
    description: "Workflow for extracting beacon configuration without disk artifacts.",
    category: "Forensics",
    tags: ["volatility", "memory", "cobalt-strike"],
    href: "/research/res-3",
  },
  {
    id: "res-4",
    title: "Detection Engineering for Entra ID Token Replay",
    description: "KQL and Sigma rules for impossible travel with token binding.",
    category: "Blue Team",
    tags: ["entra", "token", "kql", "sigma"],
    href: "/research/res-4",
  },
]

function scoreMatch(query: string, fields: string[]): number {
  const q = query.toLowerCase()
  let score = 0
  for (const field of fields) {
    const f = field.toLowerCase()
    if (f === q) score += 10
    else if (f.startsWith(q)) score += 7
    else if (f.includes(q)) score += 5
    // token matches
    const tokens = q.split(/\s+/).filter(Boolean)
    for (const tok of tokens) {
      if (f.includes(tok)) score += 2
    }
  }
  return score
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = (searchParams.get("q") ?? "").trim()
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1)
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10) || 20))

  if (!q) {
    return Response.json({ results: [], total: 0, page, limit, query: q })
  }

  // Cap query length to avoid abuse
  const query = q.slice(0, 100)

  const results: SearchResult[] = []

  for (const lab of labs) {
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

  for (const ch of challenges) {
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

  for (const r of research) {
    const score = scoreMatch(query, [r.title, r.description, r.category, r.tags.join(" ")])
    if (score > 0) {
      results.push({
        id: r.id,
        type: "research",
        title: r.title,
        description: r.description,
        category: r.category,
        score,
        href: r.href,
      })
    }
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
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
    }
  )
}
