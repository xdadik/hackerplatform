"use client"
import Link from "next/link"
import * as React from "react"
import { AppShell } from "@/components/layout/app-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Award, MapPin, Link as LinkIcon, Calendar, Trophy, FlaskConical, FileText, Users, Shield, CheckCircle2, GraduationCap, Edit2, Save, X } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { sanitizeInput, escapeHtml } from "@/lib/sanitize"

export default function ProfilePage() {
  const { user } = useAuth()
  const displayName = user?.name || "Alex Morgan"
  const displayEmail = user?.email || "alexmorgan@example.com"
  const [isEditing, setIsEditing]=React.useState(false)
  const [editName, setEditName]=React.useState(displayName)
  const [editBio, setEditBio]=React.useState("Security engineer focused on web exploitation and cloud security. OSCP, CRTO. I publish research on IAM misconfigurations and build detection tooling for SOC teams.")
  const [bio, setBio]=React.useState(editBio)
  const handle = React.useMemo(() => {
    const local = (displayEmail.split("@")[0] || "alexmorgan").toLowerCase().replace(/[^a-z0-9._-]/g, "")
    return local || "alexmorgan"
  }, [displayEmail])
  const initials = React.useMemo(() => {
    const parts = (isEditing? editName : displayName).trim().split(/\s+/).filter(Boolean)
    if (parts.length === 0) return "AM"
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }, [displayName, editName, isEditing])
  const joinedLabel = React.useMemo(() => {
    if (!user?.createdAt) return "Joined Mar 2023"
    try {
      const d = new Date(user.createdAt)
      return `Joined ${d.toLocaleDateString("en-US", { month: "short", year: "numeric" })}`
    } catch { return "Joined Mar 2023" }
  }, [user?.createdAt])

  React.useEffect(()=>{
    try{
      const b=localStorage.getItem("aegis_profile_bio")
      if(b) setBio(b)
      const n=localStorage.getItem("aegis_profile_name")
      if(n) setEditName(n)
    }catch{}
  },[])
  const saveProfile=()=>{
    const cleanName = sanitizeInput(editName, 64)
    const cleanBio = sanitizeInput(editBio, 500)
    if(!cleanName.trim()) return alert("Name required")
    try{
      localStorage.setItem("aegis_profile_bio", cleanBio)
      localStorage.setItem("aegis_profile_name", cleanName)
      const raw=localStorage.getItem("aegis_user")
      if(raw){
        const u=JSON.parse(raw)
        u.name=cleanName
        localStorage.setItem("aegis_user", JSON.stringify(u))
      }
    }catch{}
    setBio(cleanBio)
    setEditName(cleanName)
    setEditBio(cleanBio)
    setIsEditing(false)
    alert("Profile saved to localStorage (aegis_profile_*, aegis_user) — sanitized via htmlspecialchars/escapeHtml")
    window.location.reload()
  }
  const shareProfile=async()=>{
    const url=typeof window!=="undefined"? window.location.href : ""
    try{ await navigator.clipboard.writeText(url); alert("Profile link copied: "+url)}catch{ alert(url)}
  }

  return (
    <AppShell withSidebar>
      <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-[1080px]">
        {/* Header */}
        <Card className="overflow-hidden mb-6">
          <div className="h-24 bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 dark:from-[#0F1012] dark:via-[#1D1F23] dark:to-[#0F1012] border-b border-[var(--border)]" />
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-6">
              <div className="w-20 h-20 rounded-[16px] bg-[var(--text)] text-[var(--background)] flex items-center justify-center text-[22px] font-bold shrink-0 -mt-12 sm:-mt-14 border-4 border-[var(--surface)] shadow-md">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    {isEditing ? (
                      <div className="space-y-2">
                        <Input value={editName} onChange={e=>setEditName(e.target.value)} placeholder="Full name" className="h-11 sm:h-9 min-h-[44px] sm:min-h-0 font-[700] text-[18px]" />
                        <textarea value={editBio} onChange={e=>setEditBio(e.target.value)} placeholder="Bio" className="w-full min-h-[72px] rounded-[8px] border border-[var(--border)] bg-[var(--surface)] p-2 text-[13px]" />
                        <div className="flex flex-col sm:flex-row gap-2"><Button size="sm" className="h-11 sm:h-8 min-h-[44px] sm:min-h-0 gap-1" onClick={saveProfile}><Save className="w-3.5 h-3.5" /> Save</Button><Button size="sm" variant="ghost" className="h-11 sm:h-8 min-h-[44px] sm:min-h-0" onClick={()=>setIsEditing(false)}><X className="w-3.5 h-3.5" /> Cancel</Button></div>
                      </div>
                    ) : (
                      <>
                        <h1 className="text-[20px] font-[700] tracking-[-0.03em] flex items-center gap-2">
                          {displayName} <Badge variant="success" className="gap-1"><CheckCircle2 className="w-3 h-3" /> Verified</Badge>
                        </h1>
                        <div className="text-[13px] text-[var(--text-2)]">@{handle} • Security Engineer</div>
                        <div className="mt-1 flex flex-wrap items-center gap-3 text-[12px] text-[var(--text-2)]">
                          <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> Berlin • Remote</span>
                          <span className="flex items-center gap-1"><LinkIcon className="w-3 h-3" /> {displayEmail}</span>
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {joinedLabel}</span>
                        </div>
                      </>
                    )}
                  </div>
                  {!isEditing && (
                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                      <Button variant="secondary" size="sm" className="rounded-[8px] h-11 sm:h-8 min-h-[44px] sm:min-h-0 w-full sm:w-auto" onClick={shareProfile}>Share profile</Button>
                      <Button size="sm" className="rounded-[8px] h-11 sm:h-8 min-h-[44px] sm:min-h-0 w-full sm:w-auto" onClick={()=>setIsEditing(true)}><Edit2 className="w-3.5 h-3.5 mr-1" /> Edit profile</Button>
                    </div>
                  )}
                </div>
                {!isEditing && (
                  <p className="mt-4 text-[13.5px] leading-6 text-[var(--text-2)] max-w-[640px]">{bio}</p>
                )}
                <div className="mt-4 flex flex-wrap gap-1.5">
                  <Badge variant="secondary">OSCP</Badge>
                  <Badge variant="secondary">CRTO</Badge>
                  <Badge variant="secondary">AWS Security</Badge>
                  <Badge variant="outline">Web Security • Advanced</Badge>
                  <Badge variant="outline">Cloud • Intermediate</Badge>
                </div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <Stat label="Reputation" value="8,841" sub="Rank #3" />
              <Stat label="Labs" value="124" sub="6 in progress" />
              <Stat label="Challenges" value="76" sub="12 this month" />
              <Stat label="Research" value="4" sub="2 featured" />
              <Stat label="Teams" value="3" sub="1 owned" />
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-[1.7fr_1fr] gap-6">
          <div className="space-y-6">
            {/* Skills */}
            <Card>
              <CardHeader className="pb-3 flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2"><GraduationCap className="w-4 h-4" /> Skills</CardTitle>
                <Link href="/skills" className="text-[12px] font-medium text-[var(--accent)] hover:underline">View map →</Link>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { name: "Web Security", level: "Advanced", pct: 82 },
                  { name: "Cloud Security", level: "Intermediate", pct: 58 },
                  { name: "Linux", level: "Intermediate", pct: 68 },
                  { name: "Reverse Engineering", level: "Beginner", pct: 22 },
                ].map(s => (
                  <div key={s.name} className="flex items-center gap-3">
                    <span className="w-28 text-[12.5px] font-[500] shrink-0">{s.name}</span>
                    <Progress value={s.pct} className="flex-1 h-1.5" />
                    <span className="w-20 text-[11px] text-[var(--text-3)] text-right font-mono">{s.pct}% • {s.level}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Research & writeups */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2"><FileText className="w-4 h-4" /> Research & writeups</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { title: "Abusing Overly Permissive IAM Trust Policies", meta: "Jan 14 • 42 bookmarks • Featured", excerpt: "Privilege escalation via cross-account role assumption with CloudTrail detection." },
                  { title: "Writeup: Heap Overflow 101 — Tcache Poisoning", meta: "Dec 20 • 31 bookmarks", excerpt: "Step-by-step exploit for glibc 2.39 tcache with PoC." },
                  { title: "SOC Alert Triage: Entra ID Token Replay", meta: "Dec 02 • 18 bookmarks", excerpt: "KQL + Sigma rules for token replay detection." },
                ].map(a => (
                  <Link key={a.title} href="/research/1" className="block p-3 rounded-[10px] border border-[var(--border)] hover:bg-[var(--surface-2)] transition-colors">
                    <div className="text-[13px] font-[600] leading-tight">{a.title}</div>
                    <div className="text-[11px] text-[var(--text-3)] mt-1">{a.meta}</div>
                    <div className="text-[12px] text-[var(--text-2)] mt-1 leading-5">{a.excerpt}</div>
                  </Link>
                ))}
              </CardContent>
            </Card>

            {/* Labs completed */}
            <Card>
              <CardHeader className="pb-3 flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2"><FlaskConical className="w-4 h-4" /> Labs completed</CardTitle>
                <span className="text-[11px] text-[var(--text-3)]">124 total • 4 certificates</span>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    "SQL Injection Fundamentals",
                    "Cloud IAM Misconfiguration",
                    "Network Traffic Analysis",
                    "Linux Privilege Escalation",
                  ].map(lab => (
                    <div key={lab} className="p-2.5 rounded-[8px] bg-[var(--surface-2)] border border-[var(--border)] flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="text-[12.5px] font-[450] truncate">{lab}</span>
                    </div>
                  ))}
                </div>
                <Link href="/labs" className="mt-3 block text-center text-[12px] font-medium text-[var(--accent)] hover:underline">View all labs →</Link>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2"><Trophy className="w-4 h-4" /> Challenges</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between p-2.5 rounded-[8px] bg-[var(--surface-2)] border border-[var(--border)]">
                  <span className="text-[12px] font-medium">Web</span><span className="text-[12px] font-mono">34 solved</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-[8px] bg-[var(--surface-2)] border border-[var(--border)]">
                  <span className="text-[12px] font-medium">Crypto</span><span className="text-[12px] font-mono">12 solved</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-[8px] bg-[var(--surface-2)] border border-[var(--border)]">
                  <span className="text-[12px] font-medium">Pwn</span><span className="text-[12px] font-mono">8 solved</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-[8px] bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900">
                  <span className="text-[12px] font-medium text-emerald-800 dark:text-emerald-300">Total</span><span className="text-[12px] font-mono font-bold text-emerald-700 dark:text-emerald-300">76</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2"><Award className="w-4 h-4" /> Achievements</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2.5">
                {[
                  { title: "Web Security Expert", date: "Jan 2026" },
                  { title: "First Blood — Auth Bypass", date: "Dec 2025" },
                  { title: "Research Staff Pick", date: "Jan 2026" },
                  { title: "100 Labs Completed", date: "Nov 2025" },
                ].map(a => (
                  <div key={a.title} className="flex items-center gap-3 p-2.5 rounded-[10px] border border-[var(--border)]">
                    <div className="w-8 h-8 rounded-[8px] bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 flex items-center justify-center">🏆</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[12.5px] font-[600] leading-none">{a.title}</div>
                      <div className="text-[11px] text-[var(--text-3)]">{a.date}</div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2"><Users className="w-4 h-4" /> Teams</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="p-3 rounded-[10px] border border-[var(--border)] flex items-center gap-3">
                  <div className="w-8 h-8 rounded-[8px] bg-[#1A56DB] text-white flex items-center justify-center text-[11px] font-bold">RT</div>
                  <div className="flex-1">
                    <div className="text-[12.5px] font-[500]">Red Team — Atlas</div>
                    <div className="text-[11px] text-[var(--text-3)]">Member • Rank #12</div>
                  </div>
                  <Badge variant="secondary" className="text-[11px]">Active</Badge>
                </div>
                <div className="p-3 rounded-[10px] border border-[var(--border)] flex items-center gap-3">
                  <div className="w-8 h-8 rounded-[8px] bg-[#059669] text-white flex items-center justify-center text-[11px] font-bold">BT</div>
                  <div className="flex-1">
                    <div className="text-[12.5px] font-[500]">Blue Team — Sentinel</div>
                    <div className="text-[11px] text-[var(--text-3)]">Owner • Rank #4</div>
                  </div>
                  <Badge variant="default" className="text-[11px]">Owner</Badge>
                </div>
                <Link href="/teams"><Button variant="secondary" size="sm" className="w-full mt-2 h-9 sm:h-7 min-h-[36px] sm:min-h-0">View teams</Button></Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  )
}

function Stat({ label, value, sub }: { label: string, value: string, sub: string }) {
  return (
    <div className="rounded-[10px] bg-[var(--surface-2)] border border-[var(--border)] p-3">
      <div className="text-[11px] tracking-widest uppercase text-[var(--text-3)]">{label}</div>
      <div className="text-[18px] font-[700] tracking-[-0.02em]">{value}</div>
      <div className="text-[11px] text-[var(--text-2)]">{sub}</div>
    </div>
  )
}
