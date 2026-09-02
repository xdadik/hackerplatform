"use client"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TopNav } from "@/components/layout/top-nav"
import { CommandPalette } from "@/components/layout/command-palette"
import { Stagger, FadeIn, ScaleIn, CountUp, ProgressAnimated } from "@/components/ui/stagger"
import {
  BookOpen, FlaskConical, Trophy, FileText, Users, ShieldCheck,
  ArrowRight, Play, ChevronRight, Terminal, Search, Award, Building2,
  LayoutDashboard, Target, Clock, CheckCircle2, GraduationCap
} from "lucide-react"
import { useAuth } from "@/components/auth-provider"

function HomeGate({ children }: { children: React.ReactNode }) {
  const { isLoggedIn } = useAuth()
  if (!isLoggedIn) {
    return (
      <div className="mx-auto max-w-[640px] px-4 sm:px-6 lg:px-8 py-16 sm:py-24 text-center">
        <Badge variant="outline" className="rounded-full mb-4">Platform access requires authentication</Badge>
        <h1 className="text-[28px] font-[700] tracking-[-0.04em] leading-[1.1]">Aegis platform is inside.</h1>
        <p className="mt-3 text-[14px] leading-6 text-[var(--text-2)]">Learn, labs, challenges, research, and team operations are available only after you log in. Create an account or continue with Google to get started.</p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link href="/login"><Button className="h-10 px-6 rounded-[10px]">Log in</Button></Link>
          <Link href="/signup"><Button variant="secondary" className="h-10 px-6 rounded-[10px]">Sign up</Button></Link>
        </div>
        <p className="mt-6 text-[11px] text-[var(--text-3)]">Already have an invite? Use your company email. Your workspace and progress stay private until you authenticate.</p>
      </div>
    )
  }
  return <>{children}</>
}

export default function Home() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <TopNav />
      <CommandPalette />
      <HomeGate>



      {/* PLATFORM OVERVIEW */}
      <section className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="max-w-[640px]">
          <Badge variant="outline" className="mb-3 rounded-full">Platform</Badge>
          <h2 className="text-[24px] sm:text-[28px] font-[650] tracking-[-0.03em] leading-tight">Everything a security team needs to learn and operate.</h2>
          <p className="mt-3 text-[14px] leading-6 text-[var(--text-2)]">Designed for professional workflows — not gamified noise. Structured learning, isolated practice, peer-reviewed research, and team management that scales to enterprise.</p>
        </div>

        <Stagger className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="stagger-item"><FeatureCard icon={BookOpen} title="Academy" desc="Structured paths with prerequisites, progress tracking, and verified certificates. From Networking to Reverse Engineering." href="/learn" accent="Academy" /></div>
          <div className="stagger-item"><FeatureCard icon={FlaskConical} title="Hands-on Labs" desc="Isolated environments for Web, Linux, Windows, AD, Cloud, Forensics. Objectives, hints, reset, and notes." href="/labs" accent="Labs" /></div>
          <div className="stagger-item"><FeatureCard icon={Trophy} title="Challenges" desc="Clean, searchable CTF-style problems across 11 categories with clear difficulty and solve counts." href="/challenges" accent="Challenges" /></div>
          <div className="stagger-item"><FeatureCard icon={FileText} title="Research" desc="Technical publications with Markdown, code blocks, tags, and discussion. Showcase verifiable work." href="/research" accent="Research" /></div>
          <div className="stagger-item"><FeatureCard icon={Users} title="Teams & Orgs" desc="Roles, permissions, private labs, competitions, and analytics. Built for training programs." href="/teams" accent="Teams" /></div>
          <div className="stagger-item"><FeatureCard icon={GraduationCap} title="Professional Profiles" desc="Portfolios that map skills, labs, challenges, research, and reputation — explainable and verifiable." href="/profile" accent="Profiles" /></div>
        </Stagger>
      </section>

      {/* ACADEMY PREVIEW */}
      <section className="border-y border-[var(--border)] bg-[var(--surface)]">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
            <div>
              <div className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-widest uppercase text-[var(--text-3)]"><BookOpen className="w-3.5 h-3.5" /> Academy</div>
              <h2 className="mt-2 text-[22px] font-[650] tracking-[-0.03em]">Structured learning, not playlists.</h2>
              <p className="mt-2 text-[13.5px] leading-6 text-[var(--text-2)] max-w-[560px]">Ten progression paths with prerequisites, estimates, and hands-on assessments. Pick up exactly where you left off.</p>
            </div>
            <Link href="/learn" className="inline-flex items-center gap-1 text-[13px] font-medium text-[var(--accent)] hover:underline">Browse academy <ChevronRight className="w-3.5 h-3.5" /></Link>
          </div>

          <Stagger className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { name: "Networking", progress: 72, lessons: 24, time: "18h", level: "Intermediate" },
              { name: "Web Security", progress: 72, lessons: 32, time: "28h", level: "Intermediate" },
              { name: "Linux Fundamentals", progress: 45, lessons: 18, time: "12h", level: "Beginner" },
              { name: "Cloud Security", progress: 12, lessons: 21, time: "20h", level: "Intermediate" },
              { name: "Security Operations", progress: 60, lessons: 22, time: "19h", level: "Intermediate" },
              { name: "Active Directory", progress: 0, lessons: 28, time: "26h", level: "Advanced" },
            ].map(p => (
              <div key={p.name} className="stagger-item"><Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="w-9 h-9 rounded-[9px] bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center">
                      <GraduationCap className="w-4 h-4 text-[var(--text-2)]" />
                    </div>
                    <Badge variant={p.progress === 0 ? "outline" : p.progress === 72 ? "accent" : "secondary"} className="shrink-0">{p.progress > 0 ? `${p.progress}%` : p.level}</Badge>
                  </div>
                  <div className="mt-3 font-[600] tracking-[-0.015em] text-[14px]">{p.name}</div>
                  <div className="mt-1 text-[12px] text-[var(--text-2)]">{p.lessons} lessons • {p.time} • {p.level}</div>
                  <div className="mt-4 h-1.5 bg-[var(--surface-3)] rounded-full overflow-hidden">
                    <ProgressAnimated value={p.progress} className="h-full bg-[var(--text)] rounded-full" />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-[var(--text-3)]">
                    <span>{p.progress === 0 ? "Not started" : p.progress === 100 ? "Completed" : "In progress"}</span>
                    <span className="font-mono">{p.progress}%</span>
                  </div>
                </CardContent>
              </Card></div>
            ))}
          </Stagger>
        </div>
      </section>

      {/* LABS + CHALLENGES SPLIT */}
      <section className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 py-12 sm:py-16 grid lg:grid-cols-2 gap-8">
        <div className="rounded-[16px] border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
          <div className="p-6 border-b border-[var(--border)]">
            <div className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-widest uppercase text-[var(--text-3)]"><FlaskConical className="w-3.5 h-3.5" /> Hands-on Labs</div>
            <h3 className="mt-2 text-[18px] font-[650] tracking-[-0.02em]">Practice in isolated environments</h3>
            <p className="mt-1.5 text-[13px] leading-6 text-[var(--text-2)]">12 categories, objectives, hints, notes, reset. Terminal where appropriate. Built to resemble professional tooling, not a game.</p>
          </div>
          <div className="p-3 space-y-2 bg-[var(--surface-2)]">
            {[
              { title: "SQL Injection Fundamentals", cat: "Web Security", diff: "Beginner", time: "45 min", prog: 72, status: "In progress" },
              { title: "Linux Privilege Escalation", cat: "Linux", diff: "Intermediate", time: "90 min", prog: 0, status: "Not started" },
              { title: "Active Directory Enumeration", cat: "Active Directory", diff: "Advanced", time: "120 min", prog: 0, status: "Prerequisite" },
            ].map(lab => (
              <div key={lab.title} className="flex items-center gap-3 p-3 rounded-[10px] bg-[var(--surface)] border border-[var(--border)] hover:shadow-sm transition-shadow">
                <div className="w-8 h-8 rounded-[8px] bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center shrink-0">
                  <Terminal className="w-3.5 h-3.5 text-[var(--text-2)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-[550] tracking-[-0.01em] truncate">{lab.title}</div>
                  <div className="text-[11px] text-[var(--text-2)]">{lab.cat} • {lab.diff} • {lab.time}</div>
                </div>
                <div className="hidden sm:flex flex-col items-end gap-1 shrink-0">
                  <Badge variant={lab.prog > 0 ? "accent" : "outline"} className="text-[10px] px-2 py-0">{lab.status}</Badge>
                  {lab.prog > 0 && <span className="text-[11px] font-mono text-[var(--text-3)]">{lab.prog}%</span>}
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 flex items-center justify-between">
            <span className="text-[12px] text-[var(--text-2)]">6 labs in progress • 24 completed</span>
            <Link href="/labs" className="text-[13px] font-medium text-[var(--text)] inline-flex items-center gap-1 hover:gap-1.5 transition-all">View all labs <ArrowRight className="w-3.5 h-3.5" /></Link>
          </div>
        </div>

        <div className="rounded-[16px] border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
          <div className="p-6 border-b border-[var(--border)]">
            <div className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-widest uppercase text-[var(--text-3)]"><Trophy className="w-3.5 h-3.5" /> Challenges</div>
            <h3 className="mt-2 text-[18px] font-[650] tracking-[-0.02em]">Clean challenge discovery</h3>
            <p className="mt-1.5 text-[13px] leading-6 text-[var(--text-2)]">Eleven categories, search, filters, and bookmarks. Points, solve counts, and status — without clutter.</p>
          </div>
          <div className="p-3 bg-[var(--surface-2)]">
            <div className="grid grid-cols-2 gap-2">
              {[
                { name: "Auth Bypass", cat: "Web", pts: 100, diff: "Easy", solves: 3421, status: "Solved" },
                { name: "Heap Overflow 101", cat: "Pwn", pts: 250, diff: "Medium", solves: 892, status: "New" },
                { name: "RSA Common Modulus", cat: "Crypto", pts: 300, diff: "Medium", solves: 543, status: "Attempted" },
                { name: "Cloud SSRF to Metadata", cat: "Cloud", pts: 275, diff: "Medium", solves: 721, status: "New" },
              ].map(c => (
                <Card key={c.name} className="rounded-[10px] shadow-none hover:shadow-sm transition-shadow">
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between gap-2">
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 rounded-full">{c.cat}</Badge>
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full border ${c.diff === "Easy" ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30" : c.diff === "Medium" ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30" : "bg-red-50 text-red-700 border-red-200"}`}>{c.diff}</span>
                    </div>
                    <div className="mt-2 text-[13px] font-[550] leading-tight">{c.name}</div>
                    <div className="mt-1.5 flex items-center gap-2 text-[11px] text-[var(--text-3)] font-mono">
                      <span>{c.pts} pts</span><span>•</span><span>{c.solves.toLocaleString()} solves</span>
                    </div>
                    <div className="mt-2">
                      <Badge variant={c.status === "Solved" ? "success" : c.status === "Attempted" ? "secondary" : "outline"} className="text-[10px]">{c.status}</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
          <div className="p-4 flex items-center justify-between">
            <span className="text-[12px] text-[var(--text-2)]">1,204 active challenges</span>
            <Link href="/challenges" className="text-[13px] font-medium text-[var(--text)] inline-flex items-center gap-1 hover:gap-1.5 transition-all">Explore challenges <ArrowRight className="w-3.5 h-3.5" /></Link>
          </div>
        </div>
      </section>

      {/* RESEARCH */}
      <section className="border-y border-[var(--border)] bg-[var(--surface)]">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-widest uppercase text-[var(--text-3)]"><FileText className="w-3.5 h-3.5" /> Research</div>
              <h2 className="mt-2 text-[22px] font-[650] tracking-[-0.03em]">Technical publications worth citing.</h2>
              <p className="mt-2 text-[13.5px] leading-6 text-[var(--text-2)] max-w-[620px]">Markdown, syntax highlighting, diagrams, and verifiable authorship. Bookmark, comment, and relate research to labs and challenges.</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-1.5 text-[12px] text-[var(--text-3)] border border-[var(--border)] rounded-full px-3 py-1.5 bg-[var(--surface-2)]">
                <Search className="w-3 h-3" /> Search across 342 publications
              </div>
            </div>
          </div>

          <div className="mt-8 grid lg:grid-cols-[1.7fr_1fr] gap-4">
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="accent">Vulnerability Analysis</Badge>
                    <span className="text-[12px] text-[var(--text-3)]">• 12 min read • Jan 14, 2026</span>
                  </div>
                  <h3 className="text-[18px] font-[650] tracking-[-0.02em] leading-tight">Abusing Overly Permissive IAM Trust Policies in AWS Organizations</h3>
                  <p className="mt-2 text-[13px] leading-6 text-[var(--text-2)]">We analyze 1,200 real trust policies and demonstrate a privilege escalation path from cross-account role assumption, with detection rules for CloudTrail and a Terraform remediation.</p>
                  <div className="mt-4 flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center text-[11px] font-semibold">SC</div>
                      <div>
                        <div className="text-[12.5px] font-medium leading-none">Sophia Chen</div>
                        <div className="text-[11px] text-[var(--text-2)]">Security Engineer • 4.2k reputation</div>
                      </div>
                    </div>
                    <span className="ml-auto hidden sm:inline-flex items-center gap-1.5 text-[12px] text-[var(--text-3)]"><Award className="w-3.5 h-3.5" /> Staff Pick</span>
                  </div>
                </div>
                <div className="px-6 py-3 bg-[var(--surface-2)] border-t border-[var(--border)] flex items-center gap-2 overflow-x-auto">
                  <span className="text-[11px] font-mono text-[var(--text-3)]">Tags:</span>
                  <Badge variant="secondary" className="shrink-0">aws</Badge>
                  <Badge variant="secondary" className="shrink-0">iam</Badge>
                  <Badge variant="secondary" className="shrink-0">detection-engineering</Badge>
                  <span className="ml-auto text-[11px] text-[var(--text-3)] hidden sm:block">42 bookmarks • 18 comments</span>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-3">
              {[
                { title: "Heap Feng Shui in Modern glibc 2.39", tag: "Pwn", time: "18 min", author: "MR", desc: "A reproducible exploit primer for tcache poisoning with mitigations." },
                { title: "Volatility 3: Hunting Cobalt Strike in Memory", tag: "Forensics", time: "14 min", author: "EV", desc: "Workflow for extracting beacon configuration without disk artifacts." },
                { title: "Detection Engineering for Entra ID Token Replay", tag: "Blue Team", time: "10 min", author: "JK", desc: "KQL and Sigma rules for impossible travel with token binding." },
              ].map(a => (
                <Card key={a.title} className="hover:shadow-sm transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="text-[10px]">{a.tag}</Badge>
                      <span className="text-[11px] text-[var(--text-3)]">{a.time} read</span>
                      <span className="ml-auto w-6 h-6 rounded-full bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center text-[10px] font-semibold">{a.author}</span>
                    </div>
                    <div className="text-[13.5px] font-[600] leading-tight tracking-[-0.01em]">{a.title}</div>
                    <div className="mt-1 text-[12px] leading-5 text-[var(--text-2)]">{a.desc}</div>
                  </CardContent>
                </Card>
              ))}
              <Link href="/research" className="flex items-center justify-center gap-1 py-2 text-[13px] font-medium text-[var(--accent)] hover:underline">Browse all research <ChevronRight className="w-3.5 h-3.5" /></Link>
            </div>
          </div>
        </div>
      </section>

      {/* COMMUNITY / TEAMS / PROFILES */}
      <section className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid lg:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="w-9 h-9 rounded-[9px] bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center mb-4">
                <Users className="w-4 h-4 text-[var(--text-2)]" />
              </div>
              <h3 className="text-[15px] font-[650] tracking-[-0.02em]">Community, focused on quality</h3>
              <p className="mt-2 text-[13px] leading-6 text-[var(--text-2)]">Discussions, groups, mentorship, and events — prioritizing technical quality over social clutter. Reputation is explainable and tied to verifiable contributions.</p>
              <ul className="mt-4 space-y-1.5 text-[13px]">
                <li className="flex items-center gap-2 text-[var(--text-2)]"><span className="w-1 h-1 rounded-full bg-[var(--text-3)]" /> Technical posts & Q&A</li>
                <li className="flex items-center gap-2 text-[var(--text-2)]"><span className="w-1 h-1 rounded-full bg-[var(--text-3)]" /> Mentorship matching</li>
                <li className="flex items-center gap-2 text-[var(--text-2)]"><span className="w-1 h-1 rounded-full bg-[var(--text-3)]" /> Direct messages</li>
              </ul>
              <Link href="/community" className="mt-5 inline-flex text-[13px] font-medium text-[var(--text)] gap-1 items-center">Visit community <ArrowRight className="w-3.5 h-3.5" /></Link>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="w-9 h-9 rounded-[9px] bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center mb-4">
                <Award className="w-4 h-4 text-[var(--text-2)]" />
              </div>
              <h3 className="text-[15px] font-[650] tracking-[-0.02em]">Teams that operate</h3>
              <p className="mt-2 text-[13px] leading-6 text-[var(--text-2)]">Roles, permissions, team labs, competitions, and shared activity. Owner, Admin, Member — with proper authorization server-side.</p>
              <div className="mt-4 rounded-[10px] border border-[var(--border)] overflow-hidden">
                <div className="px-3 py-2 bg-[var(--surface-2)] border-b border-[var(--border)] flex items-center justify-between">
                  <span className="text-[12px] font-semibold">Red Team — Atlas</span>
                  <Badge variant="success" className="text-[10px]">Rank 12</Badge>
                </div>
                <div className="px-3 py-2.5 flex items-center justify-between text-[12px]">
                  <span className="text-[var(--text-2)]">Members</span><span className="font-mono font-medium">8 • 3 admins</span>
                </div>
                <div className="px-3 pb-2.5 flex gap-1.5">
                  <span className="w-6 h-6 rounded-full bg-[#1A56DB] text-white flex items-center justify-center text-[10px] font-semibold">MR</span>
                  <span className="w-6 h-6 rounded-full bg-[#059669] text-white flex items-center justify-center text-[10px] font-semibold">SC</span>
                  <span className="w-6 h-6 rounded-full bg-[#7C3AED] text-white flex items-center justify-center text-[10px] font-semibold">AM</span>
                  <span className="w-6 h-6 rounded-full bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center text-[10px] text-[var(--text-2)]">+5</span>
                </div>
              </div>
              <Link href="/teams" className="mt-5 inline-flex text-[13px] font-medium text-[var(--text)] gap-1 items-center">Explore teams <ArrowRight className="w-3.5 h-3.5" /></Link>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="w-9 h-9 rounded-[9px] bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center mb-4">
                <ShieldCheck className="w-4 h-4 text-[var(--text-2)]" />
              </div>
              <h3 className="text-[15px] font-[650] tracking-[-0.02em]">Portfolios that prove skill</h3>
              <p className="mt-2 text-[13px] leading-6 text-[var(--text-2)]">Professional profiles showcase labs, challenges, research, certificates, and teams. The record a hiring manager can verify.</p>
              <div className="mt-4 flex items-center gap-3 p-3 rounded-[10px] bg-[var(--surface-2)] border border-[var(--border)]">
                <div className="w-10 h-10 rounded-full bg-[var(--text)] text-[var(--background)] flex items-center justify-center text-[12px] font-semibold">AM</div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold leading-none">Alex Morgan</div>
                  <div className="text-[11px] text-[var(--text-2)]">Security Engineer • 8,841 rep • 124 labs</div>
                  <div className="mt-1 flex gap-1">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-white dark:bg-[#17181B] border border-[var(--border)]">OSCP</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-white dark:bg-[#17181B] border border-[var(--border)]">CRTO</span>
                  </div>
                </div>
              </div>
              <Link href="/profile" className="mt-5 inline-flex text-[13px] font-medium text-[var(--text)] gap-1 items-center">View profile <ArrowRight className="w-3.5 h-3.5" /></Link>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ORGANIZATIONS */}
      <section className="border-y border-[var(--border)] bg-[var(--surface)]">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="grid lg:grid-cols-[560px_1fr] gap-10 items-center">
            <div>
              <div className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-widest uppercase text-[var(--text-3)]"><Building2 className="w-3.5 h-3.5" /> Organizations</div>
              <h2 className="mt-2 text-[22px] font-[650] tracking-[-0.03em]">Built to scale into an enterprise product.</h2>
              <p className="mt-3 text-[13.5px] leading-6 text-[var(--text-2)]">Private learning paths, private labs, competitions, teams, analytics, and permissions — isolated from production infrastructure. RBAC, audit logs, and server-side authorization from day one.</p>
              <ul className="mt-6 grid sm:grid-cols-2 gap-3 text-[13px]">
                <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" /><span><strong className="font-[600]">Member management</strong> & RBAC</span></li>
                <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" /><span><strong className="font-[600]">Private content</strong> & labs</span></li>
                <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" /><span><strong className="font-[600]">Analytics</strong> & training programs</span></li>
                <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" /><span><strong className="font-[600]">Isolation</strong> via containers/VMs</span></li>
              </ul>
            </div>
            <Card className="shadow-sm">
              <CardContent className="p-0">
                <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between">
                  <span className="text-[13px] font-semibold">Organization analytics</span>
                  <Badge variant="secondary" className="text-[11px]">Preview</Badge>
                </div>
                <div className="p-5 space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-[10px] bg-[var(--surface-2)] border border-[var(--border)] p-3">
                      <div className="text-[11px] tracking-widest uppercase text-[var(--text-3)]">Members</div>
                      <div className="text-[20px] font-[650] tracking-[-0.02em]"><CountUp value={142} /></div>
                      <div className="text-[11px] text-emerald-600">+12 this month</div>
                    </div>
                    <div className="rounded-[10px] bg-[var(--surface-2)] border border-[var(--border)] p-3">
                      <div className="text-[11px] tracking-widest uppercase text-[var(--text-3)]">Completion</div>
                      <div className="text-[20px] font-[650] tracking-[-0.02em]"><CountUp value={68} />%</div>
                      <div className="text-[11px] text-[var(--text-2)]">Avg. path progress</div>
                    </div>
                    <div className="rounded-[10px] bg-[var(--surface-2)] border border-[var(--border)] p-3">
                      <div className="text-[11px] tracking-widest uppercase text-[var(--text-3)]">Lab hours</div>
                      <div className="text-[20px] font-[650] tracking-[-0.02em]"><CountUp value={1240} /></div>
                      <div className="text-[11px] text-[var(--text-2)]">This quarter</div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[12px] font-medium">Path adoption</span>
                      <span className="text-[11px] text-[var(--text-3)]">Last 30 days</span>
                    </div>
                    <div className="space-y-2">
                      <Bar label="Web Security" value={72} />
                      <Bar label="SOC" value={60} />
                      <Bar label="Cloud Security" value={44} />
                      <Bar label="Active Directory" value={31} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="rounded-[16px] border border-zinc-800 bg-[#0F1012] text-white p-8 sm:p-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 shadow-sm">
          <div>
            <h2 className="text-[22px] sm:text-[24px] font-[650] tracking-[-0.03em] leading-tight text-white">Start with one lab. Stay for the practice.</h2>
            <p className="mt-2 text-[13.5px] leading-6 text-zinc-400 max-w-[560px]">Self-paced, technical, and verifiable. No neon, no noise — just serious tooling for people who take security seriously.</p>
          </div>
          <div className="flex gap-3 shrink-0">
            <Link href="/dashboard">
              <Button className="bg-white text-zinc-900 hover:bg-zinc-100 h-10 px-6 rounded-[10px] font-[600] border border-transparent">Start learning</Button>
            </Link>
            <Link href="/labs">
              <Button variant="outline" className="h-10 px-6 rounded-[10px] border-zinc-700 text-white hover:bg-white/10 hover:text-white bg-transparent">Explore labs</Button>
            </Link>
          </div>
        </div>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[12px] text-[var(--text-3)] border-t border-[var(--border)] pt-6">
          <span>© 2026 Aegis Platform. Professional cybersecurity infrastructure.</span>
          <span className="flex items-center gap-4">
            <Link href="/research" className="hover:text-[var(--text)] hover:underline">Research</Link>
            <Link href="/community" className="hover:text-[var(--text)] hover:underline">Community</Link>
            <Link href="/settings" className="hover:text-[var(--text)] hover:underline">Security</Link>
            <span className="hidden sm:inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" /> All systems operational</span>
          </span>
        </div>
      </section>
      </HomeGate>
    </div>
  )
}

function FeatureCard({ icon: Icon, title, desc, href, accent }: { icon: any, title: string, desc: string, href: string, accent: string }) {
  return (
    <Card className="group hover:shadow-md transition-all hover:-translate-y-[1px]">
      <CardContent className="p-5">
        <div className="w-9 h-9 rounded-[9px] bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center group-hover:bg-[var(--text)] group-hover:text-[var(--background)] group-hover:border-[var(--text)] transition-colors">
          <Icon className="w-4 h-4" />
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-[14px] font-[600] tracking-[-0.015em]">{title}</span>
          <span className="text-[11px] font-mono text-[var(--text-3)]">{accent}</span>
        </div>
        <p className="mt-1.5 text-[13px] leading-6 text-[var(--text-2)]">{desc}</p>
        <Link href={href} className="mt-4 inline-flex items-center gap-1 text-[13px] font-[500] text-[var(--text)] group-hover:gap-1.5 transition-all">
          Explore <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </CardContent>
    </Card>
  )
}

function Objective({ label, done, active }: { label: string, done?: boolean, active?: boolean }) {
  return (
    <div className={`flex items-center gap-2.5 px-2.5 py-2 rounded-[8px] border text-[12.5px] ${active ? "bg-[var(--accent-muted)] border-[var(--accent-border)] text-[var(--accent)]" : done ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300" : "bg-[var(--surface-2)] border-[var(--border)] text-[var(--text-2)]"}`}>
      <span className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${done ? "bg-emerald-600 border-emerald-600 text-white" : active ? "bg-[var(--accent)] border-[var(--accent)] text-white" : "border-[var(--border-strong)] bg-[var(--surface)]"}`}>
        {done ? <CheckCircle2 className="w-3 h-3" /> : active ? <span className="w-1.5 h-1.5 rounded-full bg-white" /> : null}
      </span>
      <span className="font-[450] leading-none">{label}</span>
    </div>
  )
}

function Bar({ label, value }: { label: string, value: number }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-28 text-[12px] text-[var(--text-2)] shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-[var(--surface-3)] rounded-full overflow-hidden">
        <ProgressAnimated value={value} className="h-full bg-[var(--text)] rounded-full" />
      </div>
      <span className="w-8 text-[11px] font-mono text-[var(--text-3)] text-right"><CountUp value={value} />%</span>
    </div>
  )
}
