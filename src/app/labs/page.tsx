"use client"
import Link from "next/link"
import * as React from "react"
import { AppShell } from "@/components/layout/app-shell"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { labs } from "@/lib/data"
import { Stagger, FadeIn, ProgressAnimated } from "@/components/ui/stagger"
import { Search, Clock, Target, Terminal, Filter, Play, RotateCcw, StickyNote, Flag, Users, ChevronRight, Lock, X } from "lucide-react"

const categories = ["All", "Web Security", "Linux", "Windows", "Active Directory", "Network Security", "Cloud Security", "Reverse Engineering", "Forensics", "SOC", "Detection Engineering", "Malware Analysis"]

export default function LabsPage() {
  const [isPaid, setIsPaid] = React.useState(false)
  const [activeCat, setActiveCat] = React.useState("All")
  const [q, setQ] = React.useState("")
  const [reportOpen, setReportOpen] = React.useState(false)
  const [reportText, setReportText] = React.useState("")
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

  const filtered = React.useMemo(() => {
    return labs.filter(l => {
      if (activeCat !== "All" && l.category !== activeCat) return false
      if (q.trim()) {
        const s = q.toLowerCase()
        return l.title.toLowerCase().includes(s) || l.description.toLowerCase().includes(s) || l.category.toLowerCase().includes(s)
      }
      return true
    })
  }, [activeCat, q])

  const handleNotes = () => {
    try {
      const note = localStorage.getItem("aegis_lab_notes_sql-injection") || "- tried ' OR 1=1--, got 500"
      alert(`Notes (localStorage aegis_lab_notes_*):\n${note.slice(0,400)}\n\nOpen a lab → Notes tab to edit. Saved per-lab locally.`)
    } catch { alert("Notes: open a lab detail page to edit private notes. Saved in localStorage.") }
  }
  const handleHints = () => alert("Hints: open the lab detail page → Hints card. 3 hints per lab, 50 XP penalty for last one. Progress stored in localStorage.")
  const handleReset = () => {
    if (!isPaid) { alert("Upgrade to Go or Plus to reset labs."); return }
    if (confirm("Reset lab progress? This clears local progress for this workspace (localStorage).")) {
      try { localStorage.removeItem("aegis_progress"); localStorage.removeItem("aegis_lesson_progress") } catch {}
      alert("Lab progress reset (localStorage cleared). Refresh to see 0%.")
    }
  }
  const handleReport = () => setReportOpen(v => !v)
  const submitReport = () => {
    if (!reportText.trim()) return alert("Please describe the issue.")
    try {
      const prev = JSON.parse(localStorage.getItem("aegis_reports") || "[]")
      prev.push({ id: Date.now().toString(), text: reportText, page: "labs", at: new Date().toISOString() })
      localStorage.setItem("aegis_reports", JSON.stringify(prev))
    } catch {}
    alert("Report submitted — saved to localStorage (aegis_reports). Admin will review.")
    setReportText("")
    setReportOpen(false)
  }

  return (
    <AppShell withSidebar>
      <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-[1280px]">
        {!isPaid && (
          <div className="mb-6 rounded-[12px] border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/20 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-[8px] bg-amber-500 text-white flex items-center justify-center shrink-0"><Lock className="w-4 h-4" /></div>
              <div>
                <div className="text-[13px] font-[600] text-amber-900 dark:text-amber-200">Labs are for paid members</div>
                <div className="text-[12px] text-amber-800 dark:text-amber-300">Upgrade to Go or Plus to unlock all isolated labs and environments. Only paid users can open labs.</div>
              </div>
            </div>
            <Link href="/settings/billing" className="shrink-0"><Button size="sm" className="h-8 rounded-full bg-amber-500 hover:bg-amber-600 text-white">Upgrade plan</Button></Link>
          </div>
        )}
        <FadeIn>
          <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
            <div>
              <h1 className="text-[22px] font-[650] tracking-[-0.03em]">Labs</h1>
              <p className="mt-1 text-[13.5px] text-[var(--text-2)]">Isolated environments with objectives, hints, and reset. Terminal where appropriate — no gamification, just practice. {isPaid ? "" : "Locked until upgrade."}</p>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-[280px]">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-3)]" />
                <Input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search labs, objectives, tags..." className="pl-8 h-8 bg-[var(--surface)]" />
                {q && <button onClick={()=>setQ("")} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-[var(--surface-2)]"><X className="w-3 h-3" /></button>}
              </div>
              <Button variant="secondary" size="sm" className="h-8 shrink-0" onClick={()=>alert("Filters: Use category pills + search. Category + difficulty filtering is active. Saved in URL state would sync — here local state.")}><Filter className="w-3.5 h-3.5 mr-1" /> Filters</Button>
            </div>
          </div>
        </FadeIn>

        {/* Category pill bar */}
        <FadeIn delay={60}>
          <div className="flex gap-1.5 overflow-x-auto pb-3 scrollbar-thin">
            {categories.map(cat => (
              <button key={cat} onClick={()=>setActiveCat(cat)} className={`px-3 py-1.5 rounded-full text-[12.5px] font-[500] whitespace-nowrap border transition-colors ${cat === activeCat ? "bg-[var(--text)] text-[var(--background)] border-[var(--text)]" : "bg-[var(--surface)] text-[var(--text-2)] border-[var(--border)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]"}`}>
                {cat}
              </button>
            ))}
          </div>
        </FadeIn>

        {/* Lab workspace preview (professional) */}
        <div className="grid lg:grid-cols-[1.65fr_1fr] gap-6 mt-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold tracking-widest uppercase text-[var(--text-3)]">{filtered.length} labs • Sorted by recommended {q || activeCat!=="All" ? "• filtered" : ""}</span>
              <span className="text-[12px] text-[var(--text-3)] hidden sm:block">Progress saves automatically</span>
            </div>

            <Stagger className="grid gap-3">
              {filtered.map(lab => (
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
                        {lab.progress !== undefined && lab.status !== "completed" && (
                          <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-[var(--surface-3)]"><ProgressAnimated value={lab.progress} /></div>
                        )}
                        {/* Mobile actions: View details is always accessible, Start is paid */}
                        <div className="flex sm:hidden items-center gap-2 mt-3">
                          <Link href={`/labs/${lab.id}`} className="flex-1">
                            <Button variant="secondary" size="sm" className="w-full rounded-[8px] h-8 text-[12.5px]">View details</Button>
                          </Link>
                          {!isPaid ? (
                            <Link href="/settings/billing">
                              <Button size="sm" variant="secondary" className="rounded-[8px] h-8 gap-1.5 border-amber-200 bg-amber-50 text-amber-800 dark:bg-amber-950/20 dark:text-amber-300"><Lock className="w-3.5 h-3.5" /> Upgrade</Button>
                            </Link>
                          ) : (
                            <Link href={`/labs/${lab.id}`}>
                              <Button size="sm" variant={lab.status === "in_progress" ? "default" : "secondary"} className="rounded-[8px] h-8" onClick={()=>{ try{ localStorage.setItem("aegis_last_lab", lab.id)}catch{}}}>
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
                          {!isPaid ? (
                            <Link href="/settings/billing">
                              <Button size="sm" variant="secondary" className="rounded-[8px] h-8 gap-1.5 border-amber-200 bg-amber-50 text-amber-800 dark:bg-amber-950/20"><Lock className="w-3.5 h-3.5" /> Upgrade</Button>
                            </Link>
                          ) : (
                            <Link href={`/labs/${lab.id}`}>
                              <Button size="sm" variant={lab.status === "in_progress" ? "default" : "secondary"} className="rounded-[8px] h-8" onClick={()=>{ try{ localStorage.setItem("aegis_last_lab", lab.id)}catch{}}}>
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
              {filtered.length===0 && (
                <Card className="border-dashed bg-[var(--surface-2)]"><CardContent className="p-6 text-center"><div className="text-[13px] font-[600]">No labs match filters</div><div className="text-[12px] text-[var(--text-2)]">Adjust search or category.</div><Button size="sm" className="mt-3 h-8" onClick={()=>{setQ(""); setActiveCat("All")}}>Clear filters</Button></CardContent></Card>
              )}
            </Stagger>
          </div>

          {/* Right: Lab detail / workspace mock - sticky and professional */}
          <div className="space-y-4">
            <div className="hidden lg:block sticky top-[72px] space-y-4">
              <Card className="overflow-hidden">
                <div className="px-4 py-3 border-b border-[var(--border)] bg-[var(--surface-2)] flex items-center justify-between">
                  <span className="text-[12px] font-semibold flex items-center gap-2"><Terminal className="w-3.5 h-3.5" /> Workspace</span>
                  <Badge variant="outline" className="font-mono text-[10px]">10.10.14.2</Badge>
                </div>
                <div className="p-4 space-y-4">
                  <div>
                    <div className="text-[13px] font-[600]">SQL Injection Fundamentals</div>
                    <div className="text-[11px] text-[var(--text-3)]">Web Security • Beginner • 45 min</div>
                  </div>

                  <div className="rounded-[10px] border border-[var(--border)] overflow-hidden">
                    <div className="px-3 py-2 bg-[#0F1012] flex items-center justify-between">
                      <span className="text-[11px] font-mono text-zinc-400">objectives / progress</span>
                      <span className="text-[11px] font-mono text-emerald-400">72%</span>
                    </div>
                    <div className="p-3 space-y-2 bg-[var(--surface)]">
                      <ObjectiveRow done label="Identify injection point" />
                      <ObjectiveRow done label="Enumerate database version" />
                      <ObjectiveRow active label="Extract user table (3/5 rows)" />
                      <ObjectiveRow label="Bypass login" />
                      <ObjectiveRow label="Submit remediation note" />
                    </div>
                    <div className="px-3 py-2 bg-[var(--surface-2)] border-t border-[var(--border)] flex items-center justify-between">
                      <span className="text-[11px] text-[var(--text-2)]">Progress 72% • 2 hints used</span>
                      <span className="text-[11px] font-mono text-[var(--text-3)]">31:42 remaining</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <Button variant="secondary" size="sm" className="h-8 text-[12px]" onClick={handleNotes}><StickyNote className="w-3 h-3 mr-1" /> Notes</Button>
                    <Button variant="secondary" size="sm" className="h-8 text-[12px]" onClick={handleHints}><Flag className="w-3 h-3 mr-1" /> Hints</Button>
                    <Button variant="ghost" size="sm" className="h-8 text-[12px] border border-[var(--border)]" onClick={handleReset}><RotateCcw className="w-3 h-3 mr-1" /> Reset</Button>
                  </div>

                  <div className="rounded-[10px] bg-[#0F1012] border border-zinc-800 p-3 font-mono text-[12px] leading-relaxed">
                    <div className="text-zinc-500 mb-1.5 flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-[10px] tracking-widest uppercase">Terminal</span>
                      <span>lab-sql-01</span>
                      <span className="ml-auto w-2 h-2 rounded-full bg-emerald-500" />
                    </div>
                    <div className="text-zinc-300">$ curl &quot;https://app.lab/api/user?id=1&apos; UNION SELECT null,null--&quot;</div>
                    <div className="text-zinc-500">{'{"users": [{"id": 1, "name": "admin"}]}'}</div>
                    <div className="text-zinc-300 mt-1">$ <span className="w-2 h-4 bg-zinc-500 inline-block animate-pulse align-middle" /></div>
                  </div>

                  <div className="flex gap-2">
                    {!isPaid ? (
                      <Link href="/settings/billing" className="flex-1"><Button className="w-full rounded-[8px] gap-1.5 border-amber-200 bg-amber-50 text-amber-800 dark:bg-amber-950/20"><Lock className="w-3.5 h-3.5" /> Upgrade to unlock lab</Button></Link>
                    ) : (
                      <Link href="/labs/sql-injection" className="flex-1"><Button className="w-full rounded-[8px]" onClick={()=>{ try{ localStorage.setItem("aegis_lab_opened","sql-injection")}catch{}}}>Open lab <ChevronRight className="w-3.5 h-3.5 ml-1" /></Button></Link>
                    )}
                    <Button variant="secondary" className="rounded-[8px]" onClick={handleReport}>Report issue</Button>
                  </div>
                  {reportOpen && (
                    <div className="rounded-[10px] border border-[var(--border)] bg-[var(--surface)] p-3 space-y-2">
                      <textarea value={reportText} onChange={e=>setReportText(e.target.value)} placeholder="Describe the issue..." className="w-full min-h-[72px] rounded-[8px] border border-[var(--border)] bg-[var(--surface-2)] p-2 text-[13px]" />
                      <div className="flex gap-2"><Button size="sm" className="h-8" onClick={submitReport}>Submit report</Button><Button size="sm" variant="ghost" className="h-8" onClick={()=>setReportOpen(false)}>Cancel</Button></div>
                    </div>
                  )}
                </div>
              </Card>

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

            {/* Mobile: non-sticky fallback */}
            <div className="lg:hidden space-y-4">
              <Card className="overflow-hidden">
                <div className="px-4 py-3 border-b border-[var(--border)] bg-[var(--surface-2)] flex items-center justify-between">
                  <span className="text-[12px] font-semibold flex items-center gap-2"><Terminal className="w-3.5 h-3.5" /> Workspace</span>
                  <Badge variant="outline" className="font-mono text-[10px]">10.10.14.2</Badge>
                </div>
                <div className="p-4 space-y-4">
                  <div>
                    <div className="text-[13px] font-[600]">SQL Injection Fundamentals</div>
                    <div className="text-[11px] text-[var(--text-3)]">Web Security • Beginner • 45 min</div>
                  </div>
                  <div className="rounded-[10px] border border-[var(--border)] overflow-hidden">
                    <div className="px-3 py-2 bg-[#0F1012] flex items-center justify-between">
                      <span className="text-[11px] font-mono text-zinc-400">objectives / progress</span>
                      <span className="text-[11px] font-mono text-emerald-400">72%</span>
                    </div>
                    <div className="p-3 space-y-2 bg-[var(--surface)]">
                      <ObjectiveRow done label="Identify injection point" />
                      <ObjectiveRow done label="Enumerate database version" />
                      <ObjectiveRow active label="Extract user table (3/5 rows)" />
                      <ObjectiveRow label="Bypass login" />
                      <ObjectiveRow label="Submit remediation note" />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <Button variant="secondary" size="sm" className="h-8 text-[12px]" onClick={handleNotes}><StickyNote className="w-3 h-3 mr-1" /> Notes</Button>
                    <Button variant="secondary" size="sm" className="h-8 text-[12px]" onClick={handleHints}><Flag className="w-3 h-3 mr-1" /> Hints</Button>
                    <Button variant="ghost" size="sm" className="h-8 text-[12px] border border-[var(--border)]" onClick={handleReset}><RotateCcw className="w-3 h-3 mr-1" /> Reset</Button>
                  </div>
                  <div className="flex gap-2">
                    {!isPaid ? (
                      <Link href="/settings/billing" className="flex-1"><Button className="w-full rounded-[8px] gap-1.5 border-amber-200 bg-amber-50 text-amber-800 dark:bg-amber-950/20"><Lock className="w-3.5 h-3.5" /> Upgrade to unlock</Button></Link>
                    ) : (
                      <Link href="/labs/sql-injection" className="flex-1"><Button className="w-full rounded-[8px]">Open lab <ChevronRight className="w-3.5 h-3.5 ml-1" /></Button></Link>
                    )}
                    <Button variant="secondary" className="rounded-[8px]" onClick={handleReport}>Report issue</Button>
                  </div>
                  {reportOpen && (
                    <div className="rounded-[10px] border border-[var(--border)] bg-[var(--surface)] p-3 space-y-2">
                      <textarea value={reportText} onChange={e=>setReportText(e.target.value)} placeholder="Describe the issue..." className="w-full min-h-[72px] rounded-[8px] border border-[var(--border)] bg-[var(--surface-2)] p-2 text-[13px]" />
                      <div className="flex gap-2"><Button size="sm" className="h-8" onClick={submitReport}>Submit report</Button><Button size="sm" variant="ghost" className="h-8" onClick={()=>setReportOpen(false)}>Cancel</Button></div>
                    </div>
                  )}
                </div>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-[12px] font-semibold">Need guidance?</div>
                  <div className="text-[12px] text-[var(--text-2)] mt-1 leading-5">Labs include prerequisites and recommended order. Check the Academy path for context before starting Advanced labs.</div>
                  <Link href="/learn" className="mt-3 inline-flex text-[12px] font-medium text-[var(--accent)] hover:underline">View learning paths →</Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}

function ObjectiveRow({ label, done, active }: { label: string, done?: boolean, active?: boolean }) {
  return (
    <div className={`flex items-center gap-2.5 px-2.5 py-2 rounded-[8px] border text-[12.5px] ${active ? "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-300" : done ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300" : "bg-[var(--surface-2)] border-[var(--border)] text-[var(--text-2)]"}`}>
      <span className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 text-[10px] ${done ? "bg-emerald-600 border-emerald-600 text-white" : active ? "bg-blue-600 border-blue-600 text-white" : "border-[var(--border-strong)] bg-white dark:bg-[#17181B]"}`}>
        {done ? "✓" : active ? "•" : ""}
      </span>
      <span className="font-[450] truncate">{label}</span>
      {done && <span className="ml-auto text-[11px]">Done</span>}
      {active && <span className="ml-auto text-[11px] font-mono">3/5</span>}
    </div>
  )
}
