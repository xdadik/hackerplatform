"use client"
import * as React from "react"
import { AppShell } from "@/components/layout/app-shell"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Send, Trash2 } from "lucide-react"
import { sanitizeInput } from "@/lib/sanitize"
import { commentLimiter } from "@/lib/rate-limit"

type Msg = { id:string; from:"me"|"them"; text:string; at:string }
type Conv = { id:string; name:string; preview:string; time:string; active?:boolean; messages: Msg[] }

export default function MessagesPage() {
  const [conversations, setConversations]=React.useState<Conv[]>(()=>{
    if(typeof window!=="undefined"){
      try{ const r=localStorage.getItem("aegis_conversations"); if(r) return JSON.parse(r)}catch{}
    }
    return [
      { id:"1", name: "Sophia Chen", preview: "Reviewed your IAM writeup — great work on the detection rule.", time: "2h", active:true, messages:[
        {id:"m1", from:"them", text:"Reviewed your IAM writeup — great work on the detection rule. One suggestion: add a test for cross-account AssumeRole with externalId.", at:"2h"},
        {id:"m2", from:"me", text:"Thanks! Added. Will push an update with the Sigma rule variation.", at:"1h"},
        {id:"m3", from:"them", text:"Perfect — let’s feature it next week.", at:"1h"},
      ]},
      { id:"2", name: "Marcus Reid", preview: "Are you joining the AD lab tomorrow?", time: "5h", messages:[
        {id:"m1", from:"them", text:"Are you joining the AD lab tomorrow?", at:"5h"},
      ]},
      { id:"3", name: "Red Team — Atlas", preview: "Winter CTF strategy thread • 3 new messages", time: "1d", messages:[
        {id:"m1", from:"them", text:"Strategy: focus on pwn first, web second. Who takes crypto?", at:"1d"},
      ]},
    ]
  })
  const [activeId, setActiveId]=React.useState("1")
  const [q,setQ]=React.useState("")
  const [draft,setDraft]=React.useState("")
  React.useEffect(()=>{ try{ localStorage.setItem("aegis_conversations", JSON.stringify(conversations))}catch{}},[conversations])
  const active=conversations.find(c=>c.id===activeId) || conversations[0]
  const filtered=conversations.filter(c=> !q.trim() || c.name.toLowerCase().includes(q.toLowerCase()) || c.preview.toLowerCase().includes(q.toLowerCase()))
  const send=()=>{
    const rl = commentLimiter.check()
    if (rl.limited) return alert(`Rate limited: try again in ${Math.ceil(rl.resetMs/1000)}s`)
    const clean = sanitizeInput(draft, 1000)
    if(!clean.trim()) return
    commentLimiter.record()
    const msg:Msg={id:Date.now().toString(), from:"me", text:clean, at:"now"}
    setConversations(prev=>prev.map(c=> c.id===activeId ? {...c, messages:[...c.messages, msg], preview:clean.slice(0,60)} : c))
    setDraft("")
  }
  const deleteConv=(id:string)=>{
    if(confirm("Delete conversation? (localStorage)")) setConversations(prev=>prev.filter(c=>c.id!==id))
  }

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
                <Input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search conversations" className="pl-8 h-8 bg-[var(--surface-2)]" />
              </div>
            </div>
            <div className="flex-1 overflow-auto divide-y divide-[var(--border)]">
              {filtered.map(c => (
                <div key={c.id} onClick={()=>setActiveId(c.id)} className={`p-3 flex gap-2.5 hover:bg-[var(--surface-2)] cursor-pointer group ${c.id===activeId ? "bg-[var(--surface-2)]" : ""}`}>
                  <div className="w-8 h-8 rounded-full bg-[var(--text)] text-[var(--background)] flex items-center justify-center text-[11px] font-semibold shrink-0">{c.name.split(" ").map(n=>n[0]).join("").slice(0,2)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12.5px] font-[500] flex items-center justify-between gap-2"><span className="truncate">{c.name}</span><span className="text-[11px] text-[var(--text-3)] shrink-0">{c.time}</span></div>
                    <div className="text-[11px] text-[var(--text-2)] truncate">{c.preview}</div>
                  </div>
                  <button onClick={(e)=>{ e.stopPropagation(); deleteConv(c.id)}} className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-50 text-red-600 shrink-0"><Trash2 className="w-3 h-3" /></button>
                </div>
              ))}
              {filtered.length===0 && <div className="p-6 text-center text-[12px] text-[var(--text-2)]">No conversations match</div>}
            </div>
          </Card>

          <Card className="flex flex-col">
            <div className="p-4 border-b border-[var(--border)] flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#1A56DB] text-white flex items-center justify-center text-[11px] font-semibold">{active.name.split(" ").map(n=>n[0]).join("").slice(0,2)}</div>
              <div><div className="text-[13px] font-[600]">{active.name}</div><div className="text-[11px] text-[var(--text-3)]">Active now • {active.name.includes("Team")?"Team":"Security Engineer"}</div></div>
            </div>
            <div className="flex-1 p-4 space-y-3 bg-[var(--surface-2)] overflow-auto">
              {active.messages.map(m=>(
                <div key={m.id} className={`${m.from==="me" ? "ml-auto bg-[var(--text)] text-[var(--background)]" : "bg-[var(--surface)] border border-[var(--border)]"} max-w-[70%] p-3 rounded-[12px] text-[13px]`}>{m.text}</div>
              ))}
            </div>
            <div className="p-3 border-t border-[var(--border)] flex gap-2">
              <Input value={draft} onChange={e=>setDraft(e.target.value)} onKeyDown={e=>{ if(e.key==="Enter") send()}} placeholder="Write a message..." className="flex-1 h-9 bg-[var(--surface)]" />
              <Button size="icon" className="h-9 w-9 rounded-[8px]" onClick={send}><Send className="w-4 h-4" /></Button>
            </div>
            <div className="px-3 pb-2 text-[11px] text-[var(--text-3)]">Messages persist in localStorage (aegis_conversations) — upload/delete working. Enter to send.</div>
          </Card>
        </div>
      </div>
    </AppShell>
  )
}
