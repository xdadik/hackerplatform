"use client"
import * as React from "react"

type Theme = "light" | "dark"

const ThemeContext = React.createContext<{
  theme: Theme
  toggle: () => void
  setTheme: (t: Theme) => void
} | null>(null)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = React.useState<Theme>("light")
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    const saved = localStorage.getItem("theme") as Theme | null
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
    const initial = saved || (prefersDark ? "dark" : "light")
    setTheme(initial)
    setMounted(true)
  }, [])

  React.useEffect(() => {
    if (!mounted) return
    const root = document.documentElement
    if (theme === "dark") root.classList.add("dark")
    else root.classList.remove("dark")
    localStorage.setItem("theme", theme)
  }, [theme, mounted])

  const toggle = React.useCallback(() => setTheme(t => t === "dark" ? "light" : "dark"), [])

  // prevent flash while mounted
  // if (!mounted) return null

  return (
    <ThemeContext.Provider value={{ theme, toggle, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = React.useContext(ThemeContext)
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider")
  return ctx
}
