"use client"
import * as React from "react"
import { useRouter } from "next/navigation"
import { AppShell } from "@/components/layout/app-shell"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Send, ShieldCheck } from "lucide-react"
import { sanitizeInput } from "@/lib/sanitize"
import { useAuth } from "@/components/auth-provider"

type Msg = { id: string; from: "me" | "them"; text: string; at: string }

export default function MessagesPage() {
  const { isLoggedIn, isLoading } = useAuth()
  const router = useRouter()
  const [messages, setMessages] = React.useState<Msg[] | null>(null)
  const [draft, setDraft] = React.useState("")
  const [sending, setSending] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const bottomRef = React.useRef<HTMLDivElement>(null)

  const load = React.useCallback(async (silent = false) => {
    try {
      const res = await fetch("/api/messages", { cache: "no-store" })
      if (res.status === 401) {
        router.replace("/login")
        return
      }
      if (!res.ok) throw new Error("load failed")
      const body = await res.json()
      setMessages(body.messages ?? [])
      if (!silent) setError(null)
    } catch {
      if (!silent) setError("Could not load messages.")
    }
  }, [router])

  React.useEffect(() => {
    if (!isLoading && !isLoggedIn) router.replace("/login")
  }, [isLoading, isLoggedIn, router])

  React.useEffect(() => {
    if (!isLoggedIn) return
    load()
    const t = setInterval(() => load(true), 10000)
    return () => clearInterval(t)
  }, [isLoggedIn, load])

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const send = async () => {
    const clean = sanitizeInput(draft, 1000).trim()
    if (!clean || sending) return
    setSending(true)
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: clean }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setError(typeof body.error === "string" ? body.error : "Could not send message.")
        return
      }
      setDraft("")
      setError(null)
      await load(true)
    } catch {
      setError("Could not reach the server.")
    } finally {
      setSending(false)
    }
  }

  return (
    <AppShell withSidebar>
      <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-[720px]">
        <h1 className="text-[22px] font-[650] tracking-[-0.03em]">Support chat</h1>
        <p className="mt-1 text-[13.5px] text-[var(--text-2)]">Direct line to the platform admin — questions, issues, and feedback.</p>
        <Card className="mt-6 flex flex-col h-[480px]">
          <div className="p-4 border-b border-[var(--border)] flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-zinc-900 text-white flex items-center justify-center" aria-hidden="true"><ShieldCheck className="w-4 h-4" /></div>
            <div><div className="text-[13px] font-[600]">Aegis Support</div><div className="text-[11px] text-[var(--text-3)]">Replies within 2 business days</div></div>
          </div>
          <div className="flex-1 p-4 space-y-3 bg-[var(--surface-2)] overflow-auto">
            {messages === null ? (
              [1,2].map(i => <div key={i} className="h-10 rounded-[12px] bg-[var(--surface-3)] animate-pulse max-w-[70%]" />)
            ) : messages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-center">
                <div>
                  <div className="text-[13px] font-[600]">No messages yet</div>
                  <div className="mt-1 text-[12px] text-[var(--text-2)]">Write below — the admin will reply here.</div>
                </div>
              </div>
            ) : messages.map(m => (
              <div key={m.id} className={`${m.from === "me" ? "ml-auto bg-[var(--text)] text-[var(--background)]" : "bg-[var(--surface)] border border-[var(--border)]"} max-w-[75%] p-3 rounded-[12px] text-[13px]`}>{m.text}</div>
            ))}
            <div ref={bottomRef} />
          </div>
          {error && <div className="px-4 py-2 text-[12px] text-red-600 border-t border-[var(--border)]">{error}</div>}
          <div className="p-3 border-t border-[var(--border)] flex gap-2">
            <Input value={draft} onChange={e=>setDraft(e.target.value)} onKeyDown={e=>{ if(e.key==="Enter") send()}} placeholder="Write a message to support..." className="flex-1 h-9 bg-[var(--surface)]" aria-label="Message to support" />
            <Button size="icon" className="h-9 w-9 rounded-[8px]" onClick={send} disabled={sending} aria-label="Send message"><Send className="w-4 h-4" /></Button>
          </div>
        </Card>
      </div>
    </AppShell>
  )
}
