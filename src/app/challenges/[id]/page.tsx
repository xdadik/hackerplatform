"use client"
import Link from "next/link"
import * as React from "react"
import { AppShell } from "@/components/layout/app-shell"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Trophy, Clock, Users, Flag, Bookmark, Share2, AlertTriangle, CheckCircle2, Terminal, Code2, Download } from "lucide-react"
import { sanitizeInput } from "@/lib/sanitize"
import { flagLimiter } from "@/lib/rate-limit"

export default function ChallengeDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = (React as any).use(params) as { id: string }
  const [bookmarked, setBookmarked] = React.useState(false)
  const [flag, setFlag] = React.useState("")
  const [msg, setMsg] = React.useState<string|null>(null)
  const [solved, setSolved] = React.useState(false)
  React.useEffect(()=>{
    try{
      const raw=localStorage.getItem("aegis_bookmarks")
      if(raw){ const s=new Set(JSON.parse(raw)); setBookmarked(s.has(id)) }
      const sol=localStorage.getItem(`aegis_solved_${id}`)
      if(sol==="1") setSolved(true)
    }catch{}
  },[id])
  const toggleBookmark=()=>{
    const next=!bookmarked
    setBookmarked(next)
    try{
      const raw=localStorage.getItem("aegis_bookmarks")
      const set=new Set(raw?JSON.parse(raw):[])
      if(next) (set as Set<string>).add(id); else (set as Set<string>).delete(id)
      localStorage.setItem("aegis_bookmarks", JSON.stringify([...set]))
    }catch{}
  }
  const handleShare=async()=>{
    const url=typeof window!=="undefined"? window.location.href : ""
    try{
      if(navigator.clipboard) await navigator.clipboard.writeText(url)
      alert("Link copied to clipboard: "+url)
    }catch{ alert("Share: "+url) }
    try{ if((navigator as any).share) (navigator as any).share({title:"Challenge "+id, url})}catch{}
  }
  const handleDownload=(name:string)=>{
    const blob=new Blob([`mock file for ${name} — challenge ${id}\n`],{type:"text/plain"})
    const url=URL.createObjectURL(blob)
    const a=document.createElement("a"); a.href=url; a.download=name; a.click(); URL.revokeObjectURL(url)
  }
  const submitFlag=()=>{
    const rl = flagLimiter.check(id)
    if (rl.limited) return setMsg(`Rate limited: try again in ${Math.ceil(rl.resetMs/1000)}s (5/min)`)
    const clean = sanitizeInput(flag, 200).trim()
    if(!clean) return setMsg("Enter flag (aegis{...})")
    flagLimiter.record(id)
    const ok=/^aegis\{.+\}$/i.test(clean) || /^flag\{.+\}$/i.test(clean)
    if(ok){ setSolved(true); setMsg("✅ Correct! Challenge solved — points awarded (mock). Saved to localStorage."); try{ localStorage.setItem(`aegis_solved_${id}`,"1")}catch{} }
    else setMsg("❌ Incorrect flag. Try again. 5 attempts/min (mock).")
  }

  return (
    <AppShell withSidebar>
      <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-[1080px]">
        <Link href="/challenges" className="inline-flex items-center gap-1.5 text-[13px] text-[var(--text-2)] hover:text-[var(--text)] mb-4"><ArrowLeft className="w-3.5 h-3.5" /> Back to challenges</Link>

        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="rounded-full">Web</Badge>
              <Badge variant="secondary">Medium • 250 pts</Badge>
              <span className="text-[11px] text-[var(--text-3)] flex items-center gap-1"><Users className="w-3 h-3" />892 solves</span>
              <span className="text-[11px] text-[var(--text-3)] flex items-center gap-1"><Clock className="w-3 h-3" />Avg 24 min</span>
            </div>
            <h1 className="text-[22px] font-[700] tracking-[-0.03em]">Heap Overflow 101</h1>
            <p className="mt-1 text-[13.5px] text-[var(--text-2)]">Exploit a classic heap overflow in a 64-bit binary. Bypass tcache mitigations in glibc 2.39. Flag in <code className="px-1 py-0.5 rounded bg-[var(--surface-2)] border border-[var(--border)] font-mono text-[11px]">/flag.txt</code></p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-[var(--surface-2)] border border-[var(--border)]">#heap</span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-[var(--surface-2)] border border-[var(--border)]">#pwn</span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-[var(--surface-2)] border border-[var(--border)]">#glibc2.39</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant={bookmarked?"default":"secondary"} size="sm" className="h-8" onClick={toggleBookmark}><Bookmark className={`w-3.5 h-3.5 mr-1 ${bookmarked?"fill-current":""}`} /> {bookmarked?"Bookmarked":"Bookmark"}</Button>
            <Button variant="secondary" size="sm" className="h-8" onClick={handleShare}><Share2 className="w-3.5 h-3.5 mr-1" /> Share</Button>
            <Button size="sm" className="h-8" onClick={()=>document.getElementById("flag-input")?.scrollIntoView({behavior:"smooth"})}><Flag className="w-3.5 h-3.5 mr-1" /> Submit flag</Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-[1.7fr_1fr] gap-6">
          <div className="space-y-4">
            <Card>
              <CardContent className="p-5">
                <div className="text-[12px] font-semibold flex items-center gap-2"><Code2 className="w-3.5 h-3.5" /> Provided files</div>
                <div className="mt-3 grid sm:grid-cols-2 gap-2">
                  <button onClick={()=>handleDownload("heap101")} className="p-3 rounded-[10px] border border-[var(--border)] hover:bg-[var(--surface-2)] flex items-center gap-3 transition-colors text-left w-full">
                    <div className="w-8 h-8 rounded-[8px] bg-[#0F1012] text-zinc-300 flex items-center justify-center font-mono text-[11px] border border-zinc-800">ELF</div>
                    <div><div className="text-[12.5px] font-medium">heap101</div><div className="text-[11px] text-[var(--text-3)]">64-bit • 18 KB • SHA256: a3f...</div></div>
                    <Download className="w-3.5 h-3.5 ml-auto text-[var(--text-3)]" />
                  </button>
                  <button onClick={()=>handleDownload("heap101.c")} className="p-3 rounded-[10px] border border-[var(--border)] hover:bg-[var(--surface-2)] flex items-center gap-3 transition-colors text-left w-full">
                    <div className="w-8 h-8 rounded-[8px] bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center"><Terminal className="w-4 h-4 text-[var(--text-2)]" /></div>
                    <div><div className="text-[12.5px] font-medium">heap101.c</div><div className="text-[11px] text-[var(--text-3)]">Source • 89 lines</div></div>
                    <Download className="w-3.5 h-3.5 ml-auto text-[var(--text-3)]" />
                  </button>
                </div>
                <div className="mt-4 rounded-[10px] bg-[#0F1012] border border-zinc-800 p-3 font-mono text-[12px] leading-5 text-zinc-300 overflow-auto">
                  <div className="text-zinc-500">$ checksec heap101</div>
                  <div>Arch: amd64 • RELRO: Full • Canary: Yes • NX: Yes • PIE: Yes</div>
                  <div className="text-zinc-500 mt-2">$ nc challenges.aegis.lab 9001</div>
                  <div className="text-amber-300">Welcome to Heap 101 — try to get the flag!</div>
                  <div>{'> '} <span className="w-2 h-4 bg-zinc-500 inline-block animate-pulse align-middle" /></div>
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <input id="flag-input" value={flag} onChange={e=>setFlag(e.target.value)} placeholder="aegis{...}" className="flex-1 h-8 rounded-[8px] border border-[var(--border)] bg-[var(--surface)] px-3 text-[13px] font-mono focus:outline-none focus:ring-2 focus:ring-[var(--accent)]" />
                  <Button size="sm" className="h-8" onClick={submitFlag}>Submit</Button>
                </div>
                {msg && <div className={`mt-2 text-[12px] ${msg.includes("✅")?"text-emerald-600":"text-red-600"}`}>{msg}</div>}
                <div className="mt-2 text-[11px] text-[var(--text-3)]">Server validates flag server-side. 5 attempts/min. Instances are per-user and isolated.</div>
                {solved && <div className="mt-3 p-3 rounded-[8px] bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 text-[12px] text-emerald-800 dark:text-emerald-300 flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Solved — writeup unlocked!</div>}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <div className="text-[12px] font-semibold">Writeup & discussion</div>
                <div className="mt-3 p-3 rounded-[10px] bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900">
                  <div className="text-[12px] font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Competition mode</div>
                  <div className="text-[11px] text-amber-700 dark:text-amber-400 mt-1">Writeups are hidden until you solve or the competition ends. Discuss in team channel instead.</div>
                </div>
                <div className="mt-4 space-y-3">
                  <div className="flex gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center text-[11px] font-semibold">AM</div>
                    <div className="flex-1 p-2.5 rounded-[10px] border border-[var(--border)] bg-[var(--surface-2)]">
                      <div className="text-[12px] font-medium">Any hint on tcache poisoning without double free?</div>
                      <div className="text-[11px] text-[var(--text-3)]">Alex • 2h ago • 4 replies</div>
                    </div>
                  </div>
                </div>
                <Button variant="secondary" size="sm" className="mt-3 h-7" onClick={()=>alert("Discussion: writeups hidden until solved. Join team channel or ask in community.")}>Open discussion</Button>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-[12px] font-semibold">Challenge info</div>
                <div className="mt-3 space-y-2 text-[12px]">
                  <div className="flex justify-between"><span className="text-[var(--text-2)]">Points</span><span className="font-mono font-medium">250</span></div>
                  <div className="flex justify-between"><span className="text-[var(--text-2)]">Solves</span><span className="font-mono">892</span></div>
                  <div className="flex justify-between"><span className="text-[var(--text-2)]">Difficulty</span><Badge variant="secondary" className="text-[11px]">Medium</Badge></div>
                  <div className="flex justify-between"><span className="text-[var(--text-2)]">Author</span><span className="font-medium">marcusreid</span></div>
                  <div className="flex justify-between"><span className="text-[var(--text-2)]">Status</span><span className={`flex items-center gap-1 ${solved?"text-emerald-600":"text-amber-600"}`}>{solved? <><CheckCircle2 className="w-3 h-3" /> Solved</> : <><Clock className="w-3 h-3" /> Not solved</>}</span></div>
                </div>
                <Link href="/events"><Button variant="secondary" size="sm" className="w-full mt-3 h-7 text-[12px]">View scoreboard</Button></Link>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="text-[12px] font-semibold flex items-center gap-2"><Trophy className="w-3.5 h-3.5" /> Recent solves</div>
                <div className="mt-3 space-y-2">
                  {[
                    { user: "sophiachen", time: "4 min ago" },
                    { user: "priya_n", time: "12 min ago" },
                    { user: "elenav", time: "28 min ago" },
                  ].map(r => (
                    <div key={r.user} className="flex items-center justify-between text-[12px]">
                      <span className="flex items-center gap-2"><span className="w-6 h-6 rounded-full bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center text-[10px] font-semibold">{r.user.slice(0,2).toUpperCase()}</span>{r.user}</span>
                      <span className="text-[11px] text-[var(--text-3)]">{r.time}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-dashed bg-[var(--surface-2)]">
              <CardContent className="p-4 text-center">
                <div className="text-[12px] font-semibold flex items-center justify-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Solve to unlock</div>
                <div className="text-[11px] text-[var(--text-2)] mt-1">Writeup, flag format, and author notes after solving.</div>
                <Button size="sm" variant="secondary" className="mt-3 h-7" onClick={()=> solved ? alert("Writeup: tcache poisoning via UAF — see research section") : alert("Solve first to unlock writeup.")}>{solved ? "View writeup" : "Locked"}</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
