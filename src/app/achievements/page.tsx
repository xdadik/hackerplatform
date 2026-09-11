import Link from "next/link"
import { AppShell } from "@/components/layout/app-shell"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Award } from "lucide-react"

export default function AchievementsPage() {
  return (
    <AppShell withSidebar>
      <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-[1080px]">
        <h1 className="text-[22px] font-[650] tracking-[-0.03em]">Achievements</h1>
        <p className="mt-1 text-[13.5px] text-[var(--text-2)]">Verifiable accomplishments from labs, challenges, research, and competitions.</p>
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
      </div>
    </AppShell>
  )
}
