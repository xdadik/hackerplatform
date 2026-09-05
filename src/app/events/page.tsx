"use client"
import Link from "next/link"
import * as React from "react"
import { AppShell } from "@/components/layout/app-shell"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Trophy, Clock, Users } from "lucide-react"

type Event = { id: string, title: string, status: "live" | "upcoming" | "ended", starts: string, ends: string, participants: number, prize?: string }

const mockEvents: Event[] = [
  { id: "winter-ctf-26", title: "Winter CTF 2026", status: "live", starts: "Feb 10, 2026", ends: "Feb 12, 2026", participants: 342, prize: "$5,000" },
  { id: "soc-sim-feb", title: "SOC Simulation — Feb 22", status: "upcoming", starts: "Feb 22, 2026 14:00 UTC", ends: "Feb 22, 2026 18:00 UTC", participants: 89 },
  { id: "spring-ctf", title: "Spring Challenge Sprint", status: "upcoming", starts: "Mar 15, 2026", ends: "Mar 16, 2026", participants: 0 },
]

export default function EventsPage() {
  const [scoreboardOpen, setScoreboardOpen] = React.useState(false)
  const [events, setEvents] = React.useState<Event[] | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    // Simulate API fetch with loading skeleton
    const t = setTimeout(() => {
      setEvents(mockEvents)
      setLoading(false)
    }, 600)
    return () => clearTimeout(t)
  }, [])

  // Live polling comment: in production, poll /api/events every 30s for scoreboard updates
  // React.useEffect(() => {
  //   const id = setInterval(async () => {
  //     const res = await fetch('/api/events', { cache: 'no-store' })
  //     const data = await res.json()
  //     setEvents(data)
  //   }, 30000)
  //   return () => clearInterval(id)
  // }, [])

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
                  <Badge variant="accent" className="mb-2">{events?.find(e=>e.status==="live") ? "Live now" : "No live competition"}</Badge>
                  <div className="text-[16px] font-[650]">{events?.find(e=>e.status==="live")?.title || "Live event will appear here when started"}</div>
                  <div className="mt-1 text-[13px] text-[var(--text-2)]">{events?.find(e=>e.status==="live") ? `${events.find(e=>e.status==="live")!.participants} participants • Ends ${events.find(e=>e.status==="live")!.ends}` : "Admin creates events in control panel — scoreboard updates live."}</div>
                </div>
                <div className="flex gap-2">
                  <Link href="/leaderboard"><Button className="rounded-[8px]">Open scoreboard</Button></Link>
                  <Button variant="secondary" size="sm" className="h-11 sm:h-8 min-h-[44px] sm:min-h-0" onClick={()=>setScoreboardOpen(v=>!v)} aria-expanded={scoreboardOpen} aria-controls="live-scoreboard" aria-label={scoreboardOpen ? "Hide live scoreboard" : "Preview live scoreboard"}>{scoreboardOpen ? "Hide" : "Preview"}</Button>
                </div>
              </div>
              {scoreboardOpen && (
                <div id="live-scoreboard" className="mt-4 rounded-[10px] border border-[var(--border)] bg-[var(--surface)] p-3">
                  <div className="text-[12px] font-semibold mb-2">Live scoreboard</div>
                  <div className="py-6 text-center text-[13px] text-[var(--text-3)]">No scores yet — join a competition to appear on the board.</div>
                  <Link href="/challenges" className="mt-3 inline-flex text-[12px] font-medium text-[var(--accent)] hover:underline">Go to challenges →</Link>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="text-[13px] font-[600] flex items-center gap-2"><Calendar className="w-4 h-4" aria-hidden="true" /> Upcoming events</div>
              {loading ? (
                <div className="mt-3 space-y-3" aria-busy="true" aria-label="Loading events">
                  {[1,2,3].map(i=>(
                    <div key={i} className="p-3 rounded-[10px] border border-[var(--border)] bg-[var(--surface-2)] animate-pulse">
                      <div className="h-4 w-32 bg-[var(--surface-3)] rounded" />
                      <div className="mt-2 h-3 w-48 bg-[var(--surface-3)] rounded" />
                    </div>
                  ))}
                </div>
              ) : events && events.length > 0 ? (
                <div className="mt-3 space-y-3">
                  {events.map(ev=>(
                    <div key={ev.id} className="p-3 rounded-[10px] border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-2)] transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-[13px] font-[600] flex items-center gap-2">
                            {ev.title}
                            <Badge variant={ev.status==="live" ? "accent" : ev.status==="upcoming" ? "secondary" : "outline"} className="text-[10px] capitalize">{ev.status}</Badge>
                            {ev.prize && <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full">{ev.prize}</span>}
                          </div>
                          <div className="text-[12px] text-[var(--text-2)] mt-1 flex flex-wrap gap-2">
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" aria-hidden="true" /> {ev.starts} → {ev.ends}</span>
                            <span className="flex items-center gap-1"><Users className="w-3 h-3" aria-hidden="true" /> {ev.participants} participants</span>
                          </div>
                        </div>
                        <Link href="/challenges"><Button size="sm" variant={ev.status==="live" ? "default" : "secondary"} className="h-8 text-[12px]">Join</Button></Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  <div className="text-[12px] text-[var(--text-2)] mt-1">New workshops and competitions will be listed here when scheduled by admin.</div>
                  <div className="mt-3 text-[12px] text-[var(--text-3)]">Check back soon — or follow updates in dashboard.</div>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="border-dashed bg-[var(--surface-2)]">
            <CardContent className="p-4 flex items-center gap-2 text-[12px] text-[var(--text-2)]">
              <Trophy className="w-4 h-4" aria-hidden="true" /> Seasonal events contribute to global reputation. All scoring is transparent and auditable.
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  )
}
