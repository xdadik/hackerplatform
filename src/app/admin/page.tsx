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
  Plus, Trash2, Edit2, Search, Save, X, Eye, Ban, CheckCircle2, Upload, Star, MessageSquare, Send
} from "lucide-react"

type AdminUser = { id: string; username: string; email: string; reputation: number; status: "Active" | "Pending" | "Banned"; role: "user" | "admin" | "moderator" }
type AdminVideo = { id: string; title: string; subtitle: string; duration: string; module: string; path: string; featured: boolean; youtubeId: string; description: string }
type AdminEvent = { id: string; title: string; type: "CTF" | "Workshop" | "Competition"; date: string; status: "Live" | "Upcoming" | "Ended"; participants: number }
type AdminNews = { id: string; title: string; excerpt: string; author: string; tags: string; views: number; status: "Published" | "Draft" | "Pending"; content: string }
type AdminCVE = { id: string; cveId: string; title: string; severity: "Critical" | "High" | "Medium" | "Low"; status: "Published" | "Draft"; publishDate: string }
type AdminLab = { id: string; title: string; category: string; difficulty: "Beginner" | "Intermediate" | "Advanced" | "Expert"; duration: string; description: string; objectives: number; youtubeId: string; hasFlag: boolean }
type AdminChallenge = { id: string; name: string; category: string; difficulty: "Easy" | "Medium" | "Hard" | "Insane"; points: number; solves: number; tags: string[]; hasFlag: boolean }

const TABS = [
  { id: "overview", label: "Overview", icon: Activity },
  { id: "users", label: "Users", icon: Users },
  { id: "videos", label: "Videos", icon: Video },
  { id: "events", label: "Events", icon: Calendar },
  { id: "news", label: "News", icon: Newspaper },
  { id: "cve", label: "CVE", icon: Shield },
  { id: "labs", label: "Labs", icon: FlaskConical },
  { id: "challenges", label: "Challenges", icon: Trophy },
  { id: "inbox", label: "Inbox", icon: MessageSquare },
  { id: "system", label: "System", icon: Settings },
] as const

async function adminApi(table: string, method: "GET" | "POST" | "PATCH" | "DELETE" = "GET", id?: string, body?: Record<string, unknown>) {
  const url = id ? `/api/admin/${table}/${encodeURIComponent(id)}` : `/api/admin/${table}`
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(typeof data.error === "string" ? data.error : `Request failed (${res.status})`)
  }
  return data as { items?: Record<string, unknown>[]; item?: Record<string, unknown>; ok?: boolean }
}

export default function AdminPage() {
  const { user } = useAuth()
  const [isAdminAuthed, setIsAdminAuthed] = React.useState(false)
  const [adminUser, setAdminUser] = React.useState("")
  const [adminPass, setAdminPass] = React.useState("")
  const [loginError, setLoginError] = React.useState("")
  const [csrfToken, setCsrfToken] = React.useState("")
  React.useEffect(() => {
    try {
      // Prefer httpOnly session cookie (set by server /api/admin/login) — client localStorage is UI-only.
      const hasSessionCookie = typeof document !== "undefined" && document.cookie.includes("aegis_admin_session=")
      const hasLegacyAuth = localStorage.getItem("aegis_admin_auth") === "1"
      if (hasSessionCookie || hasLegacyAuth) setIsAdminAuthed(true)
      setCsrfToken(getOrCreateCsrfToken())
    } catch {}
  }, [])
  const [loginBusy, setLoginBusy] = React.useState(false)
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const formToken = (e.target as HTMLFormElement).querySelector<HTMLInputElement>('input[name="csrf"]')?.value || csrfToken
    if (!validateCsrfToken(formToken)) {
      setLoginError("CSRF validation failed. Refresh and try again.")
      return
    }
    const rl = adminLoginLimiter.check()
    if (rl.limited) {
      setLoginError(`Too many attempts. Try again in ${Math.ceil(rl.resetMs/60000)} min (rate limited).`)
      return
    }
    const cleanUser = sanitizeInput(adminUser, 64).trim()
    if (!cleanUser || !adminPass) {
      setLoginError("Username and password are required.")
      return
    }
    setLoginBusy(true)
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: cleanUser, password: adminPass }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        adminLoginLimiter.record(false)
        const remaining = adminLoginLimiter.check().remaining
        setLoginError(`${typeof body.error === "string" ? body.error : "Invalid username or password."} Attempts left: ${remaining}.`)
        return
      }
      try {
        localStorage.setItem("aegis_admin_auth", "1")
        adminLoginLimiter.reset()
      } catch {}
      setIsAdminAuthed(true)
      setLoginError("")
    } catch {
      setLoginError("Could not reach the server. Check your connection.")
    } finally {
      setLoginBusy(false)
    }
  }
  const handleAdminLogout = async () => {
    try {
      await fetch("/api/admin/logout", { method: "POST" })
    } catch {}
    try {
      localStorage.removeItem("aegis_admin_auth")
      sessionStorage.removeItem("aegis_csrf_token")
      document.cookie = "aegis_csrf_token=; Path=/; Max-Age=0; SameSite=Strict"
      document.cookie = "aegis_admin_session=; Path=/; Max-Age=0; SameSite=Strict"
    } catch {}
    setIsAdminAuthed(false)
    setAdminUser("")
    setAdminPass("")
  }
  const requireAdmin = React.useCallback((): boolean => {
    if (!isAdminAuthed) {
      alert("RBAC denied: admin login required. Server will re-verify session.")
      return false
    }
    return true
  }, [isAdminAuthed])

  const [active, setActive] = React.useState<typeof TABS[number]["id"]>("overview")
  const [search, setSearch] = React.useState("")

  const [users, setUsers] = React.useState<AdminUser[]>([])
  const [editingUser, setEditingUser] = React.useState<AdminUser | null>(null)
  const [showAddUser, setShowAddUser] = React.useState(false)
  const [newUser, setNewUser] = React.useState<Partial<AdminUser> & { password?: string }>({ username: "", email: "", role: "user", status: "Active", password: "" })

  const [videos, setVideos] = React.useState<AdminVideo[]>([])
  const [editingVideo, setEditingVideo] = React.useState<AdminVideo | null>(null)
  const [showAddVideo, setShowAddVideo] = React.useState(false)
  const [newVideo, setNewVideo] = React.useState<Partial<AdminVideo>>({ title: "", subtitle: "", duration: "", module: "", path: "", youtubeId: "", description: "" })

  const [events, setEvents] = React.useState<AdminEvent[]>([])
  const [editingEvent, setEditingEvent] = React.useState<AdminEvent | null>(null)
  const [showAddEvent, setShowAddEvent] = React.useState(false)
  const [newEvent, setNewEvent] = React.useState<Partial<AdminEvent>>({ title: "", type: "CTF", date: "", status: "Upcoming" })

  const [news, setNews] = React.useState<AdminNews[]>([])
  const [editingNews, setEditingNews] = React.useState<AdminNews | null>(null)
  const [showAddNews, setShowAddNews] = React.useState(false)
  const [newNews, setNewNews] = React.useState<Partial<AdminNews>>({ title: "", excerpt: "", author: "", tags: "", status: "Draft", content: "" })

  const [cves, setCves] = React.useState<AdminCVE[]>([])
  const [editingCVE, setEditingCVE] = React.useState<AdminCVE | null>(null)
  const [showAddCVE, setShowAddCVE] = React.useState(false)
  const [newCVE, setNewCVE] = React.useState<Partial<AdminCVE>>({ cveId: "", title: "", severity: "High", status: "Draft" })

  const [adminLabs, setAdminLabs] = React.useState<AdminLab[]>([])
  const [showAddLab, setShowAddLab] = React.useState(false)
  const [editingLab, setEditingLab] = React.useState<AdminLab|null>(null)
  const [newLab, setNewLab] = React.useState<Partial<AdminLab> & { flag?: string }>({title:"", category:"Web Security", difficulty:"Beginner", duration:"", description:"", objectives:1, youtubeId:"", flag:"" })

  const [adminChallenges, setAdminChallenges] = React.useState<AdminChallenge[]>([])
  const [showAddChallenge, setShowAddChallenge] = React.useState(false)
  const [editingChallenge, setEditingChallenge] = React.useState<AdminChallenge|null>(null)
  const [newChallenge, setNewChallenge] = React.useState<Partial<AdminChallenge> & { flag?: string }>({name:"", category:"Web", difficulty:"Easy", points:100, flag:"" })

  type AdminMessage = { id: string; user_id: string; userEmail: string; userName: string; from_role: string; text: string; read: boolean; created_at: string }
  const [inbox, setInbox] = React.useState<AdminMessage[]>([])
  const [inboxUser, setInboxUser] = React.useState<string | null>(null)
  const [replyDraft, setReplyDraft] = React.useState("")

  const [maintenance, setMaintenance] = React.useState(false)
  const [announcement, setAnnouncement] = React.useState("")
  const [dataLoading, setDataLoading] = React.useState(false)
  const [dataError, setDataError] = React.useState<string | null>(null)

  const loadAll = React.useCallback(async () => {
    setDataLoading(true)
    setDataError(null)
    try {
      const [u, v, e, n, c, l, ch, s, m] = await Promise.all([
        adminApi("users"), adminApi("videos"), adminApi("events"), adminApi("news"),
        adminApi("cves"), adminApi("labs"), adminApi("challenges"), adminApi("settings"), adminApi("messages"),
      ])
      setUsers((u.items ?? []) as unknown as AdminUser[])
      setVideos((v.items ?? []) as unknown as AdminVideo[])
      setEvents((e.items ?? []) as unknown as AdminEvent[])
      setNews((n.items ?? []) as unknown as AdminNews[])
      setCves((c.items ?? []) as unknown as AdminCVE[])
      setAdminLabs((l.items ?? []) as unknown as AdminLab[])
      setAdminChallenges((ch.items ?? []) as unknown as AdminChallenge[])
      setInbox((m.items ?? []) as unknown as AdminMessage[])
      const settings = Object.fromEntries(((s.items ?? []) as { key: string; value: string }[]).map(x => [x.key, x.value]))
      setAnnouncement(settings.announcement ?? "")
      setMaintenance(settings.maintenance === "1")
    } catch (err) {
      setDataError(err instanceof Error ? err.message : "Failed to load admin data")
    } finally {
      setDataLoading(false)
    }
  }, [])

  React.useEffect(() => {
    if (isAdminAuthed) loadAll()
  }, [isAdminAuthed, loadAll])

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
              <Button type="submit" disabled={loginBusy} className="w-full h-10 rounded-[8px] bg-zinc-900 text-white font-[600]">{loginBusy ? "Verifying..." : "Log in to Admin"}</Button>
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
            <Link href="/" className="h-11 sm:h-8 min-h-[44px] sm:min-h-0 px-3 rounded-[8px] border border-zinc-200 bg-white text-[13px] font-medium hover:bg-zinc-50 hidden sm:inline-flex items-center">← Back to site</Link>
            <Button size="sm" variant="secondary" className="h-11 sm:h-8 min-h-[44px] sm:min-h-0 border" onClick={handleAdminLogout}>Log out</Button>
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
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
          <Card><CardContent className="p-4"><div className="text-[11px] tracking-widest uppercase text-[var(--text-3)] flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> Users</div><div className="text-[22px] font-[700]">{users.length.toLocaleString()}</div><div className="text-[11px] text-[var(--text-2)]">{users.filter(u=>u.status==="Pending").length} pending</div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="text-[11px] tracking-widest uppercase text-[var(--text-3)] flex items-center gap-1.5"><Video className="w-3.5 h-3.5" /> Videos</div><div className="text-[22px] font-[700]">{videos.length}</div><div className="text-[11px] text-[var(--text-2)]">{videos.filter(v=>v.featured).length} featured • upload/delete</div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="text-[11px] tracking-widest uppercase text-[var(--text-3)] flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Events</div><div className="text-[22px] font-[700]">{events.length}</div><div className="text-[11px] text-[var(--text-2)]">{events.filter(e=>e.status==="Live").length} live</div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="text-[11px] tracking-widest uppercase text-[var(--text-3)] flex items-center gap-1.5"><Newspaper className="w-3.5 h-3.5" /> News</div><div className="text-[22px] font-[700]">{news.length}</div><div className="text-[11px] text-amber-600">{news.filter(n=>n.status==="Pending").length} pending</div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="text-[11px] tracking-widest uppercase text-[var(--text-3)] flex items-center gap-1.5"><Shield className="w-3.5 h-3.5" /> CVE</div><div className="text-[22px] font-[700]">{cves.length}</div><div className="text-[11px] text-[var(--text-2)]">{cves.filter(c=>c.severity==="Critical").length} critical</div></CardContent></Card>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1.5 mb-6 overflow-x-auto pb-1 scrollbar-thin">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActive(t.id)} className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 sm:py-2 min-h-[44px] sm:min-h-0 rounded-full text-[13px] font-[500] whitespace-nowrap border transition-colors ${active===t.id ? "bg-[var(--text)] text-[var(--background)] border-[var(--text)] shadow-sm" : "bg-[var(--surface)] border-[var(--border)] text-[var(--text-2)] hover:text-[var(--text)] hover:bg-[var(--surface-2)]"}`}>
              <t.icon className="w-3.5 h-3.5" /> {t.label}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-2 pl-3 w-full sm:w-auto">
            <div className="relative hidden sm:flex">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-3)]" />
              <Input placeholder="Search..." value={search} onChange={e=>setSearch(e.target.value)} className="pl-8 h-11 sm:h-8 min-h-[44px] sm:min-h-0 w-full sm:w-[180px] bg-[var(--surface)]" />
            </div>
          </div>
        </div>

        {/* Overview */}
        {dataLoading && (
          <Card className="mb-6"><CardContent className="p-4 text-[13px] text-[var(--text-2)]">Loading platform data…</CardContent></Card>
        )}
        {dataError && (
          <Card className="mb-6 border-red-200"><CardContent className="p-4 text-[13px] text-red-700">Failed to load data: {dataError} <Button size="sm" variant="secondary" className="ml-2 h-7" onClick={loadAll}>Retry</Button></CardContent></Card>
        )}
        {active==="overview" && (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardHeader className="pb-3 flex-row items-center justify-between space-y-0 gap-3"><CardTitle className="flex items-center gap-2 leading-none"><Users className="w-4 h-4" /> Recent Users</CardTitle><Button size="sm" variant="secondary" className="h-9 sm:h-7 min-h-[36px] sm:min-h-0" onClick={()=>setActive("users")}>Manage all</Button></CardHeader>
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
                            <td className="px-4 py-3 text-right"><Button size="sm" variant="ghost" className="h-9 sm:h-7 min-h-[36px] sm:min-h-0 border" onClick={()=>setActive("users")}>View</Button></td>
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
                  <div className="p-3 rounded-[8px] border border-dashed border-[var(--border)] text-center text-[var(--text-2)]">No audit events yet. Admin actions will be logged here.</div>
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
                  <div className="text-[12px] text-[var(--text-2)]">Platform settings live under the <b>System</b> tab — announcement banner and maintenance mode, stored in the database.</div>
                  <Button size="sm" className="h-11 sm:h-8 min-h-[44px] sm:min-h-0 px-4 w-full" onClick={()=>setActive("system")}>Open System settings</Button>
                  <div className="text-[11px] text-[var(--text-3)] pt-2 border-t">RBAC, rate limiting, secure headers enforced.</div>
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
              <Button size="sm" className="h-11 sm:h-8 min-h-[44px] sm:min-h-0 gap-1.5" onClick={()=>setShowAddUser(true)}><Plus className="w-3.5 h-3.5" /> Add User</Button>
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
                          <Button size="sm" variant="ghost" className="h-9 w-9 sm:h-7 sm:w-7 min-h-[36px] sm:min-h-0 p-0" onClick={()=>setEditingUser(u)}><Edit2 className="w-3.5 h-3.5" /></Button>
                          <Button size="sm" variant="ghost" className="h-9 w-9 sm:h-7 sm:w-7 min-h-[36px] sm:min-h-0 p-0" onClick={async ()=>{
                            if(!requireAdmin()) return
                            try {
                              await adminApi("users", "PATCH", u.id, { status: u.status==="Banned"?"Active":"Banned" })
                              setUsers(prev=>prev.map(x=>x.id===u.id? {...x, status: x.status==="Banned"?"Active":"Banned"}:x))
                            } catch (err) { alert(err instanceof Error ? err.message : "Failed") }
                          }}><Ban className="w-3.5 h-3.5" /></Button>
                          <Button size="sm" variant="ghost" className="h-9 w-9 sm:h-7 sm:w-7 min-h-[36px] sm:min-h-0 p-0 text-red-600" onClick={async ()=>{
                            if(!requireAdmin()) return
                            if(!confirm(`Delete user "${u.username}"?`)) return
                            try {
                              await adminApi("users", "DELETE", u.id)
                              setUsers(prev=>prev.filter(x=>x.id!==u.id))
                            } catch (err) { alert(err instanceof Error ? err.message : "Failed") }
                          }}><Trash2 className="w-3.5 h-3.5" /></Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Add User */}
              {showAddUser && (
                <div className="p-4 border-t bg-[var(--surface-2)] flex flex-wrap gap-2 items-end">
                  <div className="w-full sm:w-auto"><label className="text-[11px] font-semibold">Username</label><Input value={newUser.username} onChange={e=>setNewUser({...newUser,username:e.target.value})} placeholder="username" className="h-11 sm:h-8 min-h-[44px] sm:min-h-0 w-full sm:w-[140px] mt-1" /></div>
                  <div className="w-full sm:w-auto"><label className="text-[11px] font-semibold">Email</label><Input value={newUser.email} onChange={e=>setNewUser({...newUser,email:e.target.value})} placeholder="email" className="h-11 sm:h-8 min-h-[44px] sm:min-h-0 w-full sm:w-[180px] mt-1" /></div>
                  <div className="w-full sm:w-auto"><label className="text-[11px] font-semibold">Role</label><select value={newUser.role} onChange={e=>setNewUser({...newUser,role:e.target.value as any})} className="h-11 sm:h-8 min-h-[44px] sm:min-h-0 rounded-[8px] border border-[var(--border)] bg-[var(--surface)] px-2 text-[13px] mt-1"><option value="user">user</option><option value="moderator">moderator</option><option value="admin">admin</option></select></div>
                  <div className="w-full sm:w-auto"><label className="text-[11px] font-semibold">Password</label><Input type="password" value={newUser.password||""} onChange={e=>setNewUser({...newUser,password:e.target.value})} placeholder="min 8 chars" className="h-11 sm:h-8 min-h-[44px] sm:min-h-0 w-full sm:w-[140px] mt-1" autoComplete="new-password" /></div>
                  <Button size="sm" className="h-11 sm:h-8 min-h-[44px] sm:min-h-0 gap-1" onClick={async ()=>{
                    if(!requireAdmin()) return
                    const cleanName = sanitizeInput(newUser.username||"", 32)
                    const cleanEmail = sanitizeEmail(newUser.email||"")
                    if(!cleanName || !cleanEmail) return alert("Fill valid username/email")
                    if(!newUser.password || newUser.password.length < 8) return alert("Password required (min 8 characters)")
                    if(!validateCsrfToken(csrfToken)) return alert("CSRF failed")
                    try {
                      const data = await adminApi("users", "POST", undefined, { username: cleanName, email: cleanEmail, password: newUser.password, role: (["user","moderator","admin"].includes(newUser.role as string) ? newUser.role : "user") })
                      setUsers([...users, data.item as unknown as AdminUser])
                      setShowAddUser(false); setNewUser({username:"",email:"",role:"user",status:"Active",password:""})
                    } catch (err) { alert(err instanceof Error ? err.message : "Failed") }
                  }}><Save className="w-3.5 h-3.5" /> Save</Button>
                  <Button size="sm" variant="ghost" className="h-11 sm:h-8 min-h-[44px] sm:min-h-0" onClick={()=>setShowAddUser(false)}><X className="w-3.5 h-3.5" /></Button>
                </div>
              )}
              {/* Edit User */}
              {editingUser && (
                <div className="p-4 border-t bg-amber-50 dark:bg-amber-950/20 flex flex-wrap gap-2 items-end">
                  <div className="w-full sm:w-auto"><label className="text-[11px] font-semibold">Username</label><Input value={editingUser.username} onChange={e=>setEditingUser({...editingUser,username:e.target.value})} className="h-11 sm:h-8 min-h-[44px] sm:min-h-0 w-full sm:w-[140px] mt-1" /></div>
                  <div className="w-full sm:w-auto"><label className="text-[11px] font-semibold">Email</label><Input value={editingUser.email} onChange={e=>setEditingUser({...editingUser,email:e.target.value})} className="h-11 sm:h-8 min-h-[44px] sm:min-h-0 w-full sm:w-[180px] mt-1" /></div>
                  <div className="w-full sm:w-auto"><label className="text-[11px] font-semibold">Reputation</label><Input type="number" value={editingUser.reputation} onChange={e=>setEditingUser({...editingUser,reputation:parseInt(e.target.value)||0})} className="h-11 sm:h-8 min-h-[44px] sm:min-h-0 w-full sm:w-[100px] mt-1" /></div>
                  <div className="w-full sm:w-auto"><label className="text-[11px] font-semibold">Role</label><select value={editingUser.role} onChange={e=>setEditingUser({...editingUser,role:e.target.value as any})} className="h-11 sm:h-8 min-h-[44px] sm:min-h-0 rounded-[8px] border px-2 text-[13px] mt-1"><option value="user">user</option><option value="moderator">moderator</option><option value="admin">admin</option></select></div>
                  <Button size="sm" className="h-11 sm:h-8 min-h-[44px] sm:min-h-0" onClick={async ()=>{
                    if(!requireAdmin()) return
                    if(!validateCsrfToken(csrfToken)) return alert("CSRF failed")
                    const clean: AdminUser = {
                      ...editingUser,
                      username: sanitizeInput(editingUser.username, 32),
                      email: sanitizeEmail(editingUser.email) || editingUser.email,
                      role: (["user","moderator","admin"].includes(editingUser.role) ? editingUser.role : "user"),
                    }
                    try {
                      await adminApi("users", "PATCH", clean.id, { username: clean.username, email: clean.email, reputation: clean.reputation, role: clean.role })
                      setUsers(users.map(u=>u.id===clean.id? clean: u)); setEditingUser(null)
                    } catch (err) { alert(err instanceof Error ? err.message : "Failed") }
                  }}><Save className="w-3.5 h-3.5 mr-1" /> Update</Button>
                  <Button size="sm" variant="ghost" className="h-11 sm:h-8 min-h-[44px] sm:min-h-0" onClick={()=>setEditingUser(null)}><X className="w-3.5 h-3.5" /></Button>
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
              <Button size="sm" className="h-11 sm:h-8 min-h-[44px] sm:min-h-0 gap-1.5" onClick={()=>setShowAddVideo(true)}><Upload className="w-3.5 h-3.5" /> Add Video</Button>
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
                          <Button size="sm" variant="ghost" className="h-9 w-9 sm:h-7 sm:w-7 min-h-[36px] sm:min-h-0 p-0" onClick={()=>setEditingVideo(v)}><Edit2 className="w-3.5 h-3.5" /></Button>
                          <Button size="sm" variant="ghost" className="h-9 w-9 sm:h-7 sm:w-7 min-h-[36px] sm:min-h-0 p-0" onClick={async ()=>{
                            if(!requireAdmin()) return
                            try {
                              await adminApi("videos", "PATCH", v.id, { featured: !v.featured })
                              setVideos(videos.map(x=>x.id===v.id? {...x,featured:!x.featured}:x))
                            } catch (err) { alert(err instanceof Error ? err.message : "Failed") }
                          }}><Star className="w-3.5 h-3.5" /></Button>
                          <Button size="sm" variant="ghost" className="h-9 w-9 sm:h-7 sm:w-7 min-h-[36px] sm:min-h-0 p-0 text-red-600" onClick={async ()=>{
                            if(!requireAdmin()) return
                            if(!validateCsrfToken(csrfToken)) return alert("CSRF failed")
                            if(confirm(`Delete video "${v.title}"?`)) {
                              try {
                                await adminApi("videos", "DELETE", v.id)
                                setVideos(videos.filter(x=>x.id!==v.id))
                              } catch (err) { alert(err instanceof Error ? err.message : "Failed") }
                            }
                          }}><Trash2 className="w-3.5 h-3.5" /></Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {showAddVideo && (
                <div className="p-4 border-t bg-[var(--surface-2)] flex flex-wrap gap-2 items-end">
                  <div className="w-full sm:w-auto"><label className="text-[11px] font-semibold">Title</label><Input value={newVideo.title} onChange={e=>setNewVideo({...newVideo,title:e.target.value})} placeholder="Video title" className="h-11 sm:h-8 min-h-[44px] sm:min-h-0 w-full sm:w-[180px] mt-1" /></div>
                  <div className="w-full sm:w-auto"><label className="text-[11px] font-semibold">Module</label><Input value={newVideo.module} onChange={e=>setNewVideo({...newVideo,module:e.target.value})} placeholder="Module" className="h-11 sm:h-8 min-h-[44px] sm:min-h-0 w-full sm:w-[120px] mt-1" /></div>
                  <div className="w-full sm:w-auto"><label className="text-[11px] font-semibold">Duration</label><Input value={newVideo.duration} onChange={e=>setNewVideo({...newVideo,duration:e.target.value})} placeholder="08:12" className="h-11 sm:h-8 min-h-[44px] sm:min-h-0 w-full sm:w-[80px] mt-1" /></div>
                  <div className="w-full sm:w-auto"><label className="text-[11px] font-semibold">Path</label><Input value={newVideo.path} onChange={e=>setNewVideo({...newVideo,path:e.target.value})} placeholder="networking" className="h-11 sm:h-8 min-h-[44px] sm:min-h-0 w-full sm:w-[120px] mt-1" /></div>
                  <div className="w-full sm:w-auto"><label className="text-[11px] font-semibold">YouTube ID</label><Input value={newVideo.youtubeId||""} onChange={e=>setNewVideo({...newVideo,youtubeId:e.target.value})} placeholder="dQw4w9WgXcQ" className="h-11 sm:h-8 min-h-[44px] sm:min-h-0 w-full sm:w-[130px] mt-1 font-mono" /></div>
                  <Button size="sm" className="h-11 sm:h-8 min-h-[44px] sm:min-h-0" onClick={async ()=>{
                    if(!requireAdmin()) return
                    if(!validateCsrfToken(csrfToken)) return alert("CSRF failed")
                    if(!newVideo.title) return alert("Title required")
                    const cleanTitle = sanitizeInput(newVideo.title, 120)
                    const cleanModule = sanitizeInput(newVideo.module||"General", 64)
                    const cleanDuration = sanitizeInput(newVideo.duration||"00:00", 20)
                    const cleanPath = sanitizeInput(newVideo.path||"cybersecurity-101", 64).toLowerCase().replace(/[^a-z0-9-]/g,"-")
                    try {
                      const data = await adminApi("videos", "POST", undefined, { title: cleanTitle, subtitle: sanitizeInput(newVideo.subtitle||"Lesson",64), duration: cleanDuration, module: cleanModule, path: cleanPath, youtubeId: sanitizeInput(newVideo.youtubeId||"", 20) })
                      setVideos([...videos, data.item as unknown as AdminVideo])
                      setShowAddVideo(false); setNewVideo({title:"",subtitle:"",duration:"",module:"",path:"",youtubeId:"",description:""})
                    } catch (err) { alert(err instanceof Error ? err.message : "Failed") }
                  }}><Save className="w-3.5 h-3.5 mr-1" /> Save</Button>
                  <Button size="sm" variant="ghost" className="h-11 sm:h-8 min-h-[44px] sm:min-h-0" onClick={()=>setShowAddVideo(false)}><X className="w-3.5 h-3.5" /></Button>
                </div>
              )}
              {editingVideo && (
                <div className="p-4 border-t bg-blue-50 dark:bg-blue-950/20 flex flex-wrap gap-2 items-end">
                  <div className="w-full sm:w-auto"><label className="text-[11px] font-semibold">Title</label><Input value={editingVideo.title} onChange={e=>setEditingVideo({...editingVideo,title:e.target.value})} className="h-11 sm:h-8 min-h-[44px] sm:min-h-0 w-full sm:w-[180px] mt-1" /></div>
                  <div className="w-full sm:w-auto"><label className="text-[11px] font-semibold">Duration</label><Input value={editingVideo.duration} onChange={e=>setEditingVideo({...editingVideo,duration:e.target.value})} className="h-11 sm:h-8 min-h-[44px] sm:min-h-0 w-full sm:w-[80px] mt-1" /></div>
                  <div className="w-full sm:w-auto"><label className="text-[11px] font-semibold">Module</label><Input value={editingVideo.module} onChange={e=>setEditingVideo({...editingVideo,module:e.target.value})} className="h-11 sm:h-8 min-h-[44px] sm:min-h-0 w-full sm:w-[120px] mt-1" /></div>
                  <div className="w-full sm:w-auto"><label className="text-[11px] font-semibold">YouTube ID</label><Input value={editingVideo.youtubeId||""} onChange={e=>setEditingVideo({...editingVideo,youtubeId:e.target.value})} className="h-11 sm:h-8 min-h-[44px] sm:min-h-0 w-full sm:w-[130px] mt-1 font-mono" /></div>
                  <Button size="sm" className="h-11 sm:h-8 min-h-[44px] sm:min-h-0" onClick={async ()=>{
                    if(!requireAdmin()) return
                    if(!validateCsrfToken(csrfToken)) return alert("CSRF failed")
                    const clean: AdminVideo = {
                      ...editingVideo,
                      title: sanitizeInput(editingVideo.title, 120),
                      module: sanitizeInput(editingVideo.module, 64),
                      duration: sanitizeInput(editingVideo.duration, 20),
                      youtubeId: sanitizeInput(editingVideo.youtubeId||"", 20),
                    }
                    try {
                      await adminApi("videos", "PATCH", clean.id, { title: clean.title, module: clean.module, duration: clean.duration, youtubeId: clean.youtubeId })
                      setVideos(videos.map(v=>v.id===clean.id? clean: v)); setEditingVideo(null)
                    } catch (err) { alert(err instanceof Error ? err.message : "Failed") }
                  }}><Save className="w-3.5 h-3.5 mr-1" /> Update</Button>
                  <Button size="sm" variant="ghost" className="h-11 sm:h-8 min-h-[44px] sm:min-h-0" onClick={()=>setEditingVideo(null)}><X className="w-3.5 h-3.5" /></Button>
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
              <Button size="sm" className="h-11 sm:h-8 min-h-[44px] sm:min-h-0 gap-1.5" onClick={()=>setShowAddEvent(true)}><Plus className="w-3.5 h-3.5" /> Create Event</Button>
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
                          <Button size="sm" variant="ghost" className="h-9 w-9 sm:h-7 sm:w-7 min-h-[36px] sm:min-h-0 p-0" onClick={()=>setEditingEvent(ev)}><Edit2 className="w-3.5 h-3.5" /></Button>
                          <Button size="sm" variant="ghost" className="h-9 w-9 sm:h-7 sm:w-7 min-h-[36px] sm:min-h-0 p-0 text-red-600" onClick={async ()=>{
                            if(!requireAdmin()) return
                            if(!confirm(`Delete event "${ev.title}"?`)) return
                            try {
                              await adminApi("events", "DELETE", ev.id)
                              setEvents(events.filter(x=>x.id!==ev.id))
                            } catch (err) { alert(err instanceof Error ? err.message : "Failed") }
                          }}><Trash2 className="w-3.5 h-3.5" /></Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {showAddEvent && (
                <div className="p-4 border-t bg-[var(--surface-2)] flex flex-wrap gap-2 items-end">
                  <div className="w-full sm:w-auto"><label className="text-[11px] font-semibold">Title</label><Input value={newEvent.title} onChange={e=>setNewEvent({...newEvent,title:e.target.value})} placeholder="Event title" className="h-11 sm:h-8 min-h-[44px] sm:min-h-0 w-full sm:w-[200px] mt-1" /></div>
                  <div className="w-full sm:w-auto"><label className="text-[11px] font-semibold">Type</label><select value={newEvent.type} onChange={e=>setNewEvent({...newEvent,type:e.target.value as any})} className="h-11 sm:h-8 min-h-[44px] sm:min-h-0 rounded-[8px] border bg-[var(--surface)] px-2 text-[13px] mt-1 w-full sm:w-auto"><option>CTF</option><option>Workshop</option><option>Competition</option></select></div>
                  <div className="w-full sm:w-auto"><label className="text-[11px] font-semibold">Date</label><Input type="date" value={newEvent.date} onChange={e=>setNewEvent({...newEvent,date:e.target.value})} className="h-11 sm:h-8 min-h-[44px] sm:min-h-0 w-full sm:w-[140px] mt-1" /></div>
                  <Button size="sm" className="h-11 sm:h-8 min-h-[44px] sm:min-h-0" onClick={async ()=>{
                    if(!requireAdmin()) return
                    if(!validateCsrfToken(csrfToken)) return alert("CSRF failed")
                    if(!newEvent.title) return alert("Title required")
                    const cleanTitle = sanitizeInput(newEvent.title, 120)
                    try {
                      const data = await adminApi("events", "POST", undefined, { title: cleanTitle, type: (["CTF","Workshop","Competition"].includes(newEvent.type as string) ? newEvent.type : "CTF"), date: newEvent.date||new Date().toISOString().slice(0,10), status: "Upcoming" })
                      setEvents([...events, data.item as unknown as AdminEvent])
                      setShowAddEvent(false); setNewEvent({title:"",type:"CTF",date:"",status:"Upcoming"})
                    } catch (err) { alert(err instanceof Error ? err.message : "Failed") }
                  }}><Save className="w-3.5 h-3.5 mr-1" /> Create</Button>
                  <Button size="sm" variant="ghost" className="h-11 sm:h-8 min-h-[44px] sm:min-h-0" onClick={()=>setShowAddEvent(false)}><X className="w-3.5 h-3.5" /></Button>
                </div>
              )}
              {editingEvent && (
                <div className="p-4 border-t bg-amber-50 dark:bg-amber-950/20 flex flex-wrap gap-2 items-end">
                  <div className="w-full sm:w-auto"><label className="text-[11px] font-semibold">Title</label><Input value={editingEvent.title} onChange={e=>setEditingEvent({...editingEvent,title:e.target.value})} className="h-11 sm:h-8 min-h-[44px] sm:min-h-0 w-full sm:w-[200px] mt-1" /></div>
                  <div className="w-full sm:w-auto"><label className="text-[11px] font-semibold">Status</label><select value={editingEvent.status} onChange={e=>setEditingEvent({...editingEvent,status:e.target.value as any})} className="h-11 sm:h-8 min-h-[44px] sm:min-h-0 rounded-[8px] border px-2 text-[13px] mt-1 w-full sm:w-auto"><option>Live</option><option>Upcoming</option><option>Ended</option></select></div>
                  <Button size="sm" className="h-11 sm:h-8 min-h-[44px] sm:min-h-0" onClick={async ()=>{
                    if(!requireAdmin()) return
                    if(!validateCsrfToken(csrfToken)) return alert("CSRF failed")
                    const clean: AdminEvent = { ...editingEvent, title: sanitizeInput(editingEvent.title, 120) }
                    try {
                      await adminApi("events", "PATCH", clean.id, { title: clean.title, status: clean.status })
                      setEvents(events.map(e=>e.id===clean.id? clean: e)); setEditingEvent(null)
                    } catch (err) { alert(err instanceof Error ? err.message : "Failed") }
                  }}><Save className="w-3.5 h-3.5 mr-1" /> Update</Button>
                  <Button size="sm" variant="ghost" className="h-11 sm:h-8 min-h-[44px] sm:min-h-0" onClick={()=>setEditingEvent(null)}><X className="w-3.5 h-3.5" /></Button>
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
              <Button size="sm" className="h-11 sm:h-8 min-h-[44px] sm:min-h-0 gap-1.5" onClick={()=>setShowAddNews(true)}><Plus className="w-3.5 h-3.5" /> Publish</Button>
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
                          <Button size="sm" variant="ghost" className="h-9 w-9 sm:h-7 sm:w-7 min-h-[36px] sm:min-h-0 p-0" onClick={()=>setEditingNews(n)}><Edit2 className="w-3.5 h-3.5" /></Button>
                          <Button size="sm" variant="ghost" className="h-9 w-9 sm:h-7 sm:w-7 min-h-[36px] sm:min-h-0 p-0" onClick={()=>window.open(`/research/${n.id}`,"_blank")}><Eye className="w-3.5 h-3.5" /></Button>
                          <Button size="sm" variant="ghost" className="h-9 w-9 sm:h-7 sm:w-7 min-h-[36px] sm:min-h-0 p-0 text-red-600" onClick={async ()=>{
                            if(!requireAdmin()) return
                            if(!confirm(`Delete article "${n.title}"?`)) return
                            try {
                              await adminApi("news", "DELETE", n.id)
                              setNews(news.filter(x=>x.id!==n.id))
                            } catch (err) { alert(err instanceof Error ? err.message : "Failed") }
                          }}><Trash2 className="w-3.5 h-3.5" /></Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {showAddNews && (
                <div className="p-4 border-t bg-[var(--surface-2)] flex flex-wrap gap-2 items-end">
                  <div className="w-full sm:w-auto"><label className="text-[11px] font-semibold">Title</label><Input value={newNews.title} onChange={e=>setNewNews({...newNews,title:e.target.value})} placeholder="Article title" className="h-11 sm:h-8 min-h-[44px] sm:min-h-0 w-full sm:w-[220px] mt-1" /></div>
                  <div className="w-full sm:w-auto"><label className="text-[11px] font-semibold">Author</label><Input value={newNews.author} onChange={e=>setNewNews({...newNews,author:e.target.value})} placeholder="Author" className="h-11 sm:h-8 min-h-[44px] sm:min-h-0 w-full sm:w-[120px] mt-1" /></div>
                  <div className="w-full sm:w-auto"><label className="text-[11px] font-semibold">Status</label><select value={newNews.status} onChange={e=>setNewNews({...newNews,status:e.target.value as any})} className="h-11 sm:h-8 min-h-[44px] sm:min-h-0 rounded-[8px] border bg-[var(--surface)] px-2 text-[13px] mt-1 w-full sm:w-auto"><option>Draft</option><option>Published</option><option>Pending</option></select></div>
                  <div className="w-full"><label className="text-[11px] font-semibold">Excerpt</label><Input value={newNews.excerpt||""} onChange={e=>setNewNews({...newNews,excerpt:e.target.value})} placeholder="Short summary..." className="h-11 sm:h-8 min-h-[44px] sm:min-h-0 w-full mt-1" /></div>
                  <div className="w-full"><label className="text-[11px] font-semibold">Content</label><textarea value={newNews.content||""} onChange={e=>setNewNews({...newNews,content:e.target.value})} placeholder="Article body (paragraphs separated by blank lines)..." className="w-full min-h-[90px] rounded-[8px] border border-[var(--border)] bg-[var(--surface)] p-2 text-[13px] mt-1" /></div>
                  <Button size="sm" className="h-11 sm:h-8 min-h-[44px] sm:min-h-0" onClick={async ()=>{
                    if(!requireAdmin()) return
                    if(!validateCsrfToken(csrfToken)) return alert("CSRF failed")
                    if(!newNews.title) return alert("Title required")
                    const cleanTitle = sanitizeInput(newNews.title, 200)
                    const cleanAuthor = sanitizeInput(newNews.author||"Admin", 64)
                    try {
                      const data = await adminApi("news", "POST", undefined, { title: cleanTitle, excerpt: sanitizeInput(newNews.excerpt||"",500), author: cleanAuthor, tags: sanitizeInput(newNews.tags||"general",100), status: (["Draft","Published","Pending"].includes(newNews.status as string) ? newNews.status : "Draft"), content: sanitizeInput(newNews.content||"",50000) })
                      setNews([...news, data.item as unknown as AdminNews])
                      setShowAddNews(false); setNewNews({title:"",excerpt:"",author:"",tags:"",status:"Draft",content:""})
                    } catch (err) { alert(err instanceof Error ? err.message : "Failed") }
                  }}><Save className="w-3.5 h-3.5 mr-1" /> Publish</Button>
                  <Button size="sm" variant="ghost" className="h-11 sm:h-8 min-h-[44px] sm:min-h-0" onClick={()=>setShowAddNews(false)}><X className="w-3.5 h-3.5" /></Button>
                </div>
              )}
              {editingNews && (
                <div className="p-4 border-t bg-blue-50 dark:bg-blue-950/20 flex flex-wrap gap-2 items-end">
                  <div className="w-full sm:w-auto"><label className="text-[11px] font-semibold">Title</label><Input value={editingNews.title} onChange={e=>setEditingNews({...editingNews,title:e.target.value})} className="h-11 sm:h-8 min-h-[44px] sm:min-h-0 w-full sm:w-[220px] mt-1" /></div>
                  <div className="w-full sm:w-auto"><label className="text-[11px] font-semibold">Status</label><select value={editingNews.status} onChange={e=>setEditingNews({...editingNews,status:e.target.value as any})} className="h-11 sm:h-8 min-h-[44px] sm:min-h-0 rounded-[8px] border px-2 text-[13px] mt-1 w-full sm:w-auto"><option>Published</option><option>Draft</option><option>Pending</option></select></div>
                  <div className="w-full"><label className="text-[11px] font-semibold">Content</label><textarea value={editingNews.content||""} onChange={e=>setEditingNews({...editingNews,content:e.target.value})} placeholder="Article body..." className="w-full min-h-[90px] rounded-[8px] border border-[var(--border)] bg-[var(--surface)] p-2 text-[13px] mt-1" /></div>
                  <Button size="sm" className="h-11 sm:h-8 min-h-[44px] sm:min-h-0" onClick={async ()=>{
                    if(!requireAdmin()) return
                    if(!validateCsrfToken(csrfToken)) return alert("CSRF failed")
                    const clean: AdminNews = { ...editingNews, title: sanitizeInput(editingNews.title,200), excerpt: sanitizeInput(editingNews.excerpt,500), author: sanitizeInput(editingNews.author,64), content: sanitizeInput(editingNews.content||"",50000) }
                    try {
                      await adminApi("news", "PATCH", clean.id, { title: clean.title, excerpt: clean.excerpt, author: clean.author, status: clean.status, content: clean.content })
                      setNews(news.map(n=>n.id===clean.id? clean: n)); setEditingNews(null)
                    } catch (err) { alert(err instanceof Error ? err.message : "Failed") }
                  }}><Save className="w-3.5 h-3.5 mr-1" /> Update</Button>
                  <Button size="sm" variant="ghost" className="h-11 sm:h-8 min-h-[44px] sm:min-h-0" onClick={()=>setEditingNews(null)}><X className="w-3.5 h-3.5" /></Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Labs */}
        {active==="labs" && (
          <div className="grid gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0"><CardTitle className="flex items-center gap-2"><FlaskConical className="w-4 h-4" /> Labs — {adminLabs.filter(l=>!search || l.title.toLowerCase().includes(search.toLowerCase())).length} <span className="text-[11px] font-normal text-[var(--text-3)]">upload / edit / delete</span></CardTitle><Button size="sm" className="h-11 sm:h-8 min-h-[44px] sm:min-h-0 gap-1.5" onClick={()=>setShowAddLab(true)}><Plus className="w-3.5 h-3.5" /> Create lab</Button></CardHeader>
              <CardContent className="p-0">
                <div className="overflow-auto">
                  <table className="w-full text-left text-[13px]">
                    <thead className="bg-[var(--surface-2)] border-y border-[var(--border)] text-[11px] tracking-widest uppercase text-[var(--text-3)]"><tr><th className="px-4 py-2.5">Lab</th><th className="px-4 py-2.5">Category</th><th className="px-4 py-2.5">Time</th><th className="px-4 py-2.5">Actions</th></tr></thead>
                    <tbody className="divide-y divide-[var(--border)]">
                      {adminLabs.filter(l=>!search || l.title.toLowerCase().includes(search.toLowerCase())).map(l=>(
                        <tr key={l.id} className="hover:bg-[var(--surface-2)]">
                          <td className="px-4 py-3"><div className="font-[600]">{l.title}</div><div className="text-[11px] text-[var(--text-3)]">{l.difficulty} • {l.hasFlag ? "flag set" : "no flag"}</div></td>
                          <td className="px-4 py-3"><Badge variant="outline" className="text-[11px]">{l.category}</Badge></td>
                          <td className="px-4 py-3 font-mono text-[12px]">{l.duration}</td>
                          <td className="px-4 py-3 flex gap-1.5">
                            <Button size="sm" variant="ghost" className="h-9 w-9 sm:h-7 sm:w-7 min-h-[36px] sm:min-h-0 p-0" onClick={()=>setEditingLab(l)}><Edit2 className="w-3.5 h-3.5" /></Button>
                            <Button size="sm" variant="ghost" className="h-9 w-9 sm:h-7 sm:w-7 min-h-[36px] sm:min-h-0 p-0" onClick={()=>window.open(`/labs/${l.id}`,"_blank")}><Eye className="w-3.5 h-3.5" /></Button>
                            <Button size="sm" variant="ghost" className="h-9 w-9 sm:h-7 sm:w-7 min-h-[36px] sm:min-h-0 p-0 text-red-600" onClick={async ()=>{ if(!requireAdmin()) return; if(confirm(`Delete lab "${l.title}"?`)) { try { await adminApi("labs", "DELETE", l.id); setAdminLabs(prev=>prev.filter(x=>x.id!==l.id)) } catch (err) { alert(err instanceof Error ? err.message : "Failed") } }}}><Trash2 className="w-3.5 h-3.5" /></Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {showAddLab && (
                  <div className="p-4 border-t bg-[var(--surface-2)] flex flex-wrap gap-2 items-end">
                    <div className="w-full sm:w-auto"><label className="text-[11px] font-semibold">Title</label><Input value={newLab.title} onChange={e=>setNewLab({...newLab,title:e.target.value})} placeholder="Lab title" className="h-11 sm:h-8 min-h-[44px] sm:min-h-0 w-full sm:w-[200px] mt-1" /></div>
                    <div className="w-full sm:w-auto"><label className="text-[11px] font-semibold">Category</label><select value={newLab.category} onChange={e=>setNewLab({...newLab,category:e.target.value})} className="h-11 sm:h-8 min-h-[44px] sm:min-h-0 rounded-[8px] border bg-[var(--surface)] px-2 text-[13px] mt-1 w-full sm:w-auto"><option>Web Security</option><option>Linux</option><option>Active Directory</option><option>Cloud Security</option><option>Forensics</option></select></div>
                    <div className="w-full sm:w-auto"><label className="text-[11px] font-semibold">Difficulty</label><select value={newLab.difficulty} onChange={e=>setNewLab({...newLab,difficulty:e.target.value as any})} className="h-11 sm:h-8 min-h-[44px] sm:min-h-0 rounded-[8px] border px-2 text-[13px] mt-1 w-full sm:w-auto"><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select></div>
                    <div className="w-full sm:w-auto"><label className="text-[11px] font-semibold">Duration</label><Input value={newLab.duration} onChange={e=>setNewLab({...newLab,duration:e.target.value})} placeholder="45 min" className="h-11 sm:h-8 min-h-[44px] sm:min-h-0 w-full sm:w-[90px] mt-1" /></div>
                    <div className="w-full sm:w-auto"><label className="text-[11px] font-semibold">Objectives</label><Input type="number" min={1} value={newLab.objectives ?? 1} onChange={e=>setNewLab({...newLab,objectives:Math.max(1,parseInt(e.target.value)||1)})} className="h-11 sm:h-8 min-h-[44px] sm:min-h-0 w-full sm:w-[70px] mt-1" /></div>
                    <div className="w-full sm:w-auto"><label className="text-[11px] font-semibold">YouTube ID</label><Input value={newLab.youtubeId||""} onChange={e=>setNewLab({...newLab,youtubeId:e.target.value})} placeholder="optional" className="h-11 sm:h-8 min-h-[44px] sm:min-h-0 w-full sm:w-[130px] mt-1 font-mono" /></div>
                    <div className="w-full sm:w-auto"><label className="text-[11px] font-semibold">Flag (stored hashed)</label><Input value={newLab.flag||""} onChange={e=>setNewLab({...newLab,flag:e.target.value})} placeholder="flag{...}" className="h-11 sm:h-8 min-h-[44px] sm:min-h-0 w-full sm:w-[160px] mt-1 font-mono" /></div>
                    <div className="w-full"><label className="text-[11px] font-semibold">Description</label><Input value={newLab.description||""} onChange={e=>setNewLab({...newLab,description:e.target.value})} placeholder="What this lab covers..." className="h-11 sm:h-8 min-h-[44px] sm:min-h-0 w-full mt-1" /></div>
                    <Button size="sm" className="h-11 sm:h-8 min-h-[44px] sm:min-h-0" onClick={async ()=>{
                      if(!requireAdmin()) return
                      if(!validateCsrfToken(csrfToken)) return alert("CSRF failed")
                      if(!newLab.title) return alert("Title required")
                      const cleanTitle = sanitizeInput(newLab.title, 120)
                      try {
                        const data = await adminApi("labs", "POST", undefined, { title: cleanTitle, category: sanitizeInput(newLab.category||"Web Security",64), difficulty: (["Beginner","Intermediate","Advanced"].includes(newLab.difficulty as string) ? newLab.difficulty : "Beginner"), duration: sanitizeInput(newLab.duration||"60 min",20), description: sanitizeInput(newLab.description||"",2000), objectives: newLab.objectives ?? 1, youtubeId: sanitizeInput(newLab.youtubeId||"",20), flag: (newLab.flag||"").trim() || undefined })
                        setAdminLabs([...adminLabs, data.item as unknown as AdminLab])
                        setShowAddLab(false); setNewLab({title:"", category:"Web Security", difficulty:"Beginner", duration:"", description:"", objectives:1, youtubeId:"", flag:""})
                      } catch (err) { alert(err instanceof Error ? err.message : "Failed") }
                    }}><Save className="w-3.5 h-3.5 mr-1" /> Create</Button>
                    <Button size="sm" variant="ghost" className="h-11 sm:h-8 min-h-[44px] sm:min-h-0" onClick={()=>setShowAddLab(false)}><X className="w-3.5 h-3.5" /></Button>
                  </div>
                )}
                {editingLab && (
                  <div className="p-4 border-t bg-blue-50 dark:bg-blue-950/20 flex flex-wrap gap-2 items-end">
                    <div className="w-full sm:w-auto"><label className="text-[11px] font-semibold">Title</label><Input value={editingLab.title} onChange={e=>setEditingLab({...editingLab,title:e.target.value})} className="h-11 sm:h-8 min-h-[44px] sm:min-h-0 w-full sm:w-[200px] mt-1" /></div>
                    <div className="w-full sm:w-auto"><label className="text-[11px] font-semibold">Duration</label><Input value={editingLab.duration} onChange={e=>setEditingLab({...editingLab,duration:e.target.value})} className="h-11 sm:h-8 min-h-[44px] sm:min-h-0 w-full sm:w-[90px] mt-1" /></div>
                    <div className="w-full sm:w-auto"><label className="text-[11px] font-semibold">YouTube ID</label><Input value={editingLab.youtubeId||""} onChange={e=>setEditingLab({...editingLab,youtubeId:e.target.value})} className="h-11 sm:h-8 min-h-[44px] sm:min-h-0 w-full sm:w-[130px] mt-1 font-mono" /></div>
                    <div className="w-full"><label className="text-[11px] font-semibold">Description</label><Input value={editingLab.description||""} onChange={e=>setEditingLab({...editingLab,description:e.target.value})} className="h-11 sm:h-8 min-h-[44px] sm:min-h-0 w-full mt-1" /></div>
                    <Button size="sm" className="h-11 sm:h-8 min-h-[44px] sm:min-h-0" onClick={async ()=>{
                      if(!requireAdmin()) return
                      if(!validateCsrfToken(csrfToken)) return alert("CSRF failed")
                      const clean = { ...editingLab, title: sanitizeInput(editingLab.title,120), duration: sanitizeInput(editingLab.duration,20), description: sanitizeInput(editingLab.description||"",2000), youtubeId: sanitizeInput(editingLab.youtubeId||"",20) }
                      try {
                        await adminApi("labs", "PATCH", clean.id, { title: clean.title, duration: clean.duration, description: clean.description, youtubeId: clean.youtubeId })
                        setAdminLabs(adminLabs.map(x=>x.id===clean.id? clean as AdminLab: x)); setEditingLab(null)
                      } catch (err) { alert(err instanceof Error ? err.message : "Failed") }
                    }}><Save className="w-3.5 h-3.5 mr-1" /> Update</Button>
                    <Button size="sm" variant="ghost" className="h-11 sm:h-8 min-h-[44px] sm:min-h-0" onClick={()=>setEditingLab(null)}><X className="w-3.5 h-3.5" /></Button>
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Trophy className="w-4 h-4" /> Challenges — {adminChallenges.length}</CardTitle></CardHeader>
              <CardContent className="flex flex-wrap gap-2 items-center">
                <Badge variant="outline" className="gap-1"><Trophy className="w-3 h-3" /> {adminChallenges.length} total</Badge>
                <Badge variant="secondary">{adminChallenges.filter(c=>c.hasFlag).length} with flags</Badge>
                <Button size="sm" variant="secondary" className="h-9 sm:h-7 min-h-[36px] sm:min-h-0 ml-auto" onClick={()=>{setActive("challenges"); setShowAddChallenge(true)}}>Manage challenges →</Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Challenges */}
        {active==="challenges" && (
          <div className="grid gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0"><CardTitle className="flex items-center gap-2"><Trophy className="w-4 h-4" /> Challenges — {adminChallenges.filter(c=>!search || c.name.toLowerCase().includes(search.toLowerCase())).length} <span className="text-[11px] font-normal text-[var(--text-3)]">create / edit / delete, set flags</span></CardTitle><Button size="sm" className="h-11 sm:h-8 min-h-[44px] sm:min-h-0 gap-1.5" onClick={()=>setShowAddChallenge(true)}><Plus className="w-3.5 h-3.5" /> Create challenge</Button></CardHeader>
              <CardContent className="p-0">
                <div className="overflow-auto">
                  <table className="w-full text-left text-[13px]">
                    <thead className="bg-[var(--surface-2)] border-y border-[var(--border)] text-[11px] tracking-widest uppercase text-[var(--text-3)]"><tr><th className="px-4 py-2.5">Challenge</th><th className="px-4 py-2.5">Category</th><th className="px-4 py-2.5">Points</th><th className="px-4 py-2.5">Flag</th><th className="px-4 py-2.5 text-right">Actions</th></tr></thead>
                    <tbody className="divide-y divide-[var(--border)]">
                      {adminChallenges.filter(c=>!search || c.name.toLowerCase().includes(search.toLowerCase())).map(c=>(
                        <tr key={c.id} className="hover:bg-[var(--surface-2)]">
                          <td className="px-4 py-3"><div className="font-[600]">{c.name}</div><div className="text-[11px] text-[var(--text-3)]">{c.difficulty} • {c.solves} solves</div></td>
                          <td className="px-4 py-3"><Badge variant="outline" className="text-[11px]">{c.category}</Badge></td>
                          <td className="px-4 py-3 font-mono text-[12px]">{c.points}</td>
                          <td className="px-4 py-3">{c.hasFlag ? <Badge variant="secondary" className="text-[11px] bg-emerald-100 text-emerald-800 border-emerald-200">set</Badge> : <span className="text-[11px] text-[var(--text-3)]">—</span>}</td>
                          <td className="px-4 py-3 text-right flex justify-end gap-1.5">
                            <Button size="sm" variant="ghost" className="h-9 w-9 sm:h-7 sm:w-7 min-h-[36px] sm:min-h-0 p-0" onClick={()=>setEditingChallenge(c)}><Edit2 className="w-3.5 h-3.5" /></Button>
                            <Button size="sm" variant="ghost" className="h-9 w-9 sm:h-7 sm:w-7 min-h-[36px] sm:min-h-0 p-0" onClick={()=>window.open(`/challenges/${c.id}`,"_blank")}><Eye className="w-3.5 h-3.5" /></Button>
                            <Button size="sm" variant="ghost" className="h-9 w-9 sm:h-7 sm:w-7 min-h-[36px] sm:min-h-0 p-0 text-red-600" onClick={async ()=>{ if(!requireAdmin()) return; if(confirm(`Delete challenge "${c.name}"?`)) { try { await adminApi("challenges", "DELETE", c.id); setAdminChallenges(prev=>prev.filter(x=>x.id!==c.id)) } catch (err) { alert(err instanceof Error ? err.message : "Failed") } }}}><Trash2 className="w-3.5 h-3.5" /></Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {showAddChallenge && (
                  <div className="p-4 border-t bg-[var(--surface-2)] flex flex-wrap gap-2 items-end">
                    <div className="w-full sm:w-auto"><label className="text-[11px] font-semibold">Name</label><Input value={newChallenge.name} onChange={e=>setNewChallenge({...newChallenge,name:e.target.value})} placeholder="Challenge name" className="h-11 sm:h-8 min-h-[44px] sm:min-h-0 w-full sm:w-[200px] mt-1" /></div>
                    <div className="w-full sm:w-auto"><label className="text-[11px] font-semibold">Category</label><select value={newChallenge.category} onChange={e=>setNewChallenge({...newChallenge,category:e.target.value})} className="h-11 sm:h-8 min-h-[44px] sm:min-h-0 rounded-[8px] border bg-[var(--surface)] px-2 text-[13px] mt-1 w-full sm:w-auto"><option>Web</option><option>Crypto</option><option>Pwn</option><option>Reverse</option><option>Forensics</option><option>OSINT</option><option>Cloud</option><option>Blue Team</option><option>Misc</option></select></div>
                    <div className="w-full sm:w-auto"><label className="text-[11px] font-semibold">Difficulty</label><select value={newChallenge.difficulty} onChange={e=>setNewChallenge({...newChallenge,difficulty:e.target.value as any})} className="h-11 sm:h-8 min-h-[44px] sm:min-h-0 rounded-[8px] border px-2 text-[13px] mt-1 w-full sm:w-auto"><option>Easy</option><option>Medium</option><option>Hard</option><option>Insane</option></select></div>
                    <div className="w-full sm:w-auto"><label className="text-[11px] font-semibold">Points</label><Input type="number" min={0} value={newChallenge.points ?? 100} onChange={e=>setNewChallenge({...newChallenge,points:Math.max(0,parseInt(e.target.value)||0)})} className="h-11 sm:h-8 min-h-[44px] sm:min-h-0 w-full sm:w-[80px] mt-1" /></div>
                    <div className="w-full sm:w-auto"><label className="text-[11px] font-semibold">Flag (stored hashed)</label><Input value={newChallenge.flag||""} onChange={e=>setNewChallenge({...newChallenge,flag:e.target.value})} placeholder="flag{...}" className="h-11 sm:h-8 min-h-[44px] sm:min-h-0 w-full sm:w-[160px] mt-1 font-mono" /></div>
                    <Button size="sm" className="h-11 sm:h-8 min-h-[44px] sm:min-h-0" onClick={async ()=>{
                      if(!requireAdmin()) return
                      if(!validateCsrfToken(csrfToken)) return alert("CSRF failed")
                      if(!newChallenge.name) return alert("Name required")
                      try {
                        const data = await adminApi("challenges", "POST", undefined, { name: sanitizeInput(newChallenge.name,200), category: newChallenge.category||"Web", difficulty: (["Easy","Medium","Hard","Insane"].includes(newChallenge.difficulty as string) ? newChallenge.difficulty : "Easy"), points: newChallenge.points ?? 100, flag: (newChallenge.flag||"").trim() || undefined })
                        setAdminChallenges([...adminChallenges, data.item as unknown as AdminChallenge])
                        setShowAddChallenge(false); setNewChallenge({name:"", category:"Web", difficulty:"Easy", points:100, flag:""})
                      } catch (err) { alert(err instanceof Error ? err.message : "Failed") }
                    }}><Save className="w-3.5 h-3.5 mr-1" /> Create</Button>
                    <Button size="sm" variant="ghost" className="h-11 sm:h-8 min-h-[44px] sm:min-h-0" onClick={()=>setShowAddChallenge(false)}><X className="w-3.5 h-3.5" /></Button>
                  </div>
                )}
                {editingChallenge && (
                  <div className="p-4 border-t bg-blue-50 dark:bg-blue-950/20 flex flex-wrap gap-2 items-end">
                    <div className="w-full sm:w-auto"><label className="text-[11px] font-semibold">Name</label><Input value={editingChallenge.name} onChange={e=>setEditingChallenge({...editingChallenge,name:e.target.value})} className="h-11 sm:h-8 min-h-[44px] sm:min-h-0 w-full sm:w-[200px] mt-1" /></div>
                    <div className="w-full sm:w-auto"><label className="text-[11px] font-semibold">Points</label><Input type="number" min={0} value={editingChallenge.points} onChange={e=>setEditingChallenge({...editingChallenge,points:Math.max(0,parseInt(e.target.value)||0)})} className="h-11 sm:h-8 min-h-[44px] sm:min-h-0 w-full sm:w-[80px] mt-1" /></div>
                    <div className="w-full sm:w-auto"><label className="text-[11px] font-semibold">New flag (optional)</label><Input placeholder="leave empty to keep" onChange={e=>setEditingChallenge({...editingChallenge,flag:e.target.value} as AdminChallenge)} className="h-11 sm:h-8 min-h-[44px] sm:min-h-0 w-full sm:w-[160px] mt-1 font-mono" /></div>
                    <Button size="sm" className="h-11 sm:h-8 min-h-[44px] sm:min-h-0" onClick={async ()=>{
                      if(!requireAdmin()) return
                      if(!validateCsrfToken(csrfToken)) return alert("CSRF failed")
                      const clean = { ...editingChallenge, name: sanitizeInput(editingChallenge.name,200) }
                      const patch: Record<string, unknown> = { name: clean.name, points: clean.points }
                      const flagVal = (editingChallenge as AdminChallenge & { flag?: string }).flag
                      if (flagVal && flagVal.trim()) patch.flag = flagVal.trim()
                      try {
                        await adminApi("challenges", "PATCH", clean.id, patch)
                        setAdminChallenges(adminChallenges.map(x=>x.id===clean.id? {...clean, hasFlag: clean.hasFlag || !!(flagVal && flagVal.trim())} : x)); setEditingChallenge(null)
                      } catch (err) { alert(err instanceof Error ? err.message : "Failed") }
                    }}><Save className="w-3.5 h-3.5 mr-1" /> Update</Button>
                    <Button size="sm" variant="ghost" className="h-11 sm:h-8 min-h-[44px] sm:min-h-0" onClick={()=>setEditingChallenge(null)}><X className="w-3.5 h-3.5" /></Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Inbox — user support chats */}
        {active==="inbox" && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
              <CardTitle className="flex items-center gap-2"><MessageSquare className="w-4 h-4" /> Inbox — {inbox.filter(x=>x.from_role==="user" && !x.read).length} unread</CardTitle>
              <Button size="sm" variant="secondary" className="h-8" onClick={async ()=>{ try { const m = await adminApi("messages"); setInbox((m.items ?? []) as unknown as typeof inbox) } catch (err) { alert(err instanceof Error ? err.message : "Failed") } }}>Refresh</Button>
            </CardHeader>
            <CardContent className="p-0">
              {(() => {
                const threads = new Map<string, typeof inbox>()
                for (const msg of inbox) {
                  const arr = threads.get(msg.user_id) ?? []
                  arr.push(msg)
                  threads.set(msg.user_id, arr)
                }
                const list = [...threads.entries()].sort((a, b) => {
                  const ta = a[1][a[1].length - 1]?.created_at ?? ""
                  const tb = b[1][b[1].length - 1]?.created_at ?? ""
                  return tb.localeCompare(ta)
                })
                const current = inboxUser ? (threads.get(inboxUser) ?? []) : []
                const reply = async () => {
                  if (!inboxUser) return
                  if(!requireAdmin()) return
                  const clean = sanitizeInput(replyDraft, 2000).trim()
                  if (!clean) return alert("Write a reply")
                  if(!validateCsrfToken(csrfToken)) return alert("CSRF failed")
                  try {
                    const data = await adminApi("messages", "POST", undefined, { user_id: inboxUser, text: clean })
                    setInbox(prev => [...prev, data.item as unknown as typeof inbox[number]])
                    setReplyDraft("")
                  } catch (err) { alert(err instanceof Error ? err.message : "Failed") }
                }
                if (list.length === 0) {
                  return <div className="p-6 text-center text-[13px] text-[var(--text-2)]">No support messages yet. Users reach you from the Messages page.</div>
                }
                return (
                  <div className="grid md:grid-cols-[260px_1fr] min-h-[320px]">
                    <div className="border-r border-[var(--border)] divide-y divide-[var(--border)] max-h-[420px] overflow-auto">
                      {list.map(([uid, msgs]) => {
                        const last = msgs[msgs.length - 1]
                        const unread = msgs.filter(x => x.from_role === "user" && !x.read).length
                        return (
                          <button key={uid} onClick={()=>setInboxUser(uid)} className={`w-full text-left p-3 hover:bg-[var(--surface-2)] ${inboxUser===uid ? "bg-[var(--surface-2)]" : ""}`}>
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[13px] font-[600] truncate">{msgs[0]?.userName || msgs[0]?.userEmail || uid.slice(0,8)}</span>
                              {unread > 0 && <Badge className="text-[10px] bg-red-600 text-white border-red-600">{unread}</Badge>}
                            </div>
                            <div className="text-[11px] text-[var(--text-3)] truncate">{msgs[0]?.userEmail}</div>
                            <div className="text-[12px] text-[var(--text-2)] truncate mt-0.5">{last?.text}</div>
                          </button>
                        )
                      })}
                    </div>
                    <div className="flex flex-col min-h-[320px]">
                      {!inboxUser || current.length === 0 ? (
                        <div className="flex-1 flex items-center justify-center text-[13px] text-[var(--text-2)] p-6">Select a conversation.</div>
                      ) : (
                        <>
                          <div className="flex-1 p-4 space-y-2 overflow-auto max-h-[360px] bg-[var(--surface-2)]">
                            {current.map(msg => (
                              <div key={msg.id} className={`${msg.from_role === "admin" ? "ml-auto bg-[var(--text)] text-[var(--background)]" : "bg-[var(--surface)] border border-[var(--border)]"} max-w-[80%] p-2.5 rounded-[10px] text-[12.5px]`}>{msg.text}</div>
                            ))}
                          </div>
                          <div className="p-3 border-t border-[var(--border)] flex gap-2">
                            <Input value={replyDraft} onChange={e=>setReplyDraft(e.target.value)} onKeyDown={e=>{ if(e.key==="Enter") reply() }} placeholder="Reply as admin..." className="flex-1 h-9 bg-[var(--surface)]" aria-label="Reply to user" />
                            <Button size="sm" className="h-9" onClick={reply} aria-label="Send reply"><Send className="w-3.5 h-3.5" /></Button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )
              })()}
            </CardContent>
          </Card>
        )}

        {/* System */}
        {active==="system" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Settings className="w-4 h-4" /> Platform Settings</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div><label className="text-[12px] font-medium">Announcement Banner</label><Input value={announcement} onChange={e=>setAnnouncement(e.target.value)} placeholder="Enter announcement..." className="mt-1.5 h-11 sm:h-9 min-h-[44px] sm:min-h-0 bg-[var(--surface)]" /></div>
                <div><label className="text-[12px] font-medium">Maintenance Mode</label><div className="mt-1.5 flex items-center gap-2"><Badge variant="outline" className={maintenance ? "bg-amber-100 text-amber-800 border-amber-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"}>{maintenance ? "On" : "Off"}</Badge><Button size="sm" variant="secondary" className="h-9 sm:h-7 min-h-[36px] sm:min-h-0 ml-auto" onClick={()=>setMaintenance(!maintenance)}>Toggle</Button></div></div>
                <Button size="sm" className="h-11 sm:h-8 min-h-[44px] sm:min-h-0 w-full" onClick={async ()=>{
                  if(!requireAdmin()) return
                  if(!validateCsrfToken(csrfToken)) return alert("CSRF failed")
                  try {
                    await adminApi("settings", "POST", undefined, { key: "announcement", value: announcement })
                    await adminApi("settings", "POST", undefined, { key: "maintenance", value: maintenance ? "1" : "0" })
                    alert("Settings saved")
                  } catch (err) { alert(err instanceof Error ? err.message : "Failed") }
                }}><Save className="w-3.5 h-3.5 mr-1" /> Save Settings</Button>
                <div className="text-[11px] text-[var(--text-3)] pt-2 border-t">RBAC, rate limiting, and secure headers are enforced server-side.</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Shield className="w-4 h-4" /> Security</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-[13px]">
                <div className="flex items-center justify-between p-3 rounded-[10px] border bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900"><span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Admin session active</span></div>
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
              <Button size="sm" className="h-11 sm:h-8 min-h-[44px] sm:min-h-0 gap-1.5" onClick={()=>setShowAddCVE(true)}><Plus className="w-3.5 h-3.5" /> Add CVE</Button>
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
                          <Button size="sm" variant="ghost" className="h-9 w-9 sm:h-7 sm:w-7 min-h-[36px] sm:min-h-0 p-0" onClick={()=>setEditingCVE(c)}><Edit2 className="w-3.5 h-3.5" /></Button>
                          <Button size="sm" variant="ghost" className="h-9 w-9 sm:h-7 sm:w-7 min-h-[36px] sm:min-h-0 p-0 text-red-600" onClick={async ()=>{
                            if(!requireAdmin()) return
                            if(!confirm(`Delete CVE "${c.cveId}"?`)) return
                            try {
                              await adminApi("cves", "DELETE", c.id)
                              setCves(cves.filter(x=>x.id!==c.id))
                            } catch (err) { alert(err instanceof Error ? err.message : "Failed") }
                          }}><Trash2 className="w-3.5 h-3.5" /></Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {showAddCVE && (
                <div className="p-4 border-t bg-[var(--surface-2)] flex flex-wrap gap-2 items-end">
                  <div className="w-full sm:w-auto"><label className="text-[11px] font-semibold">CVE ID</label><Input value={newCVE.cveId} onChange={e=>setNewCVE({...newCVE,cveId:e.target.value})} placeholder="CVE-2026-0000" className="h-11 sm:h-8 min-h-[44px] sm:min-h-0 w-full sm:w-[140px] mt-1" /></div>
                  <div className="w-full sm:w-auto"><label className="text-[11px] font-semibold">Title</label><Input value={newCVE.title} onChange={e=>setNewCVE({...newCVE,title:e.target.value})} placeholder="CVE title" className="h-11 sm:h-8 min-h-[44px] sm:min-h-0 w-full sm:w-[220px] mt-1" /></div>
                  <div className="w-full sm:w-auto"><label className="text-[11px] font-semibold">Severity</label><select value={newCVE.severity} onChange={e=>setNewCVE({...newCVE,severity:e.target.value as any})} className="h-11 sm:h-8 min-h-[44px] sm:min-h-0 rounded-[8px] border bg-[var(--surface)] px-2 text-[13px] mt-1"><option>Critical</option><option>High</option><option>Medium</option><option>Low</option></select></div>
                  <Button size="sm" className="h-11 sm:h-8 min-h-[44px] sm:min-h-0" onClick={async ()=>{
                    if(!requireAdmin()) return
                    if(!validateCsrfToken(csrfToken)) return alert("CSRF failed")
                    if(!newCVE.cveId||!newCVE.title) return alert("CVE ID & Title required")
                    const cveIdPat = /^CVE-\d{4}-\d{4,7}$/
                    const cleanId = sanitizeInput(newCVE.cveId, 20).toUpperCase()
                    if(!cveIdPat.test(cleanId)) return alert("Invalid CVE ID format (CVE-YYYY-XXXX)")
                    try {
                      const data = await adminApi("cves", "POST", undefined, { cveId: cleanId, title: sanitizeInput(newCVE.title,200), severity: (["Critical","High","Medium","Low"].includes(newCVE.severity as string) ? newCVE.severity : "High") })
                      setCves([...cves, data.item as unknown as AdminCVE])
                      setShowAddCVE(false); setNewCVE({cveId:"",title:"",severity:"High",status:"Draft"})
                    } catch (err) { alert(err instanceof Error ? err.message : "Failed") }
                  }}><Save className="w-3.5 h-3.5 mr-1" /> Save</Button>
                  <Button size="sm" variant="ghost" className="h-11 sm:h-8 min-h-[44px] sm:min-h-0" onClick={()=>setShowAddCVE(false)}><X className="w-3.5 h-3.5" /></Button>
                </div>
              )}
              {editingCVE && (
                <div className="p-4 border-t bg-blue-50 dark:bg-blue-950/20 flex flex-wrap gap-2 items-end">
                  <div className="w-full sm:w-auto"><label className="text-[11px] font-semibold">CVE ID</label><Input value={editingCVE.cveId} onChange={e=>setEditingCVE({...editingCVE,cveId:e.target.value})} className="h-11 sm:h-8 min-h-[44px] sm:min-h-0 w-full sm:w-[140px] mt-1" /></div>
                  <div className="w-full sm:w-auto"><label className="text-[11px] font-semibold">Title</label><Input value={editingCVE.title} onChange={e=>setEditingCVE({...editingCVE,title:e.target.value})} className="h-11 sm:h-8 min-h-[44px] sm:min-h-0 w-full sm:w-[220px] mt-1" /></div>
                  <div className="w-full sm:w-auto"><label className="text-[11px] font-semibold">Severity</label><select value={editingCVE.severity} onChange={e=>setEditingCVE({...editingCVE,severity:e.target.value as any})} className="h-11 sm:h-8 min-h-[44px] sm:min-h-0 rounded-[8px] border px-2 text-[13px] mt-1"><option>Critical</option><option>High</option><option>Medium</option><option>Low</option></select></div>
                  <div className="w-full sm:w-auto"><label className="text-[11px] font-semibold">Status</label><select value={editingCVE.status} onChange={e=>setEditingCVE({...editingCVE,status:e.target.value as any})} className="h-11 sm:h-8 min-h-[44px] sm:min-h-0 rounded-[8px] border px-2 text-[13px] mt-1"><option>Published</option><option>Draft</option></select></div>
                  <Button size="sm" className="h-11 sm:h-8 min-h-[44px] sm:min-h-0" onClick={async ()=>{
                    if(!requireAdmin()) return
                    if(!validateCsrfToken(csrfToken)) return alert("CSRF failed")
                    const clean: AdminCVE = { ...editingCVE, cveId: sanitizeInput(editingCVE.cveId,20).toUpperCase(), title: sanitizeInput(editingCVE.title,200) }
                    try {
                      await adminApi("cves", "PATCH", clean.id, { cveId: clean.cveId, title: clean.title, severity: clean.severity, status: clean.status })
                      setCves(cves.map(c=>c.id===clean.id? clean: c)); setEditingCVE(null)
                    } catch (err) { alert(err instanceof Error ? err.message : "Failed") }
                  }}><Save className="w-3.5 h-3.5 mr-1" /> Update</Button>
                  <Button size="sm" variant="ghost" className="h-11 sm:h-8 min-h-[44px] sm:min-h-0" onClick={()=>setEditingCVE(null)}><X className="w-3.5 h-3.5" /></Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  )
}