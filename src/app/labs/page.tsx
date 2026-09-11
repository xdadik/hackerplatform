"use client"
import Link from "next/link"
import * as React from "react"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { AppShell } from "@/components/layout/app-shell"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Stagger, FadeIn, ProgressAnimated } from "@/components/ui/stagger"
import { Search, Clock, Target, Terminal, Play, Flag, Users, ChevronRight, Lock, X } from "lucide-react"
import { useAuth } from "@/components/auth-provider"

const categories = ["All", "Web Security", "Linux", "Windows", "Active Directory", "Network Security", "Cloud Security", "Reverse Engineering", "Forensics", "SOC", "Detection Engineering", "Malware Analysis"]

type Lab = {
  id: string
  title: string
  category: string
  difficulty: string
  duration: string
  description: string
  objectives: number
  participants: number
  youtubeId: string | null
  status: string
  progress: number
}

function LabsPageInner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const { user, isLoading: authLoading } = useAuth()
  const isPaid = user?.plan === "go" || user?.plan === "plus"
  const [isMounted, setIsMounted] = React.useState(false)
  const [activeCat, setActiveCat] = React.useState("All")
  const [q, setQ] = React.useState("")
  const [labs, setLabs] = React.useState<Lab[] | null>(null)

  React.useEffect(() => {
    setIsMounted(true)
  }, [])

  React.useEffect(() => {
    const cat = searchParams.get("category")
    const search = searchParams.get("q") ?? searchParams.get("search") ?? ""
    if (cat && categories.includes(cat)) setActiveCat(cat)
    if (search) setQ(search)
  }, [searchParams])

  React.useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await fetch("/api/labs")
        const body = await res.json().catch(() => ({ labs: [] }))
        if (!cancelled) setLabs(body.labs ?? [])
      } catch {
        if (!cancelled) setLabs([])
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  React.useEffect(() => {
    if (!isMounted) return
    const params = new URLSearchParams()
    if (activeCat !== "All") params.set("category", activeCat)
    if (q) params.set("q", q)
    const qs = params.toString()
    const current = searchParams.toString()
    const next = qs
    if (current !== next) {
      router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false })
    }
  }, [activeCat, q, isMounted, pathname, router, searchParams])

  const filtered = React.useMemo(() => {
    return (labs ?? []).filter(l => {
      if (activeCat !== "All" && l.category !== activeCat) return false
      if (q.trim()) {
        const s = q.toLowerCase()
        return l.title.toLowerCase().includes(s) || l.description.toLowerCase().includes(s) || l.category.toLowerCase().includes(s)
      }
      return true
    })
  }, [activeCat, q, labs])

  const featured = filtered[0] ?? null
  const loading = labs === null

  return (
    <AppShell withSidebar>
      <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-[1280px]">
        {isMounted && !authLoading && !isPaid && (
          <div className="mb-6 rounded-[12px] border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/20 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-[8px] bg-amber-500 text-white flex items-center justify-center shrink-0"><Lock className="w-4 h-4" /></div>
              <div>
                <div className="text-[13px] font-[600] text-amber-900 dark:text-amber-200">Labs are for paid members</div>
                <div className="text-[12px] text-amber-800 dark:text-amber-300">Upgrade to Go or Plus to unlock all isolated labs and environments. Only paid users can open labs.</div>
              </div>
            </div>
            <Link href="/settings/billing" className="shrink-0"><Button size="sm" className="h-11 sm:h-8 min-h-[44px] sm:min-h-0 rounded-full bg-amber-500 hover:bg-amber-600 text-white">Upgrade plan</Button></Link>
          </div>
        )}
        <FadeIn>
          <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
            <div>
              <h1 className="text-[22px] font-[650] tracking-[-0.03em]">Labs</h1>
              <p className="mt-1 text-[13.5px] text-[var(--text-2)]">Isolated environments with objectives, hints, and reset. Terminal where appropriate — no gamification, just practice. {isMounted && !isPaid ? "Locked until upgrade." : ""}</p>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-[280px] w-full">
                <label htmlFor="labs-search" className="sr-only">Search labs</label>
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-3)]" aria-hidden="true" />
                <Input id="labs-search" aria-label="Search labs" value={q} onChange={e=>setQ(e.target.value)} placeholder="Search labs, objectives, tags..." className="pl-8 h-11 sm:h-8 bg-[var(--surface)] min-h-[44px] sm:min-h-0" />
                {q && <button aria-label="Clear search" onClick={()=>setQ("")} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-[var(--surface-2)]"><X className="w-3 h-3" /></button>}
              </div>
            </div>
          </div>
        </FadeIn>

        <FadeIn delay={60}>
          <div className="flex gap-1.5 overflow-x-auto pb-3 scrollbar-thin" role="group" aria-label="Filter by category">
            {categories.map(cat => (
              <button key={cat} onClick={()=>setActiveCat(cat)} aria-pressed={activeCat===cat} aria-label={`Filter ${cat}`} className={`px-3 py-2 sm:py-1.5 min-h-[36px] sm:min-h-0 rounded-full text-[12.5px] font-[500] whitespace-nowrap border transition-colors ${cat === activeCat ? "bg-[var(--text)] text-[var(--background)] border-[var(--text)]" : "bg-[var(--surface)] text-[var(--text-2)] border-[var(--border)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]"}`}>
                {cat}
              </button>
            ))}
          </div>
        </FadeIn>

        <div className="grid lg:grid-cols-[1.65fr_1fr] gap-6 mt-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold tracking-widest uppercase text-[var(--text-3)]">{loading ? "Loading labs..." : `${filtered.length} lab${filtered.length===1?"":"s"} • Sorted by recommended ${q || activeCat!=="All" ? "• filtered" : ""}`}</span>
              <span className="text-[12px] text-[var(--text-3)] hidden sm:block">Progress saves automatically</span>
            </div>

            <Stagger className="grid gap-3">
              {loading ? (
                [1,2,3].map(i => (
                  <Card key={i}><CardContent className="p-4 sm:p-5">
                    <div className="h-5 w-2/3 rounded bg-[var(--surface-2)] animate-pulse" />
                    <div className="mt-2 h-4 w-full rounded bg-[var(--surface-2)] animate-pulse" />
                    <div className="mt-2 h-3 w-1/2 rounded bg-[var(--surface-2)] animate-pulse" />
                  </CardContent></Card>
                ))
              ) : filtered.map(lab => (
                <div key={lab.id} className="stagger-item"><Card className="group hover:shadow-md transition-all hover:-translate-y-[0.5px]">
                  <CardContent className="p-4 sm:p-5">
                    <div className="flex gap-4">
                      <div className="w-10 h-10 rounded-[10px] bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center shrink-0 group-hover:bg-[var(--text)] group-hover:text-[var(--background)] transition-colors">
                        <Target className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[14px] font-[600] tracking-[-0.015em]">{lab.title}</span>
                          <Badge variant={
                            lab.difficulty === "Beginner" ? "success" :
                            lab.difficulty === "Intermediate" ? "accent" :
                            lab.difficulty === "Advanced" ? "secondary" : "outline"
                          } className="text-[10px]">{lab.difficulty}</Badge>
                          {lab.status === "completed" && <Badge variant="success" className="text-[10px] gap-1"><Flag className="w-3 h-3" /> Completed</Badge>}
                          {lab.status === "in_progress" && <Badge variant="accent" className="text-[10px]">In progress • {lab.progress}%</Badge>}
                        </div>
                        <div className="mt-1 text-[12.5px] leading-5 text-[var(--text-2)] line-clamp-2">{lab.description}</div>
                        <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-[var(--text-3)]">
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {lab.duration}</span>
                          <span className="flex items-center gap-1"><Target className="w-3 h-3" /> {lab.objectives} objectives</span>
                          <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {lab.participants.toLocaleString()} participants</span>
                          <span className="hidden sm:inline-flex items-center gap-1"><Terminal className="w-3 h-3" /> {lab.category}</span>
                        </div>
                        {lab.progress !== undefined && lab.status !== "completed" && lab.progress > 0 && (
                          <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-[var(--surface-3)]" role="progressbar" aria-valuenow={lab.progress} aria-valuemin={0} aria-valuemax={100} aria-label={`${lab.title} progress`}><ProgressAnimated value={lab.progress} /></div>
                        )}
                        <div className="flex sm:hidden items-center gap-2 mt-3">
                          <Link href={`/labs/${lab.id}`} className="flex-1">
                            <Button variant="secondary" size="sm" className="w-full rounded-[8px] h-11 sm:h-8 min-h-[44px] sm:min-h-0 text-[12.5px]">View details</Button>
                          </Link>
                          {!isMounted ? null : !isPaid ? (
                            <Link href="/settings/billing">
                              <Button size="sm" variant="secondary" className="rounded-[8px] h-11 sm:h-8 min-h-[44px] sm:min-h-0 gap-1.5 border-amber-200 bg-amber-50 text-amber-800 dark:bg-amber-950/20 dark:text-amber-300"><Lock className="w-3.5 h-3.5" /> Upgrade</Button>
                            </Link>
                          ) : (
                            <Link href={`/labs/${lab.id}`}>
                              <Button size="sm" variant={lab.status === "in_progress" ? "default" : "secondary"} className="rounded-[8px] h-11 sm:h-8 min-h-[44px] sm:min-h-0">
                                {lab.status === "in_progress" ? <><Play className="w-3.5 h-3.5 mr-1" /> Continue</> : lab.status === "completed" ? "Review" : "Start lab"}
                              </Button>
                            </Link>
                          )}
                        </div>
                      </div>
                      <div className="hidden sm:flex flex-col items-end gap-2 shrink-0">
                        <div className="flex items-center gap-1.5">
                          <Link href={`/labs/${lab.id}`} className="text-[12px] font-medium text-[var(--text-2)] hover:text-[var(--text)] hover:underline inline-flex items-center gap-1">
                            View details <ChevronRight className="w-3 h-3" />
                          </Link>
                          {!isMounted ? null : !isPaid ? (
                            <Link href="/settings/billing">
                              <Button size="sm" variant="secondary" className="rounded-[8px] h-11 sm:h-8 min-h-[44px] sm:min-h-0 gap-1.5 border-amber-200 bg-amber-50 text-amber-800 dark:bg-amber-950/20"><Lock className="w-3.5 h-3.5" /> Upgrade</Button>
                            </Link>
                          ) : (
                            <Link href={`/labs/${lab.id}`}>
                              <Button size="sm" variant={lab.status === "in_progress" ? "default" : "secondary"} className="rounded-[8px] h-11 sm:h-8 min-h-[44px] sm:min-h-0">
                                {lab.status === "in_progress" ? <><Play className="w-3.5 h-3.5 mr-1" /> Continue</> : lab.status === "completed" ? "Review" : "Start lab"}
                              </Button>
                            </Link>
                          )}
                        </div>
                        <span className="text-[11px] font-mono text-[var(--text-3)]">{lab.category}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card></div>
              ))}
              {!loading && filtered.length===0 && (
                <Card className="border-dashed bg-[var(--surface-2)]"><CardContent className="p-6 text-center"><div className="text-[13px] font-[600]">{q || activeCat !== "All" ? "No labs match filters" : "No labs published yet"}</div><div className="text-[12px] text-[var(--text-2)]">{q || activeCat !== "All" ? "Adjust search or category." : "New labs will appear here when published."}</div>{(q || activeCat !== "All") && <Button size="sm" className="mt-3 h-11 sm:h-8 min-h-[44px] sm:min-h-0" onClick={()=>{setQ(""); setActiveCat("All")}}>Clear filters</Button>}</CardContent></Card>
              )}
            </Stagger>
          </div>

          <div className="space-y-4">
            <div className="lg:sticky lg:top-[72px] space-y-4">
              {featured ? (
                <Card>
                  <CardContent className="p-4">
                    <div className="text-[11px] font-semibold tracking-widest uppercase text-[var(--text-3)] mb-2">Featured lab</div>
                    <div className="text-[13px] font-[600]">{featured.title}</div>
                    <div className="text-[11px] text-[var(--text-3)] mt-0.5">{featured.category} • {featured.difficulty} • {featured.duration}</div>
                    <p className="mt-2 text-[12px] leading-5 text-[var(--text-2)] line-clamp-3">{featured.description}</p>
                    <Link href={`/labs/${featured.id}`} className="mt-3 inline-flex text-[12px] font-medium text-[var(--accent)] hover:underline">Open lab →</Link>
                  </CardContent>
                </Card>
              ) : !loading ? (
                <Card className="border-dashed bg-[var(--surface-2)]">
                  <CardContent className="p-4 text-center text-[12px] text-[var(--text-2)]">No labs to feature yet.</CardContent>
                </Card>
              ) : null}

              <FadeIn>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-[12px] font-semibold">Need guidance?</div>
                    <div className="text-[12px] text-[var(--text-2)] mt-1 leading-5">Labs include prerequisites and recommended order. Check the Academy path for context before starting Advanced labs.</div>
                    <Link href="/learn" className="mt-3 inline-flex text-[12px] font-medium text-[var(--accent)] hover:underline">Browse Academy →</Link>
                  </CardContent>
                </Card>
              </FadeIn>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}

export default function LabsPage() {
  return (
    <React.Suspense fallback={<div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-[1280px]"><div className="h-32 animate-pulse bg-[var(--surface-2)] rounded-[12px]" /></div>}>
      <LabsPageInner />
    </React.Suspense>
  )
}
