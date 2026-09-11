import { getSupabase } from "@/lib/supabase"

export const dynamic = "force-dynamic"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = getSupabase()
  if (!supabase) {
    return Response.json({ error: "Database is not configured" }, { status: 503 })
  }
  const { data, error } = await supabase
    .from("challenges")
    .select("id,name,category,difficulty,points,solves,tags,created_at")
    .eq("id", id)
    .limit(1)
  if (error) {
    return Response.json({ error: "Failed to load challenge" }, { status: 500 })
  }
  if (!data || data.length === 0) {
    return Response.json({ error: "Challenge not found" }, { status: 404 })
  }
  const ch = data[0]
  return Response.json({
    challenge: {
      id: String(ch.id),
      name: ch.name,
      category: ch.category ?? "",
      difficulty: ch.difficulty ?? "Easy",
      points: ch.points ?? 0,
      solves: ch.solves ?? 0,
      tags: (ch.tags as string[]) ?? [],
    },
  })
}
