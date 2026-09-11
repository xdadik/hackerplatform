"use client"
import Link from "next/link"
import * as React from "react"
import { AppShell } from "@/components/layout/app-shell"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Trophy, Clock, Users } from "lucide-react"

type Event = { id: string, title: string, type: string, date: string, status: string, participants: number }

export default function EventsPage() {
  const [events, setEvents] = React.useState<Event[] | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await fetch("/api/events")
        const body = await res.json().catch(() => ({ events: [] }))
        if (!cancelled) { setEvents(body.events ?? []); setLoading(false) }
      } catch {
        if (!cancelled) { setEvents([]); setLoading(false) }
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  const live = events?.find(e => e.status === "Live")

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
                  <Badge variant="accent" className="mb-2">{live ? "Live now" : "No live competition"}</Badge>
                  <div className="text-[16px] font-[650]">{live?.title || "Live event will appear here when started"}</div>
                  <div className="mt-1 text-[13px] text-[var(--text-2)]">{live ? `${live.participants.toLocaleString()} participants • ${live.date}` : "New competitions will be announced here when scheduled."}</div>
                </div>
                <div className="flex gap-2">
                  <Link href="/leaderboard"><Button className="rounded-[8px]">Open scoreboard</Button></Link>
                </div>
              </div>
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
                            <Badge variant={ev.status==="Live" ? "accent" : ev.status==="Upcoming" ? "secondary" : "outline"} className="text-[10px]">{ev.status}</Badge>
                          </div>
                          <div className="text-[12px] text-[var(--text-2)] mt-1 flex flex-wrap gap-2">
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" aria-hidden="true" /> {ev.date}</span>
                            <span className="flex items-center gap-1"><Users className="w-3 h-3" aria-hidden="true" /> {ev.participants.toLocaleString()} participants</span>
                          </div>
                        </div>
                        <Link href="/challenges"><Button size="sm" variant={ev.status==="Live" ? "default" : "secondary"} className="h-8 text-[12px]">Join</Button></Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  <div className="text-[12px] text-[var(--text-2)] mt-1">New workshops and competitions will be listed here when scheduled.</div>
                  <div className="mt-3 text-[12px] text-[var(--text-3)]">Check back soon.</div>
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
