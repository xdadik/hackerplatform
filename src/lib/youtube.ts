/**
 * YouTube helpers for Aegis Platform.
 * Uses youtube-nocookie for privacy-enhanced embeds.
 */

export type VideoMeta = {
  id: string
  youtubeId: string
  title: string
  thumbnail: string
  embedUrl: string
  duration?: string
  category?: string
}

// 11 chars, alphanumeric + _ -
export const YOUTUBE_ID_REGEX = /^[a-zA-Z0-9_-]{11}$/

export function isValidYoutubeId(id: string): boolean {
  return YOUTUBE_ID_REGEX.test(id)
}

/**
 * Privacy-enhanced embed URL.
 */
export function getYoutubeEmbedUrl(videoId: string): string {
  // Validate but still produce URL – caller can decide to reject
  return `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1`
}

/**
 * Thumbnail URL for a given quality.
 * @param quality - "default" | "mqdefault" | "hqdefault" | "sddefault" | "maxresdefault"
 */
export function getYoutubeThumbnail(
  videoId: string,
  quality: "default" | "mqdefault" | "hqdefault" | "sddefault" | "maxresdefault" = "hqdefault"
): string {
  return `https://img.youtube.com/vi/${videoId}/${quality}.jpg`
}

/**
 * Build VideoMeta from a raw youtubeId.
 */
export function toVideoMeta(
  youtubeId: string,
  title: string,
  opts?: { duration?: string; category?: string; id?: string }
): VideoMeta {
  return {
    id: opts?.id ?? youtubeId,
    youtubeId,
    title,
    thumbnail: getYoutubeThumbnail(youtubeId),
    embedUrl: getYoutubeEmbedUrl(youtubeId),
    duration: opts?.duration,
    category: opts?.category,
  }
}

/** Extract youtubeId from common YouTube URL formats, or null if not found. */
export function parseYoutubeId(input: string): string | null {
  if (!input) return null
  if (isValidYoutubeId(input.trim())) return input.trim()
  try {
    const url = new URL(input)
    // youtu.be/<id>
    if (url.hostname === "youtu.be") {
      const id = url.pathname.slice(1).split("/")[0]
      return isValidYoutubeId(id) ? id : null
    }
    // youtube.com/watch?v=<id>
    const v = url.searchParams.get("v")
    if (v && isValidYoutubeId(v)) return v
    // youtube.com/embed/<id>
    const embedMatch = url.pathname.match(/\/embed\/([a-zA-Z0-9_-]{11})/)
    if (embedMatch) return embedMatch[1]
    return null
  } catch {
    return null
  }
}
