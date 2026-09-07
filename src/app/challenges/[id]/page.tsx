"use client"
import Link from "next/link"
import * as React from "react"
import { use } from "react"
import { notFound } from "next/navigation"
import { AppShell } from "@/components/layout/app-shell"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Trophy, Clock, Users, Flag, Bookmark, Share2, AlertTriangle, CheckCircle2, Terminal, Code2, Download } from "lucide-react"
import { sanitizeInput } from "@/lib/sanitize"
import { challenges } from "@/lib/data"

export default function ChallengeDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  // Validate id against known challenges; if strict, call notFound
  const challenge = React.useMemo(() => challenges.find(c => c.id === id), [id])
  // Keep page working for demo ids like heap101 fallback; only notFound if clearly invalid and not demo
  const isDemoId = id === "heap101" || id.startsWith("ch-")
  if (!challenge && !isDemoId && id.length < 2) {
    notFound()
  }
  const [bookmarked, setBookmarked] = React.useState(false)
  const [flag, setFlag] = React.useState("")
  const [msg, setMsg] = React.useState<string|null>(null)
  const [msgOk, setMsgOk] = React.useState<boolean|null>(null)
  const [submitting, setSubmitting] = React.useState(false)
  const [solved, setSolved] = React.useState(false)
  React.useEffect(()=>{
    try{
      const raw=localStorage.getItem("aegis_bookmarks")
      if(raw){ const s=new Set(JSON.parse(raw)); setBookmarked((s as Set<string>).has(id)) }
      const sol=localStorage.getItem(`aegis_solved_${id}`)
      if(sol==="1") setSolved(true)
    }catch{}
  },[id])
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
      // No alert - use inline feedback via msg
      setMsg(`Link copied: ${url}`)
      setTimeout(()=>setMsg(null), 3000)
    }catch{ setMsg(`Share: ${url}`) }
    try{ if((navigator as any).share) (navigator as any).share({title:"Challenge "+id, url})}catch{}
  }
  const handleDownload=(name:string)=>{
    const blob=new Blob([`mock file for ${name} — challenge ${id}\n`],{type:"text/plain"})
    const url=URL.createObjectURL(blob)
    const a=document.createElement("a"); a.href=url; a.download=name; document.body.appendChild(a); a.click(); a.remove()
    // revoke after delay so download completes
    setTimeout(()=> URL.revokeObjectURL(url), 1000)
  }
  const submitFlag=async()=>{
    const clean = sanitizeInput(flag, 200).trim()
    if(!clean) { setMsgOk(false); setMsg("Enter flag (format: flag{...} or aegis{...})") ; return }
    if (submitting) return
    setSubmitting(true)
    setMsg(null)
    // Real server-side verification — POST /api/challenges/[id]/flag checks
    // the flag against the scrypt flag_hash in the DB. The client no longer
    // decides what is "correct" (the old regex accepted ANY flag{...} text).
    try {
      const res = await fetch(`/api/challenges/${id}/flag`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flag: clean }),
      })
      const data = (await res.json().catch(() => null)) as
        | { correct?: boolean; message?: string; error?: string; progressSaved?: boolean; retryAfterMs?: number }
        | null
      if (res.status === 429) {
        setMsgOk(false)
        setMsg(`Rate limited — try again in ${Math.ceil((data?.retryAfterMs ?? 60000) / 1000)}s.`)
      } else if (data?.correct) {
        setMsgOk(true)
        setSolved(true)
        setMsg(`✅ Correct! Challenge solved.${data.progressSaved ? " Progress saved to your account." : ""}`)
        try{ localStorage.setItem(`aegis_solved_${id}`,"1") }catch{}
      } else {
        setMsgOk(false)
        setMsg(`❌ ${data?.message || data?.error || "Incorrect flag. Try again."}`)
      }
    } catch {
      setMsgOk(false)
      setMsg("Network error — could not verify the flag.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AppShell withSidebar>
      <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-[1080px]">
        <Link href="/challenges" className="inline-flex items-center gap-1.5 text-[13px] text-[var(--text-2)] hover:text-[var(--text)] mb-4"><ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" /> Back to challenges</Link>

        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <Badge variant="outline" className="rounded-full">{challenge?.category || "Web"}</Badge>
              <Badge variant="secondary">{challenge?.difficulty || "Medium"} • {challenge?.points || 250} pts</Badge>
              <span className="text-[11px] text-[var(--text-3)] flex items-center gap-1"><Users className="w-3 h-3" aria-hidden="true" />{challenge?.solves || 892} solves</span>
              <span className="text-[11px] text-[var(--text-3)] flex items-center gap-1"><Clock className="w-3 h-3" aria-hidden="true" />Avg 24 min</span>
            </div>
            <h1 className="text-[22px] font-[700] tracking-[-0.03em]">{challenge?.name || "Heap Overflow 101"}</h1>
            <p className="mt-1 text-[13.5px] text-[var(--text-2)]">Exploit a classic heap overflow in a 64-bit binary. Bypass tcache mitigations in glibc 2.39. Flag in <code className="px-1 py-0.5 rounded bg-[var(--surface-2)] border border-[var(--border)] font-mono text-[11px]">/flag.txt</code></p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-[var(--surface-2)] border border-[var(--border)]">#heap</span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-[var(--surface-2)] border border-[var(--border)]">#pwn</span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-[var(--surface-2)] border border-[var(--border)]">#glibc2.39</span>
            </div>
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
                <div className="text-[12px] font-semibold flex items-center gap-2"><Code2 className="w-3.5 h-3.5" aria-hidden="true" /> Provided files</div>
                <div className="mt-3 grid sm:grid-cols-2 gap-2">
                  <button onClick={()=>handleDownload("heap101")} aria-label="Download heap101 binary" className="p-3 rounded-[10px] border border-[var(--border)] hover:bg-[var(--surface-2)] flex items-center gap-3 transition-colors text-left w-full min-h-11">
                    <div className="w-8 h-8 rounded-[8px] bg-[#0F1012] text-zinc-300 flex items-center justify-center font-mono text-[11px] border border-zinc-800" aria-hidden="true">ELF</div>
                    <div><div className="text-[12.5px] font-medium">heap101</div><div className="text-[11px] text-[var(--text-3)]">64-bit • 18 KB • SHA256: a3f...</div></div>
                    <Download className="w-3.5 h-3.5 ml-auto text-[var(--text-3)]" aria-hidden="true" />
                  </button>
                  <button onClick={()=>handleDownload("heap101.c")} aria-label="Download heap101.c source" className="p-3 rounded-[10px] border border-[var(--border)] hover:bg-[var(--surface-2)] flex items-center gap-3 transition-colors text-left w-full min-h-11">
                    <div className="w-8 h-8 rounded-[8px] bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center" aria-hidden="true"><Terminal className="w-4 h-4 text-[var(--text-2)]" aria-hidden="true" /></div>
                    <div><div className="text-[12.5px] font-medium">heap101.c</div><div className="text-[11px] text-[var(--text-3)]">Source • 89 lines</div></div>
                    <Download className="w-3.5 h-3.5 ml-auto text-[var(--text-3)]" aria-hidden="true" />
                  </button>
                </div>
                <div className="mt-4 rounded-[10px] bg-[#0F1012] border border-zinc-800 p-3 font-mono text-[12px] leading-5 text-zinc-300 overflow-auto" aria-hidden="true">
                  <div className="text-zinc-500">$ checksec heap101</div>
                  <div>Arch: amd64 • RELRO: Full • Canary: Yes • NX: Yes • PIE: Yes</div>
                  <div className="text-zinc-500 mt-2">$ nc challenges.aegis.lab 9001</div>
                  <div className="text-amber-300">Welcome to Heap 101 — try to get the flag!</div>
                  <div>{'> '} <span className="w-2 h-4 bg-zinc-500 inline-block animate-pulse align-middle" /></div>
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <input id="flag-input" value={flag} onChange={e=>setFlag(e.target.value)} placeholder="aegis{...}" aria-label="Flag input" className="flex-1 h-11 sm:h-8 min-h-[44px] sm:min-h-0 rounded-[8px] border border-[var(--border)] bg-[var(--surface)] px-3 text-[13px] font-mono focus:outline-none focus:ring-2 focus:ring-[var(--accent)]" />
                  <Button size="sm" className="min-h-11 h-11 sm:h-8 sm:min-h-0" onClick={submitFlag} disabled={submitting} aria-label="Submit flag">{submitting ? "Verifying..." : "Submit"}</Button>
                </div>
                {msg && <div role="status" aria-live="polite" className={`mt-2 text-[12px] ${msgOk===true||msg.includes("copied")?"text-emerald-600":msgOk===false?"text-red-600":"text-[var(--text-2)]"}`}>{msg}</div>}
                <div className="mt-2 text-[11px] text-[var(--text-3)]">Server validates flag server-side. 5 attempts/min. Instances are per-user and isolated.</div>
                {solved && <div className="mt-3 p-3 rounded-[8px] bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 text-[12px] text-emerald-800 dark:text-emerald-300 flex items-center gap-2"><CheckCircle2 className="w-4 h-4" aria-hidden="true" /> Solved — writeup unlocked!</div>}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <div className="text-[12px] font-semibold">Writeup & discussion</div>
                <div className="mt-3 p-3 rounded-[10px] bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900">
                  <div className="text-[12px] font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-1"><AlertTriangle className="w-3 h-3" aria-hidden="true" /> Competition mode</div>
                  <div className="text-[11px] text-amber-700 dark:text-amber-400 mt-1">Writeups are hidden until you solve or the competition ends. Discuss in team channel instead.</div>
                </div>
                <div className="mt-4 space-y-3">
                  <div className="flex gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center text-[11px] font-semibold" aria-hidden="true">AM</div>
                    <div className="flex-1 p-2.5 rounded-[10px] border border-[var(--border)] bg-[var(--surface-2)]">
                      <div className="text-[12px] font-medium">Any hint on tcache poisoning without double free?</div>
                      <div className="text-[11px] text-[var(--text-3)]">Alex • 2h ago • 4 replies</div>
                    </div>
                  </div>
                </div>
                <Button variant="secondary" size="sm" className="mt-3 min-h-11 h-11 sm:h-7 sm:min-h-0" onClick={()=> setMsg("Discussion: writeups hidden until solved. Join team channel or ask in community.")} aria-label="Open discussion">Open discussion</Button>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-[12px] font-semibold">Challenge info</div>
                <div className="mt-3 space-y-2 text-[12px]">
                  <div className="flex justify-between"><span className="text-[var(--text-2)]">Points</span><span className="font-mono font-medium">{challenge?.points || 250}</span></div>
                  <div className="flex justify-between"><span className="text-[var(--text-2)]">Solves</span><span className="font-mono">{challenge?.solves || 892}</span></div>
                  <div className="flex justify-between"><span className="text-[var(--text-2)]">Difficulty</span><Badge variant="secondary" className="text-[11px]">{challenge?.difficulty || "Medium"}</Badge></div>
                  <div className="flex justify-between"><span className="text-[var(--text-2)]">Author</span><span className="font-medium">marcusreid</span></div>
                  <div className="flex justify-between"><span className="text-[var(--text-2)]">Status</span><span className={`flex items-center gap-1 ${solved?"text-emerald-600":"text-amber-600"}`}>{solved? <><CheckCircle2 className="w-3 h-3" aria-hidden="true" /> Solved</> : <><Clock className="w-3 h-3" aria-hidden="true" /> Not solved</>}</span></div>
                </div>
                <Link href="/events"><Button variant="secondary" size="sm" className="w-full mt-3 min-h-11 h-11 sm:h-7 sm:min-h-0 text-[12px]">View scoreboard</Button></Link>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="text-[12px] font-semibold flex items-center gap-2"><Trophy className="w-3.5 h-3.5" aria-hidden="true" /> Recent solves</div>
                <div className="mt-3 space-y-2">
                  {[
                    { user: "sophiachen", time: "4 min ago" },
                    { user: "priya_n", time: "12 min ago" },
                    { user: "elenav", time: "28 min ago" },
                  ].map(r => (
                    <div key={r.user} className="flex items-center justify-between text-[12px]">
                      <span className="flex items-center gap-2"><span className="w-6 h-6 rounded-full bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center text-[10px] font-semibold" aria-hidden="true">{r.user.slice(0,2).toUpperCase()}</span>{r.user}</span>
                      <span className="text-[11px] text-[var(--text-3)]">{r.time}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-dashed bg-[var(--surface-2)]">
              <CardContent className="p-4 text-center">
                <div className="text-[12px] font-semibold flex items-center justify-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" /> Solve to unlock</div>
                <div className="text-[11px] text-[var(--text-2)] mt-1">Writeup, flag format, and author notes after solving.</div>
                <Button size="sm" variant="secondary" className="mt-3 min-h-11 h-11 sm:h-7 sm:min-h-0" onClick={()=> setMsg(solved ? "Writeup: tcache poisoning via UAF — see research section" : "Solve first to unlock writeup.")} aria-label={solved ? "View writeup" : "Writeup locked"}>{solved ? "View writeup" : "Locked"}</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
