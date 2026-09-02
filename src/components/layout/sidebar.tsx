"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  BookOpen,
  FlaskConical,
  Trophy,
  FileText,
  Users,
  BarChart3,
  Building2,
  Settings,
  GraduationCap,
  Target,
  Shield,
  Award,
  MessageSquare,
  Calendar,
  Wrench,
  Bug,
  Library,
  ShieldCheck,
  LogOut,
  Star,
  ChevronUp,
  ChevronRight
} from "lucide-react"
import { cn } from "@/lib/utils"
import * as React from "react"
import { useAuth } from "@/components/auth-provider"

const sections = [
  {
    title: "Overview",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { label: "Skill Progress", href: "/skills", icon: Target },
      { label: "Achievements", href: "/achievements", icon: Award },
    ]
  },
  {
    title: "Learn & Practice",
    items: [
      { label: "Academy", href: "/learn", icon: BookOpen },
      { label: "Learning Paths", href: "/learn/paths", icon: GraduationCap },
      { label: "Labs", href: "/labs", icon: FlaskConical },
      { label: "Challenges", href: "/challenges", icon: Trophy },
      { label: "Tools", href: "/tools", icon: Wrench },
    ]
  },
  {
    title: "Research & Community",
    items: [
      { label: "Research", href: "/research", icon: FileText },
      { label: "CVE Feed", href: "/cve", icon: Bug },
      { label: "References", href: "/references", icon: Library },
      { label: "Community", href: "/community", icon: MessageSquare },
      { label: "Events", href: "/events", icon: Calendar },
      { label: "Leaderboard", href: "/leaderboard", icon: BarChart3 },
    ]
  },
  {
    title: "Workspace",
    items: [
      { label: "Teams", href: "/teams", icon: Users },
      { label: "Organizations", href: "/organizations", icon: Building2 },
      { label: "Admin", href: "/admin", icon: ShieldCheck },
    ]
  },
]

export function Sidebar({ collapsed, mobileOpen }: { collapsed?: boolean, mobileOpen?: boolean }) {
  const pathname = usePathname()
  const { logout, user } = useAuth()
  const displayName = user?.name || "Notva Laka"
  const displayEmail = user?.email || "xdadikuz@gmail.com"
  const displayPlan = user?.plan ? user.plan.charAt(0).toUpperCase() + user.plan.slice(1) : "Free"
  const initials = React.useMemo(() => {
    const parts = displayName.trim().split(/\s+/).filter(Boolean)
    if (parts.length === 0) return "NL"
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }, [displayName])
  const [accountOpen, setAccountOpen] = React.useState(false)
  const dropdownRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setAccountOpen(false)
    }
    if (accountOpen) document.addEventListener("mousedown", onDown)
    return () => document.removeEventListener("mousedown", onDown)
  }, [accountOpen])

  React.useEffect(() => {
    if (!accountOpen) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const el = dropdownRef.current?.querySelector("[data-dropdown]")
    if (!el) return
    import("animejs").then(({ animate }) => {
      try {
        animate(el, { opacity: [0, 1], y: [6, 0], scale: [0.98, 1], duration: 220, ease: "outQuad" })
      } catch {}
    })
  }, [accountOpen])

  return (
    <aside className={cn(
      "shrink-0 border-r border-[var(--border)] bg-[var(--surface)] flex flex-col",
      "lg:sticky lg:top-[56px] lg:h-[calc(100vh-56px)] lg:overflow-y-auto",
      collapsed ? "w-[64px]" : "w-[240px]",
      mobileOpen ? "flex fixed inset-0 top-[56px] z-30 w-full lg:static" : "hidden lg:flex"
    )}>
      <div className="flex-1 p-2.5 space-y-5 overflow-y-auto">
        {sections.map(section => (
          <div key={section.title}>
            {!collapsed && (
              <div className="px-2 mb-2 text-[10px] font-semibold tracking-[0.08em] uppercase text-zinc-500">
                {section.title}
              </div>
            )}
            <nav className="space-y-1">
              {section.items.map(item => {
                const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-[13px] font-[500] tracking-[-0.01em] transition-colors",
                      active
                        ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-sm"
                        : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800",
                      collapsed && "justify-center px-2"
                    )}
                    title={collapsed ? item.label : undefined}
                  >
                    <item.icon className={cn("w-[18px] h-[18px] shrink-0", active ? "text-white dark:text-zinc-900" : "text-zinc-500")} />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                    {!collapsed && item.label === "Challenges" && <span className="ml-auto bg-red-500 text-white text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-sm">1</span>}
                  </Link>
                )
              })}
            </nav>
          </div>
        ))}
      </div>

      {!collapsed && (
        <div className="p-2.5 space-y-3 border-t border-[var(--border)] bg-[var(--surface)]">
          <Link href="/admin" className="flex items-center gap-3 rounded-[10px] px-3 py-2.5 border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-2)] hover:text-[var(--text)] hover:bg-[var(--surface)] transition-colors">
            <Settings className="w-[18px] h-[18px] text-[var(--text-3)]" />
            <span className="text-[13px] font-[500]">Control Panel</span>
          </Link>

          <div className="relative" ref={dropdownRef}>
            <div className="flex items-center gap-2 rounded-[10px] bg-[var(--surface-2)] border border-[var(--border)] p-2">
              <button onClick={() => setAccountOpen(v => !v)} className="flex items-center gap-2.5 flex-1 min-w-0 text-left" title={`${displayName} — ${displayPlan} plan`}>
                <div className="w-7 h-7 rounded-full bg-[#7C3AED] flex items-center justify-center text-white font-bold text-[11px] shrink-0">
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-[600] text-[var(--text)] leading-none truncate" title={displayName}>{displayName}</div>
                  <div className="text-[11px] text-[var(--text-3)]">{displayPlan}</div>
                </div>
                <ChevronUp className={cn("w-3.5 h-3.5 text-[var(--text-3)] transition-transform shrink-0", accountOpen && "rotate-180")} />
              </button>
              <Link href="/settings/billing" className="shrink-0 px-3 py-1 rounded-full bg-white dark:bg-zinc-900 border border-[var(--border)] text-[11px] font-[600] text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors" title="Upgrade plan">
                Upgrade
              </Link>
            </div>

            {accountOpen && (
              <div data-dropdown className="absolute bottom-full left-0 right-0 mb-2 rounded-[12px] bg-white border border-zinc-200 shadow-xl overflow-hidden z-50">
                <div className="p-1.5">
                  <div className="px-3 py-2">
                    <div className="text-[11px] font-mono text-zinc-500">{displayEmail}</div>
                  </div>
                  <Link href="/settings/billing" onClick={() => setAccountOpen(false)} className="flex items-center justify-between px-3 py-2.5 rounded-[8px] hover:bg-zinc-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-[#7C3AED] flex items-center justify-center text-white font-bold text-[11px]">{initials}</div>
                      <div>
                        <div className="text-[13px] font-[600] text-zinc-900 leading-none">{displayName}</div>
                        <div className="text-[11px] text-zinc-500">{displayPlan}</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-zinc-400" />
                  </Link>
                  <div className="h-px bg-zinc-100 my-1" />
                  <button onClick={() => setAccountOpen(false)} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[8px] hover:bg-zinc-50 text-zinc-700 hover:text-zinc-900 transition-colors text-left">
                    <Target className="w-4 h-4 text-zinc-500" />
                    <span className="text-[13px] font-[500]">Personalization</span>
                  </button>
                  <Link href="/profile" onClick={() => setAccountOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-[8px] hover:bg-zinc-50 text-zinc-700 hover:text-zinc-900 transition-colors">
                    <Users className="w-4 h-4 text-zinc-500" />
                    <span className="text-[13px] font-[500]">Profile</span>
                  </Link>
                  <Link href="#" onClick={() => setAccountOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-[8px] hover:bg-zinc-50 text-zinc-700 hover:text-zinc-900 transition-colors">
                    <Shield className="w-4 h-4 text-zinc-500" />
                    <span className="text-[13px] font-[500]">Get help</span>
                  </Link>
                  <div className="h-px bg-zinc-100 my-1" />
                  <Link href="/settings/billing" onClick={() => setAccountOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-[8px] hover:bg-zinc-50 text-zinc-700 hover:text-zinc-900 transition-colors">
                    <Star className="w-4 h-4 text-zinc-500" />
                    <span className="text-[13px] font-[500]">Upgrade plan</span>
                  </Link>
                  <div className="h-px bg-zinc-100 my-1" />
                  <button onClick={() => { setAccountOpen(false); logout() }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[8px] hover:bg-zinc-50 text-zinc-700 hover:text-zinc-900 transition-colors text-left">
                    <LogOut className="w-4 h-4 text-zinc-500" />
                    <span className="text-[13px] font-[500]">Log out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </aside>
  )
}
