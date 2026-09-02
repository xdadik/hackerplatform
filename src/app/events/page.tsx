import { AppShell } from "@/components/layout/app-shell"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Trophy, Clock } from "lucide-react"

export default function EventsPage() {
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
                <Button className="rounded-[8px]">Open scoreboard</Button>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="text-[13px] font-[600] flex items-center gap-2"><Calendar className="w-4 h-4" /> Upcoming: SOC Simulation — Feb 22</div>
              <div className="text-[12px] text-[var(--text-2)] mt-1">Live detection engineering workshop • 14:00 CET • 12 seats left</div>
              <Button variant="secondary" size="sm" className="mt-3 h-7">Reserve seat</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  )
}
