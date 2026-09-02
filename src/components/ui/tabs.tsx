"use client"
import * as React from "react"
import { cn } from "@/lib/utils"

interface TabsContextValue {
  value: string
  onValueChange: (v: string) => void
}
const TabsContext = React.createContext<TabsContextValue | null>(null)

export function Tabs({ defaultValue, value, onValueChange, children, className }: { defaultValue?: string, value?: string, onValueChange?: (v: string)=>void, children: React.ReactNode, className?: string }) {
  const [internal, setInternal] = React.useState(defaultValue || "")
  const current = value ?? internal
  const handle = (v: string) => {
    if (value === undefined) setInternal(v)
    onValueChange?.(v)
  }
  return (
    <TabsContext.Provider value={{ value: current, onValueChange: handle }}>
      <div className={cn(className)}>{children}</div>
    </TabsContext.Provider>
  )
}

export function TabsList({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={cn("inline-flex h-9 items-center justify-center rounded-[8px] bg-[var(--surface-2)] p-1 text-[var(--text-2)]", className)}>
      {children}
    </div>
  )
}

export function TabsTrigger({ value, children, className }: { value: string, children: React.ReactNode, className?: string }) {
  const ctx = React.useContext(TabsContext)!
  const active = ctx.value === value
  return (
    <button
      onClick={() => ctx.onValueChange(value)}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-[6px] px-3 py-1.5 text-[13px] font-medium ring-offset-background transition-all focus-visible:outline-none disabled:pointer-events-none",
        active ? "bg-[var(--surface)] text-[var(--text)] shadow-sm border border-[var(--border)]" : "text-[var(--text-2)] hover:text-[var(--text)]",
        className
      )}
    >
      {children}
    </button>
  )
}

export function TabsContent({ value, children, className }: { value: string, children: React.ReactNode, className?: string }) {
  const ctx = React.useContext(TabsContext)!
  if (ctx.value !== value) return null
  return <div className={cn("mt-4 ring-offset-background focus-visible:outline-none", className)}>{children}</div>
}
