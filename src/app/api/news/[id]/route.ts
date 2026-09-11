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
    .from("news")
    .select("id,title,excerpt,author,tags,views,status,content,created_at")
    .eq("id", id)
    .eq("status", "Published")
    .limit(1)
  if (error) {
    return Response.json({ error: "Failed to load article" }, { status: 500 })
  }
  if (!data || data.length === 0) {
    return Response.json({ error: "Article not found" }, { status: 404 })
  }
  const n = data[0]
  return Response.json({
    article: {
      id: String(n.id),
      title: n.title,
      excerpt: n.excerpt ?? "",
      author: n.author ?? "",
      tags: String(n.tags ?? "").split(",").map((t: string) => t.trim()).filter(Boolean),
      views: n.views ?? 0,
      content: n.content ?? "",
      createdAt: n.created_at,
    },
  })
}
