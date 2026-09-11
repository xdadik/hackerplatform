import { getSupabase } from "@/lib/supabase"
import { getSessionToken, getUserBySession } from "@/lib/auth-server"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const supabase = getSupabase()
  if (!supabase) {
    return Response.json({ labs: [] })
  }

  const token = getSessionToken(request)
  const user = token ? await getUserBySession(token).catch(() => null) : null

  try {
    const { data, error } = await supabase
      .from("labs")
      .select("id,title,category,difficulty,duration,description,objectives,participants,youtube_id,created_at")
      .order("created_at", { ascending: false })
      .limit(100)
    if (error) {
      console.warn("[api/labs] Supabase error, returning empty list:", error.message)
      return Response.json({ labs: [] })
    }

    let progressByLab = new Map<string, { status: string; progress: number }>()
    if (user) {
      try {
        const { data: prog } = await supabase
          .from("progress")
          .select("lab_id,status,progress")
          .eq("user_id", user.id)
          .not("lab_id", "is", null)
        for (const p of prog ?? []) {
          if (p.lab_id) progressByLab.set(String(p.lab_id), { status: String(p.status), progress: Number(p.progress ?? 0) })
        }
      } catch {}
    }

    const labs = (data ?? []).map((row: Record<string, unknown>) => {
      const id = String(row.id)
      const saved = progressByLab.get(id)
      return {
        id,
        title: String(row.title ?? ""),
        category: String(row.category ?? ""),
        difficulty: String(row.difficulty ?? "Beginner"),
        duration: String(row.duration ?? ""),
        description: String(row.description ?? ""),
        objectives: Number(row.objectives ?? 0),
        participants: Number(row.participants ?? 0),
        youtubeId: (row.youtube_id as string) ?? null,
        status: saved?.status ?? "not_started",
        progress: saved?.progress ?? 0,
      }
    })
    return Response.json(
      { labs },
      { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" } }
    )
  } catch (err) {
    console.warn("[api/labs] Supabase fetch failed, returning empty list:", err)
    return Response.json({ labs: [] })
  }
}
