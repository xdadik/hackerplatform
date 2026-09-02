import Link from "next/link"
import { AppShell } from "@/components/layout/app-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { leaderboard } from "@/lib/data"
import { Stagger, FadeIn, CountUp } from "@/components/ui/stagger"
import { Trophy, TrendingUp, Crown } from "lucide-react"

export default function LeaderboardPage() {
  return (
    <AppShell withSidebar>
      <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-[1080px]">
        <FadeIn>
          <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
            <div>
              <h1 className="text-[22px] font-[650] tracking-[-0.03em]">Leaderboard</h1>
              <p className="mt-1 text-[13.5px] text-[var(--text-2)]">Global rankings based on reputation — labs, challenges, research, and community contributions.</p>
            </div>
            <Badge variant="secondary" className="rounded-full">Season 2026 • Week 7</Badge>
          </div>
        </FadeIn>

        <Tabs defaultValue="global">
          <TabsList>
            <TabsTrigger value="global">Global</TabsTrigger>
            <TabsTrigger value="labs">Labs</TabsTrigger>
            <TabsTrigger value="challenges">Challenges</TabsTrigger>
            <TabsTrigger value="research">Research</TabsTrigger>
            <TabsTrigger value="teams">Teams</TabsTrigger>
          </TabsList>

          <TabsContent value="global">
            {/* Podium */}
            <Stagger className="grid grid-cols-3 gap-3 mb-6 mt-4">
              {[
                { rank: 2, user: leaderboard[1], height: "pt-8" },
                { rank: 1, user: leaderboard[0], height: "pt-4", crown: true },
                { rank: 3, user: leaderboard[2], height: "pt-12" },
              ].map(p => (
                <div key={p.rank} className="stagger-item"><Card className={`${p.rank === 1 ? "border-amber-200 bg-amber-50/50 dark:bg-amber-950/10 dark:border-amber-900" : ""}`}>
                  <CardContent className={`p-4 text-center ${p.height}`}>
                    {p.crown && <Crown className="w-5 h-5 text-amber-500 mx-auto mb-1" aria-hidden="true" />}
                    <div className={`w-12 h-12 rounded-full mx-auto flex items-center justify-center text-[13px] font-bold border-2 ${p.rank===1 ? "bg-amber-500 text-white border-amber-600" : p.rank===2 ? "bg-zinc-400 text-white border-zinc-500" : "bg-amber-700 text-white border-amber-800"}`} aria-hidden="true">
                      {p.user.avatar}
                    </div>
                    <div className="mt-2 text-[13px] font-[600]">{p.user.username}</div>
                    <div className="text-[11px] text-[var(--text-3)]">Rank #{p.rank}</div>
                    <div className="mt-2 text-[16px] font-[700] tracking-tight"><CountUp value={p.user.reputation} /></div>
                    <div className="text-[11px] text-[var(--text-3)]">reputation</div>
                    <Badge variant={p.rank===1 ? "default" : "secondary"} className="mt-2 text-[11px]">{p.rank===1 ? "Leader" : p.rank===2 ? "Challenger" : "Contender"}</Badge>
                  </CardContent>
                </Card></div>
              ))}
            </Stagger>

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
                        {leaderboard.map(row => (
                          <tr key={row.rank} className={`hover:bg-[var(--surface-2)] transition-colors ${row.username === "alexmorgan" ? "bg-[var(--accent-muted)]" : ""}`} aria-current={row.username === "alexmorgan" ? "true" : undefined}>
                            <td className="px-4 py-3">
                              <span className={`inline-flex w-6 h-6 rounded-full items-center justify-center text-[11px] font-bold border ${row.rank <=3 ? "bg-[var(--text)] text-[var(--background)] border-[var(--text)]" : "bg-[var(--surface-2)] border-[var(--border)] text-[var(--text-2)]"}`} aria-label={`Rank ${row.rank}`}>
                                {row.rank}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-full bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center text-[11px] font-semibold" aria-hidden="true">{row.avatar}</div>
                                <span className="text-[13px] font-[500]">{row.username}</span>
                                {row.username === "alexmorgan" && <Badge variant="accent" className="text-[10px]">You</Badge>}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-[13px] font-mono hidden sm:table-cell"><CountUp value={row.labs} /></td>
                            <td className="px-4 py-3 text-[13px] font-mono hidden sm:table-cell"><CountUp value={row.challenges} /></td>
                            <td className="px-4 py-3 text-[13px] font-mono font-[600] text-right"><CountUp value={row.reputation} /></td>
                            <td className="px-4 py-3 text-right">
                              <span className={`inline-flex items-center gap-1 text-[11px] font-medium ${row.rank %2===0 ? "text-emerald-600" : "text-[var(--text-3)]"}`} aria-label={row.rank %2===0 ? `Up ${row.rank*2} positions` : "No change"}>
                                {row.rank %2===0 ? <TrendingUp className="w-3 h-3" aria-hidden="true" /> : <span className="w-3 h-3" aria-hidden="true" />} {row.rank %2===0 ? `+${row.rank*2}` : "—"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="px-4 py-3 border-t border-[var(--border)] flex items-center justify-between text-[12px]">
                    <span className="text-[var(--text-3)]">You are ranked #3 globally • Top 0.2%</span>
                    <div className="flex gap-1">
                      <Button variant="secondary" size="sm" className="h-7" aria-label="Previous page">Previous</Button>
                      <Button variant="secondary" size="sm" className="h-7" aria-label="Next page">Next</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </FadeIn>
          </TabsContent>

          <TabsContent value="labs">
            <Card className="border-dashed rounded-[12px] bg-[var(--surface-2)]">
              <CardContent className="p-6 text-center">
                <div className="w-10 h-10 rounded-full bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center mx-auto">
                  <Trophy className="w-5 h-5 text-[var(--text-2)]" />
                </div>
                <div className="mt-3 text-[14px] font-[600] tracking-[-0.01em]">Labs leaderboard — coming soon</div>
                <div className="mt-1 text-[12px] leading-5 text-[var(--text-2)] max-w-[360px] mx-auto">Track fastest solves and completion quality across all labs. Rankings update as you complete objectives.</div>
                <Link href="/labs"><Button size="sm" className="mt-4 h-8 rounded-[8px] bg-[var(--text)] text-[var(--background)] hover:bg-zinc-800 dark:hover:bg-zinc-200">Browse labs</Button></Link>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="challenges">
            <Card className="border-dashed rounded-[12px] bg-[var(--surface-2)]">
              <CardContent className="p-6 text-center">
                <div className="w-10 h-10 rounded-full bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center mx-auto">
                  <Trophy className="w-5 h-5 text-[var(--text-2)]" />
                </div>
                <div className="mt-3 text-[14px] font-[600] tracking-[-0.01em]">Challenge leaderboard — coming soon</div>
                <div className="mt-1 text-[12px] leading-5 text-[var(--text-2)] max-w-[360px] mx-auto">Points, solve time, and first-blood bonuses. Compete globally and climb the ranks.</div>
                <Link href="/challenges"><Button size="sm" className="mt-4 h-8 rounded-[8px] bg-[var(--text)] text-[var(--background)] hover:bg-zinc-800 dark:hover:bg-zinc-200">Browse challenges</Button></Link>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="research">
            <Card className="border-dashed rounded-[12px] bg-[var(--surface-2)]">
              <CardContent className="p-6 text-center">
                <div className="w-10 h-10 rounded-full bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center mx-auto">
                  <Crown className="w-5 h-5 text-[var(--text-2)]" />
                </div>
                <div className="mt-3 text-[14px] font-[600] tracking-[-0.01em]">Research leaderboard — coming soon</div>
                <div className="mt-1 text-[12px] leading-5 text-[var(--text-2)] max-w-[360px] mx-auto">Bookmarks, citations, and review quality. Share verifiable research to earn reputation.</div>
                <Link href="/research"><Button size="sm" className="mt-4 h-8 rounded-[8px] bg-[var(--text)] text-[var(--background)] hover:bg-zinc-800 dark:hover:bg-zinc-200">Explore research</Button></Link>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="teams">
            <Card className="border-dashed rounded-[12px] bg-[var(--surface-2)]">
              <CardContent className="p-6 text-center">
                <div className="w-10 h-10 rounded-full bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center mx-auto">
                  <TrendingUp className="w-5 h-5 text-[var(--text-2)]" />
                </div>
                <div className="mt-3 text-[14px] font-[600] tracking-[-0.01em]">Team rankings — coming soon</div>
                <div className="mt-1 text-[12px] leading-5 text-[var(--text-2)] max-w-[360px] mx-auto">Aggregated reputation and competition performance. Form a team to compete together.</div>
                <Link href="/teams"><Button size="sm" className="mt-4 h-8 rounded-[8px] bg-[var(--text)] text-[var(--background)] hover:bg-zinc-800 dark:hover:bg-zinc-200">View teams</Button></Link>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  )
}
