"use client"
import * as React from "react"
import { AppShell } from "@/components/layout/app-shell"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Bell, CheckCircle2, Award, Users, FileText, Trophy, X } from "lucide-react"

type Note = { id:string; icon:any; title:string; time:string; desc:string; isNew?:boolean }

export default function NotificationsPage() {
  const [notes, setNotes]=React.useState<Note[]>(()=>{
    if(typeof window!=="undefined"){
      try{ const r=localStorage.getItem("aegis_notifications"); if(r) return JSON.parse(r)}catch{}
    }
    return []
  })
  React.useEffect(()=>{ try{ localStorage.setItem("aegis_notifications", JSON.stringify(notes))}catch{}},[notes])
  const dismiss=(id:string)=> setNotes(prev=>prev.filter(n=>n.id!==id))
  const markAllRead=()=> setNotes(prev=>prev.map(n=>({...n, isNew:false})))
  const clearAll=()=> { if(confirm("Clear all notifications?")) setNotes([])}
  return (
    <AppShell withSidebar>
      <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-[640px]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[22px] font-[650] tracking-[-0.03em] flex items-center gap-2"><Bell className="w-5 h-5" /> Notifications</h1>
            <p className="mt-1 text-[13.5px] text-[var(--text-2)]">Lab completions, achievements, team activity, and system announcements — no spam.</p>
          </div>
          <Badge variant="secondary">{notes.filter(n=>n.isNew).length} new</Badge>
        </div>
        <div className="mt-4 flex gap-2">
          <Button size="sm" variant="secondary" className="h-7" onClick={markAllRead}>Mark all read</Button>
          <Button size="sm" variant="ghost" className="h-7 border" onClick={clearAll}>Clear all</Button>
        </div>
        <div className="mt-6 space-y-3">
          {notes.length===0 ? (
            <Card className="border-dashed bg-[var(--surface-2)]"><CardContent className="p-6 text-center"><div className="text-[13px] font-[600]">No notifications</div><div className="text-[12px] text-[var(--text-2)]">You&apos;re all caught up.</div></CardContent></Card>
          ) : notes.map((n) => (
            <Card key={n.id} className={`${n.isNew ? "border-[var(--accent-border)] bg-[var(--accent-muted)]" : ""}`}>
              <CardContent className="p-4 flex gap-3">
                <div className="w-8 h-8 rounded-[8px] bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center shrink-0"><n.icon className="w-4 h-4 text-[var(--text-2)]" /></div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-[500]">{n.title}</div>
                  <div className="text-[12px] text-[var(--text-2)]">{n.desc}</div>
                  <div className="text-[11px] text-[var(--text-3)] mt-1">{n.time}</div>
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                  {n.isNew && <Badge variant="accent" className="h-fit">New</Badge>}
                  <button onClick={()=>dismiss(n.id)} className="p-1 rounded hover:bg-[var(--surface-2)] text-[var(--text-3)] hover:text-[var(--text)]"><X className="w-3.5 h-3.5" /></button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="mt-3 text-[11px] text-[var(--text-3)]">Lab completions, achievements, and announcements will appear here.</div>
      </div>
    </AppShell>
  )
}
