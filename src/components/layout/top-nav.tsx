"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Search, Bell, MessageSquare, Moon, Sun, Menu, X, Command } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useTheme } from "./theme-provider"
import { useAuth } from "@/components/auth-provider"
import * as React from "react"

export function TopNav({ onMenuToggle, mobileOpen: externalOpen, hasUnread = true, onSearchOpen }: { onMenuToggle?: () => void, mobileOpen?: boolean, hasUnread?: boolean, onSearchOpen?: () => void }) {
  const pathname = usePathname()
  const { toggle } = useTheme()
  const { isLoggedIn, logout, user } = useAuth()
  const displayName = user?.name || "Guest"
  const displayPlan = user?.plan ? user.plan.charAt(0).toUpperCase() + user.plan.slice(1) : "Free"
  const initials = React.useMemo(() => {
    if (!user) return "G"
    const parts = displayName.trim().split(/\s+/).filter(Boolean)
    if (parts.length === 0) return "G"
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }, [displayName, user])
  const [scrolled, setScrolled] = React.useState(false)
  const [internalOpen, setInternalOpen] = React.useState(false)
  const isControlled = externalOpen !== undefined
  const mobileOpen = isControlled ? externalOpen : internalOpen
  const handleToggle = onMenuToggle ?? (() => setInternalOpen(v => !v))
  const drawerRef = React.useRef<HTMLElement>(null)

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener("scroll", onScroll)
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const openSearch = React.useCallback(() => {
    if (onSearchOpen) {
      onSearchOpen()
      return
    }
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true }))
  }, [onSearchOpen])

  // Escape handler and focus trap for drawer
  React.useEffect(() => {
    if (!mobileOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isControlled) onMenuToggle?.()
        else setInternalOpen(false)
      }
      if (e.key === "Tab" && drawerRef.current) {
        const focusable = drawerRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([disabled])')
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
  }, [mobileOpen, isControlled, onMenuToggle])

  return (
    <header className={`sticky top-0 z-40 w-full border-b bg-[var(--surface)]/95 backdrop-blur-[12px] supports-[backdrop-filter]:bg-[var(--surface)]/80 transition-shadow border-[var(--border)] ${scrolled ? "shadow-sm" : ""}`}>
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 flex h-[56px] items-center justify-between gap-4">
        {/* Left */}
        <div className="flex items-center gap-8">
          <div className="hidden lg:flex items-center gap-2 text-[12px] text-zinc-500">
            <span className="hidden">Platform</span>
          </div>
        </div>

        {/* Center: Search - only when logged in */}
        {isLoggedIn ? (
          <div className="hidden md:flex flex-1 max-w-[360px] mx-4">
            <button
              onClick={openSearch}
              aria-label="Search labs, challenges, research"
              className="w-full flex items-center gap-2.5 h-8 pl-3 pr-2 rounded-[8px] bg-[var(--surface-2)] border border-[var(--border)] hover:border-[var(--border-strong)] hover:bg-[var(--surface)] transition-colors text-left group"
            >
              <Search className="w-3.5 h-3.5 text-[var(--text-3)]" aria-hidden="true" />
              <span className="text-[13px] text-[var(--text-3)] flex-1">Search</span>
              <span className="hidden xl:inline-flex items-center gap-1 text-[11px] font-mono text-[var(--text-3)] border border-[var(--border)] bg-[var(--surface)] rounded-[6px] px-1.5 py-0.5">
                <Command className="w-3 h-3" aria-hidden="true" />K
              </span>
            </button>
          </div>
        ) : (
          <div className="hidden md:flex flex-1 max-w-[360px] mx-4" />
        )}

        {/* Right */}
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="hidden sm:inline-flex h-10 w-10 sm:h-8 sm:w-8 text-zinc-600 dark:text-zinc-300 hover:text-[var(--text)] hover:bg-[var(--surface-2)]" aria-label="Toggle theme" onClick={toggle}>
            <Sun className="w-4 h-4 dark:hidden" aria-hidden="true" />
            <Moon className="w-4 h-4 hidden dark:block" aria-hidden="true" />
          </Button>

          {isLoggedIn && (
            <>
              <Link href="/notifications" className="inline-flex relative p-2.5 sm:p-2 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 items-center justify-center rounded-[8px] hover:bg-[var(--surface-2)] text-zinc-600 dark:text-zinc-300 hover:text-[var(--text)] transition-colors" aria-label="Notifications">
                <Bell className="w-4 h-4" aria-hidden="true" />
                {hasUnread && <span className="absolute top-1.5 right-1.5 sm:top-1 sm:right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-[var(--surface)]" aria-hidden="true" />}
              </Link>

              <Link href="/messages" className="inline-flex p-2.5 sm:p-2 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 items-center justify-center rounded-[8px] hover:bg-[var(--surface-2)] text-zinc-600 dark:text-zinc-300 hover:text-[var(--text)] transition-colors" aria-label="Messages">
                <MessageSquare className="w-4 h-4" aria-hidden="true" />
              </Link>
            </>
          )}

          {!isLoggedIn && pathname !== "/" && (
            <div className="flex items-center gap-2 pl-3 ml-2 border-l border-[var(--border)]">
              <Link href="/login">
                <Button variant="outline" size="sm" className="h-8 px-4 sm:px-5 rounded-[8px] font-[700] border-2 border-zinc-900 dark:border-zinc-100 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800">Log in</Button>
              </Link>
              <Link href="/signup">
                <Button size="sm" className="h-8 px-4 sm:px-5 rounded-[8px] bg-[var(--text)] text-[var(--background)] hover:bg-zinc-800 dark:hover:bg-zinc-800 font-[650] shadow-sm">Sign up</Button>
              </Link>
            </div>
          )}

          <button
            onClick={handleToggle}
            className="lg:hidden p-3 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-[8px] hover:bg-[var(--surface-2)] text-[var(--text-2)]"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav-drawer"
          >
            {mobileOpen ? <X className="w-5 h-5" aria-hidden="true" /> : <Menu className="w-5 h-5" aria-hidden="true" />}
          </button>
        </div>
      </div>

      {/* Mobile search - only when logged in */}
      {isLoggedIn && (
        <div className="md:hidden px-4 pb-3">
          <button
            onClick={openSearch}
            aria-label="Search labs, challenges, research"
            className="w-full flex items-center gap-2 h-11 sm:h-9 px-3 rounded-[8px] bg-[var(--surface-2)] border border-[var(--border)] text-[13px] text-[var(--text-3)]"
          >
            <Search className="w-3.5 h-3.5" aria-hidden="true" /> Search labs, challenges, research...
          </button>
        </div>
      )}

      {/* Mobile drawer - sidebar is primary nav when controlled externally; this drawer only for standalone pages */}
      {mobileOpen && externalOpen === undefined && (
        <div id="mobile-nav-drawer" ref={drawerRef as any} role="dialog" aria-modal="true" aria-label="Mobile navigation" className="lg:hidden border-t border-[var(--border)] bg-[var(--surface)]">
          <nav className="px-2 py-3 space-y-1 max-h-[70vh] overflow-auto" aria-label="Mobile">
            {isLoggedIn && (
              <div className="space-y-1">
                <Link href="/notifications" onClick={() => setInternalOpen(false)} className="flex items-center gap-3 px-3 py-3 sm:py-2.5 rounded-[8px] text-[13px] font-[500] text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 min-h-[44px]">
                  <Bell className="w-4 h-4" aria-hidden="true" /> Notifications {hasUnread && <span className="ml-auto w-2 h-2 bg-red-500 rounded-full" aria-hidden="true" />}
                </Link>
                <Link href="/messages" onClick={() => setInternalOpen(false)} className="flex items-center gap-3 px-3 py-3 sm:py-2.5 rounded-[8px] text-[13px] font-[500] text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 min-h-[44px]">
                  <MessageSquare className="w-4 h-4" aria-hidden="true" /> Messages
                </Link>
              </div>
            )}
            <div className="pt-3 mt-3 border-t border-[var(--border)] px-2 space-y-2">
              {isLoggedIn ? (
                <div className="flex items-center gap-3 p-2 rounded-[10px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                  <Avatar className="h-8 w-8"><AvatarFallback className="bg-[#7C3AED] text-white text-[11px]">{initials}</AvatarFallback></Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-[600] text-zinc-900 dark:text-white leading-none">{displayName}</div>
                    <div className="text-[11px] text-zinc-500">{displayPlan} plan</div>
                  </div>
                  <Button size="sm" variant="ghost" className="h-7 text-[11px] min-h-[32px]" onClick={() => { setInternalOpen(false); logout() }}>Sign out</Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Link href="/login" onClick={() => setInternalOpen(false)}><Button variant="secondary" size="sm" className="w-full h-11 sm:h-9 rounded-[8px]">Log in</Button></Link>
                  <Link href="/signup" onClick={() => setInternalOpen(false)}><Button size="sm" className="w-full h-11 sm:h-9 rounded-[8px] bg-[var(--text)] text-[var(--background)]">Sign up</Button></Link>
                </div>
              )}
              <Button variant="ghost" size="sm" className="w-full justify-start min-h-[44px] sm:min-h-0" onClick={toggle} aria-label="Toggle theme">
                <Sun className="w-4 h-4 mr-2 dark:hidden" aria-hidden="true" /><Moon className="w-4 h-4 mr-2 hidden dark:block" aria-hidden="true" /> Toggle theme
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
