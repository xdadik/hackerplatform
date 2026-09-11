import { getSupabase } from "@/lib/supabase"

export const dynamic = "force-dynamic"

export async function GET() {
  const supabase = getSupabase()
  if (!supabase) {
    return Response.json({ cves: [] })
  }
  try {
    const { data, error } = await supabase
      .from("cves")
      .select("id,cve_id,title,severity,status,publish_date")
      .eq("status", "Published")
      .order("publish_date", { ascending: false })
      .limit(20)
    if (error) {
      console.warn("[api/cves] Supabase error, returning empty list:", error.message)
      return Response.json({ cves: [] })
    }
    const cves = (data ?? []).map((row: Record<string, unknown>) => ({
      id: String(row.id),
      cveId: String(row.cve_id ?? ""),
      title: String(row.title ?? ""),
      severity: String(row.severity ?? ""),
      status: String(row.status ?? "Published"),
      published: String(row.publish_date ?? ""),
    }))
    return Response.json(
      { cves },
      { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } }
    )
  } catch (err) {
    console.warn("[api/cves] Supabase fetch failed, returning empty list:", err)
    return Response.json({ cves: [] })
  }
}
