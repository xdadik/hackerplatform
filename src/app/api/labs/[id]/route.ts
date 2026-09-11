import { getSupabase } from "@/lib/supabase"
import { getYoutubeEmbedUrl, getYoutubeThumbnail } from "@/lib/youtube"

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
    .from("labs")
    .select("id,title,category,difficulty,duration,description,objectives,participants,youtube_id,created_at")
    .eq("id", id)
    .limit(1)
  if (error) {
    return Response.json({ error: "Failed to load lab" }, { status: 500 })
  }
  if (!data || data.length === 0) {
    return Response.json({ error: "Lab not found" }, { status: 404 })
  }
  const lab = data[0]
  const youtubeId = (lab.youtube_id as string) ?? ""
  return Response.json({
    lab: {
      id: String(lab.id),
      title: lab.title,
      category: lab.category ?? "",
      difficulty: lab.difficulty ?? "Beginner",
      duration: lab.duration ?? "",
      description: lab.description ?? "",
      objectives: lab.objectives ?? 0,
      participants: lab.participants ?? 0,
      youtubeId,
      embedUrl: youtubeId ? getYoutubeEmbedUrl(youtubeId) : null,
      thumbnail: youtubeId ? getYoutubeThumbnail(youtubeId) : null,
    },
  })
}
