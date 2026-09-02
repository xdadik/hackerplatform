import { AppShell } from "@/components/layout/app-shell"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { learningPaths } from "@/lib/data"
import Link from "next/link"
import { GraduationCap } from "lucide-react"

export default function PathsPage() {
  return (
    <AppShell withSidebar>
      <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-[1080px]">
        <h1 className="text-[22px] font-[650] tracking-[-0.03em]">Learning Paths</h1>
        <p className="mt-1 text-[13.5px] text-[var(--text-2)]">Ten domains from Networking to Security Engineering. Each with prerequisites, levels, and hands-on assessments.</p>
        <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {learningPaths.map(p => (
            <Card key={p.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="w-9 h-9 rounded-[9px] bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center mb-3"><GraduationCap className="w-4 h-4" /></div>
                <div className="text-[14px] font-[600]">{p.name}</div>
                <div className="text-[12px] text-[var(--text-2)]">{p.lessons} lessons • {p.duration} • {p.level}</div>
                <Progress value={p.progress} className="mt-4 h-1.5" />
                <div className="mt-2 flex justify-between text-[11px] text-[var(--text-3)]"><span>{p.progress===0?"Not started":"In progress"}</span><span className="font-mono">{p.progress}%</span></div>
                <Link href="/learn" className="mt-4 inline-flex text-[12px] font-medium text-[var(--accent)] hover:underline">View path →</Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  )
}
