"use client"
import Link from "next/link"
import * as React from "react"
import { AppShell } from "@/components/layout/app-shell"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Stagger, FadeIn, ProgressAnimated } from "@/components/ui/stagger"
import { Search, GraduationCap, ChevronRight, X } from "lucide-react"

type Path = {
  id: string
  name: string
  lessons: number
  level: string
  progress: number
}

function titleize(slug: string): string {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())
}

export default function LearnPage() {
  const [q,setQ]=React.useState("")
  const [levelFilter,setLevelFilter]=React.useState("All")
  const [paths, setPaths] = React.useState<Path[] | null>(null)

  React.useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await fetch("/api/videos")
        const body = await res.json().catch(() => ({ videos: [] }))
        const vids = (body.videos ?? []) as { path?: string; pathId?: string | null; category?: string }[]
        const groups = new Map<string, { lessons: number; level: string }>()
        for (const v of vids) {
          const path = v.path || v.pathId || "general"
          const g = groups.get(path) ?? { lessons: 0, level: String(v.category ?? "Beginner") }
          g.lessons += 1
          groups.set(path, g)
        }
        const list: Path[] = [...groups.entries()].map(([id, g]) => ({
          id,
          name: titleize(id),
          lessons: g.lessons,
          level: g.level,
          progress: 0,
        }))
        if (!cancelled) setPaths(list)
      } catch {
        if (!cancelled) setPaths([])
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  const filtered=React.useMemo(()=>{
    return (paths ?? []).filter(p=>{
      if(levelFilter!=="All" && p.level!==levelFilter) return false
      if(q.trim()){
        const s=q.toLowerCase()
        return p.name.toLowerCase().includes(s) || p.level.toLowerCase().includes(s)
      }
      return true
    })
  },[q,levelFilter,paths])

  const loading = paths === null

  return (
    <AppShell withSidebar>
      <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-[1080px]">
        <FadeIn>
          <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
            <div>
              <h1 className="text-[22px] font-[650] tracking-[-0.03em]">Academy</h1>
              <p className="mt-1 text-[13.5px] text-[var(--text-2)] max-w-[600px]">Structured progression with prerequisites, estimates, and hands-on assessments. Pick up where you left off — or start a new path.</p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-auto">
                <label htmlFor="course-search" className="sr-only">Search courses</label>
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-3)]" aria-hidden="true" />
                <Input id="course-search" aria-label="Search courses" value={q} onChange={e=>setQ(e.target.value)} placeholder="Search courses, lessons..." className="pl-8 h-11 sm:h-8 w-full sm:w-[260px] bg-[var(--surface)] min-h-[44px] sm:min-h-0" />
                {q && <button aria-label="Clear search" onClick={()=>setQ("")} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-[var(--surface-2)]"><X className="w-3 h-3" /></button>}
              </div>
              <div className="flex items-center gap-1 p-1 rounded-[8px] bg-[var(--surface-2)] border border-[var(--border)] overflow-x-auto" role="group" aria-label="Filter by level">
                {["All","Beginner","Intermediate","Advanced"].map(l=>(
                  <button key={l} onClick={()=>setLevelFilter(l)} aria-pressed={levelFilter===l} aria-label={`Filter ${l}`} className={`px-2.5 py-2 sm:py-1 rounded-[6px] text-[12px] font-[500] min-h-[36px] sm:min-h-0 whitespace-nowrap ${levelFilter===l ? "bg-[var(--surface)] border border-[var(--border)] shadow-sm" : "text-[var(--text-2)]"}`}>{l}</button>
                ))}
              </div>
            </div>
          </div>
        </FadeIn>

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[14px] font-[650] tracking-[-0.02em]">Courses — {loading ? "…" : `${filtered.length} of ${paths?.length ?? 0}`}</h2>
          <span className="text-[12px] text-[var(--text-3)]">{levelFilter!=="All" ? `Level: ${levelFilter}` : "All levels"} {q && `• search: "${q}"`}</span>
        </div>

        <Stagger className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {loading ? (
            [1,2,3].map(i => (
              <Card key={i}><CardContent className="p-5">
                <div className="h-5 w-2/3 rounded bg-[var(--surface-2)] animate-pulse" />
                <div className="mt-2 h-4 w-1/2 rounded bg-[var(--surface-2)] animate-pulse" />
              </CardContent></Card>
            ))
          ) : filtered.map(path => (
            <div key={path.id} className="stagger-item"><Card className="group hover:shadow-md hover:-translate-y-[1px] transition-all h-full">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="w-9 h-9 rounded-[9px] border border-[var(--border)] flex items-center justify-center bg-[var(--surface-2)] group-hover:bg-[var(--text)] group-hover:text-[var(--background)] transition-colors">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <Badge variant="outline">
                    {path.progress > 0 ? `${path.progress}%` : "Not started"}
                  </Badge>
                </div>
                <div className="text-[14px] font-[600] tracking-[-0.015em]">{path.name}</div>
                <div className="mt-1 text-[12px] text-[var(--text-2)]">{path.lessons} lesson{path.lessons===1?"":"s"} • {path.level}</div>
                <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-[var(--surface-3)]" role="progressbar" aria-valuenow={path.progress} aria-valuemin={0} aria-valuemax={100} aria-label={`${path.name} progress`}><ProgressAnimated value={path.progress} /></div>
                <div className="mt-2 flex items-center justify-between text-[11px]">
                  <span className="text-[var(--text-3)]">{path.lessons} lessons</span>
                  <span className="font-mono text-[var(--text-3)]">{path.progress}%</span>
                </div>
                <Link href={`/learn/${path.id}`} className="mt-4 inline-flex items-center gap-1 text-[13px] font-medium text-[var(--text)] group-hover:gap-1.5 transition-all">
                  {path.progress > 0 ? "Continue" : "Start path"} <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </CardContent>
            </Card></div>
          ))}
          {!loading && filtered.length===0 && (
            <div className="col-span-full">
              <Card className="border-dashed bg-[var(--surface-2)]"><CardContent className="p-6 text-center"><div className="text-[13px] font-[600]">{q || levelFilter !== "All" ? "No courses match" : "No courses published yet"}</div><div className="text-[12px] text-[var(--text-2)]">{q || levelFilter !== "All" ? "Try different search or level filter." : "New learning paths will appear here when published."}</div>{(q || levelFilter !== "All") && <Button size="sm" className="mt-3 h-9 sm:h-7 min-h-[36px] sm:min-h-0" onClick={()=>{setQ(""); setLevelFilter("All")}}>Clear filters</Button>}</CardContent></Card>
            </div>
          )}
        </Stagger>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[14px] font-[650]">Skill progression</h3>
              <Link href="/skills" className="text-[12px] font-medium text-[var(--accent)] hover:underline">View skill map →</Link>
            </div>
            <p className="text-[12.5px] leading-5 text-[var(--text-2)]">Progress is earned from verifiable activity: lab objectives, challenge solves, and research contributions. Complete content to advance each skill.</p>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
