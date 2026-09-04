"use client"
import Link from "next/link"
import * as React from "react"
import { AppShell } from "@/components/layout/app-shell"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { challenges } from "@/lib/data"
import { Stagger, FadeIn } from "@/components/ui/stagger"
import { Search, Trophy, Filter, Bookmark, ChevronDown, Clock, Users, Award, Lock, BookmarkCheck, X } from "lucide-react"

const categories = ["All", "Web", "Crypto", "Pwn", "Reverse", "Forensics", "OSINT", "Cloud", "Mobile", "Hardware", "Blue Team", "Misc"]

export default function ChallengesPage() {
  const [isPaid, setIsPaid] = React.useState(false)
  const [q, setQ] = React.useState("")
  const [activeCat, setActiveCat] = React.useState("All")
  const [diffFilter, setDiffFilter] = React.useState<Set<string>>(new Set(["Easy","Medium"]))
  const [statusFilter, setStatusFilter] = React.useState<Set<string>>(new Set(["new"]))
  const [sort, setSort] = React.useState<"recommended"|"points"|"solves">("recommended")
  const [teamMode, setTeamMode] = React.useState<"Solo"|"Team">("Solo")
  const [bookmarks, setBookmarks] = React.useState<Set<string>>(new Set())
  const [page, setPage] = React.useState(1)

  React.useEffect(() => {
    try {
      const rawUser = localStorage.getItem("aegis_user")
      if (rawUser) {
        const u = JSON.parse(rawUser) as { plan?: string }
        setIsPaid(u?.plan === "go" || u?.plan === "plus")
        return
      }
    } catch {}
    const plan = localStorage.getItem("aegis_plan")
    const auth = localStorage.getItem("aegis_auth")
    setIsPaid(!!auth && (plan === "go" || plan === "plus"))
  }, [])

  React.useEffect(()=>{ try{ const raw=localStorage.getItem("aegis_bookmarks"); if(raw) setBookmarks(new Set(JSON.parse(raw))) }catch{} },[])
  React.useEffect(()=>{ try{ localStorage.setItem("aegis_bookmarks", JSON.stringify([...bookmarks])) }catch{} },[bookmarks])

  const toggleBookmark = (id:string) => {
    setBookmarks(prev=>{
      const n=new Set(prev)
      if(n.has(id)) n.delete(id); else n.add(id)
      return n
    })
  }

  const toggleDiff = (d:string)=> setDiffFilter(prev=>{
    const n=new Set(prev); if(n.has(d)) n.delete(d); else n.add(d); return n
  })
  const toggleStatus = (s:string)=> setStatusFilter(prev=>{
    const n=new Set(prev); if(n.has(s)) n.delete(s); else n.add(s); return n
  })

  const filtered = React.useMemo(()=>{
    let arr = challenges.filter(c=>{
      if(activeCat!=="All" && c.category!==activeCat) return false
      if(diffFilter.size>0 && !diffFilter.has(c.difficulty)) return false
      if(statusFilter.size>0) {
        // if Bookmarked filter active, show only bookmarked
        if(statusFilter.has("bookmarked") && !bookmarks.has(c.id)) return false
        // if other statuses selected, check them; but keep bookmark filter inclusive
        const nonBookmark = [...statusFilter].filter(s=>s!=="bookmarked")
        if(nonBookmark.length>0 && !nonBookmark.includes(c.status)) {
          // if bookmarked filter also present, allow either bookmarked or status match
          if(!(statusFilter.has("bookmarked") && bookmarks.has(c.id))) return false
          if(!statusFilter.has("bookmarked")) return false
        }
        if(nonBookmark.length===0 && statusFilter.has("bookmarked")) { /* already handled */ }
        if(nonBookmark.length===0 && statusFilter.size===1 && statusFilter.has("bookmarked")) {} // ok
        // fallback: if filter includes new/solved etc and size>0, enforce
        if(nonBookmark.length>0 && statusFilter.has("bookmarked")) {
          // show if either status matches OR bookmarked
          if(!nonBookmark.includes(c.status) && !bookmarks.has(c.id)) return false
        } else if(nonBookmark.length>0 && !statusFilter.has("bookmarked")){
          if(!nonBookmark.includes(c.status)) return false
        }
      }
      if(q.trim()){
        const s=q.toLowerCase()
        return c.name.toLowerCase().includes(s) || c.tags.some(t=>t.toLowerCase().includes(s)) || c.category.toLowerCase().includes(s)
      }
      return true
    })
    if(sort==="points") arr=[...arr].sort((a,b)=>b.points-a.points)
    if(sort==="solves") arr=[...arr].sort((a,b)=>b.solves-a.solves)
    return arr
  },[activeCat,diffFilter,statusFilter,q,sort,bookmarks])

  // pagination 6 per page
  const perPage=6
  const totalPages=Math.max(1,Math.ceil(filtered.length/perPage))
  const paged=filtered.slice((page-1)*perPage, page*perPage)
  React.useEffect(()=>{ if(page>totalPages) setPage(1) },[totalPages,page])

  return (
    <AppShell withSidebar>
      <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-[1280px]">
        {!isPaid && (
          <div className="mb-6 rounded-[12px] border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/20 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-[8px] bg-amber-500 text-white flex items-center justify-center shrink-0"><Lock className="w-4 h-4" /></div>
              <div>
                <div className="text-[13px] font-[600] text-amber-900 dark:text-amber-200">Challenges are for paid members</div>
                <div className="text-[12px] text-amber-800 dark:text-amber-300">Upgrade to unlock all 1,204 challenges. Only premium users can open challenges.</div>
              </div>
            </div>
            <Link href="/settings/billing" className="shrink-0"><Button size="sm" className="h-8 rounded-full bg-amber-500 hover:bg-amber-600 text-white">Upgrade plan</Button></Link>
          </div>
        )}
        <FadeIn>
          <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
            <div>
              <h1 className="text-[22px] font-[650] tracking-[-0.03em]">Challenges</h1>
              <p className="mt-1 text-[13.5px] text-[var(--text-2)]">1,204 challenges across 11 categories. Search, filter, sort, bookmark — clean and fast. {!isPaid && "Locked until upgrade."}</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-3)]" />
                <Input value={q} onChange={e=>{setQ(e.target.value); setPage(1)}} placeholder="Search challenges, tags..." className="pl-8 h-8 w-[220px] sm:w-[260px] bg-[var(--surface)]" />
                {q && <button onClick={()=>setQ("")} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-[var(--surface-2)]"><X className="w-3 h-3" /></button>}
              </div>
              <Button variant="secondary" size="sm" className="h-8" onClick={()=>alert("Filters: use sidebar category/difficulty/status + search. All filters persist locally and combine.")}><Filter className="w-3.5 h-3.5 mr-1" /> Filters</Button>
            </div>
          </div>
        </FadeIn>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Filters sidebar */}
          <div className="lg:w-[220px] shrink-0 space-y-4">
            <Card>
              <CardContent className="p-4 space-y-4">
                <div>
                  <div className="text-[11px] font-semibold tracking-widest uppercase text-[var(--text-3)] mb-2">Category</div>
                  <div className="space-y-1">
                    {categories.map(cat => (
                      <button key={cat} onClick={()=>{setActiveCat(cat); setPage(1)}} className={`w-full text-left px-2.5 py-1.5 rounded-[7px] text-[13px] flex items-center justify-between ${cat === activeCat ? "bg-[var(--text)] text-[var(--background)] font-[500]" : "text-[var(--text-2)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]"}`}>
                        <span>{cat}</span>
                        {cat !== "All" && <span className="text-[11px] font-mono text-[var(--text-3)]">{Math.floor(Math.random()*200)+20}</span>}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="pt-4 border-t border-[var(--border)]">
                  <div className="text-[11px] font-semibold tracking-widest uppercase text-[var(--text-3)] mb-2">Difficulty</div>
                  <div className="space-y-1.5">
                    {["Easy","Medium","Hard","Insane"].map(d=> (
                      <label key={d} className="flex items-center gap-2 text-[13px] cursor-pointer"><input type="checkbox" checked={diffFilter.has(d)} onChange={()=>toggleDiff(d)} className="rounded border-[var(--border)]" /> <span>{d}</span> <span className="ml-auto text-[11px] text-[var(--text-3)]">{d==="Easy"?"342":d==="Medium"?"521":d==="Hard"?"268":"73"}</span></label>
                    ))}
                  </div>
                </div>
                <div className="pt-4 border-t border-[var(--border)]">
                  <div className="text-[11px] font-semibold tracking-widest uppercase text-[var(--text-3)] mb-2">Status</div>
                  <div className="space-y-1.5">
                    {[
                      {id:"solved", label:"Solved"},
                      {id:"attempted", label:"Attempted"},
                      {id:"new", label:"Not started"},
                      {id:"bookmarked", label:"Bookmarked"},
                    ].map(s=> (
                      <label key={s.id} className="flex items-center gap-2 text-[13px] cursor-pointer"><input type="checkbox" checked={statusFilter.has(s.id)} onChange={()=>toggleStatus(s.id)} className="rounded" /> {s.label}</label>
                    ))}
                  </div>
                </div>
                {(q || activeCat!=="All" || diffFilter.size!==2 || statusFilter.size!==1) && (
                  <Button variant="ghost" size="sm" className="w-full h-7 border" onClick={()=>{setQ(""); setActiveCat("All"); setDiffFilter(new Set(["Easy","Medium"])); setStatusFilter(new Set(["new"])); setPage(1)}}>Clear filters</Button>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="text-[12px] font-semibold">Competition</div>
                <div className="mt-2 p-3 rounded-[10px] bg-[var(--surface-2)] border border-[var(--border)]">
                  <div className="text-[12.5px] font-[600]">Winter CTF 2026</div>
                  <div className="text-[11px] text-[var(--text-2)]">Live • Ends in 18h 42m</div>
                  <div className="mt-2 flex items-center gap-2 text-[11px] font-mono">
                    <span className="px-1.5 py-0.5 rounded bg-[var(--text)] text-[var(--background)]">Score: 2,420</span>
                    <span className="text-[var(--text-3)]">Rank #18</span>
                  </div>
                  <Link href="/events"><Button size="sm" variant="secondary" className="w-full mt-3 h-7 text-[12px]">Open scoreboard</Button></Link>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Grid */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-medium">{filtered.length} shown</span>
                <span className="text-[12px] text-[var(--text-3)]">• Sorted by {sort} • Page {page}/{totalPages}</span>
                {bookmarks.size>0 && <Badge variant="secondary" className="text-[11px] gap-1"><BookmarkCheck className="w-3 h-3" /> {bookmarks.size} bookmarked</Badge>}
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 p-1 rounded-[8px] bg-[var(--surface-2)] border border-[var(--border)]">
                  {(["recommended","points","solves"] as const).map(s=> (
                    <button key={s} onClick={()=>setSort(s)} className={`px-2.5 py-1 rounded-[6px] text-[12px] font-[500] capitalize ${sort===s ? "bg-[var(--surface)] border border-[var(--border)] shadow-sm" : "text-[var(--text-2)]"}`}>{s}</button>
                  ))}
                </div>
                <Button variant="ghost" size="sm" className="h-7 text-[12px] border border-[var(--border)] hidden sm:flex" onClick={()=>{ setTeamMode(m=>m==="Solo"?"Team":"Solo"); try{ localStorage.setItem("aegis_team_mode", teamMode==="Solo"?"Team":"Solo")}catch{}; alert(`Mode: ${teamMode==="Solo"?"Team":"Solo"} — saved to localStorage. Challenges can be solved solo or with team.`) }}><Users className="w-3 h-3 mr-1" /> {teamMode} / {teamMode==="Solo"?"Team":"Solo"}</Button>
              </div>
            </div>

            <Stagger className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {paged.map(ch => {
                const isBookmarked = bookmarks.has(ch.id)
                return (
                <div key={ch.id} className="stagger-item">
                  <Link href={isPaid ? `/challenges/${ch.id}` : "/settings/billing"} className="block">
                    <Card className="group hover:shadow-md hover:-translate-y-[0.5px] transition-all h-full">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <Badge variant="outline" className="text-[11px] rounded-full px-2 py-0">{ch.category}</Badge>
                      <button onClick={(e)=>{ e.preventDefault(); e.stopPropagation(); toggleBookmark(ch.id)}} className={`p-1 rounded hover:bg-[var(--surface-2)] ${isBookmarked ? "text-[var(--text)] bg-[var(--surface-2)]" : "text-[var(--text-3)] hover:text-[var(--text)]"}`} aria-label={isBookmarked ? "Remove bookmark" : "Bookmark"} title={isBookmarked ? "Remove bookmark" : "Bookmark"}>
                        <Bookmark className={`w-3.5 h-3.5 ${isBookmarked || ch.status === "solved" ? "fill-[var(--text)] text-[var(--text)]" : ""}`} />
                      </button>
                    </div>
                    <div className="text-[14px] font-[600] tracking-[-0.015em] leading-tight group-hover:text-[var(--accent)] transition-colors">{ch.name}</div>
                    <div className="mt-1.5 flex items-center gap-2">
                      <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded-full border ${ch.difficulty === "Easy" ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300" : ch.difficulty === "Medium" ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-900" : ch.difficulty === "Hard" ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30" : "bg-zinc-900 text-white border-zinc-800"}`}>{ch.difficulty}</span>
                      <span className="text-[11px] font-mono text-[var(--text-3)]">{ch.points} pts</span>
                      <span className="text-[11px] text-[var(--text-3)]">•</span>
                      <span className="text-[11px] text-[var(--text-3)] flex items-center gap-1"><Users className="w-3 h-3" /> {ch.solves.toLocaleString()}</span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {ch.tags.map(tag => (
                        <span key={tag} className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-2)]">#{tag}</span>
                      ))}
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <Badge variant={isBookmarked ? "accent" : ch.status === "solved" ? "success" : ch.status === "attempted" ? "secondary" : "outline"} className="text-[11px]">
                        {isBookmarked ? "★ Bookmarked" : ch.status === "solved" ? "✓ Solved" : ch.status === "attempted" ? "Attempted" : "Not started"}
                      </Badge>
                      <span className="text-[11px] text-[var(--text-3)] flex items-center gap-1"><Clock className="w-3 h-3" /> {Math.floor(Math.random()*60)+10} min avg</span>
                    </div>
                  </CardContent>
                </Card>
                  </Link>
                </div>
              )})}

              {paged.length===0 && (
                <div className="stagger-item sm:col-span-2 xl:col-span-3"><Card className="border-dashed bg-[var(--surface-2)] rounded-[12px] flex flex-col items-center justify-center p-6 text-center min-h-[188px]">
                <div className="w-10 h-10 rounded-full bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center">
                  <Award className="w-5 h-5 text-[var(--text-2)]" />
                </div>
                <div className="mt-3 text-[14px] font-[600] tracking-[-0.01em] text-[var(--text)]">No challenges match filters</div>
                <div className="mt-1 text-[12px] leading-5 text-[var(--text-2)] max-w-[280px] mx-auto">Try adjusting category or difficulty, or browse recommended challenges.</div>
                <Button size="sm" className="mt-4 h-8 rounded-[8px] bg-[var(--text)] text-[var(--background)] hover:bg-zinc-800 dark:hover:bg-zinc-200" onClick={()=>{setQ(""); setActiveCat("All"); setDiffFilter(new Set(["Easy","Medium"])); setStatusFilter(new Set(["new"])); setPage(1)}}>Clear filters</Button>
              </Card></div>
              )}
            </Stagger>

            <div className="mt-6 flex items-center justify-between text-[12px] text-[var(--text-3)] border-t border-[var(--border)] pt-4">
              <span>Showing {paged.length} of {filtered.length} • Page {page} of {totalPages}</span>
              <div className="flex gap-1">
                <Button variant="secondary" size="sm" className="h-7 px-3" disabled={page<=1} onClick={()=>setPage(p=>Math.max(1,p-1))}>Previous</Button>
                <Button variant="secondary" size="sm" className="h-7 px-3" disabled={page>=totalPages} onClick={()=>setPage(p=>Math.min(totalPages,p+1))}>Next</Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
