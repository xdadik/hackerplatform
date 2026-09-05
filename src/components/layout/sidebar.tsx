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
  Target,
  Shield,
  Award,
  MessageSquare,
  Calendar,
  Wrench,
  Bug,
  Library,
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
    ]
  },
]

export function Sidebar({ collapsed, mobileOpen, onClose }: { collapsed?: boolean, mobileOpen?: boolean, onClose?: () => void }) {
  const pathname = usePathname()
  const { logout, user } = useAuth()
  const isGuest = !user
  const displayName = user?.name || "Guest"
  const displayEmail = user?.email || ""
  const displayPlan = user?.plan ? user.plan.charAt(0).toUpperCase() + user.plan.slice(1) : "Free"
  const initials = React.useMemo(() => {
    if (isGuest) return "G"
    const parts = displayName.trim().split(/\s+/).filter(Boolean)
    if (parts.length === 0) return "G"
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }, [displayName, isGuest])
  const [accountOpen, setAccountOpen] = React.useState(false)
  const dropdownRef = React.useRef<HTMLDivElement>(null)
  const toggleRef = React.useRef<HTMLButtonElement>(null)
  const menuId = "sidebar-account-menu"

  React.useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setAccountOpen(false)
    }
    if (accountOpen) document.addEventListener("mousedown", onDown)
    return () => document.removeEventListener("mousedown", onDown)
  }, [accountOpen])

  React.useEffect(() => {
    if (!accountOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setAccountOpen(false)
        toggleRef.current?.focus()
      }
      if (e.key === "Tab" && dropdownRef.current) {
        const focusable = dropdownRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled])')
        if (focusable.length === 0) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
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

  // Body scroll lock when mobile drawer open
  React.useEffect(() => {
    if (mobileOpen) {
      const prev = document.body.style.overflow
      document.body.style.overflow = "hidden"
      return () => { document.body.style.overflow = prev }
    }
  }, [mobileOpen])

  // Close drawer on route change
  React.useEffect(() => {
    if (mobileOpen && onClose) onClose()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  const isActive = React.useCallback((href: string) => {
    return pathname === href || pathname.startsWith(href + '/')
  }, [pathname])

  return (
    <>
    <aside className={cn(
      "shrink-0 border-r border-[var(--border)] bg-[var(--surface)] flex flex-col overflow-y-auto",
      "lg:sticky lg:top-[56px] lg:h-[calc(100vh-56px)] lg:overflow-y-auto",
      collapsed ? "w-[64px]" : "w-[240px]",
      mobileOpen ? "flex fixed inset-0 top-[56px] z-30 w-[280px] max-w-[85vw] lg:static" : "hidden lg:flex"
    )}>
      <div className="flex-1 p-2.5 space-y-5 overflow-y-auto">
        {sections.map(section => (
          <div key={section.title}>
            {!collapsed && (
              <div className="px-2 mb-2 text-[10px] font-semibold tracking-[0.08em] uppercase text-zinc-500">
                {section.title}
              </div>
            )}
            <nav className="space-y-1" aria-label={section.title}>
              {section.items.map(item => {
                const active = isActive(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    aria-label={collapsed ? item.label : undefined}
                    className={cn(
                      "flex items-center gap-3 rounded-[10px] px-3 py-3 sm:py-2.5 text-[13px] font-[500] tracking-[-0.01em] transition-colors",
                      active
                        ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-sm"
                        : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800",
                      collapsed && "justify-center px-2"
                    )}
                    title={collapsed ? item.label : undefined}
                  >
                    <item.icon className={cn("w-[18px] h-[18px] shrink-0", active ? "text-white dark:text-zinc-900" : "text-zinc-500")} aria-hidden="true" />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                    {!collapsed && item.label === "Challenges" && <span className="ml-auto bg-red-500 text-white text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-sm" aria-hidden="true">1</span>}
                  </Link>
                )
              })}
            </nav>
          </div>
        ))}
      </div>

      {!collapsed && (
        <div className="p-2.5 space-y-3 border-t border-[var(--border)] bg-[var(--surface)]">

          <div className="relative" ref={dropdownRef}>
            {isGuest ? (
              <div className="flex flex-col gap-2 rounded-[10px] bg-[var(--surface-2)] border border-[var(--border)] p-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-zinc-300 dark:bg-zinc-700 flex items-center justify-center text-zinc-700 dark:text-zinc-200 font-bold text-[11px] shrink-0" aria-hidden="true">
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-[600] text-[var(--text)] leading-none">Guest</div>
                    <div className="text-[11px] text-[var(--text-3)]">Not signed in</div>
                  </div>
                </div>
                <Link href="/login" className="mt-1 inline-flex items-center justify-center h-8 rounded-[8px] bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 text-[12px] font-[600] px-3 hover:bg-zinc-800">Log in</Link>
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-[10px] bg-[var(--surface-2)] border border-[var(--border)] p-2">
                <button
                  ref={toggleRef}
                  onClick={() => setAccountOpen(v => !v)}
                  aria-expanded={accountOpen}
                  aria-haspopup="menu"
                  aria-controls={menuId}
                  className="flex items-center gap-2.5 flex-1 min-w-0 text-left"
                  title={`${displayName} — ${displayPlan} plan`}
                >
                  <div className="w-7 h-7 rounded-full bg-[#7C3AED] flex items-center justify-center text-white font-bold text-[11px] shrink-0" aria-hidden="true">
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-[600] text-[var(--text)] leading-none truncate" title={displayName}>{displayName}</div>
                    <div className="text-[11px] text-[var(--text-3)]">{displayPlan}</div>
                  </div>
                  <ChevronUp className={cn("w-3.5 h-3.5 text-[var(--text-3)] transition-transform shrink-0", accountOpen && "rotate-180")} aria-hidden="true" />
                </button>
                <Link href="/settings/billing" className="shrink-0 px-3 py-1 rounded-full bg-white dark:bg-zinc-900 border border-[var(--border)] text-[11px] font-[600] text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors" title="Upgrade plan">
                  Upgrade
                </Link>
              </div>
            )}

            {accountOpen && !isGuest && (
              <div id={menuId} data-dropdown role="menu" className="absolute bottom-full left-0 right-0 mb-2 rounded-[12px] bg-white border border-zinc-200 shadow-xl overflow-hidden z-50">
                <div className="p-1.5">
                  {displayEmail && (
                    <div className="px-3 py-2">
                      <div className="text-[11px] font-mono text-zinc-500 truncate">{displayEmail}</div>
                    </div>
                  )}
                  <Link href="/settings/billing" onClick={() => setAccountOpen(false)} role="menuitem" className="flex items-center justify-between px-3 py-2.5 rounded-[8px] hover:bg-zinc-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-[#7C3AED] flex items-center justify-center text-white font-bold text-[11px]" aria-hidden="true">{initials}</div>
                      <div>
                        <div className="text-[13px] font-[600] text-zinc-900 leading-none">{displayName}</div>
                        <div className="text-[11px] text-zinc-500">{displayPlan}</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-zinc-400" aria-hidden="true" />
                  </Link>
                  <div className="h-px bg-zinc-100 my-1" />
                  <button onClick={() => setAccountOpen(false)} role="menuitem" className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[8px] hover:bg-zinc-50 text-zinc-700 hover:text-zinc-900 transition-colors text-left">
                    <Target className="w-4 h-4 text-zinc-500" aria-hidden="true" />
                    <span className="text-[13px] font-[500]">Personalization</span>
                  </button>
                  <Link href="/profile" onClick={() => setAccountOpen(false)} role="menuitem" className="flex items-center gap-3 px-3 py-2.5 rounded-[8px] hover:bg-zinc-50 text-zinc-700 hover:text-zinc-900 transition-colors">
                    <Users className="w-4 h-4 text-zinc-500" aria-hidden="true" />
                    <span className="text-[13px] font-[500]">Profile</span>
                  </Link>
                  <Link href="#" onClick={() => setAccountOpen(false)} role="menuitem" className="flex items-center gap-3 px-3 py-2.5 rounded-[8px] hover:bg-zinc-50 text-zinc-700 hover:text-zinc-900 transition-colors">
                    <Shield className="w-4 h-4 text-zinc-500" aria-hidden="true" />
                    <span className="text-[13px] font-[500]">Get help</span>
                  </Link>
                  <div className="h-px bg-zinc-100 my-1" />
                  <Link href="/settings/billing" onClick={() => setAccountOpen(false)} role="menuitem" className="flex items-center gap-3 px-3 py-2.5 rounded-[8px] hover:bg-zinc-50 text-zinc-700 hover:text-zinc-900 transition-colors">
                    <Star className="w-4 h-4 text-zinc-500" aria-hidden="true" />
                    <span className="text-[13px] font-[500]">Upgrade plan</span>
                  </Link>
                  <div className="h-px bg-zinc-100 my-1" />
                  <button onClick={() => { setAccountOpen(false); logout() }} role="menuitem" className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[8px] hover:bg-zinc-50 text-zinc-700 hover:text-zinc-900 transition-colors text-left">
                    <LogOut className="w-4 h-4 text-zinc-500" aria-hidden="true" />
                    <span className="text-[13px] font-[500]">Log out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </aside>
    {mobileOpen && <div className="fixed inset-0 top-[56px] bg-black/40 z-20 lg:hidden" onClick={onClose} aria-hidden="true" />}
    </>
  )
}
