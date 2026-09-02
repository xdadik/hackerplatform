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
      // allow a tick for auth to hydrate from localStorage
      const hasAuth = typeof window !== "undefined" && localStorage.getItem("aegis_auth") === "1"
      if (!hasAuth) router.replace("/login")
    }
  }, [withSidebar, isLoggedIn, router, pathname])

  return (
    <div className="flex min-h-screen flex-col bg-[var(--background)]">
      <TopNav onMenuToggle={() => setMobileOpen(v => !v)} mobileOpen={mobileOpen} />
      <div className="flex flex-1">
        {withSidebar && <Sidebar mobileOpen={mobileOpen} />}
        <main className="flex-1 min-w-0 bg-[var(--background)]">
          {children}
        </main>
      </div>
      <CommandPalette />
    </div>
  )
}
