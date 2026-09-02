"use client"
import Link from "next/link"
import * as React from "react"
import { AppShell } from "@/components/layout/app-shell"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { challenges } from "@/lib/data"
import { Stagger, FadeIn } from "@/components/ui/stagger"
import { Search, Trophy, Filter, Bookmark, ChevronDown, Clock, Users, Award, Lock } from "lucide-react"

const categories = ["All", "Web", "Crypto", "Pwn", "Reverse", "Forensics", "OSINT", "Cloud", "Mobile", "Hardware", "Blue Team", "Misc"]

export default function ChallengesPage() {
  const [isPaid, setIsPaid] = React.useState(false)
  React.useEffect(() => {
    try {
      const rawUser = localStorage.getItem("aegis_user")
      if (rawUser) {
        const u = JSON.parse(rawUser) as { plan?: string }
        setIsPaid(u?.plan === "go" || u?.plan === "plus")
        return
      }
    } catch {}
    const plan = localStorage.getItem("aegis_plan")
    const auth = localStorage.getItem("aegis_auth")
    setIsPaid(!!auth && (plan === "go" || plan === "plus"))
  }, [])

  return (
    <AppShell withSidebar>
      <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-[1280px]">
        {!isPaid && (
          <div className="mb-6 rounded-[12px] border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/20 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-[8px] bg-amber-500 text-white flex items-center justify-center shrink-0"><Lock className="w-4 h-4" /></div>
              <div>
                <div className="text-[13px] font-[600] text-amber-900 dark:text-amber-200">Challenges are for paid members</div>
                <div className="text-[12px] text-amber-800 dark:text-amber-300">Upgrade to unlock all 1,204 challenges. Only premium users can open challenges.</div>
              </div>
            </div>
            <Link href="/settings/billing" className="shrink-0"><Button size="sm" className="h-8 rounded-full bg-amber-500 hover:bg-amber-600 text-white">Upgrade plan</Button></Link>
          </div>
        )}
        <FadeIn>
          <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
            <div>
              <h1 className="text-[22px] font-[650] tracking-[-0.03em]">Challenges</h1>
              <p className="mt-1 text-[13.5px] text-[var(--text-2)]">1,204 challenges across 11 categories. Search, filter, sort, bookmark — clean and fast. {!isPaid && "Locked until upgrade."}</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-3)]" />
                <Input placeholder="Search challenges, tags..." className="pl-8 h-8 w-[220px] sm:w-[260px] bg-[var(--surface)]" />
              </div>
              <Button variant="secondary" size="sm" className="h-8"><Filter className="w-3.5 h-3.5 mr-1" /> Filters</Button>
            </div>
          </div>
        </FadeIn>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Filters sidebar */}
          <div className="lg:w-[220px] shrink-0 space-y-4">
            <Card>
              <CardContent className="p-4 space-y-4">
                <div>
                  <div className="text-[11px] font-semibold tracking-widest uppercase text-[var(--text-3)] mb-2">Category</div>
                  <div className="space-y-1">
                    {categories.map(cat => (
                      <button key={cat} className={`w-full text-left px-2.5 py-1.5 rounded-[7px] text-[13px] flex items-center justify-between ${cat === "All" ? "bg-[var(--text)] text-[var(--background)] font-[500]" : "text-[var(--text-2)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]"}`}>
                        <span>{cat}</span>
                        {cat !== "All" && <span className="text-[11px] font-mono text-[var(--text-3)]">{Math.floor(Math.random()*200)+20}</span>}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="pt-4 border-t border-[var(--border)]">
                  <div className="text-[11px] font-semibold tracking-widest uppercase text-[var(--text-3)] mb-2">Difficulty</div>
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-2 text-[13px]"><input type="checkbox" defaultChecked className="rounded border-[var(--border)]" /> <span>Easy</span> <span className="ml-auto text-[11px] text-[var(--text-3)]">342</span></label>
                    <label className="flex items-center gap-2 text-[13px]"><input type="checkbox" defaultChecked className="rounded" /> <span>Medium</span> <span className="ml-auto text-[11px] text-[var(--text-3)]">521</span></label>
                    <label className="flex items-center gap-2 text-[13px]"><input type="checkbox" className="rounded" /> <span>Hard</span> <span className="ml-auto text-[11px] text-[var(--text-3)]">268</span></label>
                    <label className="flex items-center gap-2 text-[13px]"><input type="checkbox" className="rounded" /> <span>Insane</span> <span className="ml-auto text-[11px] text-[var(--text-3)]">73</span></label>
                  </div>
                </div>
                <div className="pt-4 border-t border-[var(--border)]">
                  <div className="text-[11px] font-semibold tracking-widest uppercase text-[var(--text-3)] mb-2">Status</div>
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-2 text-[13px]"><input type="checkbox" className="rounded" /> Solved</label>
                    <label className="flex items-center gap-2 text-[13px]"><input type="checkbox" className="rounded" /> Attempted</label>
                    <label className="flex items-center gap-2 text-[13px]"><input type="checkbox" defaultChecked className="rounded" /> Not started</label>
                    <label className="flex items-center gap-2 text-[13px]"><input type="checkbox" className="rounded" /> Bookmarked</label>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="text-[12px] font-semibold">Competition</div>
                <div className="mt-2 p-3 rounded-[10px] bg-[var(--surface-2)] border border-[var(--border)]">
                  <div className="text-[12.5px] font-[600]">Winter CTF 2026</div>
                  <div className="text-[11px] text-[var(--text-2)]">Live • Ends in 18h 42m</div>
                  <div className="mt-2 flex items-center gap-2 text-[11px] font-mono">
                    <span className="px-1.5 py-0.5 rounded bg-[var(--text)] text-[var(--background)]">Score: 2,420</span>
                    <span className="text-[var(--text-3)]">Rank #18</span>
                  </div>
                  <Link href="/events"><Button size="sm" variant="secondary" className="w-full mt-3 h-7 text-[12px]">Open scoreboard</Button></Link>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Grid */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-medium">{challenges.length} shown</span>
                <span className="text-[12px] text-[var(--text-3)]">• Sorted by recommended</span>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" className="h-7 text-[12px]">Recommended <ChevronDown className="w-3 h-3 ml-1" /></Button>
                <Button variant="ghost" size="sm" className="h-7 text-[12px] border border-[var(--border)] hidden sm:flex"><Users className="w-3 h-3 mr-1" /> Solo / Team</Button>
              </div>
            </div>

            <Stagger className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {challenges.map(ch => (
                <div key={ch.id} className="stagger-item"><Card className="group hover:shadow-md hover:-translate-y-[0.5px] transition-all">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <Badge variant="outline" className="text-[11px] rounded-full px-2 py-0">{ch.category}</Badge>
                      <button className="p-1 rounded hover:bg-[var(--surface-2)] text-[var(--text-3)] hover:text-[var(--text)]">
                        <Bookmark className={`w-3.5 h-3.5 ${ch.status === "solved" ? "fill-[var(--text)] text-[var(--text)]" : ""}`} />
                      </button>
                    </div>
                    <div className="text-[14px] font-[600] tracking-[-0.015em] leading-tight group-hover:text-[var(--accent)] transition-colors">{ch.name}</div>
                    <div className="mt-1.5 flex items-center gap-2">
                      <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded-full border ${ch.difficulty === "Easy" ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300" : ch.difficulty === "Medium" ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-900" : ch.difficulty === "Hard" ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30" : "bg-zinc-900 text-white border-zinc-800"}`}>{ch.difficulty}</span>
                      <span className="text-[11px] font-mono text-[var(--text-3)]">{ch.points} pts</span>
                      <span className="text-[11px] text-[var(--text-3)]">•</span>
                      <span className="text-[11px] text-[var(--text-3)] flex items-center gap-1"><Users className="w-3 h-3" /> {ch.solves.toLocaleString()}</span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {ch.tags.map(tag => (
                        <span key={tag} className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-2)]">#{tag}</span>
                      ))}
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <Badge variant={ch.status === "solved" ? "success" : ch.status === "attempted" ? "secondary" : "outline"} className="text-[11px]">
                        {ch.status === "solved" ? "✓ Solved" : ch.status === "attempted" ? "Attempted" : "Not started"}
                      </Badge>
                      <span className="text-[11px] text-[var(--text-3)] flex items-center gap-1"><Clock className="w-3 h-3" /> {Math.floor(Math.random()*60)+10} min avg</span>
                    </div>
                  </CardContent>
                </Card></div>
              ))}

              {/* Empty state - professional */}
              <div className="stagger-item"><Card className="border-dashed bg-[var(--surface-2)] rounded-[12px] flex flex-col items-center justify-center p-6 text-center min-h-[188px]">
                <div className="w-10 h-10 rounded-full bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center">
                  <Award className="w-5 h-5 text-[var(--text-2)]" />
                </div>
                <div className="mt-3 text-[14px] font-[600] tracking-[-0.01em] text-[var(--text)]">No challenges match filters</div>
                <div className="mt-1 text-[12px] leading-5 text-[var(--text-2)] max-w-[280px] mx-auto">Try adjusting category or difficulty, or browse recommended challenges.</div>
                <Button size="sm" className="mt-4 h-8 rounded-[8px] bg-[var(--text)] text-[var(--background)] hover:bg-zinc-800 dark:hover:bg-zinc-200">Clear filters</Button>
              </Card></div>
            </Stagger>

            <div className="mt-6 flex items-center justify-between text-[12px] text-[var(--text-3)] border-t border-[var(--border)] pt-4">
              <span>Showing 8 of 1,204 • Page 1 of 151</span>
              <div className="flex gap-1">
                <Button variant="secondary" size="sm" className="h-7 px-3" disabled>Previous</Button>
                <Button variant="secondary" size="sm" className="h-7 px-3">Next</Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
