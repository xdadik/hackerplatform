import Link from "next/link"
import { AppShell } from "@/components/layout/app-shell"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { learningPaths } from "@/lib/data"
import { Stagger, FadeIn, ProgressAnimated } from "@/components/ui/stagger"
import { Search, GraduationCap, ChevronRight, Filter } from "lucide-react"

export default function LearnPage() {
  return (
    <AppShell withSidebar>
      <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-[1080px]">
        <FadeIn>
          <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
            <div>
              <h1 className="text-[22px] font-[650] tracking-[-0.03em]">Academy</h1>
              <p className="mt-1 text-[13.5px] text-[var(--text-2)] max-w-[600px]">Structured progression with prerequisites, estimates, and hands-on assessments. Pick up where you left off — or start a new path.</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-3)]" />
                <Input placeholder="Search courses, lessons..." className="pl-8 h-8 w-[220px] sm:w-[260px] bg-[var(--surface)]" />
              </div>
              <Button variant="secondary" size="sm" className="h-8"><Filter className="w-3.5 h-3.5 mr-1" /> Filters</Button>
            </div>
          </div>
        </FadeIn>

        {/* Paths grid */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[14px] font-[650] tracking-[-0.02em]">Courses</h2>
          <span className="text-[12px] text-[var(--text-3)]">{learningPaths.length} courses</span>
        </div>

        <Stagger className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {learningPaths.map(path => (
            <div key={path.id} className="stagger-item"><Card className="group hover:shadow-md hover:-translate-y-[1px] transition-all">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="w-9 h-9 rounded-[9px] border border-[var(--border)] flex items-center justify-center bg-[var(--surface-2)] group-hover:bg-[var(--text)] group-hover:text-[var(--background)] transition-colors">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <Badge variant={path.id === "cybersecurity-101" ? "success" : path.progress === 0 ? "outline" : path.progress > 50 ? "accent" : "secondary"}>
                    {path.id === "cybersecurity-101" ? "Free" : path.progress > 0 ? `${path.progress}%` : "Not started"}
                  </Badge>
                </div>
                <div className="text-[14px] font-[600] tracking-[-0.015em]">{path.name}</div>
                <div className="mt-1 text-[12px] text-[var(--text-2)]">{path.lessons} lessons • {path.duration} • {path.level}</div>
                <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-[var(--surface-3)]"><ProgressAnimated value={path.progress} /></div>
                <div className="mt-2 flex items-center justify-between text-[11px]">
                  <span className="text-[var(--text-3)]">{path.progress === 0 ? "Prerequisites: None" : path.progress === 100 ? "Completed" : `Next: ${learningPaths[0].name}`}</span>
                  <span className="font-mono text-[var(--text-3)]">{path.progress}%</span>
                </div>
                <Link href={`/learn/${path.id}`} className="mt-4 inline-flex items-center gap-1 text-[13px] font-medium text-[var(--text)] group-hover:gap-1.5 transition-all">
                  {path.progress > 0 ? "Continue" : "Start path"} <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </CardContent>
            </Card></div>
          ))}
        </Stagger>

        {/* Skill progression */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[14px] font-[650]">Skill progression</h3>
              <Link href="/skills" className="text-[12px] font-medium text-[var(--accent)] hover:underline">View skill map →</Link>
            </div>
            <div className="grid sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {[
                { skill: "Web Security", level: "Intermediate", next: "Advanced", pct: 72 },
                { skill: "Linux", level: "Intermediate", next: "Advanced", pct: 68 },
                { skill: "Networking", level: "Beginner", next: "Intermediate", pct: 45 },
                { skill: "Cloud", level: "Beginner", next: "Intermediate", pct: 22 },
                { skill: "Reverse Eng.", level: "Beginner", next: "Intermediate", pct: 12 },
              ].map(s => (
                <div key={s.skill} className="rounded-[10px] border border-[var(--border)] bg-[var(--surface-2)] p-3">
                  <div className="text-[11px] font-semibold tracking-widest uppercase text-[var(--text-3)]">{s.skill}</div>
                  <div className="mt-1 text-[12px] font-[600]">{s.level} → {s.next}</div>
                  <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-[var(--surface-3)]"><ProgressAnimated value={s.pct} /></div>
                  <div className="mt-1 text-[11px] font-mono text-[var(--text-3)]">{s.pct}%</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
