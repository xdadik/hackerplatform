"use client"
import Link from "next/link"
import * as React from "react"
import { use } from "react"
import { notFound } from "next/navigation"
import { AppShell } from "@/components/layout/app-shell"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { ArrowLeft, Clock, Target, Terminal, StickyNote, Flag, RotateCcw, CheckCircle2, Play, Shield } from "lucide-react"
import { sanitizeInput } from "@/lib/sanitize"
import { flagLimiter } from "@/lib/rate-limit"
import { useAuth } from "@/components/auth-provider"

type LabDetail = {
  id: string
  title: string
  category: string
  difficulty: string
  duration: string
  description: string
  objectives: number
  participants: number
  youtubeId: string
}

export default function LabDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { user } = useAuth()
  const isPaid = user?.plan === "go" || user?.plan === "plus"
  const [lab, setLab] = React.useState<LabDetail | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [missing, setMissing] = React.useState(false)

  const [progress, setProgress] = React.useState(0)
  const [notes, setNotes] = React.useState("")
  const [flag, setFlag] = React.useState("")
  const [flagMsg, setFlagMsg] = React.useState<string | null>(null)
  const [flagBusy, setFlagBusy] = React.useState(false)

  React.useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await fetch(`/api/labs/${encodeURIComponent(id)}`)
        if (res.status === 404) {
          if (!cancelled) { setMissing(true); setLoading(false) }
          return
        }
        if (!res.ok) throw new Error("load failed")
        const body = await res.json()
        if (!cancelled) { setLab(body.lab); setLoading(false) }
      } catch {
        if (!cancelled) { setMissing(true); setLoading(false) }
      }
    }
    load()
    return () => { cancelled = true }
  }, [id])

  React.useEffect(() => {
    try {
      const savedNotes = localStorage.getItem(`aegis_lab_notes_${id}`)
      if (savedNotes) setNotes(savedNotes)
      const savedProgress = localStorage.getItem(`aegis_lab_progress_${id}`)
      if (savedProgress) setProgress(Math.min(100, Math.max(0, parseInt(savedProgress) || 0)))
    } catch {}
  }, [id])
  React.useEffect(()=>{ try{ localStorage.setItem(`aegis_lab_notes_${id}`, notes)}catch{}},[notes, id])
  React.useEffect(()=>{ try{ localStorage.setItem(`aegis_lab_progress_${id}`, String(progress))}catch{}},[progress, id])

  if (missing) {
    notFound()
  }

  if (loading || !lab) {
    return (
      <AppShell withSidebar>
        <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-[1280px]">
          <div className="h-5 w-24 rounded bg-[var(--surface-2)] animate-pulse" />
          <div className="mt-4 h-8 w-2/3 rounded bg-[var(--surface-2)] animate-pulse" />
          <div className="mt-2 h-4 w-1/2 rounded bg-[var(--surface-2)] animate-pulse" />
          <div className="mt-6 grid lg:grid-cols-[280px_1fr_300px] gap-4">
            {[0,1,2].map(i => <div key={i} className="h-[280px] rounded-[12px] bg-[var(--surface-2)] animate-pulse" />)}
          </div>
        </div>
      </AppShell>
    )
  }

  const objectiveCount = Math.max(1, lab.objectives || 1)

  const handleReset = () => {
    if(!isPaid){ alert("Upgrade to reset labs"); return}
    if(confirm("Reset this lab? Clears your local progress and notes for this lab.")){
      setProgress(0); setFlag(""); setFlagMsg(null)
      try{ localStorage.removeItem(`aegis_lab_progress_${id}`)}catch{}
    }
  }
  const handleStart = () => {
    if(!isPaid) return
    try{ document.querySelector('[data-workspace]')?.scrollIntoView({behavior:"smooth"}) }catch{}
  }
  const handleSubmitFlag = async () => {
    const rl = flagLimiter.check(id)
    if (rl.limited) return setFlagMsg(`Rate limited: try again in ${Math.ceil(rl.resetMs/1000)}s (5/min) — server enforces the same limit.`)
    const cleanFlag = sanitizeInput(flag, 200).trim()
    if(!cleanFlag) return setFlagMsg("Enter flag (format: flag{...} or aegis{...})")
    if(!/^(flag|aegis)\{[^}]+\}$/i.test(cleanFlag)) return setFlagMsg("Invalid flag format. Expected flag{...} or aegis{...}.")
    flagLimiter.record(id)
    setFlagBusy(true)
    try {
      const res = await fetch(`/api/labs/${encodeURIComponent(id)}/flag`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flag: cleanFlag }),
      })
      const body = await res.json().catch(() => ({}))
      if (res.status === 429) {
        setFlagMsg(`Rate limited by server. Try again soon.`)
        return
      }
      if (body.correct) {
        setProgress(100)
        setFlagMsg("✅ Correct! Lab completed — progress saved.")
      } else {
        setFlagMsg(`❌ ${body.error || body.message || "Incorrect flag. Try again."}`)
      }
    } catch {
      setFlagMsg("❌ Could not verify flag. Check your connection and try again.")
    } finally {
      setFlagBusy(false)
    }
  }
  const handleFlagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleSubmitFlag()
    }
  }

  return (
    <AppShell withSidebar>
      <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-[1280px]">
        <Link href="/labs" className="inline-flex items-center gap-1.5 text-[13px] text-[var(--text-2)] hover:text-[var(--text)] mb-4">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to labs
        </Link>

        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="rounded-full">{lab.category}</Badge>
              <Badge variant={lab.difficulty==="Beginner"?"success":lab.difficulty==="Advanced"?"secondary":"accent"}>{lab.difficulty}</Badge>
              <span className="text-[12px] text-[var(--text-3)] flex items-center gap-1"><Clock className="w-3 h-3" />{lab.duration}</span>
              <span className="text-[12px] text-[var(--text-3)] flex items-center gap-1"><Target className="w-3 h-3" />{objectiveCount} objective{objectiveCount===1?"":"s"}</span>
            </div>
            <h1 className="text-[20px] sm:text-[22px] font-[700] tracking-[-0.03em]">{lab.title}</h1>
            <p className="mt-1 text-[13.5px] text-[var(--text-2)] max-w-[640px]">{lab.description || "Hands-on lab in an isolated environment."}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" className="h-8" onClick={handleReset} aria-label="Reset lab"><RotateCcw className="w-3.5 h-3.5 mr-1" /> Reset</Button>
            {!isPaid ? (
              <Link href="/settings/billing"><Button size="sm" className="h-8 gap-1.5">Upgrade to unlock</Button></Link>
            ) : (
              <Button size="sm" className="h-8" onClick={handleStart} aria-label={progress>0?"Resume lab":"Start lab"}><Play className="w-3.5 h-3.5 mr-1" /> {progress>0?"Resume":"Start"} lab</Button>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-[280px_1fr_300px] gap-4">
          <div className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-[11px] font-semibold tracking-widest uppercase text-[var(--text-3)] mb-3">Objectives • {progress}%</div>
                <div className="h-1.5 bg-[var(--surface-3)] rounded-full overflow-hidden mb-4" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="Lab progress">
                  <div className="h-full bg-[var(--accent)] rounded-full" style={{ width: `${progress}%` }} />
                </div>
                <div className="space-y-2">
                  {Array.from({ length: objectiveCount }, (_, i) => {
                    const threshold = Math.round(((i + 1) / objectiveCount) * 100)
                    const done = progress >= threshold
                    const active = !done && (i === 0 || progress >= Math.round((i / objectiveCount) * 100))
                    return <Obj key={i} done={done} active={active} label={`Objective ${i + 1}`} desc="Complete this objective in the lab environment" />
                  })}
                </div>
                <div className="mt-4 p-2.5 rounded-[8px] bg-[var(--surface-2)] border border-[var(--border)]">
                  <div className="text-[11px] font-semibold">Prerequisites</div>
                  <div className="text-[11px] text-[var(--text-2)] mt-1">{lab.category} fundamentals</div>
                  <Link href="/learn" className="text-[11px] font-medium text-[var(--accent)] hover:underline mt-1 inline-block">View learning paths →</Link>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="text-[12px] font-semibold flex items-center gap-2"><Shield className="w-3.5 h-3.5" /> Environment</div>
                <div className="mt-2 space-y-1.5 text-[12px]">
                  <div className="flex justify-between"><span className="text-[var(--text-2)]">Duration</span><span className="font-mono">{lab.duration}</span></div>
                  <div className="flex justify-between"><span className="text-[var(--text-2)]">Difficulty</span><span>{lab.difficulty}</span></div>
                  <div className="flex justify-between"><span className="text-[var(--text-2)]">Participants</span><span className="font-mono">{lab.participants.toLocaleString()}</span></div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4 min-w-0" data-workspace>
            <Tabs defaultValue="workspace">
              <TabsList>
                <TabsTrigger value="workspace">Workspace</TabsTrigger>
                <TabsTrigger value="guide">Guide</TabsTrigger>
                <TabsTrigger value="notes">Notes</TabsTrigger>
              </TabsList>
              <TabsContent value="workspace">
                <Card className="overflow-hidden">
                  <div className="h-8 bg-[var(--surface-2)] border-b border-[var(--border)] flex items-center justify-between px-3">
                    <span className="text-[11px] font-medium flex items-center gap-1.5"><Terminal className="w-3 h-3" /> Lab workspace</span>
                    <span className="text-[11px] font-mono text-[var(--text-3)]">{progress}% complete</span>
                  </div>
                  <div className="bg-[#0F1012] p-3 font-mono text-[12px] leading-6 min-h-[200px] flex flex-col justify-center">
                    <div className="space-y-1 text-zinc-300 text-center">
                      <div className="text-zinc-400">Work through the objectives, then submit the flag below.</div>
                      <div className="text-zinc-500 text-[11px]">Flags are verified server-side • 5 attempts/min</div>
                    </div>
                  </div>
                  <div className="p-3 bg-[var(--surface-2)] border-t border-[var(--border)] flex gap-2">
                    <label htmlFor="flag-input" className="sr-only">Flag input</label>
                    <input id="flag-input" value={flag} onChange={e=>setFlag(e.target.value)} onKeyDown={handleFlagKeyDown} placeholder="Enter flag..." aria-label="Flag input" className="flex-1 h-8 rounded-[8px] border border-[var(--border)] bg-[var(--surface)] px-3 text-[13px] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]" />
                    <Button size="sm" className="h-8" onClick={handleSubmitFlag} disabled={flagBusy} aria-label="Submit flag">{flagBusy ? "Checking..." : "Submit"}</Button>
                  </div>
                  {flagMsg && <div role="status" aria-live="polite" className="px-3 pb-3 text-[12px] leading-5" style={{color: flagMsg.includes("✅") ? "#059669" : "#DC2626"}}>{flagMsg}</div>}
                </Card>
              </TabsContent>
              <TabsContent value="guide">
                <Card><CardContent className="p-5"><h3 className="text-[14px] font-[650]">Guide</h3><p className="text-[13px] leading-6 text-[var(--text-2)] mt-2">{lab.description || "Follow the objectives in order. Document your methodology as you go."}</p></CardContent></Card>
              </TabsContent>
              <TabsContent value="notes">
                <Card><CardContent className="p-5"><label htmlFor="lab-notes" className="sr-only">Private notes</label><textarea id="lab-notes" value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Private notes — saved automatically, per-lab, not shared..." aria-label="Private notes" className="w-full min-h-[180px] rounded-[8px] border border-[var(--border)] bg-[var(--surface)] p-3 text-[13px] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]" /><div className="mt-2 text-[11px] text-[var(--text-3)]">Auto-saved in this browser • Private to you</div><div className="mt-3 flex gap-2"><Button size="sm" className="h-8" onClick={()=>{ try{ localStorage.setItem(`aegis_lab_notes_${id}`, notes)}catch{}; setFlagMsg(null) }} aria-label="Save notes">Save notes</Button><Button size="sm" variant="ghost" className="h-8" onClick={()=>{ setNotes(""); try{ localStorage.removeItem(`aegis_lab_notes_${id}`)}catch{}}} aria-label="Clear notes">Clear</Button></div></CardContent></Card>
              </TabsContent>
            </Tabs>
          </div>

          <div className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-[12px] font-semibold flex items-center gap-1.5"><Flag className="w-3.5 h-3.5" /> Hints</div>
                <div className="mt-3 p-3 rounded-[8px] border border-dashed border-[var(--border)] text-center">
                  <div className="text-[12px] text-[var(--text-2)]">No hints published for this lab yet.</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="text-[12px] font-semibold flex items-center gap-2"><StickyNote className="w-3.5 h-3.5" /> Notes & progress</div>
                <div className="mt-3 space-y-2 text-[12px]">
                  <div className="flex justify-between"><span className="text-[var(--text-2)]">Progress</span><span className="font-mono">{progress}%</span></div>
                  <div className="h-1.5 bg-[var(--surface-3)] rounded-full overflow-hidden" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="Lab progress"><div className="h-full bg-[var(--accent)]" style={{width:`${progress}%`}} /></div>
                  <div className="flex justify-between"><span className="text-[var(--text-2)]">Duration</span><span className="font-mono">{lab.duration}</span></div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="text-[11px] font-semibold tracking-widest uppercase text-[var(--text-3)]">Next steps</div>
                <div className="mt-2 space-y-2">
                  <Link href="/labs" className="flex items-center justify-between p-2.5 rounded-[8px] border border-[var(--border)] hover:bg-[var(--surface-2)] transition-colors">
                    <span className="text-[12.5px] font-[500]">Browse all labs</span>
                  </Link>
                  <Link href="/learn" className="flex items-center justify-between p-2.5 rounded-[8px] border border-[var(--border)] hover:bg-[var(--surface-2)] transition-colors">
                    <span className="text-[12.5px] font-[500]">Back to learning paths</span>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  )
}

function Obj({ label, desc, done, active }: { label: string, desc: string, done?: boolean, active?: boolean }) {
  return (
    <div className={`p-2.5 rounded-[8px] border flex gap-2.5 ${active ? "bg-[var(--accent-muted)] border-[var(--accent-border)]" : done ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900" : "bg-[var(--surface-2)] border-[var(--border)]"}`}>
      <span className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${done ? "bg-emerald-600 border-emerald-600 text-white" : active ? "bg-[var(--accent)] border-[var(--accent)] text-white" : "bg-[var(--surface)] border-[var(--border-strong)]"}`}>
        {done ? <CheckCircle2 className="w-3 h-3" /> : active ? <span className="w-1.5 h-1.5 rounded-full bg-white" /> : null}
      </span>
      <div className="flex-1 min-w-0">
        <div className={`text-[12.5px] font-[550] leading-none ${done ? "text-emerald-800 dark:text-emerald-300" : active ? "text-[var(--accent)]" : "text-[var(--text-2)]"}`}>{label}</div>
        <div className="text-[11px] text-[var(--text-3)] mt-1 leading-4">{desc}</div>
      </div>
    </div>
  )
}
