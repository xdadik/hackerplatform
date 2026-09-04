"use client"
import Link from "next/link"
import * as React from "react"
import { AppShell } from "@/components/layout/app-shell"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar } from "lucide-react"

export default function EventsPage() {
  const [scoreboardOpen, setScoreboardOpen] = React.useState(false)
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
                  <Badge variant="accent" className="mb-2">No live competition</Badge>
                  <div className="text-[16px] font-[650]">Live event will appear here when started</div>
                  <div className="mt-1 text-[13px] text-[var(--text-2)]">Admin creates events in control panel — scoreboard updates live.</div>
                </div>
                <div className="flex gap-2">
                  <Link href="/leaderboard"><Button className="rounded-[8px]">Open scoreboard</Button></Link>
                  <Button variant="secondary" size="sm" className="h-11 sm:h-8 min-h-[44px] sm:min-h-0" onClick={()=>setScoreboardOpen(v=>!v)}>{scoreboardOpen ? "Hide" : "Preview"}</Button>
                </div>
              </div>
              {scoreboardOpen && (
                <div className="mt-4 rounded-[10px] border border-[var(--border)] bg-[var(--surface)] p-3">
                  <div className="text-[12px] font-semibold mb-2">Live scoreboard</div>
                  <div className="py-6 text-center text-[13px] text-[var(--text-3)]">No scores yet — join a competition to appear on the board.</div>
                  <Link href="/challenges" className="mt-3 inline-flex text-[12px] font-medium text-[var(--accent)] hover:underline">Go to challenges →</Link>
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="text-[13px] font-[600] flex items-center gap-2"><Calendar className="w-4 h-4" /> Upcoming events</div>
              <div className="text-[12px] text-[var(--text-2)] mt-1">New workshops and competitions will be listed here when scheduled by admin.</div>
              <div className="mt-3 text-[12px] text-[var(--text-3)]">Check back soon — or follow updates in dashboard.</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  )
}
