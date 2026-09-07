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

export type DbUser = {
  id: string
  email: string
  name: string
  plan: string
  provider: string
  role: string
  reputation: number
  status: string
  password_hash: string | null
  created_at: string
  updated_at: string
}

export type DbSession = {
  id: string
  user_id: string
  token_hash: string
  created_at: string
  expires_at: string
  last_seen_at: string
}

export type DbEvent = {
  id: string
  title: string
  type: string
  date: string
  status: string
  participants: number
  created_at: string
}

export type DbNews = {
  id: string
  title: string
  excerpt: string
  author: string
  tags: string
  views: number
  status: string
  content: string
  created_at: string
}

export type DbCve = {
  id: string
  cve_id: string
  title: string
  severity: string
  status: string
  publish_date: string | null
  created_at: string
}

export type Database = {
  public: {
    Tables: {
      videos: { Row: DbVideo; Insert: Omit<DbVideo, "created_at">; Update: Partial<DbVideo>; Relationships: [] }
      labs: { Row: DbLab; Insert: Omit<DbLab, "created_at">; Update: Partial<DbLab>; Relationships: [] }
      progress: { Row: DbProgress; Insert: Omit<DbProgress, "updated_at">; Update: Partial<DbProgress>; Relationships: [] }
      challenges: { Row: DbChallenge; Insert: Omit<DbChallenge, "created_at">; Update: Partial<DbChallenge>; Relationships: [] }
      users: { Row: DbUser; Insert: Partial<DbUser>; Update: Partial<DbUser>; Relationships: [] }
      sessions: { Row: DbSession; Insert: Partial<DbSession>; Update: Partial<DbSession>; Relationships: [] }
      events: { Row: DbEvent; Insert: Partial<DbEvent>; Update: Partial<DbEvent>; Relationships: [] }
      news: { Row: DbNews; Insert: Partial<DbNews>; Update: Partial<DbNews>; Relationships: [] }
      cves: { Row: DbCve; Insert: Partial<DbCve>; Update: Partial<DbCve>; Relationships: [] }
    }
    Functions: {
      is_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean
      }
    }
  }
}

// ---------------------------------------------------------------------------
// getSupabase – never throws, never crashes the build when env is missing.
// ---------------------------------------------------------------------------

let _client: SupabaseClient<any> | null | undefined // undefined = not yet checked

export function getSupabase(): SupabaseClient<any> | null {
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

let _serviceClient: SupabaseClient<any> | null | undefined

/** Server-only client that bypasses RLS (uses SERVICE_ROLE key). Never import on the client. */
export function getServiceSupabase(): SupabaseClient<any> | null {
  if (_serviceClient !== undefined) return _serviceClient
  const finalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    ""
  if (!finalUrl || !serviceKey) {
    _serviceClient = null
    if (process.env.NODE_ENV !== "production") {
      console.warn("[supabase] Service role key missing – server writes will fall back to anon client or fail.")
    }
    return _serviceClient
  }
  try {
    _serviceClient = createClient<Database>(finalUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  } catch (err) {
    console.warn("[supabase] Failed to create service client:", err)
    _serviceClient = null
  }
  return _serviceClient
}

/** Reset cached client – useful in tests. */
export function __resetSupabaseForTests() {
  _client = undefined
}
