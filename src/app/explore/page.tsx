"use client"
import Link from "next/link"
import * as React from "react"
import { AppShell } from "@/components/layout/app-shell"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Search, BookOpen, FlaskConical, Trophy, FileText, Users, TrendingUp, X } from "lucide-react"

export default function ExplorePage() {
  const [q,setQ]=React.useState("")
  const recent=["sql injection","iam trust policy","volatility"]
  const applyRecent=(term:string)=> setQ(term)
  const clear=()=> setQ("")
  return (
    <AppShell withSidebar>
      <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-[1080px]">
        <h1 className="text-[22px] font-[650] tracking-[-0.03em]">Explore</h1>
        <p className="mt-1 text-[13.5px] text-[var(--text-2)]">Search across courses, labs, challenges, research, users, teams, and events — one index, fast results.</p>

        <div className="mt-6 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-3)]" />
          <Input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search labs, challenges, research, people... (⌘K)" className="pl-10 h-11 text-[14px] bg-[var(--surface)] border-[var(--border)] rounded-[10px]" autoFocus />
          {q && <button onClick={clear} className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-[8px] hover:bg-[var(--surface-2)] text-[var(--text-3)]"><X className="w-4 h-4" /></button>}
        </div>

        <div className="mt-2 flex items-center gap-2 text-[11px] text-[var(--text-3)]">
          <span>Recent:</span>
          {recent.map(r=>(
            <button key={r} onClick={()=>applyRecent(r)} className={`px-2 py-1 rounded-full border ${q===r ? "bg-[var(--text)] text-[var(--background)] border-[var(--text)]" : "border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-2)]"}`}>{r}</button>
          ))}
          {q && <button onClick={clear} className="ml-2 text-[11px] text-[var(--accent)] hover:underline">Clear</button>}
        </div>
        {q && (
          <div className="mt-3 text-[12px] text-[var(--text-2)]">Search for <b className="text-[var(--text)]">&quot;{q}&quot;</b> — <Link href={`/labs?q=${encodeURIComponent(q)}`} className="text-[var(--accent)] hover:underline">Labs</Link> • <Link href={`/challenges?q=${encodeURIComponent(q)}`} className="text-[var(--accent)] hover:underline">Challenges</Link> • <Link href={`/research?q=${encodeURIComponent(q)}`} className="text-[var(--accent)] hover:underline">Research</Link></div>
        )}

        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <ExploreCard icon={FlaskConical} title="Labs" count="—" desc="Web, Linux, AD, Cloud, Forensics" href="/labs" />
          <ExploreCard icon={Trophy} title="Challenges" count="—" desc="CTF-style" href="/challenges" />
          <ExploreCard icon={BookOpen} title="Academy" count="—" desc="Learning paths" href="/learn" />
          <ExploreCard icon={FileText} title="Research" count="—" desc="Writeups & vulnerability analysis" href="/research" />
          <ExploreCard icon={Users} title="Teams" count="—" desc="Collaborate & compete" href="/teams" />
          <ExploreCard icon={TrendingUp} title="Leaderboard" count="—" desc="Global • Labs • Challenges" href="/leaderboard" />
        </div>

        <Card className="mt-8">
          <CardContent className="p-5">
              <div className="text-[12px] font-semibold">Start exploring</div>
              <div className="mt-3 grid sm:grid-cols-3 gap-3 text-[13px]">
                <Link href="/labs" className="p-3 rounded-[10px] border border-[var(--border)] hover:bg-[var(--surface-2)] transition-colors">
                  <div className="font-[600]">Hands-on labs</div><div className="text-[11px] text-[var(--text-3)]">Practice in isolated environments</div>
                </Link>
                <Link href="/challenges" className="p-3 rounded-[10px] border border-[var(--border)] hover:bg-[var(--surface-2)] transition-colors">
                  <div className="font-[600]">CTF challenges</div><div className="text-[11px] text-[var(--text-3)]">Solve and earn reputation</div>
                </Link>
                <Link href="/research" className="p-3 rounded-[10px] border border-[var(--border)] hover:bg-[var(--surface-2)] transition-colors">
                  <div className="font-[600]">Research library</div><div className="text-[11px] text-[var(--text-3)]">Writeups and analysis</div>
                </Link>
              </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}

function ExploreCard({ icon: Icon, title, count, desc, href, trending }: { icon: any, title: string, count: string, desc: string, href: string, trending?: string }) {
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
        {trending && <div className="mt-3 text-[11px] text-[var(--text-3)]">Trending: <span className="text-[var(--text)] font-[500]">{trending}</span></div>}
        <Link href={href} className="mt-4 inline-flex text-[12px] font-medium text-[var(--accent)] hover:underline">Explore {title.toLowerCase()} →</Link>
      </CardContent>
    </Card>
  )
}
