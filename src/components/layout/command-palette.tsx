"use client"
import * as React from "react"
import { Search, LayoutDashboard, FlaskConical, Trophy, BookOpen, FileText, Users, User, Settings, Sun, Moon } from "lucide-react"
import { useTheme } from "./theme-provider"

const commands = [
  { id: "dashboard", label: "Open dashboard", icon: LayoutDashboard, kbd: "G D", href: "/dashboard" },
  { id: "labs", label: "Browse labs", icon: FlaskConical, kbd: "G L", href: "/labs" },
  { id: "challenges", label: "Search challenges", icon: Trophy, kbd: "G C", href: "/challenges" },
  { id: "learn", label: "Open Academy", icon: BookOpen, kbd: "G A", href: "/learn" },
  { id: "research", label: "Browse research", icon: FileText, kbd: "G R", href: "/research" },
  { id: "teams", label: "Open teams", icon: Users, kbd: "G T", href: "/teams" },
  { id: "profile", label: "Open profile", icon: User, kbd: "G P", href: "/profile" },
  { id: "settings", label: "Open settings", icon: Settings, kbd: "G S", href: "/settings" },
]

export function CommandPalette() {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const { toggle } = useTheme()
  const inputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setOpen(v => !v)
      }
      if (e.key === "Escape") setOpen(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  React.useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50)
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
      setQuery("")
    }
  }, [open])

  const filtered = commands.filter(c => c.label.toLowerCase().includes(query.toLowerCase()))

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[22vh] px-4">
      <div className="absolute inset-0 bg-[#0F1012]/40 backdrop-blur-[2px]" onClick={() => setOpen(false)} />
      <div className="relative w-full max-w-[560px] rounded-[14px] bg-[var(--surface)] border border-[var(--border)] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
        <div className="flex items-center gap-3 px-4 h-[48px] border-b border-[var(--border)]">
          <Search className="w-4 h-4 text-[var(--text-3)] shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search labs, challenges, research, people..."
            className="flex-1 bg-transparent outline-none text-[14px] placeholder:text-[var(--text-3)]"
          />
          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium tracking-wide text-[var(--text-3)] border border-[var(--border)] rounded px-1.5 py-0.5">ESC</span>
        </div>

        <div className="p-2 max-h-[320px] overflow-auto">
          <div className="px-2 py-1.5 text-[11px] font-semibold tracking-widest uppercase text-[var(--text-3)]">Commands</div>
          {filtered.map(cmd => (
            <a
              key={cmd.id}
              href={cmd.href}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-[8px] hover:bg-[var(--surface-2)] text-[13.5px] group transition-colors"
            >
              <div className="w-7 h-7 rounded-[7px] bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center group-hover:bg-[var(--surface)] transition-colors">
                <cmd.icon className="w-3.5 h-3.5 text-[var(--text-2)]" />
              </div>
              <span className="flex-1 font-[450] text-[var(--text)]">{cmd.label}</span>
              <span className="text-[11px] font-mono text-[var(--text-3)] border border-[var(--border)] rounded px-1 py-0.5 hidden sm:block">{cmd.kbd}</span>
            </a>
          ))}
          {filtered.length === 0 && (
            <div className="mx-2 my-2 p-6 text-center rounded-[12px] border border-dashed border-[var(--border)] bg-[var(--surface-2)]">
              <div className="w-10 h-10 rounded-full bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center mx-auto">
                <Search className="w-5 h-5 text-[var(--text-2)]" />
              </div>
              <div className="mt-3 text-[14px] font-[600] tracking-[-0.01em] text-[var(--text)]">No results for “{query}”</div>
              <div className="mt-1 text-[12px] leading-5 text-[var(--text-2)]">Try a different term or browse labs, challenges, and research.</div>
              <button onClick={() => setQuery("")} className="mt-4 inline-flex items-center justify-center h-8 px-4 rounded-[8px] bg-[var(--text)] text-[var(--background)] text-[13px] font-[500] hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors">Clear search</button>
            </div>
          )}
          <div className="mt-2 pt-2 border-t border-[var(--border)] flex items-center gap-2 px-2">
            <button onClick={() => { toggle(); setOpen(false) }} className="flex items-center gap-2 text-[13px] text-[var(--text-2)] hover:text-[var(--text)] px-2 py-1.5 rounded hover:bg-[var(--surface-2)] w-full">
              <Sun className="w-3.5 h-3.5 dark:hidden" /><Moon className="w-3.5 h-3.5 hidden dark:block" /> Toggle theme
            </button>
          </div>
        </div>

        <div className="px-4 py-2.5 bg-[var(--surface-2)] border-t border-[var(--border)] flex items-center justify-between text-[11px] text-[var(--text-3)]">
          <span className="flex items-center gap-2"><span className="inline-flex items-center gap-1"><kbd className="border border-[var(--border-strong)] bg-[var(--surface)] rounded px-1 py-0.5 text-[10px]">↑</kbd><kbd className="border border-[var(--border-strong)] bg-[var(--surface)] rounded px-1 py-0.5 text-[10px]">↓</kbd> navigate</span> <span className="hidden sm:inline-flex items-center gap-1"><kbd className="border border-[var(--border-strong)] bg-[var(--surface)] rounded px-1 py-0.5 text-[10px]">↵</kbd> select</span></span>
          <span className="hidden sm:block">⌘ K to close</span>
        </div>
      </div>
    </div>
  )
}
