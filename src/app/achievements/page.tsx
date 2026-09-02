import Link from "next/link"
import { AppShell } from "@/components/layout/app-shell"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Award } from "lucide-react"

export default function AchievementsPage() {
  return (
    <AppShell withSidebar>
      <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-[1080px]">
        <h1 className="text-[22px] font-[650] tracking-[-0.03em]">Achievements</h1>
        <p className="mt-1 text-[13.5px] text-[var(--text-2)]">Verifiable accomplishments from labs, challenges, research, and competitions.</p>
        {[
            { title: "SQL Injection Master", desc: "Completed all Web SQL labs", date: "Jan 2026", rarity: "Rare" },
            { title: "First Blood — Auth Bypass", desc: "First solver for Auth Bypass challenge", date: "Dec 2025", rarity: "Epic" },
            { title: "Research Staff Pick", desc: "Featured publication: IAM Trust Policies", date: "Jan 2026", rarity: "Epic" },
            { title: "100 Labs Completed", desc: "Sustained practice across all domains", date: "Nov 2025", rarity: "Legendary" },
            { title: "7-Day Streak", desc: "Consistent daily practice", date: "Jan 2026", rarity: "Common" },
            { title: "Team Player", desc: "Contributed to 3 team competitions", date: "Dec 2025", rarity: "Rare" },
          ].length === 0 ? (
          <Card className="mt-6 border-dashed rounded-[12px] bg-[var(--surface-2)]">
            <CardContent className="p-6 text-center">
              <div className="w-10 h-10 rounded-full bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center mx-auto">
                <Award className="w-5 h-5 text-[var(--text-2)]" />
              </div>
              <div className="mt-3 text-[14px] font-[600] tracking-[-0.01em]">No achievements yet</div>
              <div className="mt-1 text-[12px] leading-5 text-[var(--text-2)] max-w-[320px] mx-auto">Complete labs and challenges to earn verifiable achievements. Your progress will appear here.</div>
              <Link href="/labs"><Button size="sm" className="mt-4 h-8 rounded-[8px] bg-[var(--text)] text-[var(--background)] hover:bg-zinc-800 dark:hover:bg-zinc-200">Browse labs</Button></Link>
            </CardContent>
          </Card>
        ) : (
          <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
            { title: "SQL Injection Master", desc: "Completed all Web SQL labs", date: "Jan 2026", rarity: "Rare" },
            { title: "First Blood — Auth Bypass", desc: "First solver for Auth Bypass challenge", date: "Dec 2025", rarity: "Epic" },
            { title: "Research Staff Pick", desc: "Featured publication: IAM Trust Policies", date: "Jan 2026", rarity: "Epic" },
            { title: "100 Labs Completed", desc: "Sustained practice across all domains", date: "Nov 2025", rarity: "Legendary" },
            { title: "7-Day Streak", desc: "Consistent daily practice", date: "Jan 2026", rarity: "Common" },
            { title: "Team Player", desc: "Contributed to 3 team competitions", date: "Dec 2025", rarity: "Rare" },
            ].map(a => (
              <Card key={a.title} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="w-9 h-9 rounded-[9px] bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 flex items-center justify-center">🏆</div>
                    <Badge variant={a.rarity==="Epic" ? "accent" : a.rarity==="Legendary" ? "default" : "secondary"} className="text-[11px]">{a.rarity}</Badge>
                  </div>
                  <div className="mt-3 text-[13px] font-[600]">{a.title}</div>
                  <div className="text-[12px] text-[var(--text-2)]">{a.desc}</div>
                  <div className="mt-3 text-[11px] text-[var(--text-3)]">{a.date} • Verified</div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}
