import { getSupabase } from "@/lib/supabase"

export const dynamic = "force-dynamic"

export async function GET() {
  const supabase = getSupabase()
  if (!supabase) {
    return Response.json({ events: [] })
  }
  try {
    const { data, error } = await supabase
      .from("events")
      .select("id,title,type,date,status,participants")
      .order("date", { ascending: true })
      .limit(50)
    if (error) {
      console.warn("[api/events] Supabase error, returning empty list:", error.message)
      return Response.json({ events: [] })
    }
    const events = (data ?? []).map((row: Record<string, unknown>) => ({
      id: String(row.id),
      title: String(row.title ?? ""),
      type: String(row.type ?? "CTF"),
      date: String(row.date ?? ""),
      status: String(row.status ?? "Upcoming"),
      participants: Number(row.participants ?? 0),
    }))
    return Response.json(
      { events },
      { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" } }
    )
  } catch (err) {
    console.warn("[api/events] Supabase fetch failed, returning empty list:", err)
    return Response.json({ events: [] })
  }
}
