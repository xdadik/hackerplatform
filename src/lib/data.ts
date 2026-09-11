import { getYoutubeEmbedUrl, getYoutubeThumbnail } from "./youtube"

export type Lab = {
  id: string
  title: string
  category: string
  difficulty: "Beginner" | "Intermediate" | "Advanced" | "Expert"
  duration: string
  progress?: number
  status: "not_started" | "in_progress" | "completed"
  description: string
  objectives: number
  participants: number
  youtubeId?: string | null
}

export type Challenge = {
  id: string
  name: string
  category: string
  difficulty: "Easy" | "Medium" | "Hard" | "Insane"
  points: number
  solves: number
  tags: string[]
  status: "solved" | "attempted" | "new"
}

export type Course = {
  id: string
  title: string
  path: string
  level: string
  lessons: number
  duration: string
  progress: number
  description: string
}

export type LearningPath = {
  id: string
  name: string
  lessons: number
  duration: string
  level: string
  progress: number
  color: string
  youtubeId?: string | null
}

export type Video = {
  id: string
  title: string
  description: string
  youtubeId: string
  duration: string
  category: string
  labId?: string | null
  pathId?: string | null
}

export const learningPaths: LearningPath[] = []

export const labs: Lab[] = []

export const challenges: Challenge[] = []

export const skillProgress: { name: string; level: string; progress: number; next: string }[] = []

// empty until api ready
export const leaderboard: { rank: number; username: string; reputation: number; labs: number; challenges: number; avatar: string }[] = []

// ---------------------------------------------------------------------------
// Video catalogue – populated from Supabase `videos` table via /api/videos.
// Static catalogue removed: content is managed in the database, not in code.
// ---------------------------------------------------------------------------

export const videos: Video[] = []

// ---------------------------------------------------------------------------
// Helpers – keep existing exports compatible, add new accessors
// ---------------------------------------------------------------------------

export function getLabById(id: string): Lab | undefined {
  return labs.find(l => l.id === id)
}

export function getChallengeById(id: string): Challenge | undefined {
  return challenges.find(c => c.id === id)
}

export function getLearningPathById(id: string): LearningPath | undefined {
  return learningPaths.find(p => p.id === id)
}

export function getVideoById(id: string): Video | undefined {
  return videos.find(v => v.id === id)
}

export function getVideoByYoutubeId(youtubeId: string): Video | undefined {
  return videos.find(v => v.youtubeId === youtubeId)
}

export function getLabVideos(labId: string): Video[] {
  return videos.filter(v => v.labId === labId)
}

export function getPathVideos(pathId: string): Video[] {
  return videos.filter(v => v.pathId === pathId)
}

/** Enriched view with embed/thumbnail URLs – convenient for player components. */
export function getVideoWithUrls(id: string) {
  const v = getVideoById(id)
  if (!v) return undefined
  return {
    ...v,
    embedUrl: getYoutubeEmbedUrl(v.youtubeId),
    thumbnail: getYoutubeThumbnail(v.youtubeId),
  }
}
