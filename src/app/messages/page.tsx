import { AppShell } from "@/components/layout/app-shell"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Send } from "lucide-react"

export default function MessagesPage() {
  return (
    <AppShell withSidebar>
      <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-[960px]">
        <h1 className="text-[22px] font-[650] tracking-[-0.03em]">Messages</h1>
        <p className="mt-1 text-[13.5px] text-[var(--text-2)]">Direct messages for mentorship and team coordination.</p>
        <div className="mt-6 grid md:grid-cols-[280px_1fr] gap-4 h-[480px]">
          <Card className="overflow-hidden flex flex-col">
            <div className="p-3 border-b border-[var(--border)]">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-3)]" />
                <Input placeholder="Search conversations" className="pl-8 h-8 bg-[var(--surface-2)]" />
              </div>
            </div>
            <div className="flex-1 overflow-auto divide-y divide-[var(--border)]">
              {[
                { name: "Sophia Chen", preview: "Reviewed your IAM writeup — great work on the detection rule.", time: "2h", active: true },
                { name: "Marcus Reid", preview: "Are you joining the AD lab tomorrow?", time: "5h" },
                { name: "Red Team — Atlas", preview: "Winter CTF strategy thread • 3 new messages", time: "1d" },
              ].map(c => (
                <div key={c.name} className={`p-3 flex gap-2.5 hover:bg-[var(--surface-2)] cursor-pointer ${c.active ? "bg-[var(--surface-2)]" : ""}`}>
                  <div className="w-8 h-8 rounded-full bg-[var(--text)] text-[var(--background)] flex items-center justify-center text-[11px] font-semibold shrink-0">{c.name.split(" ").map(n=>n[0]).join("").slice(0,2)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12.5px] font-[500] flex items-center justify-between gap-2"><span className="truncate">{c.name}</span><span className="text-[11px] text-[var(--text-3)] shrink-0">{c.time}</span></div>
                    <div className="text-[11px] text-[var(--text-2)] truncate">{c.preview}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="flex flex-col">
            <div className="p-4 border-b border-[var(--border)] flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#1A56DB] text-white flex items-center justify-center text-[11px] font-semibold">SC</div>
              <div><div className="text-[13px] font-[600]">Sophia Chen</div><div className="text-[11px] text-[var(--text-3)]">Active now • Security Engineer</div></div>
            </div>
            <div className="flex-1 p-4 space-y-3 bg-[var(--surface-2)] overflow-auto">
              <div className="max-w-[70%] p-3 rounded-[12px] bg-[var(--surface)] border border-[var(--border)] text-[13px]">Reviewed your IAM writeup — great work on the detection rule. One suggestion: add a test for cross-account AssumeRole with externalId.</div>
              <div className="max-w-[70%] ml-auto p-3 rounded-[12px] bg-[var(--text)] text-[var(--background)] text-[13px]">Thanks! Added. Will push an update with the Sigma rule variation.</div>
              <div className="max-w-[70%] p-3 rounded-[12px] bg-[var(--surface)] border border-[var(--border)] text-[13px]">Perfect — let’s feature it next week.</div>
            </div>
            <div className="p-3 border-t border-[var(--border)] flex gap-2">
              <Input placeholder="Write a message..." className="flex-1 h-9 bg-[var(--surface)]" />
              <Button size="icon" className="h-9 w-9 rounded-[8px]"><Send className="w-4 h-4" /></Button>
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  )
}
