import { getYoutubeEmbedUrl, getYoutubeThumbnail } from "@/lib/youtube"
import { getSupabase } from "@/lib/supabase"

export const revalidate = 3600

type VideoResponse = {
  id: string
  title: string
  description: string
  youtubeId: string
  embedUrl: string
  thumbnail: string
  duration: string
  category: string
  path: string
  labId?: string | null
  pathId?: string | null
}

const CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=600",
}

export async function GET(request: Request) {
  const supabase = getSupabase()
  const { searchParams } = new URL(request.url)
  const pathFilter = (searchParams.get("path") ?? "").trim().slice(0, 80)

  if (supabase) {
    try {
      let query = supabase
        .from("videos")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100)
      if (pathFilter) {
        query = query.eq("path", pathFilter)
      }
      const { data, error } = await query

      if (!error && data) {
        const mapped: VideoResponse[] = data.map((row: Record<string, unknown>) => {
          const youtubeId = (row.youtube_id as string) ?? (row.youtubeId as string) ?? ""
          return {
            id: String(row.id),
            title: String(row.title ?? ""),
            description: String(row.description ?? ""),
            youtubeId,
            embedUrl: getYoutubeEmbedUrl(youtubeId),
            thumbnail: getYoutubeThumbnail(youtubeId),
            duration: String(row.duration ?? ""),
            category: String(row.category ?? ""),
            path: String(row.path ?? ""),
            labId: (row.lab_id as string) ?? null,
            pathId: (row.path_id as string) ?? null,
          }
        })
        return Response.json(
          { videos: mapped, source: "supabase" as const },
          { headers: CACHE_HEADERS }
        )
      }
      if (error) {
        console.warn("[api/videos] Supabase error, returning empty catalogue:", error.message)
      }
    } catch (err) {
      console.warn("[api/videos] Supabase fetch failed, returning empty catalogue:", err)
    }
  }

  return Response.json(
    { videos: [], source: "empty" as const },
    { headers: CACHE_HEADERS }
  )
}
