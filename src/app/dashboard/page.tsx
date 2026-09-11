"use client"
import Link from "next/link"
import * as React from "react"
import { AppShell } from "@/components/layout/app-shell"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { labs, challenges, skillProgress } from "@/lib/data"
import { Stagger, FadeIn, CountUp, ProgressAnimated } from "@/components/ui/stagger"
import { Target, Trophy, FlaskConical, BookOpen, Zap, ArrowRight, CheckCircle2, Play, Calendar, Award, TrendingUp, Wrench, Shield, ExternalLink } from "lucide-react"
import { useAuth } from "@/components/auth-provider"

type ProgressState = { pct: number; completed: number; total: number; hasActivity: boolean }

function validateProgress(raw: unknown): ProgressState {
  const fallback: ProgressState = { pct: 0, completed: 0, total: 32, hasActivity: false }
  if (!raw || typeof raw !== "object") return fallback
  const p = raw as Record<string, unknown>
  let pct = typeof p.pct === "number" ? p.pct : Number(p.pct)
  let completed = typeof p.completed === "number" ? p.completed : Number(p.completed)
  let total = typeof p.total === "number" ? p.total : Number(p.total)
  if (!Number.isFinite(pct)) pct = 0
  if (!Number.isFinite(completed)) completed = 0
  if (!Number.isFinite(total)) total = 32
  pct = Math.min(100, Math.max(0, Math.round(pct)))
  completed = Math.min(total, Math.max(0, Math.round(completed)))
  total = Math.min(1000, Math.max(1, Math.round(total)))
  if (completed > total) completed = total
  // ensure pct consistent with completed/total if pct looks derived
  return { pct, completed, total, hasActivity: completed > 0 }
}

export default function DashboardPage() {
  const { user } = useAuth()
  const displayName = user?.name || "Guest"
  const firstName = displayName.trim().split(/\s+/)[0] || "Guest"
  const [real, setReal] = React.useState<ProgressState>({ pct: 0, completed: 0, total: 32, hasActivity: false })
  const [progressLoading, setProgressLoading] = React.useState(true)
  const [solvedCount, setSolvedCount] = React.useState(0)
  const [upcomingEvents, setUpcomingEvents] = React.useState<{ id: string; title: string; date: string; status: string }[]>([])
  const [cves, setCves] = React.useState<{ id: string; cveId: string; title: string; severity: string; status: string; published: string }[]>([])
  const planLabel = user?.plan === "go" ? "Go" : user?.plan === "plus" ? "Plus" : "Free"

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem("aegis_progress")
      if (raw) {
        const parsed = JSON.parse(raw)
        setReal(validateProgress(parsed))
      }
    } catch {}
    try {
      let n = 0
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i)
        if (k && k.startsWith("aegis_solved_") && localStorage.getItem(k) === "1") n++
      }
      setSolvedCount(n)
    } catch {}
    setProgressLoading(false)
  }, [])

  React.useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const [evRes, cveRes] = await Promise.all([
          fetch("/api/events").then(r => r.json().catch(() => ({ events: [] }))),
          fetch("/api/cves").then(r => r.json().catch(() => ({ cves: [] }))),
        ])
        if (!cancelled) {
          setUpcomingEvents((evRes.events ?? []).slice(0, 2))
          setCves((cveRes.cves ?? []).slice(0, 4))
        }
      } catch {
        if (!cancelled) { setUpcomingEvents([]); setCves([]) }
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

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
              <Link href="/learn"><Button size="sm" className="rounded-[8px]">Continue</Button></Link>
            </div>
          </div>
        </FadeIn>

        {/* Quick actions bar — left-aligned with Good morning title */}
        <FadeIn delay={60}>
          <Card className="mb-6">
            <CardContent className="p-3 sm:p-3.5 flex flex-wrap items-center justify-start gap-2">
              <span className="text-[11px] font-semibold tracking-widest uppercase text-[var(--text-3)] mr-1 hidden sm:inline shrink-0" aria-hidden="true">Quick actions</span>
              <span className="hidden sm:block h-4 w-px bg-[var(--border)] mr-1 shrink-0" aria-hidden="true" />
              <Link href="/labs">
                <Button variant="secondary" size="sm" className="h-9 sm:h-7 min-h-[36px] sm:min-h-0 rounded-full gap-1.5 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800">
                  <FlaskConical className="w-3.5 h-3.5" aria-hidden="true" /> Labs
                </Button>
              </Link>
              <Link href="/challenges">
                <Button variant="secondary" size="sm" className="h-9 sm:h-7 min-h-[36px] sm:min-h-0 rounded-full gap-1.5 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800">
                  <Trophy className="w-3.5 h-3.5" aria-hidden="true" /> Challenges
                </Button>
              </Link>
              <Link href="/tools">
                <Button variant="secondary" size="sm" className="h-9 sm:h-7 min-h-[36px] sm:min-h-0 rounded-full gap-1.5 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800">
                  <Wrench className="w-3.5 h-3.5" aria-hidden="true" /> Tools
                </Button>
              </Link>
              <Link href="/learn">
                <Button variant="secondary" size="sm" className="h-9 sm:h-7 min-h-[36px] sm:min-h-0 rounded-full gap-1.5 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800">
                  <BookOpen className="w-3.5 h-3.5" aria-hidden="true" /> Academy
                </Button>
              </Link>
              <Link href="/research">
                <Button variant="secondary" size="sm" className="h-9 sm:h-7 min-h-[36px] sm:min-h-0 rounded-full gap-1.5 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800">
                  <BookOpen className="w-3.5 h-3.5" aria-hidden="true" /> Research
                </Button>
              </Link>
              <span className="ml-auto hidden lg:inline text-[11px] text-[var(--text-3)] shrink-0">Jump to where you left off</span>
            </CardContent>
          </Card>
        </FadeIn>

        {/* Stats - animated with anime.js stagger + count-up */}
        <Stagger className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
          <div className="stagger-item"><Stat label="XP" value={0} sub="Complete labs to earn XP" /></div>
          <div className="stagger-item"><Stat label="Reputation" value={user?.reputation ?? 0} sub="Based on your activity" /></div>
          <div className="stagger-item"><Stat label="Labs completed" value={real.completed} sub="Across all labs" /></div>
          <div className="stagger-item"><Stat label="Challenges solved" value={solvedCount} sub="Across all challenges" /></div>
          <div className="stagger-item">
            <Card>
              <CardContent className="p-4">
                <div className="text-[11px] font-semibold tracking-widest uppercase text-[var(--text-3)]">Plan</div>
                <div className="mt-1 text-[20px] font-[700] tracking-[-0.03em] text-[var(--text)]">{planLabel}</div>
                <div className="text-[11px] text-[var(--text-2)]"><Link href="/settings/billing" className="hover:underline">Manage billing</Link></div>
              </CardContent>
            </Card>
          </div>
        </Stagger>

        <div className="grid lg:grid-cols-[1.7fr_1fr] gap-6">
          {/* Left */}
          <div className="space-y-6">
            {/* Continue learning */}
            <FadeIn delay={80}>
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-4">
                    <h2 className="flex items-center gap-2 leading-none text-[14px] font-[600]"><BookOpen className="w-4 h-4 text-[var(--text-3)]" aria-hidden="true" /> Continue your learning</h2>
                    <Link href="/learn" className="inline-flex items-center text-[12px] font-medium text-[var(--accent)] hover:underline leading-none self-center gap-1">View all <ArrowRight className="w-3 h-3" aria-hidden="true" /></Link>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-[10px] border border-[var(--border)] p-4 bg-[var(--surface-2)]">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex gap-3 min-w-0 flex-1">
                        <div className="w-10 h-10 rounded-[9px] bg-[#7C3AED] text-white flex items-center justify-center shrink-0" aria-hidden="true">
                          <BookOpen className="w-4 h-4" aria-hidden="true" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-[13.5px] font-[600] tracking-[-0.015em]">Continue your learning</h3>
                          <div className="text-[12px] text-[var(--text-2)]">Pick up a path in the Academy and work through video lessons.</div>
                          <div className="mt-2 flex items-center gap-2">
                            <div className="flex-1 max-w-[180px] w-full h-1.5 overflow-hidden rounded-full bg-[var(--surface-3)] shrink-0" role="progressbar" aria-valuenow={progressLoading ? undefined : real.pct} aria-valuemin={0} aria-valuemax={100} aria-label="Course progress">
                              {progressLoading ? (
                                <div className="h-full w-full bg-[var(--surface-3)] animate-pulse" />
                              ) : (
                                <ProgressAnimated value={real.pct} />
                              )}
                            </div>
                            {progressLoading ? (
                              <span className="text-[11px] font-mono text-[var(--text-3)] font-medium tabular-nums animate-pulse">--%</span>
                            ) : (
                              <span className="text-[11px] font-mono text-[var(--text-3)] font-medium tabular-nums"><CountUp value={real.pct} />%</span>
                            )}
                            <span className="text-[11px] text-[var(--text-3)]">• {progressLoading ? "--/--" : `${real.completed}/${real.total}`} lessons</span>
                            {!progressLoading && !real.hasActivity && <span className="text-[11px] text-amber-600">• No lessons yet</span>}
                          </div>
                        </div>
                      </div>
                      <Link href="/learn"><Button size="sm" className="shrink-0 rounded-[8px] bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 border border-zinc-900 dark:border-zinc-700 h-11 sm:h-8 min-h-[44px] sm:min-h-0">Continue <ArrowRight className="w-3.5 h-3.5 ml-1" aria-hidden="true" /></Button></Link>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-[12px] font-semibold tracking-wide text-[var(--text-2)] mb-2">Recommended next step</h3>
                    <div className="rounded-[10px] border border-[var(--border)] bg-[var(--surface)] p-4 flex items-start gap-3">
                      <div className="w-9 h-9 rounded-[8px] bg-zinc-800 text-white flex items-center justify-center shrink-0" aria-hidden="true">
                        <FlaskConical className="w-4 h-4" aria-hidden="true" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-[600]">Start a hands-on lab</div>
                        <div className="text-[12px] text-[var(--text-2)]">Isolated environments with objectives and server-side flag checks.</div>
                      </div>
                      <Link href="/labs"><Button size="sm" variant="secondary" className="shrink-0 rounded-[8px] bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 h-11 sm:h-8 min-h-[44px] sm:min-h-0">Browse labs <ArrowRight className="w-3.5 h-3.5 ml-1" aria-hidden="true" /></Button></Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </FadeIn>

            {/* Labs in progress */}
            <FadeIn delay={100}>
              <Card>
                <CardHeader className="pb-3 flex-row items-center justify-between space-y-0">
                  <h2 className="flex items-center gap-2 text-[14px] font-[600]"><FlaskConical className="w-4 h-4 text-[var(--text-3)]" aria-hidden="true" /> Labs in progress</h2>
                  <Link href="/labs" className="text-[12px] font-medium text-[var(--text-2)] hover:text-[var(--text)]">Browse labs →</Link>
                </CardHeader>
                <CardContent className="space-y-3">
                  {labs.filter(l => l.status === "in_progress").map(lab => (
                    <div key={lab.id} className="flex items-center gap-3 p-3 rounded-[10px] border border-[var(--border)] hover:shadow-sm transition-shadow">
                      <div className="w-8 h-8 rounded-[8px] bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center shrink-0" aria-hidden="true">
                        <Target className="w-3.5 h-3.5 text-[var(--text-2)]" aria-hidden="true" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-[550] truncate">{lab.title}</div>
                        <div className="text-[11px] text-[var(--text-2)]">{lab.category} • {lab.difficulty} • {lab.duration}</div>
                        <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-[var(--surface-3)]" role="progressbar" aria-valuenow={lab.progress ?? 0} aria-valuemin={0} aria-valuemax={100} aria-label={`${lab.title} progress`}>
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
                        <div className="w-10 h-10 rounded-full bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center mx-auto" aria-hidden="true">
                          <FlaskConical className="w-5 h-5 text-[var(--text-2)]" aria-hidden="true" />
                        </div>
                        <div className="mt-3 text-[14px] font-[600] tracking-[-0.01em] text-[var(--text)]">No labs in progress</div>
                        <div className="mt-1 text-[12px] leading-5 text-[var(--text-2)] max-w-[320px] mx-auto">Pick a lab to start practicing. Your active labs will appear here with progress.</div>
                        <Link href="/labs"><Button size="sm" className="mt-4 h-11 sm:h-8 min-h-[44px] sm:min-h-0 rounded-[8px] bg-[var(--text)] text-[var(--background)] hover:bg-zinc-800 dark:hover:bg-zinc-200">Browse labs</Button></Link>
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
                  <h2 className="flex items-center gap-2 text-[14px] font-[600]"><Trophy className="w-4 h-4 text-[var(--text-3)]" aria-hidden="true" /> Challenge activity</h2>
                  <Badge variant="secondary">{challenges.filter(c=>c.status==="solved").length} solved</Badge>
                </CardHeader>
                <CardContent>
                  {challenges.length === 0 ? (
                    <div className="p-3 rounded-[10px] border border-dashed border-[var(--border)] text-center col-span-full">
                      <div className="text-[12px] font-[600]">No challenges published yet</div>
                      <div className="text-[11px] text-[var(--text-2)] mt-0.5">New challenges will appear here when published.</div>
                    </div>
                  ) : (
                  <Stagger className="grid grid-cols-1 sm:grid-cols-2 gap-2" selector=".stagger-item">
                    {challenges.slice(0,4).map(c => (
                      <div key={c.id} className="stagger-item p-3 rounded-[10px] border border-[var(--border)] flex items-center gap-3">
                        <div className={`w-7 h-7 rounded-[7px] flex items-center justify-center shrink-0 ${c.status==="solved" ? "bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-950/30" : "bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-3)]"}`} aria-hidden="true">
                          {c.status==="solved" ? <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" /> : <Trophy className="w-3.5 h-3.5" aria-hidden="true" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[12.5px] font-[550] truncate">{c.name}</div>
                          <div className="text-[11px] text-[var(--text-3)]">{c.category} • {c.points} pts</div>
                        </div>
                        <Badge variant={c.status==="solved" ? "success" : c.status==="attempted" ? "secondary" : "outline"} className="text-[10px] shrink-0">{c.status}</Badge>
                      </div>
                    ))}
                  </Stagger>
                  )}
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
                  <h2 className="flex items-center gap-2 text-[14px] font-[600]"><TrendingUp className="w-4 h-4 text-[var(--text-3)]" aria-hidden="true" /> Skill Progress</h2>
                  <CardDescription>Track advancement across core domains.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {skillProgress.length === 0 ? (
                    <div className="p-3 rounded-[10px] border border-dashed border-[var(--border)] text-center">
                      <div className="text-[12px] font-[600]">No skill activity yet</div>
                      <div className="text-[11px] text-[var(--text-2)] mt-0.5">Complete labs to build your skill map.</div>
                    </div>
                  ) : skillProgress.map(s => (
                    <div key={s.name}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[12.5px] font-[500]">{s.name}</span>
                        <span className="text-[11px] font-mono text-[var(--text-3)]"><CountUp value={s.progress} />% • {s.level}</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--surface-3)]" role="progressbar" aria-valuenow={s.progress} aria-valuemin={0} aria-valuemax={100} aria-label={`${s.name} progress`}>
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
                  <h2 className="flex items-center gap-2 text-[14px] font-[600]"><Zap className="w-4 h-4 text-amber-500" aria-hidden="true" /> Reputation</h2>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline gap-2">
                    <span className="text-[24px] font-[700] tracking-[-0.03em]"><CountUp value={user?.reputation ?? 0} /></span>
                  </div>
                  <div className="mt-3 space-y-2 text-[12px]">
                    <div className="flex justify-between"><span className="text-[var(--text-2)]">Labs completed</span><span className="font-mono"><CountUp value={real.completed} /></span></div>
                    <div className="flex justify-between"><span className="text-[var(--text-2)]">Challenges solved</span><span className="font-mono"><CountUp value={solvedCount} /></span></div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-[var(--border)] text-[11px] text-[var(--text-3)]">Reputation grows as you complete labs, solve challenges, and publish research.</div>
                </CardContent>
              </Card>
            </FadeIn>

            {/* Achievements */}
            <FadeIn delay={130}>
              <Card>
                <CardHeader className="pb-3">
                  <h2 className="flex items-center gap-2 text-[14px] font-[600]"><Award className="w-4 h-4 text-[var(--text-3)]" aria-hidden="true" /> Recent achievements</h2>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="p-3 rounded-[10px] border border-dashed border-[var(--border)] text-center">
                    <div className="text-[12px] font-[600]">No achievements yet</div>
                    <div className="text-[11px] text-[var(--text-2)] mt-0.5">Complete labs and challenges to earn them.</div>
                  </div>
                </CardContent>
              </Card>
            </FadeIn>

            {/* Upcoming */}
            <FadeIn delay={140}>
              <Card>
                <CardHeader className="pb-3">
                  <h2 className="flex items-center gap-2 text-[14px] font-[600]"><Calendar className="w-4 h-4 text-[var(--text-3)]" aria-hidden="true" /> Upcoming</h2>
                </CardHeader>
                <CardContent className="space-y-3">
                  {upcomingEvents.length === 0 ? (
                    <div className="p-3 rounded-[10px] border border-dashed border-[var(--border)] text-center">
                      <div className="text-[12px] font-[600]">No upcoming events</div>
                      <div className="text-[11px] text-[var(--text-2)] mt-0.5">New competitions will appear here when scheduled.</div>
                    </div>
                  ) : upcomingEvents.map(ev => (
                    <div key={ev.id} className="p-3 rounded-[10px] border border-[var(--border)] bg-[var(--surface)]">
                      <h3 className="text-[12.5px] font-[600]">{ev.title}</h3>
                      <div className="text-[11px] text-[var(--text-2)]">{ev.date}</div>
                      <div className="mt-2 flex items-center gap-2">
                        <Badge variant={ev.status === "Live" ? "accent" : "secondary"} className="text-[11px]">{ev.status}</Badge>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </FadeIn>
          </div>
        </div>

        {/* Threat intel - Recent CVEs */}
        <FadeIn delay={80}>
          <Card className="mt-6 overflow-hidden">
            <CardHeader className="pb-3 flex-row items-center justify-between space-y-0 gap-4">
              <h2 className="flex items-center gap-2 text-[14px] font-[600]"><Shield className="w-4 h-4 text-[var(--text-3)]" aria-hidden="true" /> Threat intel — Recent CVEs</h2>
              <div className="flex items-center gap-2 shrink-0">
                <Link href="/cve" className="text-[12px] font-medium text-[var(--accent)] hover:underline hidden sm:inline-flex items-center gap-1">View intel <ExternalLink className="w-3 h-3" aria-hidden="true" /></Link>
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
                    {cves.length === 0 ? (
                      <tr><td colSpan={5} className="px-4 py-6 text-center text-[12px] text-[var(--text-2)]">No advisories published yet.</td></tr>
                    ) : cves.map(c => (
                      <tr key={c.id} className="hover:bg-[var(--surface-2)] transition-colors">
                        <td className="px-4 py-3 font-mono text-[12.5px] font-medium whitespace-nowrap">{c.cveId}</td>
                        <td className="px-4 py-3 text-[13px] leading-5 max-w-[360px]">{c.title}</td>
                        <td className="px-4 py-3"><Badge variant="secondary" className="text-[11px]">{c.severity}</Badge></td>
                        <td className="px-4 py-3"><Badge variant="outline" className="text-[11px]">{c.status}</Badge></td>
                        <td className="px-4 py-3 text-[11px] font-mono text-[var(--text-3)] hidden sm:table-cell">{c.published}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-2.5 border-t border-[var(--border)] bg-[var(--surface-2)]/50 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                <span className="text-[var(--text-3)]">Sorted by severity • Curated advisories</span>
                <Link href="/cve" className="font-medium text-[var(--text-2)] hover:text-[var(--text)] inline-flex items-center gap-1">Open intel feed <ArrowRight className="w-3 h-3" aria-hidden="true" /></Link>
              </div>
            </CardContent>
          </Card>
        </FadeIn>

        {/* Recent activity */}
        <FadeIn delay={60}>
          <Card className="mt-6">
            <CardHeader className="pb-3 flex-row items-center justify-between space-y-0">
              <h2 className="text-[14px] font-[600]">Recent activity</h2>
              <span className="text-[11px] text-[var(--text-3)]">Last 7 days</span>
            </CardHeader>
            <CardContent>
              <div className="p-3 rounded-[10px] border border-dashed border-[var(--border)] text-center">
                <div className="text-[12px] font-[600]">No recent activity</div>
                <div className="text-[11px] text-[var(--text-2)] mt-0.5">Start a lab or solve a challenge — your activity will show here.</div>
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
