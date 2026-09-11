import { getSupabase } from "@/lib/supabase"
import { getSessionToken, getUserBySession } from "@/lib/auth-server"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const supabase = getSupabase()
  if (!supabase) {
    return Response.json({ challenges: [] })
  }

  const token = getSessionToken(request)
  const user = token ? await getUserBySession(token).catch(() => null) : null

  try {
    const { data, error } = await supabase
      .from("challenges")
      .select("id,name,category,difficulty,points,solves,tags,created_at")
      .order("created_at", { ascending: false })
      .limit(100)
    if (error) {
      console.warn("[api/challenges] Supabase error, returning empty list:", error.message)
      return Response.json({ challenges: [] })
    }

    const solvedIds = new Set<string>()
    if (user) {
      try {
        const { data: prog } = await supabase
          .from("progress")
          .select("challenge_id,status")
          .eq("user_id", user.id)
          .eq("status", "completed")
          .not("challenge_id", "is", null)
        for (const p of prog ?? []) {
          if (p.challenge_id) solvedIds.add(String(p.challenge_id))
        }
      } catch {}
    }

    const challenges = (data ?? []).map((row: Record<string, unknown>) => {
      const id = String(row.id)
      return {
        id,
        name: String(row.name ?? ""),
        category: String(row.category ?? ""),
        difficulty: String(row.difficulty ?? "Easy"),
        points: Number(row.points ?? 0),
        solves: Number(row.solves ?? 0),
        tags: (row.tags as string[]) ?? [],
        status: solvedIds.has(id) ? "solved" : "new",
      }
    })
    return Response.json(
      { challenges },
      { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" } }
    )
  } catch (err) {
    console.warn("[api/challenges] Supabase fetch failed, returning empty list:", err)
    return Response.json({ challenges: [] })
  }
}
