"use client"
import Link from "next/link"
import * as React from "react"
import { AppShell } from "@/components/layout/app-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { leaderboard } from "@/lib/data"
import { Stagger, FadeIn, CountUp } from "@/components/ui/stagger"
import { Trophy, TrendingUp, Crown } from "lucide-react"

// If leaderboard empty (clean state), show mock fallback for UI
const demoFallback = [
  { rank:1, username:"sophiachen", reputation:12400, labs:80, challenges:120, avatar:"SC" },
  { rank:2, username:"marcusreid", reputation:11000, labs:70, challenges:100, avatar:"MR" },
  { rank:3, username:"alexmorgan", reputation:8841, labs:64, challenges:76, avatar:"AM" },
  { rank:4, username:"priya_n", reputation:8200, labs:60, challenges:70, avatar:"PN" },
  { rank:5, username:"elenav", reputation:7900, labs:58, challenges:68, avatar:"EV" },
]
export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = React.useState("global")
  const [page, setPage] = React.useState(1)
  const data = leaderboard.length>0 ? leaderboard : demoFallback
  const perPage=5
  const totalPages=Math.max(1, Math.ceil(Math.max(0, data.length-3)/perPage))
  const paged=data.filter(r=>r.rank>3).slice((page-1)*perPage, page*perPage)
  const podiumSlots = [
    { rank: 2, user: data[1], height: "pt-8" },
    { rank: 1, user: data[0], height: "pt-4", crown: true },
    { rank: 3, user: data[2], height: "pt-12" },
  ].filter(s => !!s.user)
  return (
    <AppShell withSidebar>
      <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-[1080px]">
        <FadeIn>
          <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
            <div>
              <h1 className="text-[22px] font-[650] tracking-[-0.03em]">Leaderboard</h1>
              <p className="mt-1 text-[13.5px] text-[var(--text-2)]">Global rankings based on reputation — labs, challenges, research, and community contributions.</p>
            </div>
            <Badge variant="secondary" className="rounded-full">Season 2026 • Week 7 • Page {page}/{totalPages}</Badge>
          </div>
        </FadeIn>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="global">Global</TabsTrigger>
            <TabsTrigger value="labs">Labs</TabsTrigger>
            <TabsTrigger value="challenges">Challenges</TabsTrigger>
            <TabsTrigger value="research">Research</TabsTrigger>
            <TabsTrigger value="teams">Teams</TabsTrigger>
          </TabsList>

          <TabsContent value="global">
            {/* Podium */}
            {podiumSlots.length > 0 ? (
            <Stagger className="grid grid-cols-3 gap-2 sm:gap-3 mb-6 mt-4">
              {podiumSlots.map(p => (
                <div key={p.rank} className="stagger-item"><Card className={`${p.rank === 1 ? "border-amber-200 bg-amber-50/50 dark:bg-amber-950/10 dark:border-amber-900" : ""}`}>
                  <CardContent className={`p-2 sm:p-4 text-center ${p.height}`}>
                    {p.crown && <Crown className="w-5 h-5 text-amber-500 mx-auto mb-1" aria-hidden="true" />}
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full mx-auto flex items-center justify-center text-[13px] font-bold border-2 ${p.rank===1 ? "bg-amber-500 text-white border-amber-600" : p.rank===2 ? "bg-zinc-400 text-white border-zinc-500" : "bg-amber-700 text-white border-amber-800"}`} aria-hidden="true">
                      {p.user!.avatar}
                    </div>
                    <Link href={`/profile?user=${p.user!.username}`} className="mt-2 block text-[13px] font-[600] hover:underline hover:text-[var(--accent)]">{p.user!.username}</Link>
                    <div className="text-[11px] text-[var(--text-3)]">Rank #{p.rank}</div>
                    <div className="mt-2 text-[16px] font-[700] tracking-tight"><CountUp value={p.user!.reputation} /></div>
                    <div className="text-[11px] text-[var(--text-3)]">reputation</div>
                    <Badge variant={p.rank===1 ? "default" : "secondary"} className="mt-2 text-[11px]">{p.rank===1 ? "Leader" : p.rank===2 ? "Challenger" : "Contender"}</Badge>
                  </CardContent>
                </Card></div>
              ))}
            </Stagger>
            ) : (
              <Card className="mt-4 mb-6"><CardContent className="p-6 text-center text-[13px] text-[var(--text-2)]">No rankings yet — be the first!</CardContent></Card>
            )}

            <FadeIn>
              <Card>
                <CardHeader className="pb-3 flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2"><Trophy className="w-4 h-4" aria-hidden="true" /> Global rankings</CardTitle>
                  <span className="text-[11px] text-[var(--text-3)]">Updates every 5 minutes • Last: 2 min ago</span>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left" aria-label="Global leaderboard rankings">
                      <caption className="sr-only">Global leaderboard rankings based on reputation, labs and challenges completed</caption>
                      <thead>
                        <tr className="border-y border-[var(--border)] bg-[var(--surface-2)] text-[11px] font-semibold tracking-widest uppercase text-[var(--text-3)]">
                          <th scope="col" className="px-4 py-2.5 font-semibold">Rank</th>
                          <th scope="col" className="px-4 py-2.5 font-semibold">User</th>
                          <th scope="col" className="px-4 py-2.5 font-semibold hidden sm:table-cell">Labs</th>
                          <th scope="col" className="px-4 py-2.5 font-semibold hidden sm:table-cell">Challenges</th>
                          <th scope="col" className="px-4 py-2.5 font-semibold text-right">Reputation</th>
                          <th scope="col" className="px-4 py-2.5 font-semibold text-right">Trend</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border)]">
                        {paged.length===0 ? (
                          <tr><td colSpan={6} className="px-4 py-6 text-center text-[12px] text-[var(--text-2)]">No more rankings — page {page} empty</td></tr>
                        ) : paged.map(row => (
                          <tr key={row.rank} className={`hover:bg-[var(--surface-2)] transition-colors ${row.username === "alexmorgan" ? "bg-[var(--accent-muted)]" : ""}`} aria-current={row.username === "alexmorgan" ? true : undefined}>
                            <td className="px-4 py-3">
                              <span className="inline-flex w-6 h-6 rounded-full items-center justify-center text-[11px] font-bold border bg-[var(--surface-2)] border-[var(--border)] text-[var(--text-2)]" aria-label={`Rank ${row.rank}`}>
                                {row.rank}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <Link href={`/profile?user=${row.username}`} className="flex items-center gap-2.5 hover:opacity-80">
                                <div className="w-7 h-7 rounded-full bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center text-[11px] font-semibold" aria-hidden="true">{row.avatar}</div>
                                <span className="text-[13px] font-[500] hover:text-[var(--accent)] hover:underline">{row.username}</span>
                                {row.username === "alexmorgan" && <Badge variant="accent" className="text-[10px]">You</Badge>}
                              </Link>
                            </td>
                            <td className="px-4 py-3 text-[13px] font-mono hidden sm:table-cell"><CountUp value={row.labs} /></td>
                            <td className="px-4 py-3 text-[13px] font-mono hidden sm:table-cell"><CountUp value={row.challenges} /></td>
                            <td className="px-4 py-3 text-[13px] font-mono font-[600] text-right"><CountUp value={row.reputation} /></td>
                            <td className="px-4 py-3 text-right">
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--text-3)]" aria-label="No change">
                                <span className="w-3 h-3" aria-hidden="true" /> —
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="px-4 py-3 border-t border-[var(--border)] flex items-center justify-between text-[12px]">
                    <span className="text-[var(--text-3)]">Page {page} of {totalPages} • {data.length} total</span>
                    <div className="flex gap-1">
                      <Button variant="secondary" size="sm" className="h-9 sm:h-7 min-h-[36px] sm:min-h-0" aria-label="Previous page" disabled={page<=1} onClick={()=>setPage(p=>Math.max(1,p-1))}>Previous</Button>
                      <Button variant="secondary" size="sm" className="h-9 sm:h-7 min-h-[36px] sm:min-h-0" aria-label="Next page" disabled={page>=totalPages} onClick={()=>setPage(p=>Math.min(totalPages,p+1))}>Next</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </FadeIn>
          </TabsContent>

          <TabsContent value="labs">
            <Card className="border-dashed rounded-[12px] bg-[var(--surface-2)]">
              <CardContent className="p-6 text-center">
                <div className="w-10 h-10 rounded-full bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center mx-auto" aria-hidden="true">
                  <Trophy className="w-5 h-5 text-[var(--text-2)]" aria-hidden="true" />
                </div>
                <div className="mt-3 text-[14px] font-[600] tracking-[-0.01em]">Labs leaderboard — coming soon</div>
                <div className="mt-1 text-[12px] leading-5 text-[var(--text-2)] max-w-[360px] mx-auto">Track fastest solves and completion quality across all labs. Rankings update as you complete objectives.</div>
                <Button asChild size="sm" className="mt-4 h-11 sm:h-8 min-h-[44px] sm:min-h-0 rounded-[8px] bg-[var(--text)] text-[var(--background)] hover:bg-zinc-800 dark:hover:bg-zinc-200"><Link href="/labs">Browse labs</Link></Button>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="challenges">
            <Card className="border-dashed rounded-[12px] bg-[var(--surface-2)]">
              <CardContent className="p-6 text-center">
                <div className="w-10 h-10 rounded-full bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center mx-auto" aria-hidden="true">
                  <Trophy className="w-5 h-5 text-[var(--text-2)]" aria-hidden="true" />
                </div>
                <div className="mt-3 text-[14px] font-[600] tracking-[-0.01em]">Challenge leaderboard — coming soon</div>
                <div className="mt-1 text-[12px] leading-5 text-[var(--text-2)] max-w-[360px] mx-auto">Points, solve time, and first-blood bonuses. Compete globally and climb the ranks.</div>
                <Button asChild size="sm" className="mt-4 h-11 sm:h-8 min-h-[44px] sm:min-h-0 rounded-[8px] bg-[var(--text)] text-[var(--background)] hover:bg-zinc-800 dark:hover:bg-zinc-200"><Link href="/challenges">Browse challenges</Link></Button>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="research">
            <Card className="border-dashed rounded-[12px] bg-[var(--surface-2)]">
              <CardContent className="p-6 text-center">
                <div className="w-10 h-10 rounded-full bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center mx-auto" aria-hidden="true">
                  <Crown className="w-5 h-5 text-[var(--text-2)]" aria-hidden="true" />
                </div>
                <div className="mt-3 text-[14px] font-[600] tracking-[-0.01em]">Research leaderboard — coming soon</div>
                <div className="mt-1 text-[12px] leading-5 text-[var(--text-2)] max-w-[360px] mx-auto">Bookmarks, citations, and review quality. Share verifiable research to earn reputation.</div>
                <Button asChild size="sm" className="mt-4 h-11 sm:h-8 min-h-[44px] sm:min-h-0 rounded-[8px] bg-[var(--text)] text-[var(--background)] hover:bg-zinc-800 dark:hover:bg-zinc-200"><Link href="/research">Explore research</Link></Button>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="teams">
            <Card className="border-dashed rounded-[12px] bg-[var(--surface-2)]">
              <CardContent className="p-6 text-center">
                <div className="w-10 h-10 rounded-full bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center mx-auto" aria-hidden="true">
                  <TrendingUp className="w-5 h-5 text-[var(--text-2)]" aria-hidden="true" />
                </div>
                <div className="mt-3 text-[14px] font-[600] tracking-[-0.01em]">Team rankings — coming soon</div>
                <div className="mt-1 text-[12px] leading-5 text-[var(--text-2)] max-w-[360px] mx-auto">Aggregated reputation and competition performance. Form a team to compete together.</div>
                <Button asChild size="sm" className="mt-4 h-11 sm:h-8 min-h-[44px] sm:min-h-0 rounded-[8px] bg-[var(--text)] text-[var(--background)] hover:bg-zinc-800 dark:hover:bg-zinc-200"><Link href="/teams">View teams</Link></Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  )
}
