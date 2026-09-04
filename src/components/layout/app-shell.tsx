"use client"
import * as React from "react"
import { useRouter, usePathname } from "next/navigation"
import { TopNav } from "./top-nav"
import { Sidebar } from "./sidebar"
import { CommandPalette } from "./command-palette"
import { useAuth } from "@/components/auth-provider"

export function AppShell({ children, withSidebar = false }: { children: React.ReactNode, withSidebar?: boolean }) {
  const [mobileOpen, setMobileOpen] = React.useState(false)
  const { isLoggedIn } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  React.useEffect(() => {
    if (withSidebar && !isLoggedIn) {
      // wait for auth
      const hasAuth = typeof window !== "undefined" && localStorage.getItem("aegis_auth") === "1"
      if (!hasAuth) router.replace("/login")
    }
  }, [withSidebar, isLoggedIn, router, pathname])

  return (
    <div className="flex min-h-screen flex-col bg-[var(--background)] overflow-x-hidden">
      <TopNav onMenuToggle={() => setMobileOpen(v => !v)} mobileOpen={mobileOpen} />
      <div className="flex flex-1 min-w-0 overflow-x-hidden">
        {withSidebar && <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />}
        <main className="flex-1 min-w-0 overflow-x-hidden bg-[var(--background)]">
          {children}
        </main>
      </div>
      {/* Mobile sidebar backdrop fallback - Sidebar also renders its own backdrop */}
      {withSidebar && mobileOpen && (
        <div
          className="fixed inset-0 top-[56px] bg-black/40 z-20 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}
      <CommandPalette />
    </div>
  )
}
