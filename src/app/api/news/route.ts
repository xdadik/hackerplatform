import { getSupabase } from "@/lib/supabase"

export const dynamic = "force-dynamic"

export async function GET() {
  const supabase = getSupabase()
  if (!supabase) {
    return Response.json({ articles: [] })
  }
  try {
    const { data, error } = await supabase
      .from("news")
      .select("id,title,excerpt,author,tags,views,status,created_at")
      .eq("status", "Published")
      .order("created_at", { ascending: false })
      .limit(50)
    if (error) {
      console.warn("[api/news] Supabase error, returning empty list:", error.message)
      return Response.json({ articles: [] })
    }
    const articles = (data ?? []).map((row: Record<string, unknown>) => ({
      id: String(row.id),
      title: String(row.title ?? ""),
      excerpt: String(row.excerpt ?? ""),
      author: String(row.author ?? ""),
      tags: String(row.tags ?? "").split(",").map((t: string) => t.trim()).filter(Boolean),
      views: Number(row.views ?? 0),
      createdAt: String(row.created_at ?? ""),
    }))
    return Response.json(
      { articles },
      { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } }
    )
  } catch (err) {
    console.warn("[api/news] Supabase fetch failed, returning empty list:", err)
    return Response.json({ articles: [] })
  }
}
