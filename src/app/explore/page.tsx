import Link from "next/link"
import { AppShell } from "@/components/layout/app-shell"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, BookOpen, FlaskConical, Trophy, FileText, Users, TrendingUp } from "lucide-react"

export default function ExplorePage() {
  return (
    <AppShell withSidebar>
      <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-[1080px]">
        <h1 className="text-[22px] font-[650] tracking-[-0.03em]">Explore</h1>
        <p className="mt-1 text-[13.5px] text-[var(--text-2)]">Search across courses, labs, challenges, research, users, teams, and events — one index, fast results.</p>

        <div className="mt-6 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-3)]" />
          <Input placeholder="Search labs, challenges, research, people... (⌘K)" className="pl-10 h-11 text-[14px] bg-[var(--surface)] border-[var(--border)] rounded-[10px]" autoFocus />
        </div>

        <div className="mt-2 flex items-center gap-2 text-[11px] text-[var(--text-3)]">
          <span>Recent:</span>
          <button className="px-2 py-1 rounded-full border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-2)]">sql injection</button>
          <button className="px-2 py-1 rounded-full border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-2)]">iam trust policy</button>
          <button className="px-2 py-1 rounded-full border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-2)]">volatility</button>
        </div>

        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <ExploreCard icon={FlaskConical} title="Labs" count="124" desc="Web, Linux, AD, Cloud, Forensics" href="/labs" trending="SQL Injection Fundamentals" />
          <ExploreCard icon={Trophy} title="Challenges" count="1,204" desc="11 categories • CTF-style" href="/challenges" trending="Auth Bypass" />
          <ExploreCard icon={BookOpen} title="Academy" count="10" desc="Paths • 180+ lessons" href="/learn" trending="Web Security" />
          <ExploreCard icon={FileText} title="Research" count="342" desc="Writeups & vulnerability analysis" href="/research" trending="IAM Trust Policies" />
          <ExploreCard icon={Users} title="Teams" count="89" desc="Collaborate & compete" href="/teams" trending="Red Team — Atlas" />
          <ExploreCard icon={TrendingUp} title="Leaderboard" count="—" desc="Global • Labs • Challenges" href="/leaderboard" trending="Top: sophiachen" />
        </div>

        <Card className="mt-8">
          <CardContent className="p-5">
            <div className="text-[12px] font-semibold">Popular this week</div>
            <div className="mt-3 grid sm:grid-cols-3 gap-3 text-[13px]">
              <Link href="/labs" className="p-3 rounded-[10px] border border-[var(--border)] hover:bg-[var(--surface-2)] transition-colors">
                <div className="font-[600]">Active Directory Enumeration</div><div className="text-[11px] text-[var(--text-3)]">Lab • Advanced • 5432 participants</div>
              </Link>
              <Link href="/challenges" className="p-3 rounded-[10px] border border-[var(--border)] hover:bg-[var(--surface-2)] transition-colors">
                <div className="font-[600]">Heap Overflow 101</div><div className="text-[11px] text-[var(--text-3)]">Challenge • Pwn • 892 solves</div>
              </Link>
              <Link href="/research" className="p-3 rounded-[10px] border border-[var(--border)] hover:bg-[var(--surface-2)] transition-colors">
                <div className="font-[600]">KQL for Entra ID Token Replay</div><div className="text-[11px] text-[var(--text-3)]">Research • Blue Team • 1.1k views</div>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}

function ExploreCard({ icon: Icon, title, count, desc, href, trending }: { icon: any, title: string, count: string, desc: string, href: string, trending: string }) {
  return (
    <Card className="hover:shadow-md hover:-translate-y-[1px] transition-all group">
      <CardContent className="p-5">
        <div className="w-9 h-9 rounded-[9px] bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center group-hover:bg-[var(--text)] group-hover:text-[var(--background)] transition-colors">
          <Icon className="w-4 h-4" />
        </div>
        <div className="mt-3 flex items-baseline justify-between">
          <span className="text-[14px] font-[600]">{title}</span>
          <span className="text-[11px] font-mono text-[var(--text-3)]">{count}</span>
        </div>
        <div className="text-[12px] text-[var(--text-2)]">{desc}</div>
        <div className="mt-3 text-[11px] text-[var(--text-3)]">Trending: <span className="text-[var(--text)] font-[500]">{trending}</span></div>
        <Link href={href} className="mt-4 inline-flex text-[12px] font-medium text-[var(--accent)] hover:underline">Explore {title.toLowerCase()} →</Link>
      </CardContent>
    </Card>
  )
}
