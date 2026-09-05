"use client"
import * as React from "react"
import { useRouter, usePathname } from "next/navigation"
import { TopNav } from "./top-nav"
import { Sidebar } from "./sidebar"
import { CommandPalette } from "./command-palette"
import { useAuth } from "@/components/auth-provider"

export function AppShell({ children, withSidebar = false }: { children: React.ReactNode, withSidebar?: boolean }) {
  const [mobileOpen, setMobileOpen] = React.useState(false)
  const { isLoggedIn, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  // Avoid FOUC: wait for auth loading before redirect
  React.useEffect(() => {
    if (!withSidebar) return
    if (isLoading) return
    if (!isLoggedIn) {
      router.replace("/login")
    }
  }, [withSidebar, isLoggedIn, isLoading, router, pathname])

  // Scroll lock when mobile drawer open
  React.useEffect(() => {
    if (mobileOpen) {
      const prev = document.body.style.overflow
      document.body.style.overflow = "hidden"
      return () => { document.body.style.overflow = prev }
    }
  }, [mobileOpen])

  // Escape handler to close drawer
  React.useEffect(() => {
    if (!mobileOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false)
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [mobileOpen])

  // Close drawer on route change is handled inside Sidebar via pathname effect, but also ensure here
  React.useEffect(() => {
    setMobileOpen(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  if (withSidebar && isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-[var(--background)]">
        <TopNav onMenuToggle={() => setMobileOpen(v => !v)} mobileOpen={mobileOpen} />
        <div className="flex flex-1">
          <div className="hidden lg:flex w-[240px] shrink-0 border-r border-[var(--border)] bg-[var(--surface)] animate-pulse" aria-hidden="true" />
          <main id="main-content" className="flex-1 p-6">
            <div className="max-w-[1280px] mx-auto space-y-4">
              <div className="h-8 w-48 bg-[var(--surface-2)] rounded animate-pulse" />
              <div className="h-4 w-96 bg-[var(--surface-2)] rounded animate-pulse" />
              <div className="grid grid-cols-3 gap-3">
                <div className="h-24 bg-[var(--surface-2)] rounded-[12px] animate-pulse" />
                <div className="h-24 bg-[var(--surface-2)] rounded-[12px] animate-pulse" />
                <div className="h-24 bg-[var(--surface-2)] rounded-[12px] animate-pulse" />
              </div>
            </div>
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-[var(--background)] overflow-x-hidden">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:rounded-[8px] focus:bg-[var(--text)] focus:text-[var(--background)] focus:outline-none">
        Skip to content
      </a>
      <TopNav onMenuToggle={() => setMobileOpen(v => !v)} mobileOpen={mobileOpen} />
      <div className="flex flex-1 min-w-0 overflow-x-hidden">
        {withSidebar && <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />}
        <main id="main-content" tabIndex={-1} className="flex-1 min-w-0 overflow-x-hidden bg-[var(--background)] focus:outline-none">
          {children}
        </main>
      </div>
      <CommandPalette />
    </div>
  )
}
