"use client"
import Link from "next/link"
import * as React from "react"
import { AppShell } from "@/components/layout/app-shell"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { labs, challenges, skillProgress } from "@/lib/data"
import { Stagger, FadeIn, CountUp, ProgressAnimated } from "@/components/ui/stagger"
import { Clock, Target, Trophy, FlaskConical, BookOpen, Zap, ArrowRight, CheckCircle2, Play, Calendar, Award, TrendingUp, Wrench, Shield, ExternalLink } from "lucide-react"
import { useAuth } from "@/components/auth-provider"

export default function DashboardPage() {
  const { user } = useAuth()
  const displayName = user?.name || "Notva Laka"
  const firstName = displayName.trim().split(/\s+/)[0] || "Notva"
  const [real] = React.useState(() => {
    if (typeof window === "undefined") return { pct: 0, completed: 0, total: 32, hasActivity: false }
    try {
      const raw = localStorage.getItem("aegis_progress")
      if (raw) {
        const p = JSON.parse(raw)
        return { pct: p.pct ?? 0, completed: p.completed ?? 0, total: p.total ?? 32, hasActivity: (p.completed ?? 0) > 0 }
      }
    } catch {}
    return { pct: 0, completed: 0, total: 32, hasActivity: false }
  })

  return (
    <AppShell withSidebar>
      <div className="w-full max-w-[1280px] px-4 sm:px-6 lg:px-6 py-6 sm:py-8">
        {/* Header */}
        <FadeIn>
          <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
            <div>
              <h1 className="text-[22px] font-[650] tracking-[-0.03em]">Good morning, {firstName}</h1>
              <p className="mt-1 text-[13.5px] text-[var(--text-2)]">Here&apos;s what&apos;s happening with your training today.</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="rounded-full gap-1.5 px-3 py-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Streak: 12 days
              </Badge>
              <Link href="/learn"><Button size="sm" className="rounded-[8px]">Continue</Button></Link>
            </div>
          </div>
        </FadeIn>

        {/* Quick actions bar — left-aligned with Good morning title */}
        <FadeIn delay={60}>
          <Card className="mb-6">
            <CardContent className="p-3 sm:p-3.5 flex flex-wrap items-center justify-start gap-2">
              <span className="text-[11px] font-semibold tracking-widest uppercase text-[var(--text-3)] mr-1 hidden sm:inline shrink-0">Quick actions</span>
              <span className="hidden sm:block h-4 w-px bg-[var(--border)] mr-1 shrink-0" />
              <Link href="/labs">
                <Button variant="secondary" size="sm" className="h-7 rounded-full gap-1.5 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800">
                  <FlaskConical className="w-3.5 h-3.5" /> Labs
                </Button>
              </Link>
              <Link href="/challenges">
                <Button variant="secondary" size="sm" className="h-7 rounded-full gap-1.5 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800">
                  <Trophy className="w-3.5 h-3.5" /> Challenges
                </Button>
              </Link>
              <Link href="/tools">
                <Button variant="secondary" size="sm" className="h-7 rounded-full gap-1.5 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800">
                  <Wrench className="w-3.5 h-3.5" /> Tools
                </Button>
              </Link>
              <Link href="/learn">
                <Button variant="secondary" size="sm" className="h-7 rounded-full gap-1.5 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800">
                  <BookOpen className="w-3.5 h-3.5" /> Academy
                </Button>
              </Link>
              <Link href="/research">
                <Button variant="secondary" size="sm" className="h-7 rounded-full gap-1.5 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800">
                  <BookOpen className="w-3.5 h-3.5" /> Research
                </Button>
              </Link>
              <span className="ml-auto hidden lg:inline text-[11px] text-[var(--text-3)] shrink-0">Jump to where you left off • <Link href="/labs/sql-injection" className="font-medium text-[var(--text-2)] hover:text-[var(--text)] underline decoration-[var(--border-strong)] underline-offset-4">SQL Injection Lab</Link></span>
            </CardContent>
          </Card>
        </FadeIn>

        {/* Stats - animated with anime.js stagger + count-up */}
        <Stagger className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
          <div className="stagger-item"><Stat label="XP" value={1240} sub="+120 this week" /></div>
          <div className="stagger-item"><Stat label="Reputation" value={8841} sub="Reputation Rank #3 • Top 1%" /></div>
          <div className="stagger-item"><Stat label="Labs completed" value={24} sub="6 in progress" /></div>
          <div className="stagger-item"><Stat label="Challenges solved" value={76} sub="12 this month" /></div>
          <div className="stagger-item"><Stat label="Global rank" value={247} sub="↑ 12 positions • Global" prefix="#" /></div>
        </Stagger>

        <div className="grid lg:grid-cols-[1.7fr_1fr] gap-6">
          {/* Left */}
          <div className="space-y-6">
            {/* Continue learning */}
            <FadeIn delay={80}>
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-4">
                    <CardTitle className="flex items-center gap-2 leading-none"><BookOpen className="w-4 h-4 text-[var(--text-3)]" /> Continue your learning</CardTitle>
                    <Link href="/learn" className="inline-flex items-center text-[12px] font-medium text-[var(--accent)] hover:underline leading-none self-center gap-1">View all <ArrowRight className="w-3 h-3" /></Link>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-[10px] border border-[var(--border)] p-4 bg-[var(--surface-2)]">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex gap-3 min-w-0 flex-1">
                        <div className="w-10 h-10 rounded-[9px] bg-[#7C3AED] text-white flex items-center justify-center shrink-0">
                          <BookOpen className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-[13.5px] font-[600] tracking-[-0.015em]">Web Application Security</div>
                          <div className="text-[12px] text-[var(--text-2)]">Intermediate • 32 lessons • 28h estimated</div>
                          <div className="mt-2 flex items-center gap-2">
                            <div className="flex-1 max-w-[180px] w-full h-1.5 overflow-hidden rounded-full bg-[var(--surface-3)] shrink-0">
                              <ProgressAnimated value={real.pct} />
                            </div>
                            <span className="text-[11px] font-mono text-[var(--text-3)] font-medium tabular-nums"><CountUp value={real.pct} />%</span>
                            <span className="text-[11px] text-[var(--text-3)]">• {real.completed}/{real.total} lessons</span>
                            {!real.hasActivity && <span className="text-[11px] text-amber-600">• No lessons yet</span>}
                          </div>
                        </div>
                      </div>
                      <Link href="/learn/web-security"><Button size="sm" className="shrink-0 rounded-[8px] bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 border border-zinc-900 dark:border-zinc-700">Continue <ArrowRight className="w-3.5 h-3.5 ml-1" /></Button></Link>
                    </div>
                  </div>

                  <div>
                    <div className="text-[12px] font-semibold tracking-wide text-[var(--text-2)] mb-2">Recommended next step</div>
                    <div className="rounded-[10px] border border-[var(--border)] bg-[var(--surface)] p-4 flex items-start gap-3">
                      <div className="w-9 h-9 rounded-[8px] bg-zinc-800 text-white flex items-center justify-center shrink-0">
                        <FlaskConical className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-[600]">Linux Privilege Escalation</div>
                        <div className="text-[12px] text-[var(--text-2)]">Enumerate and exploit misconfigurations — 90 min • 7 objectives • Not started</div>
                        <div className="mt-2 flex items-center gap-2">
                          <Badge variant="secondary" className="text-[11px] bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700">Lab</Badge>
                          <span className="text-[11px] text-[var(--text-3)]">Not started • 90 min • Next in path</span>
                        </div>
                      </div>
                      <Link href="/labs/lab-2"><Button size="sm" variant="secondary" className="shrink-0 rounded-[8px] bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200">Start <ArrowRight className="w-3.5 h-3.5 ml-1" /></Button></Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </FadeIn>

            {/* Labs in progress */}
            <FadeIn delay={100}>
              <Card>
                <CardHeader className="pb-3 flex-row items-center justify-between space-y-0">
                  <CardTitle className="flex items-center gap-2"><FlaskConical className="w-4 h-4 text-[var(--text-3)]" /> Labs in progress</CardTitle>
                  <Link href="/labs" className="text-[12px] font-medium text-[var(--text-2)] hover:text-[var(--text)]">Browse labs →</Link>
                </CardHeader>
                <CardContent className="space-y-3">
                  {labs.filter(l => l.status === "in_progress").map(lab => (
                    <div key={lab.id} className="flex items-center gap-3 p-3 rounded-[10px] border border-[var(--border)] hover:shadow-sm transition-shadow">
                      <div className="w-8 h-8 rounded-[8px] bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center shrink-0">
                        <Target className="w-3.5 h-3.5 text-[var(--text-2)]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-[550] truncate">{lab.title}</div>
                        <div className="text-[11px] text-[var(--text-2)]">{lab.category} • {lab.difficulty} • {lab.duration}</div>
                        <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-[var(--surface-3)]">
                          <ProgressAnimated value={lab.progress ?? 0} />
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-[11px] font-mono font-medium"><CountUp value={lab.progress ?? 0} />%</div>
                        <Link href={`/labs/${lab.id}`} className="text-[11px] font-medium text-[var(--accent)] hover:underline">Continue</Link>
                      </div>
                    </div>
                  ))}
                  {labs.filter(l=>l.status==="in_progress").length===0 && (
                    <Card className="border-dashed rounded-[12px] bg-[var(--surface-2)]">
                      <CardContent className="p-6 text-center">
                        <div className="w-10 h-10 rounded-full bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center mx-auto">
                          <FlaskConical className="w-5 h-5 text-[var(--text-2)]" />
                        </div>
                        <div className="mt-3 text-[14px] font-[600] tracking-[-0.01em] text-[var(--text)]">No labs in progress</div>
                        <div className="mt-1 text-[12px] leading-5 text-[var(--text-2)] max-w-[320px] mx-auto">Pick a lab to start practicing. Your active labs will appear here with progress.</div>
                        <Link href="/labs"><Button size="sm" className="mt-4 h-8 rounded-[8px] bg-[var(--text)] text-[var(--background)] hover:bg-zinc-800 dark:hover:bg-zinc-200">Browse labs</Button></Link>
                      </CardContent>
                    </Card>
                  )}
                </CardContent>
              </Card>
            </FadeIn>

            {/* Challenge activity */}
            <FadeIn delay={120}>
              <Card>
                <CardHeader className="pb-3 flex-row items-center justify-between space-y-0">
                  <CardTitle className="flex items-center gap-2"><Trophy className="w-4 h-4 text-[var(--text-3)]" /> Challenge activity</CardTitle>
                  <Badge variant="secondary">{challenges.filter(c=>c.status==="solved").length} solved</Badge>
                </CardHeader>
                <CardContent>
                  <Stagger className="grid sm:grid-cols-2 gap-2" selector=".stagger-item">
                    {challenges.slice(0,4).map(c => (
                      <div key={c.id} className="stagger-item p-3 rounded-[10px] border border-[var(--border)] flex items-center gap-3">
                        <div className={`w-7 h-7 rounded-[7px] flex items-center justify-center shrink-0 ${c.status==="solved" ? "bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-950/30" : "bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-3)]"}`}>
                          {c.status==="solved" ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Trophy className="w-3.5 h-3.5" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[12.5px] font-[550] truncate">{c.name}</div>
                          <div className="text-[11px] text-[var(--text-3)]">{c.category} • {c.points} pts</div>
                        </div>
                        <Badge variant={c.status==="solved" ? "success" : c.status==="attempted" ? "secondary" : "outline"} className="text-[10px] shrink-0">{c.status}</Badge>
                      </div>
                    ))}
                  </Stagger>
                </CardContent>
              </Card>
            </FadeIn>
          </div>

          {/* Right */}
          <div className="space-y-6">
            {/* Skill progress */}
            <FadeIn delay={90}>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2"><TrendingUp className="w-4 h-4 text-[var(--text-3)]" /> Skill Progress</CardTitle>
                  <CardDescription>Track advancement across core domains.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {skillProgress.map(s => (
                    <div key={s.name}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[12.5px] font-[500]">{s.name}</span>
                        <span className="text-[11px] font-mono text-[var(--text-3)]"><CountUp value={s.progress} />% • {s.level}</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--surface-3)]">
                        <ProgressAnimated value={s.progress} />
                      </div>
                      <div className="mt-1 text-[11px] text-[var(--text-3)]">Next: {s.next}</div>
                    </div>
                  ))}
                  <Link href="/skills" className="block text-center text-[12px] font-medium text-[var(--accent)] hover:underline pt-2 border-t border-[var(--border)]">View detailed skill map →</Link>
                </CardContent>
              </Card>
            </FadeIn>

            {/* Reputation */}
            <FadeIn delay={110}>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2"><Zap className="w-4 h-4 text-amber-500" /> Reputation</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline gap-2">
                    <span className="text-[24px] font-[700] tracking-[-0.03em]"><CountUp value={8841} /></span>
                    <span className="text-[11px] font-medium px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">+142 this week</span>
                  </div>
                  <div className="mt-3 space-y-2 text-[12px]">
                    <div className="flex justify-between"><span className="text-[var(--text-2)]">Labs</span><span className="font-mono"><CountUp value={64} /></span></div>
                    <div className="flex justify-between"><span className="text-[var(--text-2)]">Challenges</span><span className="font-mono"><CountUp value={38} /></span></div>
                    <div className="flex justify-between"><span className="text-[var(--text-2)]">Research</span><span className="font-mono"><CountUp value={24} /></span></div>
                    <div className="flex justify-between"><span className="text-[var(--text-2)]">Community</span><span className="font-mono"><CountUp value={16} /></span></div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-[var(--border)] text-[11px] text-[var(--text-3)]">Every change is explainable. No trivial activity dominates the score.</div>
                </CardContent>
              </Card>
            </FadeIn>

            {/* Achievements */}
            <FadeIn delay={130}>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2"><Award className="w-4 h-4 text-[var(--text-3)]" /> Recent achievements</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { title: "SQL Injection Master", desc: "Completed all Web SQL labs", time: "2 hours ago", icon: "🎯" },
                    { title: "First Research Published", desc: "Your writeup was featured", time: "Yesterday", icon: "📄" },
                    { title: "7-Day Streak", desc: "Consistent daily practice", time: "3 days ago", icon: "🔥" },
                  ].map(a => (
                    <div key={a.title} className="flex gap-3 p-2.5 rounded-[10px] bg-[var(--surface-2)] border border-[var(--border)]">
                      <div className="w-8 h-8 rounded-[8px] bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-[14px] shrink-0">{a.icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[12.5px] font-[600] leading-none">{a.title}</div>
                        <div className="text-[11px] text-[var(--text-2)]">{a.desc}</div>
                        <div className="text-[11px] text-[var(--text-3)] mt-1 flex items-center gap-1"><Clock className="w-3 h-3" />{a.time}</div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </FadeIn>

            {/* Upcoming */}
            <FadeIn delay={140}>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2"><Calendar className="w-4 h-4 text-[var(--text-3)]" /> Upcoming</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="p-3 rounded-[10px] border border-[var(--border)] bg-[var(--surface)]">
                    <div className="text-[12.5px] font-[600]">Winter CTF 2026</div>
                    <div className="text-[11px] text-[var(--text-2)]">Team competition • 48 hours • Starts in 6 days</div>
                    <div className="mt-2 flex items-center gap-2">
                      <Badge variant="accent" className="text-[11px]">Registered</Badge>
                      <span className="text-[11px] text-[var(--text-3)]">Red Team — Atlas</span>
                    </div>
                  </div>
                  <div className="p-3 rounded-[10px] border border-dashed border-[var(--border)] bg-[var(--surface-2)] text-center">
                    <div className="text-[12px] font-medium">SOC Simulation — Feb 22</div>
                    <div className="text-[11px] text-[var(--text-2)]">Live detection engineering workshop</div>
                    <Button size="sm" variant="secondary" className="mt-2 h-7 text-[12px]">Reserve seat</Button>
                  </div>
                </CardContent>
              </Card>
            </FadeIn>
          </div>
        </div>

        {/* Threat intel - Recent CVEs */}
        <FadeIn delay={80}>
          <Card className="mt-6 overflow-hidden">
            <CardHeader className="pb-3 flex-row items-center justify-between space-y-0 gap-4">
              <CardTitle className="flex items-center gap-2"><Shield className="w-4 h-4 text-[var(--text-3)]" /> Threat intel — Recent CVEs</CardTitle>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant="outline" className="font-mono text-[10px] hidden sm:inline-flex">Source: NVD • Updated 2h ago</Badge>
                <Link href="/research" className="text-[12px] font-medium text-[var(--accent)] hover:underline hidden sm:inline-flex items-center gap-1">View intel <ExternalLink className="w-3 h-3" /></Link>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left" aria-label="Recent CVEs threat intel">
                  <caption className="sr-only">Recent CVEs and threat intel</caption>
                  <thead>
                    <tr className="border-y border-[var(--border)] bg-[var(--surface-2)] text-[11px] font-semibold tracking-widest uppercase text-[var(--text-3)]">
                      <th scope="col" className="px-4 py-2.5 font-semibold whitespace-nowrap">CVE</th>
                      <th scope="col" className="px-4 py-2.5 font-semibold min-w-[220px]">Summary</th>
                      <th scope="col" className="px-4 py-2.5 font-semibold">Severity</th>
                      <th scope="col" className="px-4 py-2.5 font-semibold">Status</th>
                      <th scope="col" className="px-4 py-2.5 font-semibold hidden sm:table-cell whitespace-nowrap">Published</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    <tr className="hover:bg-[var(--surface-2)] transition-colors">
                      <td className="px-4 py-3 font-mono text-[12.5px] font-medium whitespace-nowrap">CVE-2024-3400</td>
                      <td className="px-4 py-3 text-[13px] leading-5 max-w-[360px]"><span className="font-[500]">PAN-OS GlobalProtect</span> <span className="text-[var(--text-2)]">— command injection, unauthenticated RCE via crafted session</span></td>
                      <td className="px-4 py-3"><Badge variant="secondary" className="bg-zinc-900 text-white border-zinc-800 dark:bg-zinc-800 text-[11px]">Critical</Badge></td>
                      <td className="px-4 py-3"><Badge variant="success" className="text-[11px]">Patch available</Badge></td>
                      <td className="px-4 py-3 text-[11px] font-mono text-[var(--text-3)] hidden sm:table-cell">2024-04-12</td>
                    </tr>
                    <tr className="hover:bg-[var(--surface-2)] transition-colors">
                      <td className="px-4 py-3 font-mono text-[12.5px] font-medium whitespace-nowrap">CVE-2024-3094</td>
                      <td className="px-4 py-3 text-[13px] leading-5 max-w-[360px]"><span className="font-[500]">XZ Utils liblzma</span> <span className="text-[var(--text-2)]">— backdoor in 5.6.0/5.6.1, SSH auth bypass via build script</span></td>
                      <td className="px-4 py-3"><Badge variant="secondary" className="bg-zinc-900 text-white border-zinc-800 dark:bg-zinc-800 text-[11px]">Critical</Badge></td>
                      <td className="px-4 py-3"><Badge variant="outline" className="text-[11px]">Mitigated</Badge></td>
                      <td className="px-4 py-3 text-[11px] font-mono text-[var(--text-3)] hidden sm:table-cell">2024-03-29</td>
                    </tr>
                    <tr className="hover:bg-[var(--surface-2)] transition-colors">
                      <td className="px-4 py-3 font-mono text-[12.5px] font-medium whitespace-nowrap">CVE-2024-21626</td>
                      <td className="px-4 py-3 text-[13px] leading-5 max-w-[360px]"><span className="font-[500]">runc</span> <span className="text-[var(--text-2)]">— container escape via leaked file descriptor, host file overwrite</span></td>
                      <td className="px-4 py-3"><Badge variant="secondary" className="bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/20 dark:text-amber-300 dark:border-amber-900 text-[11px]">High</Badge></td>
                      <td className="px-4 py-3"><Badge variant="success" className="text-[11px]">Patch available</Badge></td>
                      <td className="px-4 py-3 text-[11px] font-mono text-[var(--text-3)] hidden sm:table-cell">2024-01-31</td>
                    </tr>
                    <tr className="hover:bg-[var(--surface-2)] transition-colors">
                      <td className="px-4 py-3 font-mono text-[12.5px] font-medium whitespace-nowrap">CVE-2023-44487</td>
                      <td className="px-4 py-3 text-[13px] leading-5 max-w-[360px]"><span className="font-[500]">HTTP/2 Rapid Reset</span> <span className="text-[var(--text-2)]">— DoS via stream cancellation, widespread server impact</span></td>
                      <td className="px-4 py-3"><Badge variant="secondary" className="bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/20 dark:text-amber-300 dark:border-amber-900 text-[11px]">High</Badge></td>
                      <td className="px-4 py-3"><Badge variant="outline" className="text-[11px]">Monitoring</Badge></td>
                      <td className="px-4 py-3 text-[11px] font-mono text-[var(--text-3)] hidden sm:table-cell">2023-10-10</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-2.5 border-t border-[var(--border)] bg-[var(--surface-2)]/50 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                <span className="text-[var(--text-3)]">Showing 4 of 12 tracked • Sorted by severity • Restrained signal only</span>
                <Link href="/research" className="font-medium text-[var(--text-2)] hover:text-[var(--text)] inline-flex items-center gap-1">Open intel feed <ArrowRight className="w-3 h-3" /></Link>
              </div>
            </CardContent>
          </Card>
        </FadeIn>

        {/* Recent activity */}
        <FadeIn delay={60}>
          <Card className="mt-6">
            <CardHeader className="pb-3 flex-row items-center justify-between space-y-0">
              <CardTitle>Recent activity</CardTitle>
              <span className="text-[11px] text-[var(--text-3)]">Last 7 days</span>
            </CardHeader>
            <CardContent>
              <div className="divide-y divide-[var(--border)]">
                {[
                  { action: "Completed lab", target: "Network Traffic Analysis", meta: "Earned 120 XP • 2 hours ago", color: "bg-emerald-500" },
                  { action: "Solved challenge", target: "Auth Bypass (Web • 100 pts)", meta: "First blood bonus • 5 hours ago", color: "bg-blue-500" },
                  { action: "Published research", target: "Abusing IAM Trust Policies", meta: "12 bookmarks in 24h • Yesterday", color: "bg-purple-500" },
                  { action: "Joined team", target: "Red Team — Atlas activity", meta: "Team rank improved to #12 • 2 days ago", color: "bg-amber-500" },
                  { action: "Earned certificate", target: "Web Security — Intermediate", meta: "Verified credential • 3 days ago", color: "bg-zinc-800" },
                ].map((row, i) => (
                  <div key={i} className="flex items-center gap-3 py-3">
                    <span className={`w-1.5 h-1.5 rounded-full ${row.color} shrink-0`} />
                    <div className="flex-1 min-w-0">
                      <span className="text-[13px] text-[var(--text-2)]">{row.action}</span> <span className="text-[13px] font-[550] text-[var(--text)]">{row.target}</span>
                      <div className="text-[11px] text-[var(--text-3)]">{row.meta}</div>
                    </div>
                    <ChevronLink />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </FadeIn>
      </div>
    </AppShell>
  )
}

function Stat({ label, value, sub, accent, prefix = "" }: { label: string, value: number, sub: string, accent?: boolean, prefix?: string }) {
  return (
    <Card className={accent ? "border-[var(--accent-border)] bg-[var(--accent-muted)]" : ""}>
      <CardContent className="p-4">
        <div className="text-[11px] font-semibold tracking-widest uppercase text-[var(--text-3)]">{label}</div>
        <div className={`mt-1 text-[20px] font-[700] tracking-[-0.03em] ${accent ? "text-[var(--accent)]" : "text-[var(--text)]"}`}>
          {prefix}<CountUp value={value} />
        </div>
        <div className="text-[11px] text-[var(--text-2)]">{sub}</div>
      </CardContent>
    </Card>
  )
}

function ChevronLink() {
  return <span className="w-7 h-7 rounded-[7px] border border-[var(--border)] bg-[var(--surface)] flex items-center justify-center text-[var(--text-3)] hover:text-[var(--text)] cursor-pointer"><ArrowRight className="w-3.5 h-3.5" /></span>
}
