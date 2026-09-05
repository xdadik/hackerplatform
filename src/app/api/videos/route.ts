import { videos } from "@/lib/data"
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
  labId?: string | null
  pathId?: string | null
}

function enrich(v: (typeof videos)[number]): VideoResponse {
  return {
    id: v.id,
    title: v.title,
    description: v.description,
    youtubeId: v.youtubeId,
    embedUrl: getYoutubeEmbedUrl(v.youtubeId),
    thumbnail: getYoutubeThumbnail(v.youtubeId),
    duration: v.duration,
    category: v.category,
    labId: v.labId ?? null,
    pathId: v.pathId ?? null,
  }
}

export async function GET() {
  // Try Supabase if configured, otherwise fall back to in-memory mock
  const supabase = getSupabase()

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("videos")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100)

      if (!error && data && data.length > 0) {
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
            labId: (row.lab_id as string) ?? null,
            pathId: (row.path_id as string) ?? null,
          }
        })
        return Response.json(
          { videos: mapped, source: "supabase" as const },
          {
            headers: {
              "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=600",
            },
          }
        )
      }
      if (error) {
        console.warn("[api/videos] Supabase error, falling back to mock:", error.message)
      }
    } catch (err) {
      console.warn("[api/videos] Supabase fetch failed, falling back to mock:", err)
    }
  }

  const enriched = videos.map(enrich)

  return Response.json(
    { videos: enriched, source: "mock" as const },
    {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=600",
      },
    }
  )
}
