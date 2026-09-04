"use client"
import Link from "next/link"
import * as React from "react"
import { AppShell } from "@/components/layout/app-shell"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Trophy, Clock, CheckCircle2 } from "lucide-react"

export default function EventsPage() {
  const [reserved, setReserved] = React.useState(false)
  const [scoreboardOpen, setScoreboardOpen] = React.useState(false)
  React.useEffect(()=>{
    try{ setReserved(localStorage.getItem("aegis_event_soc_reserved")==="1") }catch{}
  },[])
  const toggleReserve = () => {
    const next = !reserved
    setReserved(next)
    try{ localStorage.setItem("aegis_event_soc_reserved", next?"1":"0") }catch{}
  }
  return (
    <AppShell withSidebar>
      <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-[1080px]">
        <h1 className="text-[22px] font-[650] tracking-[-0.03em]">Events</h1>
        <p className="mt-1 text-[13.5px] text-[var(--text-2)]">CTFs, team competitions, and seasonal events. Timed, scored, and transparent.</p>
        <div className="mt-6 grid gap-4">
          <Card className="border-[var(--accent-border)] bg-[var(--accent-muted)]">
            <CardContent className="p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <Badge variant="accent" className="mb-2">Live • Winter CTF 2026</Badge>
                  <div className="text-[16px] font-[650]">48-hour team competition • 12 challenges</div>
                  <div className="mt-1 text-[13px] text-[var(--text-2)] flex items-center gap-3"><span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Ends in 18h 42m</span><span className="flex items-center gap-1"><Trophy className="w-3.5 h-3.5" /> Score: 2,420 • Rank #18</span></div>
                </div>
                <div className="flex gap-2">
                  <Link href="/leaderboard"><Button className="rounded-[8px]">Open scoreboard</Button></Link>
                  <Button variant="secondary" size="sm" className="h-8" onClick={()=>setScoreboardOpen(v=>!v)}>{scoreboardOpen ? "Hide" : "Preview"}</Button>
                </div>
              </div>
              {scoreboardOpen && (
                <div className="mt-4 rounded-[10px] border border-[var(--border)] bg-[var(--surface)] p-3">
                  <div className="text-[12px] font-semibold mb-2">Live scoreboard (mock)</div>
                  <div className="space-y-1.5 text-[12px]">
                    {[
                      {team:"Atlas", score:2420, rank:18},
                      {team:"Sentinel", score:3100, rank:4},
                      {team:"Forensics Unit", score:1800, rank:28},
                    ].map(r=>(
                      <div key={r.team} className="flex justify-between p-2 rounded-[8px] bg-[var(--surface-2)] border border-[var(--border)]"><span>{r.team} • Rank #{r.rank}</span><span className="font-mono">{r.score.toLocaleString()}</span></div>
                    ))}
                  </div>
                  <Link href="/challenges" className="mt-3 inline-flex text-[12px] font-medium text-[var(--accent)] hover:underline">Go to challenges →</Link>
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="text-[13px] font-[600] flex items-center gap-2"><Calendar className="w-4 h-4" /> Upcoming: SOC Simulation — Feb 22</div>
              <div className="text-[12px] text-[var(--text-2)] mt-1">Live detection engineering workshop • 14:00 CET • 12 seats left {reserved && <span className="ml-2 inline-flex items-center gap-1 text-emerald-600"><CheckCircle2 className="w-3 h-3" /> Reserved</span>}</div>
              <Button variant={reserved ? "default" : "secondary"} size="sm" className="mt-3 h-7" onClick={toggleReserve}>{reserved ? "✓ Reserved — Cancel?" : "Reserve seat"}</Button>
              {reserved && <div className="mt-2 text-[11px] text-[var(--text-3)]">Saved to localStorage (aegis_event_soc_reserved). You&apos;ll get a reminder.</div>}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  )
}
