import { AppShell } from "@/components/layout/app-shell"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Bell, CheckCircle2, Award, Users, FileText, Trophy } from "lucide-react"

export default function NotificationsPage() {
  return (
    <AppShell withSidebar>
      <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-[640px]">
        <h1 className="text-[22px] font-[650] tracking-[-0.03em] flex items-center gap-2"><Bell className="w-5 h-5" /> Notifications</h1>
        <p className="mt-1 text-[13.5px] text-[var(--text-2)]">Lab completions, achievements, team activity, and system announcements — no spam.</p>
        <div className="mt-6 space-y-3">
          {[
            { icon: CheckCircle2, title: "Lab completed: Network Traffic Analysis", time: "2 hours ago", desc: "+120 XP • Certificate available" },
            { icon: Award, title: "Achievement unlocked: SQL Injection Master", time: "5 hours ago", desc: "Completed all Web SQL labs" },
            { icon: FileText, title: "Research featured: IAM Trust Policies", time: "Yesterday", desc: "Your publication was featured as Staff Pick" },
            { icon: Users, title: "Team activity: Red Team — Atlas", time: "2 days ago", desc: "Team rank improved to #12 in Winter CTF" },
            { icon: Trophy, title: "Competition: Winter CTF starts in 6 days", time: "3 days ago", desc: "Your team is registered. Prepare your environment." },
          ].map((n, i) => (
            <Card key={i} className={`${i===0 ? "border-[var(--accent-border)] bg-[var(--accent-muted)]" : ""}`}>
              <CardContent className="p-4 flex gap-3">
                <div className="w-8 h-8 rounded-[8px] bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center shrink-0"><n.icon className="w-4 h-4 text-[var(--text-2)]" /></div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-[500]">{n.title}</div>
                  <div className="text-[12px] text-[var(--text-2)]">{n.desc}</div>
                  <div className="text-[11px] text-[var(--text-3)] mt-1">{n.time}</div>
                </div>
                {i===0 && <Badge variant="accent" className="h-fit shrink-0">New</Badge>}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  )
}
