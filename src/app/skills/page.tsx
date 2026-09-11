import { AppShell } from "@/components/layout/app-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

const skills = [
  { name: "Web Security", level: "Not started", pct: 0, next: "Beginner", prereq: "Networking • Linux", related: ["Cloud Security", "Threat Intelligence"] },
  { name: "Networking", level: "Not started", pct: 0, next: "Beginner", prereq: "None", related: ["Linux", "SOC"] },
  { name: "Linux", level: "Not started", pct: 0, next: "Beginner", prereq: "Networking", related: ["Reverse Engineering", "Forensics"] },
  { name: "Cloud Security", level: "Not started", pct: 0, next: "Beginner", prereq: "Networking • Linux", related: ["Web Security", "Active Directory"] },
  { name: "Active Directory", level: "Not started", pct: 0, next: "Beginner", prereq: "Networking • Windows", related: ["Cloud Security"] },
  { name: "Reverse Engineering", level: "Not started", pct: 0, next: "Beginner", prereq: "Linux • Assembly", related: ["Malware Analysis"] },
]

export default function SkillsPage() {
  return (
    <AppShell withSidebar>
      <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-[1080px]">
        <h1 className="text-[22px] font-[650] tracking-[-0.03em]">Skill Progress</h1>
        <p className="mt-1 text-[13.5px] text-[var(--text-2)]">Visualize advancement across domains. Each skill: Beginner → Intermediate → Advanced → Expert. Related skills and prerequisites are explicit.</p>

        <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {skills.map(s => (
            <Card key={s.name} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[14px] font-[600] tracking-[-0.015em]">{s.name}</span>
                  <Badge variant={s.level==="Intermediate" || s.level==="Advanced" ? "accent" : "secondary"} className="text-[11px]">{s.level}</Badge>
                </div>
                <div className="mt-3">
                  <div className="flex items-center justify-between text-[11px] mb-1.5">
                    <span className="text-[var(--text-3)]">Progress to {s.next}</span>
                    <span className="font-mono">{s.pct}%</span>
                  </div>
                  <Progress value={s.pct} className="h-1.5" />
                </div>
                <div className="mt-3 space-y-1 text-[11px] text-[var(--text-3)]">
                  <div><span className="font-medium text-[var(--text-2)]">Prerequisites:</span> {s.prereq}</div>
                  <div><span className="font-medium text-[var(--text-2)]">Related:</span> {s.related.join(" • ")}</div>
                </div>
                <div className="mt-3 flex gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${s.pct>=25 ? "bg-[var(--text)]" : "bg-[var(--surface-3)]"}`} />
                  <span className={`w-2 h-2 rounded-full ${s.pct>=50 ? "bg-[var(--text)]" : "bg-[var(--surface-3)]"}`} />
                  <span className={`w-2 h-2 rounded-full ${s.pct>=75 ? "bg-[var(--text)]" : "bg-[var(--surface-3)]"}`} />
                  <span className={`w-2 h-2 rounded-full ${s.pct>=100 ? "bg-[var(--text)]" : "bg-[var(--surface-3)]"}`} />
                  <span className="ml-1 text-[11px] text-[var(--text-3)]">Beginner → Expert</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mt-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-[14px]">How progression works</CardTitle>
          </CardHeader>
          <CardContent className="text-[13px] leading-6 text-[var(--text-2)]">
            Progress is earned from verifiable activity: lab objectives, challenge solves, research bookmarks/citations, and peer-reviewed contributions. No trivial activity dominates reputation. Each level requires prerequisites and assessed labs.
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
