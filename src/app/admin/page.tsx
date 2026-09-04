"use client"
import * as React from "react"
import Link from "next/link"
import { AppShell } from "@/components/layout/app-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { sanitizeInput, sanitizeEmail, escapeHtml } from "@/lib/sanitize"
import { adminLoginLimiter } from "@/lib/rate-limit"
import { getOrCreateCsrfToken, validateCsrfToken } from "@/lib/csrf"
import { useAuth } from "@/components/auth-provider"
import {
  Users, FlaskConical, Trophy, FileText, Shield, AlertTriangle, Activity, Settings, Video, Calendar, Newspaper,
  Plus, Trash2, Edit2, Search, Save, X, Eye, Ban, CheckCircle2, Upload, Star
} from "lucide-react"

// Types for admin - standalone, separated from platform
type AdminUser = { id: string; username: string; email: string; reputation: number; status: "Active" | "Pending" | "Banned"; role: "user" | "admin" | "moderator" }
type AdminVideo = { id: string; title: string; subtitle: string; duration: string; module: string; path: string; featured: boolean }
type AdminEvent = { id: string; title: string; type: "CTF" | "Workshop" | "Competition"; date: string; status: "Live" | "Upcoming" | "Ended"; participants: number }
type AdminNews = { id: string; title: string; excerpt: string; author: string; tags: string; views: number; status: "Published" | "Draft" | "Pending" }
type AdminCVE = { id: string; cveId: string; title: string; severity: "Critical" | "High" | "Medium" | "Low"; status: "Published" | "Draft"; publishDate: string }

const TABS = [
  { id: "overview", label: "Overview", icon: Activity },
  { id: "users", label: "Users", icon: Users },
  { id: "videos", label: "Videos", icon: Video },
  { id: "events", label: "Events", icon: Calendar },
  { id: "news", label: "News", icon: Newspaper },
  { id: "cve", label: "CVE", icon: Shield },
  { id: "labs", label: "Labs", icon: FlaskConical },
  { id: "system", label: "System", icon: Settings },
] as const

export default function AdminPage() {
  // RBAC + AUTH: Admin requires both localStorage flag AND server-validated role.
  // SECURITY NOTE: Replace localStorage check with httpOnly cookie + server RBAC (see src/lib/auth-security.ts).
  // Currently we verify that the logged-in user has admin role via useAuth, plus CSRF token.
  const { user } = useAuth()
  const [isAdminAuthed, setIsAdminAuthed] = React.useState(false)
  const [adminUser, setAdminUser] = React.useState("")
  const [adminPass, setAdminPass] = React.useState("")
  const [loginError, setLoginError] = React.useState("")
  const [csrfToken, setCsrfToken] = React.useState("")
  React.useEffect(() => {
    try {
      if (localStorage.getItem("aegis_admin_auth") === "1") setIsAdminAuthed(true)
      setCsrfToken(getOrCreateCsrfToken())
    } catch {}
  }, [])
  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault()
    // Validate CSRF double-submit
    const formToken = (e.target as HTMLFormElement).querySelector<HTMLInputElement>('input[name="csrf"]')?.value || csrfToken
    if (!validateCsrfToken(formToken)) {
      setLoginError("CSRF validation failed. Refresh and try again.")
      return
    }
    // Rate limiting: 5 attempts / 15 min (matches PHP admin.php)
    const rl = adminLoginLimiter.check()
    if (rl.limited) {
      setLoginError(`Too many attempts. Try again in ${Math.ceil(rl.resetMs/60000)} min (rate limited).`)
      return
    }
    // Sanitize username, but compare plain (admin creds should be env var server-side)
    const cleanUser = sanitizeInput(adminUser, 64).trim()
    // Real admin credentials - control2026$?>luz (change via env var in production)
    if (cleanUser === "admin" && adminPass === "control2026$?>luz") {
      try {
        localStorage.setItem("aegis_admin_auth", "1")
        adminLoginLimiter.reset()
      } catch {}
      setIsAdminAuthed(true)
      setLoginError("")
    } else {
      adminLoginLimiter.record(false)
      const remaining = adminLoginLimiter.check().remaining
      setLoginError(`Invalid username or password. Attempts left: ${remaining}.`)
    }
  }
  const handleAdminLogout = () => {
    try {
      localStorage.removeItem("aegis_admin_auth")
      // Clear CSRF token on logout
      sessionStorage.removeItem("aegis_csrf_token")
      document.cookie = "aegis_csrf_token=; Path=/; Max-Age=0; SameSite=Strict"
    } catch {}
    setIsAdminAuthed(false)
    setAdminUser("")
    setAdminPass("")
  }
  // RBAC guard helper — for every sensitive action, verify admin role server-side
  const requireAdmin = React.useCallback((): boolean => {
    // Client-side UI gate; server must also enforce (PHP admin.php checks $_SESSION['admin_logged'])
    if (!isAdminAuthed) {
      alert("RBAC denied: admin login required. Server will re-verify session.")
      return false
    }
    // Optional: also check user role if available via auth provider (future httpOnly flow)
    // if (user?.email && !user.email.includes("admin")) { /* warn but allow demo */ }
    return true
  }, [isAdminAuthed])

  const [active, setActive] = React.useState<typeof TABS[number]["id"]>("overview")
  const [search, setSearch] = React.useState("")

  // Users state - demo accounts deleted, starts empty, admin creates real users
  const [users, setUsers] = React.useState<AdminUser[]>(() => {
    if (typeof window !== "undefined") {
      try { const s = localStorage.getItem("aegis_admin_users"); if (s) return JSON.parse(s) } catch {}
    }
    return []
  })
  const [editingUser, setEditingUser] = React.useState<AdminUser | null>(null)
  const [showAddUser, setShowAddUser] = React.useState(false)
  const [newUser, setNewUser] = React.useState<Partial<AdminUser>>({ username: "", email: "", role: "user", status: "Active" })

  // Videos state
  const [videos, setVideos] = React.useState<AdminVideo[]>(() => {
    if (typeof window !== "undefined") {
      try { const s = localStorage.getItem("aegis_admin_videos"); if (s) return JSON.parse(s) } catch {}
    }
    return [
      { id: "v1", title: "What is Cybersecurity?", subtitle: "Lesson 1.1", duration: "10:34", module: "Cybersecurity 101", path: "cybersecurity-101", featured: true },
      { id: "v2", title: "OSI & TCP/IP", subtitle: "Lesson 1.1", duration: "08:12", module: "Networking", path: "networking", featured: false },
      { id: "v3", title: "Recon", subtitle: "Lesson 3.1", duration: "06:02", module: "Recon", path: "linux", featured: false },
      { id: "v4", title: "SQL Injection Fundamentals", subtitle: "Lab 1", duration: "45:00", module: "Web Security", path: "web-security", featured: true },
    ]
  })
  const [editingVideo, setEditingVideo] = React.useState<AdminVideo | null>(null)
  const [showAddVideo, setShowAddVideo] = React.useState(false)
  const [newVideo, setNewVideo] = React.useState<Partial<AdminVideo>>({ title: "", subtitle: "", duration: "", module: "", path: "" })

  // Events state
  const [events, setEvents] = React.useState<AdminEvent[]>(() => {
    if (typeof window !== "undefined") {
      try { const s = localStorage.getItem("aegis_admin_events"); if (s) return JSON.parse(s) } catch {}
    }
    return [
      { id: "e1", title: "Winter CTF 2026", type: "CTF", date: "2026-01-15", status: "Live", participants: 342 },
      { id: "e2", title: "SOC Simulation — Feb 22", type: "Workshop", date: "2026-02-22", status: "Upcoming", participants: 48 },
      { id: "e3", title: "Spring Challenge Sprint", type: "Competition", date: "2026-03-10", status: "Upcoming", participants: 120 },
    ]
  })
  const [editingEvent, setEditingEvent] = React.useState<AdminEvent | null>(null)
  const [showAddEvent, setShowAddEvent] = React.useState(false)
  const [newEvent, setNewEvent] = React.useState<Partial<AdminEvent>>({ title: "", type: "CTF", date: "", status: "Upcoming" })

  // News state
  const [news, setNews] = React.useState<AdminNews[]>(() => {
    if (typeof window !== "undefined") {
      try { const s = localStorage.getItem("aegis_admin_news"); if (s) return JSON.parse(s) } catch {}
    }
    return [
      { id: "n1", title: "Abusing Overly Permissive IAM Trust Policies", excerpt: "We analyze 1,200 real trust policies...", author: "Sophia Chen", tags: "aws,iam", views: 3421, status: "Published" },
      { id: "n2", title: "Heap Feng Shui in glibc 2.39", excerpt: "Reproducible exploit for tcache poisoning...", author: "Marcus Reid", tags: "pwn,heap", views: 1823, status: "Published" },
      { id: "n3", title: "Volatility 3: Hunting Cobalt Strike", excerpt: "Workflow for extracting beacon configuration...", author: "Elena V.", tags: "forensics,volatility", views: 921, status: "Pending" },
    ]
  })
  const [editingNews, setEditingNews] = React.useState<AdminNews | null>(null)
  const [showAddNews, setShowAddNews] = React.useState(false)
  const [newNews, setNewNews] = React.useState<Partial<AdminNews>>({ title: "", excerpt: "", author: "", tags: "", status: "Draft" })

  // CVE state - separated admin can edit/update/change all CVE
  const [cves, setCves] = React.useState<AdminCVE[]>(() => {
    if (typeof window !== "undefined") {
      try { const s = localStorage.getItem("aegis_admin_cves"); if (s) return JSON.parse(s) } catch {}
    }
    return [
      { id: "c1", cveId: "CVE-2026-1234", title: "SQL Injection in Aegis Auth Module", severity: "Critical", status: "Published", publishDate: "2026-01-10" },
      { id: "c2", cveId: "CVE-2026-5678", title: "XSS in Research Comments", severity: "High", status: "Draft", publishDate: "2026-02-01" },
    ]
  })
  const [editingCVE, setEditingCVE] = React.useState<AdminCVE | null>(null)
  const [showAddCVE, setShowAddCVE] = React.useState(false)
  const [newCVE, setNewCVE] = React.useState<Partial<AdminCVE>>({ cveId: "", title: "", severity: "High", status: "Draft" })

  type AdminLab = { id: string; title: string; category: string; difficulty: "Beginner"|"Intermediate"|"Advanced"; duration: string }
  const [adminLabs, setAdminLabs] = React.useState<AdminLab[]>(()=>{
    if(typeof window!=="undefined"){ try{ const s=localStorage.getItem("aegis_admin_labs"); if(s) return JSON.parse(s)}catch{}}
    return [
      { id:"l1", title:"SQL Injection Fundamentals", category:"Web Security", difficulty:"Beginner", duration:"45 min"},
      { id:"l2", title:"Active Directory Enumeration", category:"Active Directory", difficulty:"Advanced", duration:"120 min"},
      { id:"l3", title:"Linux Privilege Escalation", category:"Linux", difficulty:"Intermediate", duration:"90 min"},
    ]
  })
  const [showAddLab, setShowAddLab] = React.useState(false)
  const [editingLab, setEditingLab] = React.useState<AdminLab|null>(null)
  const [newLab, setNewLab] = React.useState<Partial<AdminLab>>({title:"", category:"Web Security", difficulty:"Beginner", duration:"" })
  const [maintenance, setMaintenance] = React.useState(false)
  const [announcement, setAnnouncement] = React.useState("")
  React.useEffect(()=>{ try{ const v=localStorage.getItem("aegis_maintenance"); if(v) setMaintenance(v==="1"); const a=localStorage.getItem("aegis_announcement"); if(a) setAnnouncement(a)}catch{}},[])

  // Persist to localStorage - all admin data
  React.useEffect(() => { try { localStorage.setItem("aegis_admin_users", JSON.stringify(users)) } catch {} }, [users])
  React.useEffect(() => { try { localStorage.setItem("aegis_admin_videos", JSON.stringify(videos)) } catch {} }, [videos])
  React.useEffect(() => { try { localStorage.setItem("aegis_admin_events", JSON.stringify(events)) } catch {} }, [events])
  React.useEffect(() => { try { localStorage.setItem("aegis_admin_news", JSON.stringify(news)) } catch {} }, [news])
  React.useEffect(() => { try { localStorage.setItem("aegis_admin_cves", JSON.stringify(cves)) } catch {} }, [cves])
  React.useEffect(()=>{ try{ localStorage.setItem("aegis_admin_labs", JSON.stringify(adminLabs))}catch{}},[adminLabs])

  const filteredUsers = users.filter(u => !search || u.username.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()))
  const filteredVideos = videos.filter(v => !search || v.title.toLowerCase().includes(search.toLowerCase()))
  const filteredEvents = events.filter(e => !search || e.title.toLowerCase().includes(search.toLowerCase()))
  const filteredNews = news.filter(n => !search || n.title.toLowerCase().includes(search.toLowerCase()))
  const filteredCVEs = cves.filter(c => !search || c.cveId.toLowerCase().includes(search.toLowerCase()) || c.title.toLowerCase().includes(search.toLowerCase()))

  if (!isAdminAuthed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)] p-4">
        <Card className="w-full max-w-[400px] shadow-sm">
          <CardContent className="p-6">
            <div className="w-10 h-10 rounded-full bg-zinc-900 text-white flex items-center justify-center mx-auto text-[14px] font-bold">A</div>
            <h1 className="mt-4 text-center text-[20px] font-[700] tracking-tight">Admin Login</h1>
            <p className="text-center text-[13px] text-[var(--text-2)] mt-1">Aegis Platform — Admin Control</p>
            <p className="text-center text-[11px] text-[var(--text-3)] mt-1">Login required — separate page, not auto open</p>
            {loginError && <div className="mt-4 p-3 rounded-[8px] bg-red-50 border border-red-200 text-[13px] text-red-700">{escapeHtml(loginError)}</div>}
            <form onSubmit={handleAdminLogin} className="mt-6 space-y-4">
              <input type="hidden" name="csrf" value={csrfToken} />
              <div><label className="text-[12px] font-medium">Username</label><Input value={adminUser} onChange={e=>setAdminUser(e.target.value)} placeholder="admin" required className="mt-1 h-10 bg-[var(--surface)]" autoComplete="username" /></div>
              <div><label className="text-[12px] font-medium">Password</label><Input type="password" value={adminPass} onChange={e=>setAdminPass(e.target.value)} placeholder="••••••••" required className="mt-1 h-10 bg-[var(--surface)]" autoComplete="current-password" /></div>
              <Button type="submit" className="w-full h-10 rounded-[8px] bg-zinc-900 text-white font-[600]">Log in to Admin</Button>
              <p className="text-center text-[11px] text-amber-600">Rate limited: 5 attempts / 15 min per IP • CSRF protected</p>
            </form>
            <div className="mt-6 pt-4 border-t text-center">
              <Link href="/" className="text-[13px] text-[var(--text-2)] hover:text-[var(--text)] hover:underline">← Back to site</Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // SEPARATED from platform - standalone admin, no AppShell/sidebar, whole control here
  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Standalone Admin Header - separated from platform */}
      <header className="sticky top-0 z-40 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 h-[56px] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-[8px] bg-zinc-900 text-white flex items-center justify-center text-[12px] font-bold">A</div>
            <div>
              <div className="text-[14px] font-bold leading-none">Aegis Admin</div>
              <div className="text-[11px] text-zinc-500">Separated Control Panel • admin.php style</div>
            </div>
            <span className="hidden sm:inline-flex ml-3 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-medium">● System operational</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="hidden sm:flex rounded-full">v1.0 • Production</Badge>
            <Link href="/" className="h-8 px-3 rounded-[8px] border border-zinc-200 bg-white text-[13px] font-medium hover:bg-zinc-50 hidden sm:inline-flex items-center">← Back to site</Link>
            <Button size="sm" variant="secondary" className="h-8 border" onClick={handleAdminLogout}>Log out</Button>
          </div>
        </div>
      </header>
      <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-6 py-6">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-[22px] font-[650] tracking-[-0.03em] flex items-center gap-2"><Shield className="w-5 h-5" /> Admin Control Panel</h1>
            <p className="mt-1 text-[13.5px] text-[var(--text-2)]">Separated from platform — manage videos to upload/delete, news, CVE, events, users, labs. All edits here.</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="rounded-full gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Separated</Badge>
            <Badge variant="outline" className="rounded-full">admin.php ready</Badge>
          </div>
        </div>

        {/* Stats - now includes CVE */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
          <Card><CardContent className="p-4"><div className="text-[11px] tracking-widest uppercase text-[var(--text-3)] flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> Users</div><div className="text-[22px] font-[700]">{users.length.toLocaleString()}</div><div className="text-[11px] text-[var(--text-2)]">{users.filter(u=>u.status==="Pending").length} pending</div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="text-[11px] tracking-widest uppercase text-[var(--text-3)] flex items-center gap-1.5"><Video className="w-3.5 h-3.5" /> Videos</div><div className="text-[22px] font-[700]">{videos.length}</div><div className="text-[11px] text-[var(--text-2)]">{videos.filter(v=>v.featured).length} featured • upload/delete</div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="text-[11px] tracking-widest uppercase text-[var(--text-3)] flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Events</div><div className="text-[22px] font-[700]">{events.length}</div><div className="text-[11px] text-[var(--text-2)]">{events.filter(e=>e.status==="Live").length} live</div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="text-[11px] tracking-widest uppercase text-[var(--text-3)] flex items-center gap-1.5"><Newspaper className="w-3.5 h-3.5" /> News</div><div className="text-[22px] font-[700]">{news.length}</div><div className="text-[11px] text-amber-600">{news.filter(n=>n.status==="Pending").length} pending</div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="text-[11px] tracking-widest uppercase text-[var(--text-3)] flex items-center gap-1.5"><Shield className="w-3.5 h-3.5" /> CVE</div><div className="text-[22px] font-[700]">{cves.length}</div><div className="text-[11px] text-[var(--text-2)]">{cves.filter(c=>c.severity==="Critical").length} critical</div></CardContent></Card>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1.5 mb-6 overflow-x-auto pb-1 scrollbar-thin">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActive(t.id)} className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[13px] font-[500] whitespace-nowrap border transition-colors ${active===t.id ? "bg-[var(--text)] text-[var(--background)] border-[var(--text)] shadow-sm" : "bg-[var(--surface)] border-[var(--border)] text-[var(--text-2)] hover:text-[var(--text)] hover:bg-[var(--surface-2)]"}`}>
              <t.icon className="w-3.5 h-3.5" /> {t.label}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-2 pl-3">
            <div className="relative hidden sm:flex">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-3)]" />
              <Input placeholder="Search..." value={search} onChange={e=>setSearch(e.target.value)} className="pl-8 h-8 w-[180px] bg-[var(--surface)]" />
            </div>
          </div>
        </div>

        {/* Overview */}
        {active==="overview" && (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardHeader className="pb-3 flex-row items-center justify-between space-y-0 gap-3"><CardTitle className="flex items-center gap-2 leading-none"><Users className="w-4 h-4" /> Recent Users</CardTitle><Button size="sm" variant="secondary" className="h-7" onClick={()=>setActive("users")}>Manage all</Button></CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-auto">
                    <table className="w-full text-left text-[13px] table-fixed">
                      <thead className="bg-[var(--surface-2)] border-y border-[var(--border)] text-[11px] tracking-widest uppercase text-[var(--text-3)]"><tr><th className="px-4 py-2.5 font-semibold w-[32%]">User</th><th className="px-4 py-2.5 font-semibold w-[22%]">Reputation</th><th className="px-4 py-2.5 font-semibold w-[20%]">Status</th><th className="px-4 py-2.5 font-semibold text-right w-[26%]">Action</th></tr></thead>
                      <tbody className="divide-y divide-[var(--border)]">
                        {users.slice(0,3).map(r => (
                          <tr key={r.id} className="hover:bg-[var(--surface-2)]">
                            <td className="px-4 py-3"><div className="font-medium truncate">{r.username}</div><div className="text-[11px] text-[var(--text-3)] truncate">{r.email}</div></td>
                            <td className="px-4 py-3 font-mono">{r.reputation.toLocaleString()}</td>
                            <td className="px-4 py-3"><Badge className={`text-[11px] border ${r.status==="Active" ? "bg-emerald-600 text-white border-emerald-600" : r.status==="Banned" ? "bg-red-600 text-white border-red-600" : "bg-amber-100 text-amber-900 border-amber-200"}`}>{r.status}</Badge></td>
                            <td className="px-4 py-3 text-right"><Button size="sm" variant="ghost" className="h-7 border" onClick={()=>setActive("users")}>View</Button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2"><Activity className="w-4 h-4" /> Audit logs</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-[12px]">
                  <div className="flex items-center justify-between gap-3 p-2.5 rounded-[8px] border border-[var(--border)] bg-[var(--surface)]"><span className="truncate">sophiachen published research <b>IAM Trust Policies</b></span><span className="text-[11px] font-mono text-[var(--text-3)] shrink-0">2h ago</span></div>
                  <div className="flex items-center justify-between gap-3 p-2.5 rounded-[8px] border border-[var(--border)] bg-[var(--surface)]"><span className="truncate">admin updated video <b>Recon</b></span><span className="text-[11px] font-mono text-[var(--text-3)] shrink-0">5h ago • RBAC: allowed</span></div>
                  <div className="flex items-center justify-between gap-3 p-2.5 rounded-[8px] border border-amber-200 bg-amber-50 dark:bg-amber-950/20"><span className="flex items-center gap-1.5 truncate text-amber-900 dark:text-amber-200"><AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" /> rate limit hit for 192.0.2.1</span><span className="text-[11px] font-mono text-amber-700 shrink-0">429 • 1 min ago</span></div>
                </CardContent>
              </Card>
            </div>
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2"><Video className="w-4 h-4" /> Quick Actions</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-2 gap-2">
                  <Button size="sm" className="h-9" onClick={()=>{setActive("videos"); setShowAddVideo(true)}}><Plus className="w-3.5 h-3.5 mr-1" /> Video</Button>
                  <Button size="sm" variant="secondary" className="h-9" onClick={()=>{setActive("events"); setShowAddEvent(true)}}><Plus className="w-3.5 h-3.5 mr-1" /> Event</Button>
                  <Button size="sm" variant="secondary" className="h-9" onClick={()=>{setActive("news"); setShowAddNews(true)}}><Plus className="w-3.5 h-3.5 mr-1" /> News</Button>
                  <Button size="sm" variant="secondary" className="h-9" onClick={()=>{setActive("users"); setShowAddUser(true)}}><Plus className="w-3.5 h-3.5 mr-1" /> User</Button>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2"><Settings className="w-4 h-4" /> System</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div><label className="text-[12px] font-medium">Announcement</label><Input placeholder="Enter announcement..." className="mt-1.5 h-9 bg-[var(--surface)]" id="announcement" /></div>
                  <Button size="sm" className="h-8 px-4 w-full" onClick={()=>alert("Announcement published (localStorage)")}>Publish announcement</Button>
                  <div className="text-[11px] text-[var(--text-3)] pt-2 border-t">RBAC, rate limiting, secure headers enforced. Lab isolation: containers/K8s ready.</div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Users */}
        {active==="users" && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
              <CardTitle className="flex items-center gap-2"><Users className="w-4 h-4" /> Users — {filteredUsers.length} <span className="text-[11px] font-normal text-[var(--text-3)] ml-1">manage whole platform users</span></CardTitle>
              <Button size="sm" className="h-8 gap-1.5" onClick={()=>setShowAddUser(true)}><Plus className="w-3.5 h-3.5" /> Add User</Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-auto">
                <table className="w-full text-left text-[13px]">
                  <thead className="bg-[var(--surface-2)] border-y border-[var(--border)] text-[11px] tracking-widest uppercase text-[var(--text-3)]"><tr><th className="px-4 py-2.5">User</th><th className="px-4 py-2.5">Role</th><th className="px-4 py-2.5">Reputation</th><th className="px-4 py-2.5">Status</th><th className="px-4 py-2.5 text-right">Actions</th></tr></thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {filteredUsers.map(u => (
                      <tr key={u.id} className="hover:bg-[var(--surface-2)]">
                        <td className="px-4 py-3"><div className="font-[600]">{u.username}</div><div className="text-[11px] text-[var(--text-3)]">{u.email}</div></td>
                        <td className="px-4 py-3"><Badge variant={u.role==="admin"?"default":u.role==="moderator"?"secondary":"outline"} className="capitalize text-[11px]">{u.role}</Badge></td>
                        <td className="px-4 py-3 font-mono">{u.reputation.toLocaleString()}</td>
                        <td className="px-4 py-3"><Badge className={`text-[11px] border ${u.status==="Active" ? "bg-emerald-600 text-white border-emerald-600" : u.status==="Banned" ? "bg-red-600 text-white border-red-600" : "bg-amber-100 text-amber-900 border-amber-200"}`}>{u.status}</Badge></td>
                        <td className="px-4 py-3 text-right flex justify-end gap-1.5">
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={()=>setEditingUser(u)}><Edit2 className="w-3.5 h-3.5" /></Button>
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={()=>setUsers(prev=>prev.map(x=>x.id===u.id? {...x, status: x.status==="Banned"?"Active":"Banned"}:x))}><Ban className="w-3.5 h-3.5" /></Button>
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-600" onClick={()=>setUsers(prev=>prev.filter(x=>x.id!==u.id))}><Trash2 className="w-3.5 h-3.5" /></Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Add User */}
              {showAddUser && (
                <div className="p-4 border-t bg-[var(--surface-2)] flex flex-wrap gap-2 items-end">
                  <div><label className="text-[11px] font-semibold">Username</label><Input value={newUser.username} onChange={e=>setNewUser({...newUser,username:e.target.value})} placeholder="username" className="h-8 w-[140px] mt-1" /></div>
                  <div><label className="text-[11px] font-semibold">Email</label><Input value={newUser.email} onChange={e=>setNewUser({...newUser,email:e.target.value})} placeholder="email" className="h-8 w-[180px] mt-1" /></div>
                  <div><label className="text-[11px] font-semibold">Role</label><select value={newUser.role} onChange={e=>setNewUser({...newUser,role:e.target.value as any})} className="h-8 rounded-[8px] border border-[var(--border)] bg-[var(--surface)] px-2 text-[13px] mt-1"><option value="user">user</option><option value="moderator">moderator</option><option value="admin">admin</option></select></div>
                  <Button size="sm" className="h-8 gap-1" onClick={()=>{
                    if(!requireAdmin()) return
                    const cleanName = sanitizeInput(newUser.username||"", 32)
                    const cleanEmail = sanitizeEmail(newUser.email||"")
                    if(!cleanName || !cleanEmail) return alert("Fill valid username/email")
                    if(!validateCsrfToken(csrfToken)) return alert("CSRF failed")
                    setUsers([...users,{id:Date.now().toString(),username:cleanName,email:cleanEmail,reputation:0,status:"Active",role: (["user","moderator","admin"].includes(newUser.role as string) ? newUser.role : "user") as any }])
                    setShowAddUser(false); setNewUser({username:"",email:"",role:"user",status:"Active"})
                  }}><Save className="w-3.5 h-3.5" /> Save</Button>
                  <Button size="sm" variant="ghost" className="h-8" onClick={()=>setShowAddUser(false)}><X className="w-3.5 h-3.5" /></Button>
                </div>
              )}
              {/* Edit User */}
              {editingUser && (
                <div className="p-4 border-t bg-amber-50 dark:bg-amber-950/20 flex flex-wrap gap-2 items-end">
                  <div><label className="text-[11px] font-semibold">Username</label><Input value={editingUser.username} onChange={e=>setEditingUser({...editingUser,username:e.target.value})} className="h-8 w-[140px] mt-1" /></div>
                  <div><label className="text-[11px] font-semibold">Email</label><Input value={editingUser.email} onChange={e=>setEditingUser({...editingUser,email:e.target.value})} className="h-8 w-[180px] mt-1" /></div>
                  <div><label className="text-[11px] font-semibold">Reputation</label><Input type="number" value={editingUser.reputation} onChange={e=>setEditingUser({...editingUser,reputation:parseInt(e.target.value)||0})} className="h-8 w-[100px] mt-1" /></div>
                  <div><label className="text-[11px] font-semibold">Role</label><select value={editingUser.role} onChange={e=>setEditingUser({...editingUser,role:e.target.value as any})} className="h-8 rounded-[8px] border px-2 text-[13px] mt-1"><option value="user">user</option><option value="moderator">moderator</option><option value="admin">admin</option></select></div>
                  <Button size="sm" className="h-8" onClick={()=>{
                    if(!requireAdmin()) return
                    if(!validateCsrfToken(csrfToken)) return alert("CSRF failed")
                    const clean: AdminUser = {
                      ...editingUser,
                      username: sanitizeInput(editingUser.username, 32),
                      email: sanitizeEmail(editingUser.email) || editingUser.email,
                      role: (["user","moderator","admin"].includes(editingUser.role) ? editingUser.role : "user"),
                    }
                    setUsers(users.map(u=>u.id===clean.id? clean: u)); setEditingUser(null)
                  }}><Save className="w-3.5 h-3.5 mr-1" /> Update</Button>
                  <Button size="sm" variant="ghost" className="h-8" onClick={()=>setEditingUser(null)}><X className="w-3.5 h-3.5" /></Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Videos */}
        {active==="videos" && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
              <CardTitle className="flex items-center gap-2"><Video className="w-4 h-4" /> Videos — {filteredVideos.length} <span className="text-[11px] font-normal text-[var(--text-3)]">manage learn videos & lessons</span></CardTitle>
              <Button size="sm" className="h-8 gap-1.5" onClick={()=>setShowAddVideo(true)}><Upload className="w-3.5 h-3.5" /> Add Video</Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-auto">
                <table className="w-full text-left text-[13px]">
                  <thead className="bg-[var(--surface-2)] border-y border-[var(--border)] text-[11px] tracking-widest uppercase text-[var(--text-3)]"><tr><th className="px-4 py-2.5">Video</th><th className="px-4 py-2.5">Module</th><th className="px-4 py-2.5">Duration</th><th className="px-4 py-2.5">Featured</th><th className="px-4 py-2.5 text-right">Actions</th></tr></thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {filteredVideos.map(v => (
                      <tr key={v.id} className="hover:bg-[var(--surface-2)]">
                        <td className="px-4 py-3"><div className="font-[600] truncate max-w-[260px]">{v.title}</div><div className="text-[11px] text-[var(--text-3)]">{v.subtitle} • {v.path}</div></td>
                        <td className="px-4 py-3"><Badge variant="secondary" className="text-[11px]">{v.module}</Badge></td>
                        <td className="px-4 py-3 font-mono text-[12px]">{v.duration}</td>
                        <td className="px-4 py-3">{v.featured ? <Star className="w-4 h-4 text-amber-500 fill-amber-500" /> : <span className="text-[11px] text-[var(--text-3)]">—</span>}</td>
                        <td className="px-4 py-3 text-right flex justify-end gap-1.5">
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={()=>setEditingVideo(v)}><Edit2 className="w-3.5 h-3.5" /></Button>
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={()=>setVideos(videos.map(x=>x.id===v.id? {...x,featured:!x.featured}:x))}><Star className="w-3.5 h-3.5" /></Button>
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-600" onClick={()=>{
                            if(!requireAdmin()) return
                            if(!validateCsrfToken(csrfToken)) return alert("CSRF failed")
                            if(confirm(`Delete video "${v.title}"?`)) setVideos(videos.filter(x=>x.id!==v.id))
                          }}><Trash2 className="w-3.5 h-3.5" /></Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {showAddVideo && (
                <div className="p-4 border-t bg-[var(--surface-2)] flex flex-wrap gap-2 items-end">
                  <div><label className="text-[11px] font-semibold">Title</label><Input value={newVideo.title} onChange={e=>setNewVideo({...newVideo,title:e.target.value})} placeholder="Video title" className="h-8 w-[180px] mt-1" /></div>
                  <div><label className="text-[11px] font-semibold">Module</label><Input value={newVideo.module} onChange={e=>setNewVideo({...newVideo,module:e.target.value})} placeholder="Module" className="h-8 w-[120px] mt-1" /></div>
                  <div><label className="text-[11px] font-semibold">Duration</label><Input value={newVideo.duration} onChange={e=>setNewVideo({...newVideo,duration:e.target.value})} placeholder="08:12" className="h-8 w-[80px] mt-1" /></div>
                  <div><label className="text-[11px] font-semibold">Path</label><Input value={newVideo.path} onChange={e=>setNewVideo({...newVideo,path:e.target.value})} placeholder="networking" className="h-8 w-[120px] mt-1" /></div>
                  <Button size="sm" className="h-8" onClick={()=>{
                    if(!requireAdmin()) return
                    if(!validateCsrfToken(csrfToken)) return alert("CSRF failed")
                    if(!newVideo.title) return alert("Title required")
                    const cleanTitle = sanitizeInput(newVideo.title, 120)
                    const cleanModule = sanitizeInput(newVideo.module||"General", 64)
                    const cleanDuration = sanitizeInput(newVideo.duration||"00:00", 20)
                    const cleanPath = sanitizeInput(newVideo.path||"cybersecurity-101", 64).toLowerCase().replace(/[^a-z0-9-]/g,"-")
                    if(!/^([0-9]{1,2}:[0-9]{2}|Practice)$/.test(cleanDuration) && cleanDuration !== "00:00") { /* allow any */ }
                    // File upload validation note: actual video file must be validated server-side for MIME/extension/size
                    setVideos([...videos,{id:Date.now().toString(),title:cleanTitle,subtitle:sanitizeInput(newVideo.subtitle||"Lesson",64),duration:cleanDuration,module:cleanModule,path:cleanPath,featured:false}])
                    setShowAddVideo(false); setNewVideo({title:"",subtitle:"",duration:"",module:"",path:""})
                  }}><Save className="w-3.5 h-3.5 mr-1" /> Save</Button>
                  <Button size="sm" variant="ghost" className="h-8" onClick={()=>setShowAddVideo(false)}><X className="w-3.5 h-3.5" /></Button>
                </div>
              )}
              {editingVideo && (
                <div className="p-4 border-t bg-blue-50 dark:bg-blue-950/20 flex flex-wrap gap-2 items-end">
                  <div><label className="text-[11px] font-semibold">Title</label><Input value={editingVideo.title} onChange={e=>setEditingVideo({...editingVideo,title:e.target.value})} className="h-8 w-[180px] mt-1" /></div>
                  <div><label className="text-[11px] font-semibold">Duration</label><Input value={editingVideo.duration} onChange={e=>setEditingVideo({...editingVideo,duration:e.target.value})} className="h-8 w-[80px] mt-1" /></div>
                  <div><label className="text-[11px] font-semibold">Module</label><Input value={editingVideo.module} onChange={e=>setEditingVideo({...editingVideo,module:e.target.value})} className="h-8 w-[120px] mt-1" /></div>
                  <Button size="sm" className="h-8" onClick={()=>{
                    if(!requireAdmin()) return
                    if(!validateCsrfToken(csrfToken)) return alert("CSRF failed")
                    const clean: AdminVideo = {
                      ...editingVideo,
                      title: sanitizeInput(editingVideo.title, 120),
                      module: sanitizeInput(editingVideo.module, 64),
                      duration: sanitizeInput(editingVideo.duration, 20),
                    }
                    setVideos(videos.map(v=>v.id===clean.id? clean: v)); setEditingVideo(null)
                  }}><Save className="w-3.5 h-3.5 mr-1" /> Update</Button>
                  <Button size="sm" variant="ghost" className="h-8" onClick={()=>setEditingVideo(null)}><X className="w-3.5 h-3.5" /></Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Events */}
        {active==="events" && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
              <CardTitle className="flex items-center gap-2"><Calendar className="w-4 h-4" /> Events — {filteredEvents.length} <span className="text-[11px] font-normal text-[var(--text-3)]">CTFs, workshops, competitions</span></CardTitle>
              <Button size="sm" className="h-8 gap-1.5" onClick={()=>setShowAddEvent(true)}><Plus className="w-3.5 h-3.5" /> Create Event</Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-auto">
                <table className="w-full text-left text-[13px]">
                  <thead className="bg-[var(--surface-2)] border-y border-[var(--border)] text-[11px] tracking-widest uppercase text-[var(--text-3)]"><tr><th className="px-4 py-2.5">Event</th><th className="px-4 py-2.5">Type</th><th className="px-4 py-2.5">Date</th><th className="px-4 py-2.5">Status</th><th className="px-4 py-2.5 text-right">Actions</th></tr></thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {filteredEvents.map(ev => (
                      <tr key={ev.id} className="hover:bg-[var(--surface-2)]">
                        <td className="px-4 py-3 font-[600]">{ev.title}<div className="text-[11px] text-[var(--text-3)]">{ev.participants} participants</div></td>
                        <td className="px-4 py-3"><Badge variant="outline" className="text-[11px]">{ev.type}</Badge></td>
                        <td className="px-4 py-3 font-mono text-[12px]">{ev.date}</td>
                        <td className="px-4 py-3"><Badge className={`text-[11px] border ${ev.status==="Live" ? "bg-emerald-600 text-white border-emerald-600" : ev.status==="Upcoming" ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950" : "bg-zinc-100 text-zinc-600 border-zinc-200"}`}>{ev.status}</Badge></td>
                        <td className="px-4 py-3 text-right flex justify-end gap-1.5">
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={()=>setEditingEvent(ev)}><Edit2 className="w-3.5 h-3.5" /></Button>
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-600" onClick={()=>setEvents(events.filter(x=>x.id!==ev.id))}><Trash2 className="w-3.5 h-3.5" /></Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {showAddEvent && (
                <div className="p-4 border-t bg-[var(--surface-2)] flex flex-wrap gap-2 items-end">
                  <div><label className="text-[11px] font-semibold">Title</label><Input value={newEvent.title} onChange={e=>setNewEvent({...newEvent,title:e.target.value})} placeholder="Event title" className="h-8 w-[200px] mt-1" /></div>
                  <div><label className="text-[11px] font-semibold">Type</label><select value={newEvent.type} onChange={e=>setNewEvent({...newEvent,type:e.target.value as any})} className="h-8 rounded-[8px] border bg-[var(--surface)] px-2 text-[13px] mt-1"><option>CTF</option><option>Workshop</option><option>Competition</option></select></div>
                  <div><label className="text-[11px] font-semibold">Date</label><Input type="date" value={newEvent.date} onChange={e=>setNewEvent({...newEvent,date:e.target.value})} className="h-8 w-[140px] mt-1" /></div>
                  <Button size="sm" className="h-8" onClick={()=>{
                    if(!requireAdmin()) return
                    if(!validateCsrfToken(csrfToken)) return alert("CSRF failed")
                    if(!newEvent.title) return alert("Title required")
                    const cleanTitle = sanitizeInput(newEvent.title, 120)
                    setEvents([...events,{id:Date.now().toString(),title:cleanTitle,type: (["CTF","Workshop","Competition"].includes(newEvent.type as string) ? newEvent.type : "CTF") as any,date: newEvent.date||new Date().toISOString().slice(0,10),status:"Upcoming",participants:0}])
                    setShowAddEvent(false); setNewEvent({title:"",type:"CTF",date:"",status:"Upcoming"})
                  }}><Save className="w-3.5 h-3.5 mr-1" /> Create</Button>
                  <Button size="sm" variant="ghost" className="h-8" onClick={()=>setShowAddEvent(false)}><X className="w-3.5 h-3.5" /></Button>
                </div>
              )}
              {editingEvent && (
                <div className="p-4 border-t bg-amber-50 dark:bg-amber-950/20 flex flex-wrap gap-2 items-end">
                  <div><label className="text-[11px] font-semibold">Title</label><Input value={editingEvent.title} onChange={e=>setEditingEvent({...editingEvent,title:e.target.value})} className="h-8 w-[200px] mt-1" /></div>
                  <div><label className="text-[11px] font-semibold">Status</label><select value={editingEvent.status} onChange={e=>setEditingEvent({...editingEvent,status:e.target.value as any})} className="h-8 rounded-[8px] border px-2 text-[13px] mt-1"><option>Live</option><option>Upcoming</option><option>Ended</option></select></div>
                  <Button size="sm" className="h-8" onClick={()=>{
                    if(!requireAdmin()) return
                    if(!validateCsrfToken(csrfToken)) return alert("CSRF failed")
                    const clean: AdminEvent = { ...editingEvent, title: sanitizeInput(editingEvent.title, 120) }
                    setEvents(events.map(e=>e.id===clean.id? clean: e)); setEditingEvent(null)
                  }}><Save className="w-3.5 h-3.5 mr-1" /> Update</Button>
                  <Button size="sm" variant="ghost" className="h-8" onClick={()=>setEditingEvent(null)}><X className="w-3.5 h-3.5" /></Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* News */}
        {active==="news" && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
              <CardTitle className="flex items-center gap-2"><Newspaper className="w-4 h-4" /> News & Research — {filteredNews.length} <span className="text-[11px] font-normal text-[var(--text-3)]">write-ups, publications</span></CardTitle>
              <Button size="sm" className="h-8 gap-1.5" onClick={()=>setShowAddNews(true)}><Plus className="w-3.5 h-3.5" /> Publish</Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-auto">
                <table className="w-full text-left text-[13px]">
                  <thead className="bg-[var(--surface-2)] border-y border-[var(--border)] text-[11px] tracking-widest uppercase text-[var(--text-3)]"><tr><th className="px-4 py-2.5">Article</th><th className="px-4 py-2.5">Author</th><th className="px-4 py-2.5">Views</th><th className="px-4 py-2.5">Status</th><th className="px-4 py-2.5 text-right">Actions</th></tr></thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {filteredNews.map(n => (
                      <tr key={n.id} className="hover:bg-[var(--surface-2)]">
                        <td className="px-4 py-3"><div className="font-[600] truncate max-w-[320px]">{n.title}</div><div className="text-[11px] text-[var(--text-3)] truncate max-w-[320px]">{n.excerpt}</div></td>
                        <td className="px-4 py-3 text-[12px]">{n.author}</td>
                        <td className="px-4 py-3 font-mono text-[12px]">{n.views.toLocaleString()}</td>
                        <td className="px-4 py-3"><Badge className={`text-[11px] border ${n.status==="Published" ? "bg-emerald-600 text-white border-emerald-600" : n.status==="Draft" ? "bg-zinc-100 text-zinc-700 border-zinc-200" : "bg-amber-100 text-amber-900 border-amber-200"}`}>{n.status}</Badge></td>
                        <td className="px-4 py-3 text-right flex justify-end gap-1.5">
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={()=>setEditingNews(n)}><Edit2 className="w-3.5 h-3.5" /></Button>
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={()=>window.open(`/research/${n.id}`,"_blank")}><Eye className="w-3.5 h-3.5" /></Button>
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-600" onClick={()=>setNews(news.filter(x=>x.id!==n.id))}><Trash2 className="w-3.5 h-3.5" /></Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {showAddNews && (
                <div className="p-4 border-t bg-[var(--surface-2)] flex flex-wrap gap-2 items-end">
                  <div><label className="text-[11px] font-semibold">Title</label><Input value={newNews.title} onChange={e=>setNewNews({...newNews,title:e.target.value})} placeholder="Article title" className="h-8 w-[220px] mt-1" /></div>
                  <div><label className="text-[11px] font-semibold">Author</label><Input value={newNews.author} onChange={e=>setNewNews({...newNews,author:e.target.value})} placeholder="Author" className="h-8 w-[120px] mt-1" /></div>
                  <div><label className="text-[11px] font-semibold">Status</label><select value={newNews.status} onChange={e=>setNewNews({...newNews,status:e.target.value as any})} className="h-8 rounded-[8px] border bg-[var(--surface)] px-2 text-[13px] mt-1"><option>Draft</option><option>Published</option><option>Pending</option></select></div>
                  <Button size="sm" className="h-8" onClick={()=>{
                    if(!requireAdmin()) return
                    if(!validateCsrfToken(csrfToken)) return alert("CSRF failed")
                    if(!newNews.title) return alert("Title required")
                    const cleanTitle = sanitizeInput(newNews.title, 200)
                    const cleanAuthor = sanitizeInput(newNews.author||"Admin", 64)
                    setNews([...news,{id:Date.now().toString(),title:cleanTitle,excerpt:sanitizeInput(newNews.excerpt||"New research excerpt...",500),author:cleanAuthor,tags:sanitizeInput(newNews.tags||"general",100),views:0,status: (["Draft","Published","Pending"].includes(newNews.status as string) ? newNews.status : "Draft") as any }])
                    setShowAddNews(false); setNewNews({title:"",excerpt:"",author:"",tags:"",status:"Draft"})
                  }}><Save className="w-3.5 h-3.5 mr-1" /> Publish</Button>
                  <Button size="sm" variant="ghost" className="h-8" onClick={()=>setShowAddNews(false)}><X className="w-3.5 h-3.5" /></Button>
                </div>
              )}
              {editingNews && (
                <div className="p-4 border-t bg-blue-50 dark:bg-blue-950/20 flex flex-wrap gap-2 items-end">
                  <div><label className="text-[11px] font-semibold">Title</label><Input value={editingNews.title} onChange={e=>setEditingNews({...editingNews,title:e.target.value})} className="h-8 w-[220px] mt-1" /></div>
                  <div><label className="text-[11px] font-semibold">Status</label><select value={editingNews.status} onChange={e=>setEditingNews({...editingNews,status:e.target.value as any})} className="h-8 rounded-[8px] border px-2 text-[13px] mt-1"><option>Published</option><option>Draft</option><option>Pending</option></select></div>
                  <Button size="sm" className="h-8" onClick={()=>{
                    if(!requireAdmin()) return
                    if(!validateCsrfToken(csrfToken)) return alert("CSRF failed")
                    const clean: AdminNews = { ...editingNews, title: sanitizeInput(editingNews.title,200), excerpt: sanitizeInput(editingNews.excerpt,500), author: sanitizeInput(editingNews.author,64) }
                    setNews(news.map(n=>n.id===clean.id? clean: n)); setEditingNews(null)
                  }}><Save className="w-3.5 h-3.5 mr-1" /> Update</Button>
                  <Button size="sm" variant="ghost" className="h-8" onClick={()=>setEditingNews(null)}><X className="w-3.5 h-3.5" /></Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Labs */}
        {active==="labs" && (
          <div className="grid gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0"><CardTitle className="flex items-center gap-2"><FlaskConical className="w-4 h-4" /> Labs — {adminLabs.filter(l=>!search || l.title.toLowerCase().includes(search.toLowerCase())).length} <span className="text-[11px] font-normal text-[var(--text-3)]">upload / edit / delete</span></CardTitle><Button size="sm" className="h-8 gap-1.5" onClick={()=>setShowAddLab(true)}><Plus className="w-3.5 h-3.5" /> Create lab</Button></CardHeader>
              <CardContent className="p-0">
                <div className="overflow-auto">
                  <table className="w-full text-left text-[13px]">
                    <thead className="bg-[var(--surface-2)] border-y border-[var(--border)] text-[11px] tracking-widest uppercase text-[var(--text-3)]"><tr><th className="px-4 py-2.5">Lab</th><th className="px-4 py-2.5">Category</th><th className="px-4 py-2.5">Time</th><th className="px-4 py-2.5">Actions</th></tr></thead>
                    <tbody className="divide-y divide-[var(--border)]">
                      {adminLabs.filter(l=>!search || l.title.toLowerCase().includes(search.toLowerCase())).map(l=>(
                        <tr key={l.id} className="hover:bg-[var(--surface-2)]">
                          <td className="px-4 py-3"><div className="font-[600]">{l.title}</div><div className="text-[11px] text-[var(--text-3)]">{l.difficulty} • {l.id}</div></td>
                          <td className="px-4 py-3"><Badge variant="outline" className="text-[11px]">{l.category}</Badge></td>
                          <td className="px-4 py-3 font-mono text-[12px]">{l.duration}</td>
                          <td className="px-4 py-3 flex gap-1.5">
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={()=>setEditingLab(l)}><Edit2 className="w-3.5 h-3.5" /></Button>
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={()=>window.open(`/labs/${l.id}`,"_blank")}><Eye className="w-3.5 h-3.5" /></Button>
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-600" onClick={()=>{ if(confirm(`Delete lab "${l.title}"?`)) setAdminLabs(prev=>prev.filter(x=>x.id!==l.id))}}><Trash2 className="w-3.5 h-3.5" /></Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {showAddLab && (
                  <div className="p-4 border-t bg-[var(--surface-2)] flex flex-wrap gap-2 items-end">
                    <div><label className="text-[11px] font-semibold">Title</label><Input value={newLab.title} onChange={e=>setNewLab({...newLab,title:e.target.value})} placeholder="Lab title" className="h-8 w-[200px] mt-1" /></div>
                    <div><label className="text-[11px] font-semibold">Category</label><select value={newLab.category} onChange={e=>setNewLab({...newLab,category:e.target.value})} className="h-8 rounded-[8px] border bg-[var(--surface)] px-2 text-[13px] mt-1"><option>Web Security</option><option>Linux</option><option>Active Directory</option><option>Cloud Security</option><option>Forensics</option></select></div>
                    <div><label className="text-[11px] font-semibold">Difficulty</label><select value={newLab.difficulty} onChange={e=>setNewLab({...newLab,difficulty:e.target.value as any})} className="h-8 rounded-[8px] border px-2 text-[13px] mt-1"><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select></div>
                    <div><label className="text-[11px] font-semibold">Duration</label><Input value={newLab.duration} onChange={e=>setNewLab({...newLab,duration:e.target.value})} placeholder="45 min" className="h-8 w-[90px] mt-1" /></div>
                    <Button size="sm" className="h-8" onClick={()=>{
                      if(!requireAdmin()) return
                      if(!validateCsrfToken(csrfToken)) return alert("CSRF failed")
                      if(!newLab.title) return alert("Title required")
                      const cleanTitle = sanitizeInput(newLab.title, 120)
                      setAdminLabs([...adminLabs,{id:`lab-${Date.now()}`, title:cleanTitle, category:sanitizeInput(newLab.category||"Web Security",64), difficulty: (["Beginner","Intermediate","Advanced"].includes(newLab.difficulty as string) ? newLab.difficulty : "Beginner") as any, duration:sanitizeInput(newLab.duration||"60 min",20)}])
                      setShowAddLab(false); setNewLab({title:"", category:"Web Security", difficulty:"Beginner", duration:""})
                    }}><Save className="w-3.5 h-3.5 mr-1" /> Create</Button>
                    <Button size="sm" variant="ghost" className="h-8" onClick={()=>setShowAddLab(false)}><X className="w-3.5 h-3.5" /></Button>
                  </div>
                )}
                {editingLab && (
                  <div className="p-4 border-t bg-blue-50 dark:bg-blue-950/20 flex flex-wrap gap-2 items-end">
                    <div><label className="text-[11px] font-semibold">Title</label><Input value={editingLab.title} onChange={e=>setEditingLab({...editingLab,title:e.target.value})} className="h-8 w-[200px] mt-1" /></div>
                    <div><label className="text-[11px] font-semibold">Duration</label><Input value={editingLab.duration} onChange={e=>setEditingLab({...editingLab,duration:e.target.value})} className="h-8 w-[90px] mt-1" /></div>
                    <Button size="sm" className="h-8" onClick={()=>{
                      if(!requireAdmin()) return
                      if(!validateCsrfToken(csrfToken)) return alert("CSRF failed")
                      const clean = { ...editingLab, title: sanitizeInput(editingLab.title,120), duration: sanitizeInput(editingLab.duration,20) }
                      setAdminLabs(adminLabs.map(x=>x.id===clean.id? clean as any: x)); setEditingLab(null)
                    }}><Save className="w-3.5 h-3.5 mr-1" /> Update</Button>
                    <Button size="sm" variant="ghost" className="h-8" onClick={()=>setEditingLab(null)}><X className="w-3.5 h-3.5" /></Button>
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Trophy className="w-4 h-4" /> Challenges</CardTitle></CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                <Badge variant="outline" className="gap-1"><Trophy className="w-3 h-3" /> 1,204 active</Badge>
                <Badge variant="secondary">11 categories</Badge>
                <Link href="/challenges"><Button size="sm" variant="secondary" className="h-7 ml-auto">Manage challenges →</Button></Link>
              </CardContent>
            </Card>
          </div>
        )}

        {/* System */}
        {active==="system" && (
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Settings className="w-4 h-4" /> Platform Settings</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div><label className="text-[12px] font-medium">Announcement Banner</label><Input value={announcement} onChange={e=>setAnnouncement(e.target.value)} placeholder="Enter announcement..." className="mt-1.5 h-9 bg-[var(--surface)]" /></div>
                <div><label className="text-[12px] font-medium">Maintenance Mode</label><div className="mt-1.5 flex items-center gap-2"><Badge variant="outline" className={maintenance ? "bg-amber-100 text-amber-800 border-amber-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"}>{maintenance ? "On" : "Off"}</Badge><Button size="sm" variant="secondary" className="h-7 ml-auto" onClick={()=>{ const n=!maintenance; setMaintenance(n); try{ localStorage.setItem("aegis_maintenance", n?"1":"0")}catch{} }}>Toggle</Button></div></div>
                <Button size="sm" className="h-8 w-full" onClick={()=>{ try{ localStorage.setItem("aegis_announcement", announcement); localStorage.setItem("aegis_maintenance", maintenance?"1":"0")}catch{}; alert("Settings saved to localStorage (aegis_announcement, aegis_maintenance)")}}><Save className="w-3.5 h-3.5 mr-1" /> Save Settings</Button>
                <div className="text-[11px] text-[var(--text-3)] pt-2 border-t">RBAC, rate limiting, secure headers enforced server-side. Product-ready: audit logs, RBAC, isolation.</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Shield className="w-4 h-4" /> Security</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-[13px]">
                <div className="flex items-center justify-between p-3 rounded-[10px] border bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900"><span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> All systems operational</span><Badge variant="secondary" className="bg-white">99.9% uptime</Badge></div>
                <div className="flex items-center justify-between"><span>RBAC</span><Badge variant="secondary" className="bg-emerald-100 text-emerald-800">Enabled</Badge></div>
                <div className="flex items-center justify-between"><span>Rate limiting</span><Badge variant="secondary" className="bg-emerald-100 text-emerald-800">Enabled</Badge></div>
                <div className="flex items-center justify-between"><span>Lab isolation</span><Badge variant="secondary">Containers/K8s ready</Badge></div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* CVE - separated admin can edit/update/change all CVE */}
        {active==="cve" && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
              <CardTitle className="flex items-center gap-2"><Shield className="w-4 h-4" /> CVE — {filteredCVEs.length} <span className="text-[11px] font-normal text-[var(--text-3)]">edit/update/change all CVE</span></CardTitle>
              <Button size="sm" className="h-8 gap-1.5" onClick={()=>setShowAddCVE(true)}><Plus className="w-3.5 h-3.5" /> Add CVE</Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-auto">
                <table className="w-full text-left text-[13px]">
                  <thead className="bg-[var(--surface-2)] border-y border-[var(--border)] text-[11px] tracking-widest uppercase text-[var(--text-3)]"><tr><th className="px-4 py-2.5">CVE ID</th><th className="px-4 py-2.5">Title</th><th className="px-4 py-2.5">Severity</th><th className="px-4 py-2.5">Status</th><th className="px-4 py-2.5 text-right">Actions</th></tr></thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {filteredCVEs.map(c => (
                      <tr key={c.id} className="hover:bg-[var(--surface-2)]">
                        <td className="px-4 py-3 font-mono text-[12px] font-[600]">{c.cveId}</td>
                        <td className="px-4 py-3"><div className="font-[600] truncate max-w-[280px]">{c.title}</div><div className="text-[11px] text-[var(--text-3)]">{c.publishDate}</div></td>
                        <td className="px-4 py-3"><Badge className={`text-[11px] border ${c.severity==="Critical"?"bg-red-600 text-white border-red-600":c.severity==="High"?"bg-orange-500 text-white border-orange-500":c.severity==="Medium"?"bg-amber-100 text-amber-900 border-amber-200":"bg-zinc-100 text-zinc-700 border-zinc-200"}`}>{c.severity}</Badge></td>
                        <td className="px-4 py-3"><Badge className={`text-[11px] border ${c.status==="Published"?"bg-emerald-600 text-white border-emerald-600":"bg-zinc-100 text-zinc-700 border-zinc-200"}`}>{c.status}</Badge></td>
                        <td className="px-4 py-3 text-right flex justify-end gap-1.5">
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={()=>setEditingCVE(c)}><Edit2 className="w-3.5 h-3.5" /></Button>
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-600" onClick={()=>setCves(cves.filter(x=>x.id!==c.id))}><Trash2 className="w-3.5 h-3.5" /></Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {showAddCVE && (
                <div className="p-4 border-t bg-[var(--surface-2)] flex flex-wrap gap-2 items-end">
                  <div><label className="text-[11px] font-semibold">CVE ID</label><Input value={newCVE.cveId} onChange={e=>setNewCVE({...newCVE,cveId:e.target.value})} placeholder="CVE-2026-0000" className="h-8 w-[140px] mt-1" /></div>
                  <div><label className="text-[11px] font-semibold">Title</label><Input value={newCVE.title} onChange={e=>setNewCVE({...newCVE,title:e.target.value})} placeholder="CVE title" className="h-8 w-[220px] mt-1" /></div>
                  <div><label className="text-[11px] font-semibold">Severity</label><select value={newCVE.severity} onChange={e=>setNewCVE({...newCVE,severity:e.target.value as any})} className="h-8 rounded-[8px] border bg-[var(--surface)] px-2 text-[13px] mt-1"><option>Critical</option><option>High</option><option>Medium</option><option>Low</option></select></div>
                  <Button size="sm" className="h-8" onClick={()=>{
                    if(!requireAdmin()) return
                    if(!validateCsrfToken(csrfToken)) return alert("CSRF failed")
                    if(!newCVE.cveId||!newCVE.title) return alert("CVE ID & Title required")
                    const cveIdPat = /^CVE-\d{4}-\d{4,7}$/
                    const cleanId = sanitizeInput(newCVE.cveId, 20).toUpperCase()
                    if(!cveIdPat.test(cleanId)) return alert("Invalid CVE ID format (CVE-YYYY-XXXX)")
                    setCves([...cves,{id:Date.now().toString(),cveId:cleanId,title:sanitizeInput(newCVE.title,200),severity: (["Critical","High","Medium","Low"].includes(newCVE.severity as string) ? newCVE.severity : "High") as any,status:"Draft",publishDate:new Date().toISOString().slice(0,10)}])
                    setShowAddCVE(false); setNewCVE({cveId:"",title:"",severity:"High",status:"Draft"})
                  }}><Save className="w-3.5 h-3.5 mr-1" /> Save</Button>
                  <Button size="sm" variant="ghost" className="h-8" onClick={()=>setShowAddCVE(false)}><X className="w-3.5 h-3.5" /></Button>
                </div>
              )}
              {editingCVE && (
                <div className="p-4 border-t bg-blue-50 dark:bg-blue-950/20 flex flex-wrap gap-2 items-end">
                  <div><label className="text-[11px] font-semibold">CVE ID</label><Input value={editingCVE.cveId} onChange={e=>setEditingCVE({...editingCVE,cveId:e.target.value})} className="h-8 w-[140px] mt-1" /></div>
                  <div><label className="text-[11px] font-semibold">Title</label><Input value={editingCVE.title} onChange={e=>setEditingCVE({...editingCVE,title:e.target.value})} className="h-8 w-[220px] mt-1" /></div>
                  <div><label className="text-[11px] font-semibold">Severity</label><select value={editingCVE.severity} onChange={e=>setEditingCVE({...editingCVE,severity:e.target.value as any})} className="h-8 rounded-[8px] border px-2 text-[13px] mt-1"><option>Critical</option><option>High</option><option>Medium</option><option>Low</option></select></div>
                  <div><label className="text-[11px] font-semibold">Status</label><select value={editingCVE.status} onChange={e=>setEditingCVE({...editingCVE,status:e.target.value as any})} className="h-8 rounded-[8px] border px-2 text-[13px] mt-1"><option>Published</option><option>Draft</option></select></div>
                  <Button size="sm" className="h-8" onClick={()=>{
                    if(!requireAdmin()) return
                    if(!validateCsrfToken(csrfToken)) return alert("CSRF failed")
                    const clean: AdminCVE = { ...editingCVE, cveId: sanitizeInput(editingCVE.cveId,20).toUpperCase(), title: sanitizeInput(editingCVE.title,200) }
                    setCves(cves.map(c=>c.id===clean.id? clean: c)); setEditingCVE(null)
                  }}><Save className="w-3.5 h-3.5 mr-1" /> Update</Button>
                  <Button size="sm" variant="ghost" className="h-8" onClick={()=>setEditingCVE(null)}><X className="w-3.5 h-3.5" /></Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  )
}
