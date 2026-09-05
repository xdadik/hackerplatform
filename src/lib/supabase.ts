import { createClient, type SupabaseClient } from "@supabase/supabase-js"

// ---------------------------------------------------------------------------
// DB table types (extend as real schema is introduced)
// ---------------------------------------------------------------------------

export type DbVideo = {
  id: string
  title: string
  description: string | null
  youtube_id: string | null
  duration: string | null
  category: string | null
  created_at: string
}

export type DbLab = {
  id: string
  title: string
  category: string
  difficulty: "Beginner" | "Intermediate" | "Advanced" | "Expert"
  duration: string
  description: string
  objectives: number
  participants: number
  youtube_id: string | null
  created_at: string
}

export type DbProgress = {
  id: string
  user_id: string
  lab_id: string | null
  challenge_id: string | null
  status: "not_started" | "in_progress" | "completed"
  progress: number | null
  updated_at: string
}

export type DbChallenge = {
  id: string
  name: string
  category: string
  difficulty: "Easy" | "Medium" | "Hard" | "Insane"
  points: number
  solves: number
  tags: string[]
  created_at: string
}

export type Database = {
  public: {
    Tables: {
      videos: { Row: DbVideo; Insert: Omit<DbVideo, "created_at">; Update: Partial<DbVideo> }
      labs: { Row: DbLab; Insert: Omit<DbLab, "created_at">; Update: Partial<DbLab> }
      progress: { Row: DbProgress; Insert: Omit<DbProgress, "updated_at">; Update: Partial<DbProgress> }
      challenges: { Row: DbChallenge; Insert: Omit<DbChallenge, "created_at">; Update: Partial<DbChallenge> }
    }
  }
}

// ---------------------------------------------------------------------------
// getSupabase – never throws, never crashes the build when env is missing.
// ---------------------------------------------------------------------------

let _client: SupabaseClient<Database> | null | undefined // undefined = not yet checked

export function getSupabase(): SupabaseClient<Database> | null {
  if (_client !== undefined) return _client

  const finalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
  // Support both legacy (ANON_KEY) and new (PUBLISHABLE_KEY) Supabase key names
  const finalKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
    ""

  if (!finalUrl || !finalKey) {
    _client = null
    // Warn once in dev / server logs – never throw.
    if (process.env.NODE_ENV !== "production") {
      console.warn("[supabase] NEXT_PUBLIC_SUPABASE_URL or anon/publishable key missing – using mock fallback. Set NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY (or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY).")
    }
    return _client
  }

  try {
    _client = createClient<Database>(finalUrl, finalKey)
  } catch (err) {
    console.warn("[supabase] Failed to create client:", err)
    _client = null
  }
  return _client
}

/** Reset cached client – useful in tests. */
export function __resetSupabaseForTests() {
  _client = undefined
}
