"use client"
import Link from "next/link"
import * as React from "react"
import { use } from "react"
import { notFound } from "next/navigation"
import { AppShell } from "@/components/layout/app-shell"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Trophy, Clock, Flag, Bookmark, Share2, CheckCircle2 } from "lucide-react"
import { sanitizeInput } from "@/lib/sanitize"
import { flagLimiter } from "@/lib/rate-limit"

type ChallengeDetail = {
  id: string
  name: string
  category: string
  difficulty: string
  points: number
  solves: number
  tags: string[]
}

export default function ChallengeDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [challenge, setChallenge] = React.useState<ChallengeDetail | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [missing, setMissing] = React.useState(false)
  const [bookmarked, setBookmarked] = React.useState(false)
  const [flag, setFlag] = React.useState("")
  const [msg, setMsg] = React.useState<string|null>(null)
  const [solved, setSolved] = React.useState(false)
  const [flagBusy, setFlagBusy] = React.useState(false)

  React.useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await fetch(`/api/challenges/${encodeURIComponent(id)}`)
        if (res.status === 404) {
          if (!cancelled) { setMissing(true); setLoading(false) }
          return
        }
        if (!res.ok) throw new Error("load failed")
        const body = await res.json()
        if (!cancelled) { setChallenge(body.challenge); setLoading(false) }
      } catch {
        if (!cancelled) { setMissing(true); setLoading(false) }
      }
    }
    load()
    return () => { cancelled = true }
  }, [id])

  React.useEffect(()=>{
    try{
      const raw=localStorage.getItem("aegis_bookmarks")
      if(raw){ const s=new Set(JSON.parse(raw)); setBookmarked((s as Set<string>).has(id)) }
      const sol=localStorage.getItem(`aegis_solved_${id}`)
      if(sol==="1") setSolved(true)
    }catch{}
  },[id])

  if (missing) {
    notFound()
  }

  if (loading || !challenge) {
    return (
      <AppShell withSidebar>
        <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-[1080px]">
          <div className="h-5 w-24 rounded bg-[var(--surface-2)] animate-pulse" />
          <div className="mt-4 h-8 w-2/3 rounded bg-[var(--surface-2)] animate-pulse" />
          <div className="mt-2 h-4 w-1/2 rounded bg-[var(--surface-2)] animate-pulse" />
          <div className="mt-6 h-[280px] rounded-[12px] bg-[var(--surface-2)] animate-pulse" />
        </div>
      </AppShell>
    )
  }

  const toggleBookmark=()=>{
    const next=!bookmarked
    setBookmarked(next)
    try{
      const raw=localStorage.getItem("aegis_bookmarks")
      const set=new Set<string>(raw?JSON.parse(raw):[])
      if(next) set.add(id); else set.delete(id)
      localStorage.setItem("aegis_bookmarks", JSON.stringify([...set]))
    }catch{}
  }
  const handleShare=async()=>{
    const url=typeof window!=="undefined"? window.location.href : ""
    try{
      if(navigator.clipboard) await navigator.clipboard.writeText(url)
      setMsg(`Link copied: ${url}`)
      setTimeout(()=>setMsg(null), 3000)
    }catch{ setMsg(`Share: ${url}`) }
    try{ if((navigator as any).share) (navigator as any).share({title:"Challenge "+id, url})}catch{}
  }
  const submitFlag=async()=>{
    const rl = flagLimiter.check(id)
    if (rl.limited) return setMsg(`Rate limited: try again in ${Math.ceil(rl.resetMs/1000)}s (5/min)`)
    const clean = sanitizeInput(flag, 200).trim()
    if(!clean) return setMsg("Enter flag (aegis{...})")
    if(!/^(flag|aegis)\{[^}]+\}$/i.test(clean)) return setMsg("Invalid flag format. Expected flag{...} or aegis{...}.")
    flagLimiter.record(id)
    setFlagBusy(true)
    try {
      const res = await fetch(`/api/labs/${encodeURIComponent(id)}/flag`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flag: clean }),
      })
      const body = await res.json().catch(() => ({}))
      if (body.correct) {
        setSolved(true)
        setMsg("✅ Correct! Challenge solved — points awarded.")
        try{ localStorage.setItem(`aegis_solved_${id}`,"1")}catch{}
      } else {
        setMsg(`❌ ${body.error || body.message || "Incorrect flag. Try again."}`)
      }
    } catch {
      setMsg("❌ Could not verify flag. Check your connection and try again.")
    } finally {
      setFlagBusy(false)
    }
  }

  return (
    <AppShell withSidebar>
      <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-[1080px]">
        <Link href="/challenges" className="inline-flex items-center gap-1.5 text-[13px] text-[var(--text-2)] hover:text-[var(--text)] mb-4"><ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" /> Back to challenges</Link>

        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <Badge variant="outline" className="rounded-full">{challenge.category}</Badge>
              <Badge variant="secondary">{challenge.difficulty} • {challenge.points} pts</Badge>
              <span className="text-[11px] text-[var(--text-3)]">{challenge.solves.toLocaleString()} solves</span>
            </div>
            <h1 className="text-[22px] font-[700] tracking-[-0.03em]">{challenge.name}</h1>
            {challenge.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {challenge.tags.map(t => (
                  <span key={t} className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-[var(--surface-2)] border border-[var(--border)]">#{t}</span>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant={bookmarked?"default":"secondary"} size="sm" className="min-h-11 h-11 sm:h-8 sm:min-h-0" onClick={toggleBookmark} aria-pressed={bookmarked} aria-label={bookmarked ? "Remove bookmark" : "Bookmark challenge"}><Bookmark className={`w-3.5 h-3.5 mr-1 ${bookmarked?"fill-current":""}`} aria-hidden="true" /> {bookmarked?"Bookmarked":"Bookmark"}</Button>
            <Button variant="secondary" size="sm" className="min-h-11 h-11 sm:h-8 sm:min-h-0" onClick={handleShare} aria-label="Share challenge"><Share2 className="w-3.5 h-3.5 mr-1" aria-hidden="true" /> Share</Button>
            <Button size="sm" className="min-h-11 h-11 sm:h-8 sm:min-h-0" onClick={()=>document.getElementById("flag-input")?.scrollIntoView({behavior:"smooth"})} aria-label="Scroll to flag submission"><Flag className="w-3.5 h-3.5 mr-1" aria-hidden="true" /> Submit flag</Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-[1.7fr_1fr] gap-6">
          <div className="space-y-4">
            <Card>
              <CardContent className="p-5">
                <div className="text-[12px] font-semibold">Submit flag</div>
                <div className="mt-4 flex items-center gap-2">
                  <input id="flag-input" value={flag} onChange={e=>setFlag(e.target.value)} placeholder="aegis{...}" aria-label="Flag input" className="flex-1 h-11 sm:h-8 min-h-[44px] sm:min-h-0 rounded-[8px] border border-[var(--border)] bg-[var(--surface)] px-3 text-[13px] font-mono focus:outline-none focus:ring-2 focus:ring-[var(--accent)]" />
                  <Button size="sm" className="min-h-11 h-11 sm:h-8 sm:min-h-0" onClick={submitFlag} disabled={flagBusy} aria-label="Submit flag">{flagBusy ? "Checking..." : "Submit"}</Button>
                </div>
                {msg && <div role="status" aria-live="polite" className={`mt-2 text-[12px] ${msg.includes("✅")||msg.includes("copied")?"text-emerald-600":"text-red-600"}`}>{msg}</div>}
                <div className="mt-2 text-[11px] text-[var(--text-3)]">Flags are verified server-side. 5 attempts/min.</div>
                {solved && <div className="mt-3 p-3 rounded-[8px] bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 text-[12px] text-emerald-800 dark:text-emerald-300 flex items-center gap-2"><CheckCircle2 className="w-4 h-4" aria-hidden="true" /> Solved!</div>}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-[12px] font-semibold">Challenge info</div>
                <div className="mt-3 space-y-2 text-[12px]">
                  <div className="flex justify-between"><span className="text-[var(--text-2)]">Points</span><span className="font-mono font-medium">{challenge.points}</span></div>
                  <div className="flex justify-between"><span className="text-[var(--text-2)]">Solves</span><span className="font-mono">{challenge.solves.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span className="text-[var(--text-2)]">Difficulty</span><Badge variant="secondary" className="text-[11px]">{challenge.difficulty}</Badge></div>
                  <div className="flex justify-between"><span className="text-[var(--text-2)]">Status</span><span className={`flex items-center gap-1 ${solved?"text-emerald-600":"text-amber-600"}`}>{solved? <><CheckCircle2 className="w-3 h-3" aria-hidden="true" /> Solved</> : <><Clock className="w-3 h-3" aria-hidden="true" /> Not solved</>}</span></div>
                </div>
                <Link href="/events"><Button variant="secondary" size="sm" className="w-full mt-3 min-h-11 h-11 sm:h-7 sm:min-h-0 text-[12px]">View scoreboard</Button></Link>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="text-[12px] font-semibold flex items-center gap-2"><Trophy className="w-3.5 h-3.5" aria-hidden="true" /> Recent solves</div>
                <div className="mt-3 p-3 rounded-[8px] border border-dashed border-[var(--border)] text-center">
                  <div className="text-[12px] text-[var(--text-2)]">No solves yet — be the first.</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
