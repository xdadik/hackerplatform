"use client"
import * as React from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { sanitizeInput, sanitizeEmail, escapeHtml } from "@/lib/sanitize"
import { adminLoginLimiter } from "@/lib/rate-limit"
import { getOrCreateCsrfToken, validateCsrfToken } from "@/lib/csrf"
import {
  Users, FlaskConical, Trophy, FileText, Shield, AlertTriangle, Activity, Settings, Video, Calendar, Newspaper,
  Plus, Trash2, Edit2, Search, Save, X, Eye, Ban, CheckCircle2, Upload, Star, Database, RefreshCw
} from "lucide-react"

// ---------------------------------------------------------------------------
// Types (server row shapes from /api/admin/*)
// ---------------------------------------------------------------------------

type AdminUser = { id: string; name: string; email: string; reputation: number; status: string; role: string; plan: string; created_at?: string }
type AdminVideo = { id: string; title: string; subtitle: string; duration: string; module: string; path: string; youtube_id?: string | null; featured: boolean }
type AdminEvent = { id: string; title: string; type: string; date: string; status: string; participants: number }
type AdminNews = { id: string; title: string; excerpt: string; author: string; tags: string; views: number; status: string }
type AdminCVE = { id: string; cve_id: string; title: string; severity: string; status: string; publish_date: string | null }
type AdminLab = { id: string; title: string; category: string; difficulty: string; duration: string }

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

// ---------------------------------------------------------------------------
// Fetch helper — CSRF double-submit + cookie auth against /api/admin/*
// ---------------------------------------------------------------------------

async function adminApi<T = unknown>(
  path: string,
  init?: RequestInit
): Promise<{ ok: boolean; status: number; data?: T; error?: string }> {
  const token = getOrCreateCsrfToken()
  const headers = new Headers(init?.headers ?? {})
  headers.set("x-csrf-token", token)
  headers.set("X-Requested-With", "XMLHttpRequest")
  if (init?.body) headers.set("Content-Type", "application/json")
  let res: Response
  try {
    res = await fetch(path, { ...init, headers, credentials: "same-origin" })
  } catch {
    return { ok: false, status: 0, error: "Network error — is the server running?" }
  }
  let body: Record<string, unknown> | null = null
  try {
    body = (await res.json()) as Record<string, unknown>
  } catch {
    /* empty body */
  }
  if (!res.ok) {
    return { ok: false, status: res.status, error: (body?.error as string) ?? `Request failed (${res.status})` }
  }
  return { ok: true, status: res.status, data: body as T }
}

export default function AdminPage() {
  // --- admin session state --------------------------------------------------
  const [sessionChecked, setSessionChecked] = React.useState(false)
  const [isAdminAuthed, setIsAdminAuthed] = React.useState(false)
  const [adminUser, setAdminUser] = React.useState("")
  const [adminPass, setAdminPass] = React.useState("")
  const [loginError, setLoginError] = React.useState("")
  const [loginLoading, setLoginLoading] = React.useState(false)
  const [csrfToken, setCsrfToken] = React.useState("")
  const [dbStatus, setDbStatus] = React.useState<string>("checking")

  // --- resource state --------------------------------------------------------
  const [users, setUsers] = React.useState<AdminUser[]>([])
  const [videos, setVideos] = React.useState<AdminVideo[]>([])
  const [events, setEvents] = React.useState<AdminEvent[]>([])
  const [news, setNews] = React.useState<AdminNews[]>([])
  const [cves, setCves] = React.useState<AdminCVE[]>([])
  const [adminLabs, setAdminLabs] = React.useState<AdminLab[]>([])
  const [loadingData, setLoadingData] = React.useState(false)
  const [dataError, setDataError] = React.useState<string | null>(null)
  const [notice, setNotice] = React.useState<string | null>(null)

  // --- editing / creating state ----------------------------------------------
  const [active, setActive] = React.useState<(typeof TABS)[number]["id"]>("overview")
  const [search, setSearch] = React.useState("")

  const [editingUser, setEditingUser] = React.useState<AdminUser | null>(null)
  const [showAddUser, setShowAddUser] = React.useState(false)
  const [newUser, setNewUser] = React.useState<Partial<AdminUser> & { password?: string }>({ name: "", email: "", role: "user", status: "Active" })

  const [editingVideo, setEditingVideo] = React.useState<AdminVideo | null>(null)
  const [showAddVideo, setShowAddVideo] = React.useState(false)
  const [newVideo, setNewVideo] = React.useState<Partial<AdminVideo> & { youtube_id?: string }>({ title: "", subtitle: "", duration: "", module: "", path: "" })

  const [editingEvent, setEditingEvent] = React.useState<AdminEvent | null>(null)
  const [showAddEvent, setShowAddEvent] = React.useState(false)
  const [newEvent, setNewEvent] = React.useState<Partial<AdminEvent>>({ title: "", type: "CTF", date: "", status: "Upcoming" })

  const [editingNews, setEditingNews] = React.useState<AdminNews | null>(null)
  const [showAddNews, setShowAddNews] = React.useState(false)
  const [newNews, setNewNews] = React.useState<Partial<AdminNews>>({ title: "", excerpt: "", author: "", tags: "", status: "Draft" })

  const [editingCVE, setEditingCVE] = React.useState<AdminCVE | null>(null)
  const [showAddCVE, setShowAddCVE] = React.useState(false)
  const [newCVE, setNewCVE] = React.useState<Partial<AdminCVE>>({ cve_id: "", title: "", severity: "High", status: "Draft" })

  const [showAddLab, setShowAddLab] = React.useState(false)
  const [editingLab, setEditingLab] = React.useState<AdminLab | null>(null)
  const [newLab, setNewLab] = React.useState<Partial<AdminLab> & { flag?: string; description?: string }>({ title: "", category: "Web Security", difficulty: "Beginner", duration: "" })
  const [editLabFlag, setEditLabFlag] = React.useState("")

  const [maintenance, setMaintenance] = React.useState(false)
  const [announcement, setAnnouncement] = React.useState("")
  React.useEffect(() => {
    try {
      const v = localStorage.getItem("aegis_maintenance")
      if (v) setMaintenance(v === "1")
      const a = localStorage.getItem("aegis_announcement")
      if (a) setAnnouncement(a)
    } catch {}
  }, [])

  // --- data loading -----------------------------------------------------------
  const loadAll = React.useCallback(async () => {
    setLoadingData(true)
    setDataError(null)
    const [usersRes, videosRes, eventsRes, newsRes, cvesRes, labsRes] = await Promise.all([
      adminApi<{ data: AdminUser[] }>("/api/admin/users?limit=300"),
      adminApi<{ data: AdminVideo[] }>("/api/admin/videos"),
      adminApi<{ data: AdminEvent[] }>("/api/admin/events"),
      adminApi<{ data: AdminNews[] }>("/api/admin/news"),
      adminApi<{ data: AdminCVE[] }>("/api/admin/cves"),
      adminApi<{ data: AdminLab[] }>("/api/admin/labs"),
    ])
    if (usersRes.ok && usersRes.data) setUsers(usersRes.data.data ?? [])
    if (videosRes.ok && videosRes.data) setVideos(videosRes.data.data ?? [])
    if (eventsRes.ok && eventsRes.data) setEvents(eventsRes.data.data ?? [])
    if (newsRes.ok && newsRes.data) setNews(newsRes.data.data ?? [])
    if (cvesRes.ok && cvesRes.data) setCves(cvesRes.data.data ?? [])
    if (labsRes.ok && labsRes.data) setAdminLabs(labsRes.data.data ?? [])
    const failures = [usersRes, videosRes, eventsRes, newsRes, cvesRes, labsRes].filter((r) => !r.ok)
    if (failures.length > 0) {
      setDataError(failures[0].error ?? "Failed to load data from the server")
    }
    setLoadingData(false)
  }, [])

  // --- session bootstrap ------------------------------------------------------
  React.useEffect(() => {
    let cancelled = false
    setCsrfToken(getOrCreateCsrfToken())
    ;(async () => {
      // httpOnly cookie is invisible to JS — probe the guarded API instead
      const probe = await adminApi("/api/admin/users?limit=1")
      if (cancelled) return
      if (probe.ok) {
        setIsAdminAuthed(true)
        await loadAll()
      } else if (probe.status === 503) {
        setDataError(probe.error ?? "Database not configured")
      }
      setSessionChecked(true)
    })()
    return () => {
      cancelled = true
    }
  }, [loadAll])

  // --- health check ------------------------------------------------------------
  React.useEffect(() => {
    if (!isAdminAuthed) return
    ;(async () => {
      try {
        const res = await fetch("/api/health", { cache: "no-store" })
        const body = (await res.json()) as { db?: string }
        setDbStatus(body.db ?? "unknown")
      } catch {
        setDbStatus("unknown")
      }
    })()
  }, [isAdminAuthed])

  // --- admin auth actions -------------------------------------------------------
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const formToken = (e.target as HTMLFormElement).querySelector<HTMLInputElement>('input[name="csrf"]')?.value || csrfToken
    if (!validateCsrfToken(formToken)) {
      setLoginError("CSRF validation failed. Refresh and try again.")
      return
    }
    const rl = adminLoginLimiter.check()
    if (rl.limited) {
      setLoginError(`Too many attempts. Try again in ${Math.ceil(rl.resetMs / 60000)} min (rate limited).`)
      return
    }
    setLoginError("")
    setLoginLoading(true)
    // Real server-side check — POST /api/admin/login validates ADMIN_PASS
    // and sets the httpOnly aegis_admin_session cookie (middleware guards
    // everything else). No secret ever reaches the browser.
    const res = await adminApi("/api/admin/login", {
      method: "POST",
      body: JSON.stringify({ username: sanitizeInput(adminUser, 64).trim(), password: adminPass }),
    })
    setLoginLoading(false)
    if (!res.ok) {
      adminLoginLimiter.record(false)
      setLoginError(res.error ?? "Invalid credentials")
      return
    }
    adminLoginLimiter.reset()
    setIsAdminAuthed(true)
    setAdminPass("")
    await loadAll()
  }

  const handleAdminLogout = async () => {
    await adminApi("/api/admin/logout", { method: "POST" }).catch(() => null)
    try {
      sessionStorage.removeItem("aegis_csrf_token")
      document.cookie = "aegis_csrf_token=; Path=/; Max-Age=0; SameSite=Strict"
      localStorage.removeItem("aegis_admin_auth")
    } catch {}
    setIsAdminAuthed(false)
    setUsers([]); setVideos([]); setEvents([]); setNews([]); setCves([]); setAdminLabs([])
    setAdminUser("")
    setAdminPass("")
  }

  const flash = (message: string) => {
    setNotice(message)
    window.setTimeout(() => setNotice(null), 3500)
  }

  const mutate = React.useCallback(
    async (fn: () => Promise<{ ok: boolean; error?: string }>, successMessage: string, reload: () => void) => {
      const res = await fn()
      if (!res.ok) {
        flash(res.error ?? "Operation failed")
        return false
      }
      flash(successMessage)
      reload()
      return true
    },
    []
  )

  const reloadUsers = React.useCallback(async () => {
    const r = await adminApi<{ data: AdminUser[] }>("/api/admin/users?limit=300")
    if (r.ok && r.data) setUsers(r.data.data ?? [])
  }, [])
  const reloadVideos = React.useCallback(async () => {
    const r = await adminApi<{ data: AdminVideo[] }>("/api/admin/videos")
    if (r.ok && r.data) setVideos(r.data.data ?? [])
  }, [])
  const reloadEvents = React.useCallback(async () => {
    const r = await adminApi<{ data: AdminEvent[] }>("/api/admin/events")
    if (r.ok && r.data) setEvents(r.data.data ?? [])
  }, [])
  const reloadNews = React.useCallback(async () => {
    const r = await adminApi<{ data: AdminNews[] }>("/api/admin/news")
    if (r.ok && r.data) setNews(r.data.data ?? [])
  }, [])
  const reloadCves = React.useCallback(async () => {
    const r = await adminApi<{ data: AdminCVE[] }>("/api/admin/cves")
    if (r.ok && r.data) setCves(r.data.data ?? [])
  }, [])
  const reloadLabs = React.useCallback(async () => {
    const r = await adminApi<{ data: AdminLab[] }>("/api/admin/labs")
    if (r.ok && r.data) setAdminLabs(r.data.data ?? [])
  }, [])

  // --- filters ---------------------------------------------------------------
  const filteredUsers = users.filter(
    (u) => !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
  )
  const filteredVideos = videos.filter((v) => !search || v.title.toLowerCase().includes(search.toLowerCase()))
  const filteredEvents = events.filter((e) => !search || e.title.toLowerCase().includes(search.toLowerCase()))
  const filteredNews = news.filter((n) => !search || n.title.toLowerCase().includes(search.toLowerCase()))
  const filteredCVEs = cves.filter(
    (c) => !search || c.cve_id.toLowerCase().includes(search.toLowerCase()) || c.title.toLowerCase().includes(search.toLowerCase())
  )

  // ---------------------------------------------------------------------------
  // Login screen (server-verified)
  // ---------------------------------------------------------------------------
  if (!sessionChecked || !isAdminAuthed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)] p-4">
        <Card className="w-full max-w-[400px] shadow-sm">
          <CardContent className="p-6">
            <div className="w-10 h-10 rounded-full bg-zinc-900 text-white flex items-center justify-center mx-auto text-[14px] font-bold">A</div>
            <h1 className="mt-4 text-center text-[20px] font-[700] tracking-tight">Admin Login</h1>
            <p className="text-center text-[13px] text-[var(--text-2)] mt-1">Aegis Platform — Admin Control</p>
            <p className="text-center text-[11px] text-[var(--text-3)] mt-1">
              {sessionChecked ? "Login required — separate page, not auto open" : "Checking session…"}
            </p>
            <div className="mt-4 p-3 rounded-[8px] bg-emerald-50 border border-emerald-200 text-[11px] leading-relaxed text-emerald-900">
              <span className="font-semibold">Security:</span> Credentials are verified server-side against <code className="font-mono">ADMIN_PASS</code> (never shipped to the browser). The server sets an httpOnly <code className="font-mono">aegis_admin_session</code> cookie; <code className="font-mono">middleware.ts</code> guards every admin route.
            </div>
            {loginError && <div className="mt-4 p-3 rounded-[8px] bg-red-50 border border-red-200 text-[13px] text-red-700">{escapeHtml(loginError)}</div>}
            <form onSubmit={handleAdminLogin} className="mt-6 space-y-4">
              <input type="hidden" name="csrf" value={csrfToken} />
              <div>
                <label className="text-[12px] font-medium">Username</label>
                <Input value={adminUser} onChange={(e) => setAdminUser(e.target.value)} placeholder="admin" required className="mt-1 h-10 bg-[var(--surface)]" autoComplete="username" />
              </div>
              <div>
                <label className="text-[12px] font-medium">Password</label>
                <Input type="password" value={adminPass} onChange={(e) => setAdminPass(e.target.value)} placeholder="••••••••" required className="mt-1 h-10 bg-[var(--surface)]" autoComplete="current-password" />
              </div>
              <Button type="submit" disabled={loginLoading || !sessionChecked} className="w-full h-10 rounded-[8px] bg-zinc-900 text-white font-[600]">
                {loginLoading ? "Verifying…" : "Log in to Admin"}
              </Button>
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

  // ---------------------------------------------------------------------------
  // Admin panel (server-backed)
  // ---------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Standalone Admin Header - separated from platform */}
      <header className="sticky top-0 z-40 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 h-[56px] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-[8px] bg-zinc-900 text-white flex items-center justify-center text-[12px] font-bold">A</div>
            <div>
              <div className="text-[14px] font-bold leading-none">Aegis Admin</div>
              <div className="text-[11px] text-zinc-500">Server-backed • Supabase live</div>
            </div>
            <span className="hidden sm:inline-flex ml-3 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-medium">
              {dbStatus === "ok" ? "● DB connected" : dbStatus === "error" ? "● DB error" : dbStatus === "unconfigured" ? "● DB not configured" : "● checking…"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="hidden sm:flex rounded-full">v1.1 • Backend live</Badge>
            <Link href="/" className="h-11 sm:h-8 min-h-[44px] sm:min-h-0 px-3 rounded-[8px] border border-zinc-200 bg-white text-[13px] font-medium hover:bg-zinc-50 hidden sm:inline-flex items-center">← Back to site</Link>
            <Button size="sm" variant="secondary" className="h-11 sm:h-8 min-h-[44px] sm:min-h-0 border" onClick={loadAll}>
              <RefreshCw className="w-3.5 h-3.5 mr-1" /> Refresh
            </Button>
            <Button size="sm" variant="secondary" className="h-11 sm:h-8 min-h-[44px] sm:min-h-0 border" onClick={handleAdminLogout}>Log out</Button>
          </div>
        </div>
      </header>

      <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-6 py-6">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-[22px] font-[650] tracking-[-0.03em] flex items-center gap-2"><Shield className="w-5 h-5" /> Admin Control Panel</h1>
            <p className="mt-1 text-[13.5px] text-[var(--text-2)]">Manage users, videos, labs, challenges, events, news and CVEs. Every change is written to the database and audit-logged.</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="rounded-full gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Live data</Badge>
            <Badge variant="outline" className="rounded-full">service-role + RLS</Badge>
          </div>
        </div>

        {notice && (
          <div className="mb-4 p-3 rounded-[8px] bg-emerald-50 border border-emerald-200 text-[13px] text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" /> {escapeHtml(notice)}
          </div>
        )}
        {dataError && (
          <div className="mb-4 p-3 rounded-[8px] bg-amber-50 border border-amber-200 text-[13px] text-amber-900 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <b>Database issue:</b> {escapeHtml(dataError)}
              <div className="text-[11px] mt-1">Run <code className="font-mono">supabase/migrations/0001_init.sql</code> and <code className="font-mono">0002_audit_and_login_tracking.sql</code> in the Supabase SQL Editor, and set <code className="font-mono">SUPABASE_SERVICE_ROLE_KEY</code>.</div>
            </div>
          </div>
        )}
        {loadingData && <div className="mb-4 p-3 rounded-[8px] border border-[var(--border)] bg-[var(--surface)] text-[13px] text-[var(--text-2)]">Loading data from server…</div>}

        {/* Stats - now includes CVE */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
          <Card><CardContent className="p-4"><div className="text-[11px] tracking-widest uppercase text-[var(--text-3)] flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> Users</div><div className="text-[22px] font-[700]">{users.length.toLocaleString()}</div><div className="text-[11px] text-[var(--text-2)]">{users.filter((u) => u.status === "Pending").length} pending</div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="text-[11px] tracking-widest uppercase text-[var(--text-3)] flex items-center gap-1.5"><Video className="w-3.5 h-3.5" /> Videos</div><div className="text-[22px] font-[700]">{videos.length}</div><div className="text-[11px] text-[var(--text-2)]">{videos.filter((v) => v.featured).length} featured</div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="text-[11px] tracking-widest uppercase text-[var(--text-3)] flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Events</div><div className="text-[22px] font-[700]">{events.length}</div><div className="text-[11px] text-[var(--text-2)]">{events.filter((e) => e.status === "Live").length} live</div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="text-[11px] tracking-widest uppercase text-[var(--text-3)] flex items-center gap-1.5"><Newspaper className="w-3.5 h-3.5" /> News</div><div className="text-[22px] font-[700]">{news.length}</div><div className="text-[11px] text-amber-600">{news.filter((n) => n.status === "Pending").length} pending</div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="text-[11px] tracking-widest uppercase text-[var(--text-3)] flex items-center gap-1.5"><Shield className="w-3.5 h-3.5" /> CVE</div><div className="text-[22px] font-[700]">{cves.length}</div><div className="text-[11px] text-[var(--text-2)]">{cves.filter((c) => c.severity === "Critical").length} critical</div></CardContent></Card>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1.5 mb-6 overflow-x-auto pb-1 scrollbar-thin">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setActive(t.id)} className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 sm:py-2 min-h-[44px] sm:min-h-0 rounded-full text-[13px] font-[500] whitespace-nowrap border transition-colors ${active === t.id ? "bg-[var(--text)] text-[var(--background)] border-[var(--text)] shadow-sm" : "bg-[var(--surface)] border-[var(--border)] text-[var(--text-2)] hover:text-[var(--text)] hover:bg-[var(--surface-2)]"}`}>
              <t.icon className="w-3.5 h-3.5" /> {t.label}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-2 pl-3 w-full sm:w-auto">
            <div className="relative hidden sm:flex">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-3)]" />
              <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 h-11 sm:h-8 min-h-[44px] sm:min-h-0 w-full sm:w-[180px] bg-[var(--surface)]" />
            </div>
          </div>
        </div>

        {/* Overview */}
        {active === "overview" && (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardHeader className="pb-3 flex-row items-center justify-between space-y-0 gap-3"><CardTitle className="flex items-center gap-2 leading-none"><Users className="w-4 h-4" /> Recent Users</CardTitle><Button size="sm" variant="secondary" className="h-9 sm:h-7 min-h-[36px] sm:min-h-0" onClick={() => setActive("users")}>Manage all</Button></CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-auto">
                    <table className="w-full text-left text-[13px] table-fixed">
                      <thead className="bg-[var(--surface-2)] border-y border-[var(--border)] text-[11px] tracking-widest uppercase text-[var(--text-3)]"><tr><th className="px-4 py-2.5 font-semibold w-[32%]">User</th><th className="px-4 py-2.5 font-semibold w-[22%]">Reputation</th><th className="px-4 py-2.5 font-semibold w-[20%]">Status</th><th className="px-4 py-2.5 font-semibold text-right w-[26%]">Action</th></tr></thead>
                      <tbody className="divide-y divide-[var(--border)]">
                        {users.slice(0, 3).map((r) => (
                          <tr key={r.id} className="hover:bg-[var(--surface-2)]">
                            <td className="px-4 py-3"><div className="font-medium truncate">{r.name}</div><div className="text-[11px] text-[var(--text-3)] truncate">{r.email}</div></td>
                            <td className="px-4 py-3 font-mono">{r.reputation.toLocaleString()}</td>
                            <td className="px-4 py-3"><Badge className={`text-[11px] border ${r.status === "Active" ? "bg-emerald-600 text-white border-emerald-600" : r.status === "Banned" ? "bg-red-600 text-white border-red-600" : "bg-amber-100 text-amber-900 border-amber-200"}`}>{r.status}</Badge></td>
                            <td className="px-4 py-3 text-right"><Button size="sm" variant="ghost" className="h-9 sm:h-7 min-h-[36px] sm:min-h-0 border" onClick={() => setActive("users")}>View</Button></td>
                          </tr>
                        ))}
                        {users.length === 0 && <tr><td colSpan={4} className="px-4 py-6 text-center text-[12px] text-[var(--text-3)]">No users yet — signups will appear here.</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2"><Database className="w-4 h-4" /> System Health</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-[12px]">
                  <div className="flex items-center justify-between gap-3 p-2.5 rounded-[8px] border border-[var(--border)] bg-[var(--surface)]"><span>Database (Supabase)</span><Badge variant="outline" className={dbStatus === "ok" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-800 border-amber-200"}>{dbStatus}</Badge></div>
                  <div className="flex items-center justify-between gap-3 p-2.5 rounded-[8px] border border-[var(--border)] bg-[var(--surface)]"><span>Admin auth</span><Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">httpOnly + HMAC</Badge></div>
                  <div className="flex items-center justify-between gap-3 p-2.5 rounded-[8px] border border-[var(--border)] bg-[var(--surface)]"><span>Flags</span><Badge variant="outline">scrypt-hashed in DB</Badge></div>
                </CardContent>
              </Card>
            </div>
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2"><Video className="w-4 h-4" /> Quick Actions</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-2 gap-2">
                  <Button size="sm" className="h-9" onClick={() => { setActive("videos"); setShowAddVideo(true) }}><Plus className="w-3.5 h-3.5 mr-1" /> Video</Button>
                  <Button size="sm" variant="secondary" className="h-9" onClick={() => { setActive("events"); setShowAddEvent(true) }}><Plus className="w-3.5 h-3.5 mr-1" /> Event</Button>
                  <Button size="sm" variant="secondary" className="h-9" onClick={() => { setActive("news"); setShowAddNews(true) }}><Plus className="w-3.5 h-3.5 mr-1" /> News</Button>
                  <Button size="sm" variant="secondary" className="h-9" onClick={() => { setActive("labs"); setShowAddLab(true) }}><Plus className="w-3.5 h-3.5 mr-1" /> Lab</Button>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2"><Settings className="w-4 h-4" /> System</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="w-full sm:w-auto"><label className="text-[12px] font-medium">Announcement</label><Input value={announcement} onChange={(e) => setAnnouncement(e.target.value)} placeholder="Enter announcement..." className="mt-1.5 h-9 bg-[var(--surface)]" id="announcement" /></div>
                  <Button size="sm" className="h-11 sm:h-8 min-h-[44px] sm:min-h-0 px-4 w-full" onClick={() => { try { localStorage.setItem("aegis_announcement", announcement) } catch {}; flash("Announcement saved (visible site-wide)") }}>Publish announcement</Button>
                  <div className="text-[11px] text-[var(--text-3)] pt-2 border-t">RBAC, rate limiting, secure headers enforced. Lab isolation: containers/K8s ready.</div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Users */}
        {active === "users" && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
              <CardTitle className="flex items-center gap-2"><Users className="w-4 h-4" /> Users — {filteredUsers.length} <span className="text-[11px] font-normal text-[var(--text-3)] ml-1">manage whole platform users</span></CardTitle>
              <Button size="sm" className="h-11 sm:h-8 min-h-[44px] sm:min-h-0 gap-1.5" onClick={() => setShowAddUser(true)}><Plus className="w-3.5 h-3.5" /> Add User</Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-auto">
                <table className="w-full text-left text-[13px]">
                  <thead className="bg-[var(--surface-2)] border-y border-[var(--border)] text-[11px] tracking-widest uppercase text-[var(--text-3)]"><tr><th className="px-4 py-2.5">User</th><th className="px-4 py-2.5">Role</th><th className="px-4 py-2.5">Reputation</th><th className="px-4 py-2.5">Status</th><th className="px-4 py-2.5 text-right">Actions</th></tr></thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {filteredUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-[var(--surface-2)]">
                        <td className="px-4 py-3"><div className="font-[600]">{u.name}</div><div className="text-[11px] text-[var(--text-3)]">{u.email}</div></td>
                        <td className="px-4 py-3"><Badge variant={u.role === "admin" ? "default" : u.role === "moderator" ? "secondary" : "outline"} className="capitalize text-[11px]">{u.role}</Badge></td>
                        <td className="px-4 py-3 font-mono">{u.reputation.toLocaleString()}</td>
                        <td className="px-4 py-3"><Badge className={`text-[11px] border ${u.status === "Active" ? "bg-emerald-600 text-white border-emerald-600" : u.status === "Banned" ? "bg-red-600 text-white border-red-600" : "bg-amber-100 text-amber-900 border-amber-200"}`}>{u.status}</Badge></td>
                        <td className="px-4 py-3 text-right flex justify-end gap-1.5">
                          <Button size="sm" variant="ghost" className="h-9 w-9 sm:h-7 sm:w-7 min-h-[36px] sm:min-h-0 p-0" onClick={() => setEditingUser(u)}><Edit2 className="w-3.5 h-3.5" /></Button>
                          <Button size="sm" variant="ghost" className="h-9 w-9 sm:h-7 sm:w-7 min-h-[36px] sm:min-h-0 p-0" onClick={() => mutate(() => adminApi("/api/admin/users", { method: "PATCH", body: JSON.stringify({ id: u.id, status: u.status === "Banned" ? "Active" : "Banned" }) }), `User ${u.status === "Banned" ? "unbanned" : "banned"}`, reloadUsers)}><Ban className="w-3.5 h-3.5" /></Button>
                          <Button size="sm" variant="ghost" className="h-9 w-9 sm:h-7 sm:w-7 min-h-[36px] sm:min-h-0 p-0 text-red-600" onClick={() => { if (confirm(`Delete user ${u.email}? This removes their sessions and progress.`)) mutate(() => adminApi(`/api/admin/users?id=${encodeURIComponent(u.id)}`, { method: "DELETE" }), "User deleted", reloadUsers) }}><Trash2 className="w-3.5 h-3.5" /></Button>
                        </td>
                      </tr>
                    ))}
                    {filteredUsers.length === 0 && <tr><td colSpan={5} className="px-4 py-6 text-center text-[12px] text-[var(--text-3)]">No users {search ? "match your search" : "yet — they appear when people sign up"}.</td></tr>}
                  </tbody>
                </table>
              </div>
              {/* Add User */}
              {showAddUser && (
                <div className="p-4 border-t bg-[var(--surface-2)] flex flex-wrap gap-2 items-end">
                  <div className="w-full sm:w-auto"><label className="text-[11px] font-semibold">Name</label><Input value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} placeholder="Full name" className="h-11 sm:h-8 min-h-[44px] sm:min-h-0 w-full sm:w-[140px] mt-1" /></div>
                  <div className="w-full sm:w-auto"><label className="text-[11px] font-semibold">Email</label><Input value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} placeholder="email" className="h-11 sm:h-8 min-h-[44px] sm:min-h-0 w-full sm:w-[180px] mt-1" /></div>
                  <div className="w-full sm:w-auto"><label className="text-[11px] font-semibold">Password</label><Input type="password" value={newUser.password ?? ""} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} placeholder="min 8 chars" className="h-11 sm:h-8 min-h-[44px] sm:min-h-0 w-full sm:w-[140px] mt-1" /></div>
                  <div className="w-full sm:w-auto"><label className="text-[11px] font-semibold">Role</label><select value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })} className="h-11 sm:h-8 min-h-[44px] sm:min-h-0 rounded-[8px] border border-[var(--border)] bg-[var(--surface)] px-2 text-[13px] mt-1"><option value="user">user</option><option value="moderator">moderator</option><option value="admin">admin</option></select></div>
                  <Button size="sm" className="h-11 sm:h-8 min-h-[44px] sm:min-h-0 gap-1" onClick={async () => {
                    const cleanName = sanitizeInput(newUser.name ?? "", 32)
                    const cleanEmail = sanitizeEmail(newUser.email ?? "")
                    if (!cleanName || !cleanEmail) return flash("Fill valid name/email")
                    if ((newUser.password ?? "").length > 0 && (newUser.password ?? "").length < 8) return flash("Password must be at least 8 characters (or leave empty)")
                    if (!validateCsrfToken(csrfToken)) return flash("CSRF failed — refresh the page")
                    const ok = await mutate(() => adminApi("/api/admin/users", { method: "POST", body: JSON.stringify({ name: cleanName, email: cleanEmail, password: newUser.password || undefined, role: newUser.role ?? "user" }) }), "User created", reloadUsers)
                    if (ok) { setShowAddUser(false); setNewUser({ name: "", email: "", role: "user", status: "Active" }) }
                  }}><Save className="w-3.5 h-3.5" /> Save</Button>
                  <Button size="sm" variant="ghost" className="h-11 sm:h-8 min-h-[44px] sm:min-h-0" onClick={() => setShowAddUser(false)}><X className="w-3.5 h-3.5" /></Button>
                </div>
              )}
              {/* Edit User */}
              {editingUser && (
                <div className="p-4 border-t bg-amber-50 dark:bg-amber-950/20 flex flex-wrap gap-2 items-end">
                  <div className="w-full sm:w-auto"><label className="text-[11px] font-semibold">Name</label><Input value={editingUser.name} onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })} className="h-11 sm:h-8 min-h-[44px] sm:min-h-0 w-full sm:w-[140px] mt-1" /></div>
                  <div className="w-full sm:w-auto"><label className="text-[11px] font-semibold">Reputation</label><Input type="number" value={editingUser.reputation} onChange={(e) => setEditingUser({ ...editingUser, reputation: parseInt(e.target.value) || 0 })} className="h-11 sm:h-8 min-h-[44px] sm:min-h-0 w-full sm:w-[100px] mt-1" /></div>
                  <div className="w-full sm:w-auto"><label className="text-[11px] font-semibold">Role</label><select value={editingUser.role} onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })} className="h-11 sm:h-8 min-h-[44px] sm:min-h-0 rounded-[8px] border px-2 text-[13px] mt-1"><option value="user">user</option><option value="moderator">moderator</option><option value="admin">admin</option></select></div>
                  <div className="w-full sm:w-auto"><label className="text-[11px] font-semibold">Status</label><select value={editingUser.status} onChange={(e) => setEditingUser({ ...editingUser, status: e.target.value })} className="h-11 sm:h-8 min-h-[44px] sm:min-h-0 rounded-[8px] border px-2 text-[13px] mt-1"><option>Active</option><option>Pending</option><option>Banned</option></select></div>
                  <Button size="sm" className="h-11 sm:h-8 min-h-[44px] sm:min-h-0" onClick={async () => {
                    if (!validateCsrfToken(csrfToken)) return flash("CSRF failed — refresh the page")
                    const ok = await mutate(() => adminApi("/api/admin/users", { method: "PATCH", body: JSON.stringify({ id: editingUser.id, name: sanitizeInput(editingUser.name, 32), role: editingUser.role, status: editingUser.status, reputation: editingUser.reputation }) }), "User updated", reloadUsers)
                    if (ok) setEditingUser(null)
                  }}><Save className="w-3.5 h-3.5 mr-1" /> Update</Button>
                  <Button size="sm" variant="ghost" className="h-11 sm:h-8 min-h-[44px] sm:min-h-0" onClick={() => setEditingUser(null)}><X className="w-3.5 h-3.5" /></Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Videos */}
        {active === "videos" && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
              <CardTitle className="flex items-center gap-2"><Video className="w-4 h-4" /> Videos — {filteredVideos.length} <span className="text-[11px] font-normal text-[var(--text-3)]">manage learn videos & lessons</span></CardTitle>
              <Button size="sm" className="h-11 sm:h-8 min-h-[44px] sm:min-h-0 gap-1.5" onClick={() => setShowAddVideo(true)}><Upload className="w-3.5 h-3.5" /> Add Video</Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-auto">
                <table className="w-full text-left text-[13px]">
                  <thead className="bg-[var(--surface-2)] border-y border-[var(--border)] text-[11px] tracking-widest uppercase text-[var(--text-3)]"><tr><th className="px-4 py-2.5">Video</th><th className="px-4 py-2.5">Module</th><th className="px-4 py-2.5">Duration</th><th className="px-4 py-2.5">Featured</th><th className="px-4 py-2.5 text-right">Actions</th></tr></thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {filteredVideos.map((v) => (
                      <tr key={v.id} className="hover:bg-[var(--surface-2)]">
                        <td className="px-4 py-3"><div className="font-[600] truncate max-w-[260px]">{v.title}</div><div className="text-[11px] text-[var(--text-3)]">{v.subtitle || "—"} • {v.path || "—"}</div></td>
                        <td className="px-4 py-3"><Badge variant="secondary" className="text-[11px]">{v.module || "General"}</Badge></td>
                        <td className="px-4 py-3 font-mono text-[12px]">{v.duration}</td>
                        <td className="px-4 py-3">{v.featured ? <Star className="w-4 h-4 text-amber-500 fill-amber-500" /> : <span className="text-[11px] text-[var(--text-3)]">—</span>}</td>
                        <td className="px-4 py-3 text-right flex justify-end gap-1.5">
                          <Button size="sm" variant="ghost" className="h-9 w-9 sm:h-7 sm:w-7 min-h-[36px] sm:min-h-0 p-0" onClick={() => setEditingVideo(v)}><Edit2 className="w-3.5 h-3.5" /></Button>
                          <Button size="sm" variant="ghost" className="h-9 w-9 sm:h-7 sm:w-7 min-h-[36px] sm:min-h-0 p-0" onClick={() => mutate(() => adminApi("/api/admin/videos", { method: "PATCH", body: JSON.stringify({ id: v.id, featured: !v.featured }) }), v.featured ? "Unfeatured" : "Featured", reloadVideos)}><Star className="w-3.5 h-3.5" /></Button>
                          <Button size="sm" variant="ghost" className="h-9 w-9 sm:h-7 sm:w-7 min-h-[36px] sm:min-h-0 p-0 text-red-600" onClick={() => { if (confirm(`Delete video "${v.title}"?`)) mutate(() => adminApi(`/api/admin/videos?id=${encodeURIComponent(v.id)}`, { method: "DELETE" }), "Video deleted", reloadVideos) }}><Trash2 className="w-3.5 h-3.5" /></Button>
                        </td>
                      </tr>
                    ))}
                    {filteredVideos.length === 0 && <tr><td colSpan={5} className="px-4 py-6 text-center text-[12px] text-[var(--text-3)]">No videos yet — add your first lesson video.</td></tr>}
                  </tbody>
                </table>
              </div>
              {showAddVideo && (
                <div className="p-4 border-t bg-[var(--surface-2)] flex flex-wrap gap-2 items-end">
                  <div className="w-full sm:w-auto"><label className="text-[11px] font-semibold">Title</label><Input value={newVideo.title} onChange={(e) => setNewVideo({ ...newVideo, title: e.target.value })} placeholder="Video title" className="h-11 sm:h-8 min-h-[44px] sm:min-h-0 w-full sm:w-[180px] mt-1" /></div>
                  <div className="w-full sm:w-auto"><label className="text-[11px] font-semibold">Subtitle</label><Input value={newVideo.subtitle} onChange={(e) => setNewVideo({ ...newVideo, subtitle: e.target.value })} placeholder="Lesson" className="h-11 sm:h-8 min-h-[44px] sm:min-h-0 w-full sm:w-[140px] mt-1" /></div>
                  <div className="w-full sm:w-auto"><label className="text-[11px] font-semibold">Module</label><Input value={newVideo.module} onChange={(e) => setNewVideo({ ...newVideo, module: e.target.value })} placeholder="Module" className="h-11 sm:h-8 min-h-[44px] sm:min-h-0 w-full sm:w-[120px] mt-1" /></div>
                  <div className="w-full sm:w-auto"><label className="text-[11px] font-semibold">Duration</label><Input value={newVideo.duration} onChange={(e) => setNewVideo({ ...newVideo, duration: e.target.value })} placeholder="08:12" className="h-11 sm:h-8 min-h-[44px] sm:min-h-0 w-full sm:w-[80px] mt-1" /></div>
                  <div className="w-full sm:w-auto"><label className="text-[11px] font-semibold">Path</label><Input value={newVideo.path} onChange={(e) => setNewVideo({ ...newVideo, path: e.target.value })} placeholder="networking" className="h-11 sm:h-8 min-h-[44px] sm:min-h-0 w-full sm:w-[120px] mt-1" /></div>
                  <div className="w-full sm:w-auto"><label className="text-[11px] font-semibold">YouTube ID</label><Input value={newVideo.youtube_id ?? ""} onChange={(e) => setNewVideo({ ...newVideo, youtube_id: e.target.value })} placeholder="dQw4w9WgXcQ" className="h-11 sm:h-8 min-h-[44px] sm:min-h-0 w-full sm:w-[140px] mt-1" /></div>
                  <Button size="sm" className="h-11 sm:h-8 min-h-[44px] sm:min-h-0" onClick={async () => {
                    if (!newVideo.title) return flash("Title required")
                    if (!validateCsrfToken(csrfToken)) return flash("CSRF failed — refresh the page")
                    const ok = await mutate(() => adminApi("/api/admin/videos", { method: "POST", body: JSON.stringify({
                      title: sanitizeInput(newVideo.title ?? "", 120),
                      subtitle: sanitizeInput(newVideo.subtitle || "Lesson", 64),
                      module: sanitizeInput(newVideo.module || "General", 64),
                      duration: sanitizeInput(newVideo.duration || "00:00", 20),
                      path: sanitizeInput(newVideo.path || "cybersecurity-101", 64).toLowerCase().replace(/[^a-z0-9-]/g, "-"),
                      youtube_id: (newVideo.youtube_id || "").trim() || undefined,
                    }) }), "Video created", reloadVideos)
                    if (ok) { setShowAddVideo(false); setNewVideo({ title: "", subtitle: "", duration: "", module: "", path: "" }) }
                  }}><Save className="w-3.5 h-3.5 mr-1" /> Save</Button>
                  <Button size="sm" variant="ghost" className="h-11 sm:h-8 min-h-[44px] sm:min-h-0" onClick={() => setShowAddVideo(false)}><X className="w-3.5 h-3.5" /></Button>
                </div>
              )}
              {editingVideo && (
                <div className="p-4 border-t bg-blue-50 dark:bg-blue-950/20 flex flex-wrap gap-2 items-end">
                  <div className="w-full sm:w-auto"><label className="text-[11px] font-semibold">Title</label><Input value={editingVideo.title} onChange={(e) => setEditingVideo({ ...editingVideo, title: e.target.value })} className="h-11 sm:h-8 min-h-[44px] sm:min-h-0 w-full sm:w-[180px] mt-1" /></div>
                  <div className="w-full sm:w-auto"><label className="text-[11px] font-semibold">Duration</label><Input value={editingVideo.duration} onChange={(e) => setEditingVideo({ ...editingVideo, duration: e.target.value })} className="h-11 sm:h-8 min-h-[44px] sm:min-h-0 w-full sm:w-[80px] mt-1" /></div>
                  <div className="w-full sm:w-auto"><label className="text-[11px] font-semibold">Module</label><Input value={editingVideo.module} onChange={(e) => setEditingVideo({ ...editingVideo, module: e.target.value })} className="h-11 sm:h-8 min-h-[44px] sm:min-h-0 w-full sm:w-[120px] mt-1" /></div>
                  <Button size="sm" className="h-11 sm:h-8 min-h-[44px] sm:min-h-0" onClick={async () => {
                    if (!validateCsrfToken(csrfToken)) return flash("CSRF failed — refresh the page")
                    const ok = await mutate(() => adminApi("/api/admin/videos", { method: "PATCH", body: JSON.stringify({
                      id: editingVideo.id,
                      title: sanitizeInput(editingVideo.title, 120),
                      module: sanitizeInput(editingVideo.module, 64),
                      duration: sanitizeInput(editingVideo.duration, 20),
                    }) }), "Video updated", reloadVideos)
                    if (ok) setEditingVideo(null)
                  }}><Save className="w-3.5 h-3.5 mr-1" /> Update</Button>
                  <Button size="sm" variant="ghost" className="h-11 sm:h-8 min-h-[44px] sm:min-h-0" onClick={() => setEditingVideo(null)}><X className="w-3.5 h-3.5" /></Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Events */}
        {active === "events" && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
              <CardTitle className="flex items-center gap-2"><Calendar className="w-4 h-4" /> Events — {filteredEvents.length} <span className="text-[11px] font-normal text-[var(--text-3)]">CTFs, workshops, competitions</span></CardTitle>
              <Button size="sm" className="h-11 sm:h-8 min-h-[44px] sm:min-h-0 gap-1.5" onClick={() => setShowAddEvent(true)}><Plus className="w-3.5 h-3.5" /> Create Event</Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-auto">
                <table className="w-full text-left text-[13px]">
                  <thead className="bg-[var(--surface-2)] border-y border-[var(--border)] text-[11px] tracking-widest uppercase text-[var(--text-3)]"><tr><th className="px-4 py-2.5">Event</th><th className="px-4 py-2.5">Type</th><th className="px-4 py-2.5">Date</th><th className="px-4 py-2.5">Status</th><th className="px-4 py-2.5 text-right">Actions</th></tr></thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {filteredEvents.map((ev) => (
                      <tr key={ev.id} className="hover:bg-[var(--surface-2)]">
                        <td className="px-4 py-3 font-[600]">{ev.title}<div className="text-[11px] text-[var(--text-3)]">{ev.participants} participants</div></td>
                        <td className="px-4 py-3"><Badge variant="outline" className="text-[11px]">{ev.type}</Badge></td>
                        <td className="px-4 py-3 font-mono text-[12px]">{ev.date}</td>
                        <td className="px-4 py-3"><Badge className={`text-[11px] border ${ev.status === "Live" ? "bg-emerald-600 text-white border-emerald-600" : ev.status === "Upcoming" ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950" : "bg-zinc-100 text-zinc-600 border-zinc-200"}`}>{ev.status}</Badge></td>
                        <td className="px-4 py-3 text-right flex justify-end gap-1.5">
                          <Button size="sm" variant="ghost" className="h-9 w-9 sm:h-7 sm:w-7 min-h-[36px] sm:min-h-0 p-0" onClick={() => setEditingEvent(ev)}><Edit2 className="w-3.5 h-3.5" /></Button>
                          <Button size="sm" variant="ghost" className="h-9 w-9 sm:h-7 sm:w-7 min-h-[36px] sm:min-h-0 p-0 text-red-600" onClick={() => { if (confirm(`Delete event "${ev.title}"?`)) mutate(() => adminApi(`/api/admin/events?id=${encodeURIComponent(ev.id)}`, { method: "DELETE" }), "Event deleted", reloadEvents) }}><Trash2 className="w-3.5 h-3.5" /></Button>
                        </td>
                      </tr>
                    ))}
                    {filteredEvents.length === 0 && <tr><td colSpan={5} className="px-4 py-6 text-center text-[12px] text-[var(--text-3)]">No events yet.</td></tr>}
                  </tbody>
                </table>
              </div>
              {showAddEvent && (
                <div className="p-4 border-t bg-[var(--surface-2)] flex flex-wrap gap-2 items-end">
                  <div className="w-full sm:w-auto"><label className="text-[11px] font-semibold">Title</label><Input value={newEvent.title} onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })} placeholder="Event title" className="h-11 sm:h-8 min-h-[44px] sm:min-h-0 w-full sm:w-[200px] mt-1" /></div>
                  <div className="w-full sm:w-auto"><label className="text-[11px] font-semibold">Type</label><select value={newEvent.type} onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value })} className="h-11 sm:h-8 min-h-[44px] sm:min-h-0 rounded-[8px] border bg-[var(--surface)] px-2 text-[13px] mt-1 w-full sm:w-auto"><option>CTF</option><option>Workshop</option><option>Competition</option></select></div>
                  <div className="w-full sm:w-auto"><label className="text-[11px] font-semibold">Date</label><Input type="date" value={newEvent.date} onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })} className="h-11 sm:h-8 min-h-[44px] sm:min-h-0 w-full sm:w-[140px] mt-1" /></div>
                  <Button size="sm" className="h-11 sm:h-8 min-h-[44px] sm:min-h-0" onClick={async () => {
                    if (!newEvent.title) return flash("Title required")
                    if (!validateCsrfToken(csrfToken)) return flash("CSRF failed — refresh the page")
                    const ok = await mutate(() => adminApi("/api/admin/events", { method: "POST", body: JSON.stringify({
                      title: sanitizeInput(newEvent.title ?? "", 120),
                      type: ["CTF", "Workshop", "Competition"].includes(newEvent.type ?? "") ? newEvent.type : "CTF",
                      date: newEvent.date || new Date().toISOString().slice(0, 10),
                    }) }), "Event created", reloadEvents)
                    if (ok) { setShowAddEvent(false); setNewEvent({ title: "", type: "CTF", date: "", status: "Upcoming" }) }
                  }}><Save className="w-3.5 h-3.5 mr-1" /> Create</Button>
                  <Button size="sm" variant="ghost" className="h-11 sm:h-8 min-h-[44px] sm:min-h-0" onClick={() => setShowAddEvent(false)}><X className="w-3.5 h-3.5" /></Button>
                </div>
              )}
              {editingEvent && (
                <div className="p-4 border-t bg-amber-50 dark:bg-amber-950/20 flex flex-wrap gap-2 items-end">
                  <div className="w-full sm:w-auto"><label className="text-[11px] font-semibold">Title</label><Input value={editingEvent.title} onChange={(e) => setEditingEvent({ ...editingEvent, title: e.target.value })} className="h-11 sm:h-8 min-h-[44px] sm:min-h-0 w-full sm:w-[200px] mt-1" /></div>
                  <div className="w-full sm:w-auto"><label className="text-[11px] font-semibold">Status</label><select value={editingEvent.status} onChange={(e) => setEditingEvent({ ...editingEvent, status: e.target.value })} className="h-11 sm:h-8 min-h-[44px] sm:min-h-0 rounded-[8px] border px-2 text-[13px] mt-1 w-full sm:w-auto"><option>Live</option><option>Upcoming</option><option>Ended</option></select></div>
                  <Button size="sm" className="h-11 sm:h-8 min-h-[44px] sm:min-h-0" onClick={async () => {
                    if (!validateCsrfToken(csrfToken)) return flash("CSRF failed — refresh the page")
                    const ok = await mutate(() => adminApi("/api/admin/events", { method: "PATCH", body: JSON.stringify({ id: editingEvent.id, title: sanitizeInput(editingEvent.title, 120), status: editingEvent.status }) }), "Event updated", reloadEvents)
                    if (ok) setEditingEvent(null)
                  }}><Save className="w-3.5 h-3.5 mr-1" /> Update</Button>
                  <Button size="sm" variant="ghost" className="h-11 sm:h-8 min-h-[44px] sm:min-h-0" onClick={() => setEditingEvent(null)}><X className="w-3.5 h-3.5" /></Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* News */}
        {active === "news" && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
              <CardTitle className="flex items-center gap-2"><Newspaper className="w-4 h-4" /> News & Research — {filteredNews.length} <span className="text-[11px] font-normal text-[var(--text-3)]">write-ups, publications</span></CardTitle>
              <Button size="sm" className="h-11 sm:h-8 min-h-[44px] sm:min-h-0 gap-1.5" onClick={() => setShowAddNews(true)}><Plus className="w-3.5 h-3.5" /> Publish</Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-auto">
                <table className="w-full text-left text-[13px]">
                  <thead className="bg-[var(--surface-2)] border-y border-[var(--border)] text-[11px] tracking-widest uppercase text-[var(--text-3)]"><tr><th className="px-4 py-2.5">Article</th><th className="px-4 py-2.5">Author</th><th className="px-4 py-2.5">Views</th><th className="px-4 py-2.5">Status</th><th className="px-4 py-2.5 text-right">Actions</th></tr></thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {filteredNews.map((n) => (
                      <tr key={n.id} className="hover:bg-[var(--surface-2)]">
                        <td className="px-4 py-3"><div className="font-[600] truncate max-w-[280px]">{n.title}</div><div className="text-[11px] text-[var(--text-3)] truncate max-w-[280px]">{n.excerpt}</div></td>
                        <td className="px-4 py-3">{n.author}</td>
                        <td className="px-4 py-3 font-mono">{n.views.toLocaleString()}</td>
                        <td className="px-4 py-3"><Badge variant={n.status === "Published" ? "default" : "secondary"} className="text-[11px]">{n.status}</Badge></td>
                        <td className="px-4 py-3 text-right flex justify-end gap-1.5">
                          <Button size="sm" variant="ghost" className="h-9 w-9 sm:h-7 sm:w-7 min-h-[36px] sm:min-h-0 p-0" onClick={() => setEditingNews(n)}><Edit2 className="w-3.5 h-3.5" /></Button>
                          <Button size="sm" variant="ghost" className="h-9 w-9 sm:h-7 sm:w-7 min-h-[36px] sm:min-h-0 p-0" onClick={() => mutate(() => adminApi("/api/admin/news", { method: "PATCH", body: JSON.stringify({ id: n.id, status: n.status === "Published" ? "Draft" : "Published" }) }), n.status === "Published" ? "Unpublished" : "Published", reloadNews)}><Eye className="w-3.5 h-3.5" /></Button>
                          <Button size="sm" variant="ghost" className="h-9 w-9 sm:h-7 sm:w-7 min-h-[36px] sm:min-h-0 p-0 text-red-600" onClick={() => { if (confirm(`Delete article "${n.title}"?`)) mutate(() => adminApi(`/api/admin/news?id=${encodeURIComponent(n.id)}`, { method: "DELETE" }), "Article deleted", reloadNews) }}><Trash2 className="w-3.5 h-3.5" /></Button>
                        </td>
                      </tr>
                    ))}
                    {filteredNews.length === 0 && <tr><td colSpan={5} className="px-4 py-6 text-center text-[12px] text-[var(--text-3)]">No articles yet — publish your first research write-up.</td></tr>}
                  </tbody>
                </table>
              </div>
              {showAddNews && (
                <div className="p-4 border-t bg-[var(--surface-2)] flex flex-wrap gap-2 items-end">
                  <div className="w-full sm:w-auto"><label className="text-[11px] font-semibold">Title</label><Input value={newNews.title} onChange={(e) => setNewNews({ ...newNews, title: e.target.value })} placeholder="Article title" className="h-11 sm:h-8 min-h-[44px] sm:min-h-0 w-full sm:w-[220px] mt-1" /></div>
                  <div className="w-full sm:w-auto"><label className="text-[11px] font-semibold">Excerpt</label><Input value={newNews.excerpt} onChange={(e) => setNewNews({ ...newNews, excerpt: e.target.value })} placeholder="Short summary" className="h-11 sm:h-8 min-h-[44px] sm:min-h-0 w-full sm:w-[220px] mt-1" /></div>
                  <div className="w-full sm:w-auto"><label className="text-[11px] font-semibold">Author</label><Input value={newNews.author} onChange={(e) => setNewNews({ ...newNews, author: e.target.value })} placeholder="Author" className="h-11 sm:h-8 min-h-[44px] sm:min-h-0 w-full sm:w-[120px] mt-1" /></div>
                  <div className="w-full sm:w-auto"><label className="text-[11px] font-semibold">Tags</label><Input value={newNews.tags} onChange={(e) => setNewNews({ ...newNews, tags: e.target.value })} placeholder="aws, iam" className="h-11 sm:h-8 min-h-[44px] sm:min-h-0 w-full sm:w-[120px] mt-1" /></div>
                  <div className="w-full sm:w-auto"><label className="text-[11px] font-semibold">Status</label><select value={newNews.status} onChange={(e) => setNewNews({ ...newNews, status: e.target.value })} className="h-11 sm:h-8 min-h-[44px] sm:min-h-0 rounded-[8px] border bg-[var(--surface)] px-2 text-[13px] mt-1 w-full sm:w-auto"><option>Draft</option><option>Published</option><option>Pending</option></select></div>
                  <Button size="sm" className="h-11 sm:h-8 min-h-[44px] sm:min-h-0" onClick={async () => {
                    if (!newNews.title) return flash("Title required")
                    if (!validateCsrfToken(csrfToken)) return flash("CSRF failed — refresh the page")
                    const ok = await mutate(() => adminApi("/api/admin/news", { method: "POST", body: JSON.stringify({
                      title: sanitizeInput(newNews.title ?? "", 200),
                      excerpt: sanitizeInput(newNews.excerpt || "New research excerpt...", 500),
                      author: sanitizeInput(newNews.author || "Admin", 64),
                      tags: sanitizeInput(newNews.tags || "general", 100),
                      status: ["Draft", "Published", "Pending"].includes(newNews.status ?? "") ? newNews.status : "Draft",
                    }) }), "Article created", reloadNews)
                    if (ok) { setShowAddNews(false); setNewNews({ title: "", excerpt: "", author: "", tags: "", status: "Draft" }) }
                  }}><Save className="w-3.5 h-3.5 mr-1" /> Publish</Button>
                  <Button size="sm" variant="ghost" className="h-11 sm:h-8 min-h-[44px] sm:min-h-0" onClick={() => setShowAddNews(false)}><X className="w-3.5 h-3.5" /></Button>
                </div>
              )}
              {editingNews && (
                <div className="p-4 border-t bg-amber-50 dark:bg-amber-950/20 flex flex-wrap gap-2 items-end">
                  <div className="w-full sm:w-auto"><label className="text-[11px] font-semibold">Title</label><Input value={editingNews.title} onChange={(e) => setEditingNews({ ...editingNews, title: e.target.value })} className="h-11 sm:h-8 min-h-[44px] sm:min-h-0 w-full sm:w-[220px] mt-1" /></div>
                  <div className="w-full sm:w-auto"><label className="text-[11px] font-semibold">Excerpt</label><Input value={editingNews.excerpt} onChange={(e) => setEditingNews({ ...editingNews, excerpt: e.target.value })} className="h-11 sm:h-8 min-h-[44px] sm:min-h-0 w-full sm:w-[220px] mt-1" /></div>
                  <div className="w-full sm:w-auto"><label className="text-[11px] font-semibold">Status</label><select value={editingNews.status} onChange={(e) => setEditingNews({ ...editingNews, status: e.target.value })} className="h-11 sm:h-8 min-h-[44px] sm:min-h-0 rounded-[8px] border px-2 text-[13px] mt-1 w-full sm:w-auto"><option>Draft</option><option>Published</option><option>Pending</option></select></div>
                  <Button size="sm" className="h-11 sm:h-8 min-h-[44px] sm:min-h-0" onClick={async () => {
                    if (!validateCsrfToken(csrfToken)) return flash("CSRF failed — refresh the page")
                    const ok = await mutate(() => adminApi("/api/admin/news", { method: "PATCH", body: JSON.stringify({
                      id: editingNews.id,
                      title: sanitizeInput(editingNews.title, 200),
                      excerpt: sanitizeInput(editingNews.excerpt, 500),
                      author: sanitizeInput(editingNews.author, 64),
                      status: editingNews.status,
                    }) }), "Article updated", reloadNews)
                    if (ok) setEditingNews(null)
                  }}><Save className="w-3.5 h-3.5 mr-1" /> Update</Button>
                  <Button size="sm" variant="ghost" className="h-11 sm:h-8 min-h-[44px] sm:min-h-0" onClick={() => setEditingNews(null)}><X className="w-3.5 h-3.5" /></Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* CVE */}
        {active === "cve" && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
              <CardTitle className="flex items-center gap-2"><Shield className="w-4 h-4" /> CVE Database — {filteredCVEs.length} <span className="text-[11px] font-normal text-[var(--text-3)]">tracked vulnerabilities</span></CardTitle>
              <Button size="sm" className="h-11 sm:h-8 min-h-[44px] sm:min-h-0 gap-1.5" onClick={() => setShowAddCVE(true)}><Plus className="w-3.5 h-3.5" /> Add CVE</Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-auto">
                <table className="w-full text-left text-[13px]">
                  <thead className="bg-[var(--surface-2)] border-y border-[var(--border)] text-[11px] tracking-widest uppercase text-[var(--text-3)]"><tr><th className="px-4 py-2.5">CVE ID</th><th className="px-4 py-2.5">Title</th><th className="px-4 py-2.5">Severity</th><th className="px-4 py-2.5">Status</th><th className="px-4 py-2.5 text-right">Actions</th></tr></thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {filteredCVEs.map((c) => (
                      <tr key={c.id} className="hover:bg-[var(--surface-2)]">
                        <td className="px-4 py-3 font-mono text-[12px] font-[600]">{c.cve_id}</td>
                        <td className="px-4 py-3"><div className="truncate max-w-[320px]">{c.title}</div></td>
                        <td className="px-4 py-3"><Badge className={`text-[11px] border ${c.severity === "Critical" ? "bg-red-600 text-white border-red-600" : c.severity === "High" ? "bg-orange-500 text-white border-orange-500" : c.severity === "Medium" ? "bg-amber-100 text-amber-900 border-amber-200" : "bg-zinc-100 text-zinc-600 border-zinc-200"}`}>{c.severity}</Badge></td>
                        <td className="px-4 py-3"><Badge variant={c.status === "Published" ? "default" : "secondary"} className="text-[11px]">{c.status}</Badge></td>
                        <td className="px-4 py-3 text-right flex justify-end gap-1.5">
                          <Button size="sm" variant="ghost" className="h-9 w-9 sm:h-7 sm:w-7 min-h-[36px] sm:min-h-0 p-0" onClick={() => setEditingCVE(c)}><Edit2 className="w-3.5 h-3.5" /></Button>
                          <Button size="sm" variant="ghost" className="h-9 w-9 sm:h-7 sm:w-7 min-h-[36px] sm:min-h-0 p-0" onClick={() => mutate(() => adminApi("/api/admin/cves", { method: "PATCH", body: JSON.stringify({ id: c.id, status: c.status === "Published" ? "Draft" : "Published" }) }), c.status === "Published" ? "Moved to draft" : "CVE published", reloadCves)}><Eye className="w-3.5 h-3.5" /></Button>
                          <Button size="sm" variant="ghost" className="h-9 w-9 sm:h-7 sm:w-7 min-h-[36px] sm:min-h-0 p-0 text-red-600" onClick={() => { if (confirm(`Delete ${c.cve_id}?`)) mutate(() => adminApi(`/api/admin/cves?id=${encodeURIComponent(c.id)}`, { method: "DELETE" }), "CVE deleted", reloadCves) }}><Trash2 className="w-3.5 h-3.5" /></Button>
                        </td>
                      </tr>
                    ))}
                    {filteredCVEs.length === 0 && <tr><td colSpan={5} className="px-4 py-6 text-center text-[12px] text-[var(--text-3)]">No CVEs tracked yet.</td></tr>}
                  </tbody>
                </table>
              </div>
              {showAddCVE && (
                <div className="p-4 border-t bg-[var(--surface-2)] flex flex-wrap gap-2 items-end">
                  <div className="w-full sm:w-auto"><label className="text-[11px] font-semibold">CVE ID</label><Input value={newCVE.cve_id} onChange={(e) => setNewCVE({ ...newCVE, cve_id: e.target.value })} placeholder="CVE-2026-0000" className="h-11 sm:h-8 min-h-[44px] sm:min-h-0 w-full sm:w-[140px] mt-1" /></div>
                  <div className="w-full sm:w-auto"><label className="text-[11px] font-semibold">Title</label><Input value={newCVE.title} onChange={(e) => setNewCVE({ ...newCVE, title: e.target.value })} placeholder="CVE title" className="h-11 sm:h-8 min-h-[44px] sm:min-h-0 w-full sm:w-[220px] mt-1" /></div>
                  <div className="w-full sm:w-auto"><label className="text-[11px] font-semibold">Severity</label><select value={newCVE.severity} onChange={(e) => setNewCVE({ ...newCVE, severity: e.target.value })} className="h-11 sm:h-8 min-h-[44px] sm:min-h-0 rounded-[8px] border bg-[var(--surface)] px-2 text-[13px] mt-1"><option>Critical</option><option>High</option><option>Medium</option><option>Low</option></select></div>
                  <div className="w-full sm:w-auto"><label className="text-[11px] font-semibold">Status</label><select value={newCVE.status} onChange={(e) => setNewCVE({ ...newCVE, status: e.target.value })} className="h-11 sm:h-8 min-h-[44px] sm:min-h-0 rounded-[8px] border bg-[var(--surface)] px-2 text-[13px] mt-1"><option>Draft</option><option>Published</option></select></div>
                  <Button size="sm" className="h-11 sm:h-8 min-h-[44px] sm:min-h-0" onClick={async () => {
                    if (!newCVE.cve_id || !newCVE.title) return flash("CVE ID & Title required")
                    if (!validateCsrfToken(csrfToken)) return flash("CSRF failed — refresh the page")
                    const ok = await mutate(() => adminApi("/api/admin/cves", { method: "POST", body: JSON.stringify({
                      cve_id: sanitizeInput(newCVE.cve_id ?? "", 20).toUpperCase(),
                      title: sanitizeInput(newCVE.title ?? "", 200),
                      severity: ["Critical", "High", "Medium", "Low"].includes(newCVE.severity ?? "") ? newCVE.severity : "High",
                      status: ["Draft", "Published"].includes(newCVE.status ?? "") ? newCVE.status : "Draft",
                      publish_date: new Date().toISOString().slice(0, 10),
                    }) }), "CVE created", reloadCves)
                    if (ok) { setShowAddCVE(false); setNewCVE({ cve_id: "", title: "", severity: "High", status: "Draft" }) }
                  }}><Save className="w-3.5 h-3.5 mr-1" /> Save</Button>
                  <Button size="sm" variant="ghost" className="h-11 sm:h-8 min-h-[44px] sm:min-h-0" onClick={() => setShowAddCVE(false)}><X className="w-3.5 h-3.5" /></Button>
                </div>
              )}
              {editingCVE && (
                <div className="p-4 border-t bg-amber-50 dark:bg-amber-950/20 flex flex-wrap gap-2 items-end">
                  <div className="w-full sm:w-auto"><label className="text-[11px] font-semibold">CVE ID</label><Input value={editingCVE.cve_id} onChange={(e) => setEditingCVE({ ...editingCVE, cve_id: e.target.value })} className="h-11 sm:h-8 min-h-[44px] sm:min-h-0 w-full sm:w-[140px] mt-1" /></div>
                  <div className="w-full sm:w-auto"><label className="text-[11px] font-semibold">Title</label><Input value={editingCVE.title} onChange={(e) => setEditingCVE({ ...editingCVE, title: e.target.value })} className="h-11 sm:h-8 min-h-[44px] sm:min-h-0 w-full sm:w-[220px] mt-1" /></div>
                  <div className="w-full sm:w-auto"><label className="text-[11px] font-semibold">Severity</label><select value={editingCVE.severity} onChange={(e) => setEditingCVE({ ...editingCVE, severity: e.target.value })} className="h-11 sm:h-8 min-h-[44px] sm:min-h-0 rounded-[8px] border px-2 text-[13px] mt-1 w-full sm:w-auto"><option>Critical</option><option>High</option><option>Medium</option><option>Low</option></select></div>
                  <Button size="sm" className="h-11 sm:h-8 min-h-[44px] sm:min-h-0" onClick={async () => {
                    if (!validateCsrfToken(csrfToken)) return flash("CSRF failed — refresh the page")
                    const ok = await mutate(() => adminApi("/api/admin/cves", { method: "PATCH", body: JSON.stringify({
                      id: editingCVE.id,
                      cve_id: sanitizeInput(editingCVE.cve_id, 20).toUpperCase(),
                      title: sanitizeInput(editingCVE.title, 200),
                      severity: editingCVE.severity,
                    }) }), "CVE updated", reloadCves)
                    if (ok) setEditingCVE(null)
                  }}><Save className="w-3.5 h-3.5 mr-1" /> Update</Button>
                  <Button size="sm" variant="ghost" className="h-11 sm:h-8 min-h-[44px] sm:min-h-0" onClick={() => setEditingCVE(null)}><X className="w-3.5 h-3.5" /></Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Labs */}
        {active === "labs" && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
              <CardTitle className="flex items-center gap-2"><FlaskConical className="w-4 h-4" /> Labs — {adminLabs.length} <span className="text-[11px] font-normal text-[var(--text-3)]">flags are scrypt-hashed server-side</span></CardTitle>
              <Button size="sm" className="h-11 sm:h-8 min-h-[44px] sm:min-h-0 gap-1.5" onClick={() => setShowAddLab(true)}><Plus className="w-3.5 h-3.5" /> Create Lab</Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-auto">
                <table className="w-full text-left text-[13px]">
                  <thead className="bg-[var(--surface-2)] border-y border-[var(--border)] text-[11px] tracking-widest uppercase text-[var(--text-3)]"><tr><th className="px-4 py-2.5">Lab</th><th className="px-4 py-2.5">Category</th><th className="px-4 py-2.5">Difficulty</th><th className="px-4 py-2.5">Duration</th><th className="px-4 py-2.5 text-right">Actions</th></tr></thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {adminLabs.map((l) => (
                      <tr key={l.id} className="hover:bg-[var(--surface-2)]">
                        <td className="px-4 py-3 font-[600]">{l.title}</td>
                        <td className="px-4 py-3"><Badge variant="outline" className="text-[11px]">{l.category}</Badge></td>
                        <td className="px-4 py-3 text-[12px]">{l.difficulty}</td>
                        <td className="px-4 py-3 font-mono text-[12px]">{l.duration}</td>
                        <td className="px-4 py-3 text-right flex justify-end gap-1.5">
                          <Button size="sm" variant="ghost" className="h-9 w-9 sm:h-7 sm:w-7 min-h-[36px] sm:min-h-0 p-0" onClick={() => { setEditingLab(l); setEditLabFlag("") }}><Edit2 className="w-3.5 h-3.5" /></Button>
                          <Button size="sm" variant="ghost" className="h-9 w-9 sm:h-7 sm:w-7 min-h-[36px] sm:min-h-0 p-0 text-red-600" onClick={() => { if (confirm(`Delete lab "${l.title}"?`)) mutate(() => adminApi(`/api/admin/labs?id=${encodeURIComponent(l.id)}`, { method: "DELETE" }), "Lab deleted", reloadLabs) }}><Trash2 className="w-3.5 h-3.5" /></Button>
                        </td>
                      </tr>
                    ))}
                    {adminLabs.length === 0 && <tr><td colSpan={5} className="px-4 py-6 text-center text-[12px] text-[var(--text-3)]">No labs in the database yet — create one (with a flag) to make it solvable.</td></tr>}
                  </tbody>
                </table>
              </div>
              {showAddLab && (
                <div className="p-4 border-t bg-[var(--surface-2)] flex flex-wrap gap-2 items-end">
                  <div className="w-full sm:w-auto"><label className="text-[11px] font-semibold">Title</label><Input value={newLab.title} onChange={(e) => setNewLab({ ...newLab, title: e.target.value })} placeholder="Lab title" className="h-11 sm:h-8 min-h-[44px] sm:min-h-0 w-full sm:w-[200px] mt-1" /></div>
                  <div className="w-full sm:w-auto"><label className="text-[11px] font-semibold">Category</label><select value={newLab.category} onChange={(e) => setNewLab({ ...newLab, category: e.target.value })} className="h-11 sm:h-8 min-h-[44px] sm:min-h-0 rounded-[8px] border bg-[var(--surface)] px-2 text-[13px] mt-1 w-full sm:w-auto"><option>Web Security</option><option>Linux</option><option>Active Directory</option><option>Cloud Security</option><option>Forensics</option></select></div>
                  <div className="w-full sm:w-auto"><label className="text-[11px] font-semibold">Difficulty</label><select value={newLab.difficulty} onChange={(e) => setNewLab({ ...newLab, difficulty: e.target.value })} className="h-11 sm:h-8 min-h-[44px] sm:min-h-0 rounded-[8px] border px-2 text-[13px] mt-1 w-full sm:w-auto"><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select></div>
                  <div className="w-full sm:w-auto"><label className="text-[11px] font-semibold">Duration</label><Input value={newLab.duration} onChange={(e) => setNewLab({ ...newLab, duration: e.target.value })} placeholder="45 min" className="h-11 sm:h-8 min-h-[44px] sm:min-h-0 w-full sm:w-[90px] mt-1" /></div>
                  <div className="w-full sm:w-auto"><label className="text-[11px] font-semibold">Flag (optional)</label><Input value={newLab.flag ?? ""} onChange={(e) => setNewLab({ ...newLab, flag: e.target.value })} placeholder="flag{...}" className="h-11 sm:h-8 min-h-[44px] sm:min-h-0 w-full sm:w-[180px] mt-1" /></div>
                  <Button size="sm" className="h-11 sm:h-8 min-h-[44px] sm:min-h-0" onClick={async () => {
                    if (!newLab.title) return flash("Title required")
                    if ((newLab.flag ?? "") && !/^(flag|aegis)\{[^}]+\}$/.test((newLab.flag ?? "").trim())) return flash("Flag must look like flag{...}")
                    if (!validateCsrfToken(csrfToken)) return flash("CSRF failed — refresh the page")
                    const ok = await mutate(() => adminApi("/api/admin/labs", { method: "POST", body: JSON.stringify({
                      title: sanitizeInput(newLab.title ?? "", 120),
                      category: sanitizeInput(newLab.category || "Web Security", 64),
                      difficulty: ["Beginner", "Intermediate", "Advanced"].includes(newLab.difficulty ?? "") ? newLab.difficulty : "Beginner",
                      duration: sanitizeInput(newLab.duration || "60 min", 20),
                      flag: (newLab.flag ?? "").trim() || undefined,
                    }) }), "Lab created", reloadLabs)
                    if (ok) { setShowAddLab(false); setNewLab({ title: "", category: "Web Security", difficulty: "Beginner", duration: "" }) }
                  }}><Save className="w-3.5 h-3.5 mr-1" /> Create</Button>
                  <Button size="sm" variant="ghost" className="h-11 sm:h-8 min-h-[44px] sm:min-h-0" onClick={() => setShowAddLab(false)}><X className="w-3.5 h-3.5" /></Button>
                </div>
              )}
              {editingLab && (
                <div className="p-4 border-t bg-amber-50 dark:bg-amber-950/20 flex flex-wrap gap-2 items-end">
                  <div className="w-full sm:w-auto"><label className="text-[11px] font-semibold">Title</label><Input value={editingLab.title} onChange={(e) => setEditingLab({ ...editingLab, title: e.target.value })} className="h-11 sm:h-8 min-h-[44px] sm:min-h-0 w-full sm:w-[200px] mt-1" /></div>
                  <div className="w-full sm:w-auto"><label className="text-[11px] font-semibold">Duration</label><Input value={editingLab.duration} onChange={(e) => setEditingLab({ ...editingLab, duration: e.target.value })} className="h-11 sm:h-8 min-h-[44px] sm:min-h-0 w-full sm:w-[90px] mt-1" /></div>
                  <div className="w-full sm:w-auto"><label className="text-[11px] font-semibold">New flag (optional)</label><Input value={editLabFlag} onChange={(e) => setEditLabFlag(e.target.value)} placeholder="leave empty to keep current" className="h-11 sm:h-8 min-h-[44px] sm:min-h-0 w-full sm:w-[180px] mt-1" /></div>
                  <Button size="sm" className="h-11 sm:h-8 min-h-[44px] sm:min-h-0" onClick={async () => {
                    if (!validateCsrfToken(csrfToken)) return flash("CSRF failed — refresh the page")
                    const body: Record<string, unknown> = {
                      id: editingLab.id,
                      title: sanitizeInput(editingLab.title, 120),
                      duration: sanitizeInput(editingLab.duration, 20),
                    }
                    if (editLabFlag.trim()) {
                      if (!/^(flag|aegis)\{[^}]+\}$/.test(editLabFlag.trim())) return flash("Flag must look like flag{...}")
                      body.flag = editLabFlag.trim()
                    }
                    const ok = await mutate(() => adminApi("/api/admin/labs", { method: "PATCH", body: JSON.stringify(body) }), "Lab updated", reloadLabs)
                    if (ok) { setEditingLab(null); setEditLabFlag("") }
                  }}><Save className="w-3.5 h-3.5 mr-1" /> Update</Button>
                  <Button size="sm" variant="ghost" className="h-11 sm:h-8 min-h-[44px] sm:min-h-0" onClick={() => setEditingLab(null)}><X className="w-3.5 h-3.5" /></Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* System */}
        {active === "system" && (
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2"><Settings className="w-4 h-4" /> Platform Settings</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div><label className="text-[12px] font-medium">Announcement</label><Input value={announcement} onChange={(e) => setAnnouncement(e.target.value)} placeholder="Maintenance window, new content…" className="mt-1.5 h-9 bg-[var(--surface)]" /></div>
                <div><label className="text-[12px] font-medium">Maintenance Mode</label><div className="mt-1.5 flex items-center gap-2"><Badge variant="outline" className={maintenance ? "bg-amber-100 text-amber-800 border-amber-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"}>{maintenance ? "On" : "Off"}</Badge><Button size="sm" variant="secondary" className="h-9 sm:h-7 min-h-[36px] sm:min-h-0 ml-auto" onClick={() => { const n = !maintenance; setMaintenance(n); try { localStorage.setItem("aegis_maintenance", n ? "1" : "0") } catch {} }}>Toggle</Button></div></div>
                <Button size="sm" className="h-11 sm:h-8 min-h-[44px] sm:min-h-0 w-full" onClick={() => { try { localStorage.setItem("aegis_announcement", announcement); localStorage.setItem("aegis_maintenance", maintenance ? "1" : "0") } catch {}; flash("Settings saved") }}><Save className="w-3.5 h-3.5 mr-1" /> Save Settings</Button>
                <div className="text-[11px] text-[var(--text-3)] pt-2 border-t">Announcement/maintenance are site-wide UI flags (localStorage). DB status: <b>{dbStatus}</b>.</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2"><Database className="w-4 h-4" /> Backend Status</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-[12px]">
                <div className="flex items-center justify-between gap-3 p-2.5 rounded-[8px] border border-[var(--border)] bg-[var(--surface)]"><span>/api/health database check</span><Badge variant="outline" className={dbStatus === "ok" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-800 border-amber-200"}>{dbStatus}</Badge></div>
                <div className="flex items-center justify-between gap-3 p-2.5 rounded-[8px] border border-[var(--border)] bg-[var(--surface)]"><span>Admin auth</span><Badge variant="outline">httpOnly cookie + HMAC + CSRF</Badge></div>
                <div className="flex items-center justify-between gap-3 p-2.5 rounded-[8px] border border-[var(--border)] bg-[var(--surface)]"><span>Lab flags</span><Badge variant="outline">scrypt-hashed (never plaintext)</Badge></div>
                <div className="flex items-center justify-between gap-3 p-2.5 rounded-[8px] border border-[var(--border)] bg-[var(--surface)]"><span>Audit log</span><Badge variant="outline">audit_logs table (0002)</Badge></div>
                <div className="p-2.5 rounded-[8px] border border-[var(--border)] bg-[var(--surface)] text-[11px] text-[var(--text-3)]">If DB shows "error": run 0001 + 0002 migrations in the Supabase SQL Editor. If "unconfigured": set SUPABASE_SERVICE_ROLE_KEY in the deployment env.</div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
