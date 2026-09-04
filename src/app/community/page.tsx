"use client"
import * as React from "react"
import { AppShell } from "@/components/layout/app-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, MessageSquare, Users, Calendar, Award, ArrowRight, TrendingUp, Pin, X, Trash2 } from "lucide-react"
import { sanitizeInput } from "@/lib/sanitize"
import { commentLimiter } from "@/lib/rate-limit"

type Discussion = { id:string; pin?:boolean; title:string; author:string; time:string; replies:number; excerpt:string; cat:string }

export default function CommunityPage() {
  const [active, setActive]=React.useState("All")
  const [q,setQ]=React.useState("")
  const [showNew,setShowNew]=React.useState(false)
  const [newTitle,setNewTitle]=React.useState("")
  const [newExcerpt,setNewExcerpt]=React.useState("")
  const [joinedGroups, setJoinedGroups]=React.useState<Set<string>>(new Set())
  const [discussions, setDiscussions]=React.useState<Discussion[]>(()=>{
    if(typeof window!=="undefined"){
      try{ const r=localStorage.getItem("aegis_discussions"); if(r) return JSON.parse(r)}catch{}
    }
    return [
      { pin: true, id:"1", title: "Welcome: How to get the most from Aegis Community", author: "Aegis Team", time: "Pinned", replies: 42, excerpt: "Guidelines for high-quality technical discussion, mentorship, and research review. Please read before posting.", cat:"Technical" },
      { id:"2", title: "Best way to practice AD enumeration without a full lab?", author: "alexmorgan", time: "2 hours ago", replies: 12, excerpt: "Looking for lightweight options to practice BloodHound-style analysis. Any recommended datasets or GoAD setups?", cat:"Technical" },
      { id:"3", title: "Detection engineering: Sigma vs. KQL for Entra ID — which do you prefer in production?", author: "james.k", time: "5 hours ago", replies: 18, excerpt: "We’re standardizing on Sentinel. Curious how teams handle rule portability and testing.", cat:"Technical" },
      { id:"4", title: "[Writeup] Cloud SSRF to Metadata — alternative path via IMDSv2 bypass", author: "priya_n", time: "Yesterday", replies: 8, excerpt: "Found a different bypass using header injection. Would love review before publishing.", cat:"Groups" },
    ]
  })
  React.useEffect(()=>{ try{ localStorage.setItem("aegis_discussions", JSON.stringify(discussions))}catch{}},[discussions])
  React.useEffect(()=>{ try{ const r=localStorage.getItem("aegis_joined_groups"); if(r) setJoinedGroups(new Set(JSON.parse(r)))}catch{}},[])
  React.useEffect(()=>{ try{ localStorage.setItem("aegis_joined_groups", JSON.stringify([...joinedGroups]))}catch{}},[joinedGroups])

  const filtered=discussions.filter(d=>{
    if(active!=="All" && d.cat!==active) return false
    if(q.trim()){
      const s=q.toLowerCase()
      return d.title.toLowerCase().includes(s) || d.excerpt.toLowerCase().includes(s) || d.author.toLowerCase().includes(s)
    }
    return true
  })

  const createPost=()=>{
    const rl = commentLimiter.check()
    if (rl.limited) return alert(`Rate limited: try again in ${Math.ceil(rl.resetMs/1000)}s (10/min)`)
    const cleanTitle = sanitizeInput(newTitle, 120)
    if(!cleanTitle.trim()) return alert("Title required")
    const cleanExcerpt = sanitizeInput(newExcerpt, 500) || "New discussion — awaiting replies."
    commentLimiter.record()
    setDiscussions(prev=>[{id:Date.now().toString(), title:cleanTitle, excerpt:cleanExcerpt, author:"you", time:"now", replies:0, cat:"Technical"}, ...prev])
    setNewTitle(""); setNewExcerpt(""); setShowNew(false)
  }
  const deletePost=(id:string)=>{
    const d=discussions.find(x=>x.id===id)
    if(d?.author!=="you") return alert("Can only delete your own posts (demo)")
    if(confirm("Delete post?")) setDiscussions(prev=>prev.filter(x=>x.id!==id))
  }
  const toggleGroup=(name:string)=>{
    setJoinedGroups(prev=>{
      const n=new Set(prev)
      if(n.has(name)) n.delete(name); else n.add(name)
      return n
    })
  }

  return (
    <AppShell withSidebar>
      <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-[1080px]">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-[22px] font-[650] tracking-[-0.03em]">Community</h1>
            <p className="mt-1 text-[13.5px] text-[var(--text-2)]">Focused, professional discussions. No social-media clutter — technical quality first.</p>
          </div>
          <Button className="rounded-[8px]" onClick={()=>setShowNew(v=>!v)}>{showNew?"Cancel":"New discussion"}</Button>
        </div>

        {showNew && (
          <Card className="mb-6"><CardContent className="p-4 space-y-3">
            <Input value={newTitle} onChange={e=>setNewTitle(e.target.value)} placeholder="Title (e.g., How to detect...)" className="h-9" />
            <textarea value={newExcerpt} onChange={e=>setNewExcerpt(e.target.value)} placeholder="Details..." className="w-full min-h-[80px] rounded-[8px] border border-[var(--border)] bg-[var(--surface)] p-3 text-[13px]" />
            <div className="flex gap-2"><Button size="sm" className="h-8" onClick={createPost}>Create post</Button><Button size="sm" variant="ghost" className="h-8" onClick={()=>setShowNew(false)}>Cancel</Button></div>
            <div className="text-[11px] text-[var(--text-3)]">Saved to localStorage (aegis_discussions). Your posts can be deleted; others read-only.</div>
          </CardContent></Card>
        )}

        <div className="grid lg:grid-cols-[1.7fr_1fr] gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-3)]" />
                <Input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search discussions, groups, people..." className="pl-8 h-8 bg-[var(--surface)]" />
                {q && <button onClick={()=>setQ("")} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-[var(--surface-2)]"><X className="w-3 h-3" /></button>}
              </div>
              <Badge variant="secondary" className="hidden sm:inline-flex">{filtered.length} discussions</Badge>
            </div>

            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {["All","Technical","Groups","Mentorship","Events"].map(cat=>(
                <button key={cat} onClick={()=>setActive(cat)} className={`px-3 py-1.5 rounded-full text-[12.5px] font-[500] whitespace-nowrap border ${cat===active ? "bg-[var(--text)] text-[var(--background)] border-[var(--text)]" : "bg-[var(--surface)] border border-[var(--border)] text-[var(--text-2)] hover:bg-[var(--surface-2)]"}`}>{cat}</button>
              ))}
            </div>

            {filtered.map((d) => (
              <Card key={d.id} className={`${d.pin ? "border-amber-200 bg-amber-50/30 dark:bg-amber-950/10 dark:border-amber-900" : "hover:shadow-sm"} transition-shadow`}>
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center text-[11px] font-semibold shrink-0">
                      {d.author.split(" ").map(n=>n[0]).join("").slice(0,2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {d.pin && <Badge variant="warning" className="gap-1 text-[11px]"><Pin className="w-3 h-3" /> Pinned</Badge>}
                        <span className="text-[13px] font-[600] leading-tight">{d.title}</span>
                        {d.author==="you" && <button onClick={()=>deletePost(d.id)} className="ml-auto p-1 rounded hover:bg-red-50 text-red-600"><Trash2 className="w-3 h-3" /></button>}
                      </div>
                      <div className="mt-1 text-[12.5px] leading-5 text-[var(--text-2)] line-clamp-2">{d.excerpt}</div>
                      <div className="mt-3 flex items-center gap-3 text-[11px] text-[var(--text-3)]">
                        <span>{d.author} • {d.time}</span>
                        <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" /> {d.replies} replies</span>
                        <span className="hidden sm:inline-flex items-center gap-1"><TrendingUp className="w-3 h-3" /> {Math.floor(Math.random()*40)+5} views</span>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-[var(--text-3)] shrink-0 hidden sm:block" />
                  </div>
                </CardContent>
              </Card>
            ))}

            {filtered.length===0 && (
              <Card className="border-dashed bg-[var(--surface-2)] rounded-[12px]">
                <CardContent className="p-6 text-center">
                  <div className="w-10 h-10 rounded-full bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center mx-auto">
                    <MessageSquare className="w-5 h-5 text-[var(--text-2)]" />
                  </div>
                  <div className="mt-3 text-[14px] font-[600] tracking-[-0.01em] text-[var(--text)]">No discussions match your filters</div>
                  <div className="mt-1 text-[12px] leading-5 text-[var(--text-2)] max-w-[320px] mx-auto">Try adjusting filters or start a new technical post. Your search returned no results.</div>
                  <Button size="sm" className="mt-4 h-8 rounded-[8px] bg-[var(--text)] text-[var(--background)] hover:bg-zinc-800 dark:hover:bg-zinc-200" onClick={()=>{ setQ(""); setActive("All"); setShowNew(true)}}>Create post</Button>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2"><Users className="w-4 h-4" /> Groups</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  { name: "Web Security Practitioners", members: 3421 },
                  { name: "Cloud Security Research", members: 1823 },
                  { name: "DFIR & Forensics", members: 921 },
                ].map(g => {
                  const joined=joinedGroups.has(g.name)
                  return (
                  <div key={g.name} className="flex items-center justify-between p-2.5 rounded-[8px] border border-[var(--border)] hover:bg-[var(--surface-2)] transition-colors">
                    <span className="text-[12.5px] font-[500]">{g.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-[var(--text-3)] hidden sm:block">{g.members.toLocaleString()} members</span>
                      <Button size="sm" variant={joined?"default":"secondary"} className="h-7 text-[11px] px-2" onClick={()=>toggleGroup(g.name)}>{joined?"✓ Joined":"Join"}</Button>
                    </div>
                  </div>
                )})}
                <Button variant="secondary" size="sm" className="w-full mt-2 h-7 text-[12px]" onClick={()=>alert("Browse groups: " + [...joinedGroups].join(", ") || "none — join a group above (localStorage)")}>Browse groups</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2"><Calendar className="w-4 h-4" /> Events</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 rounded-[10px] border border-[var(--border)]">
                  <div className="text-[12.5px] font-[600]">SOC Simulation Workshop</div>
                  <div className="text-[11px] text-[var(--text-2)]">Feb 22 • 14:00 CET • Live</div>
                  <Badge variant="accent" className="mt-2 text-[11px]">12 seats left</Badge>
                </div>
                <div className="p-3 rounded-[10px] border border-[var(--border)]">
                  <div className="text-[12.5px] font-[600]">Mentorship Office Hours</div>
                  <div className="text-[11px] text-[var(--text-2)]">Weekly • Thursdays • 18:00 CET</div>
                  <span className="text-[11px] text-[var(--text-3)]">With Sophia Chen & Marcus Reid</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <div className="text-[12px] font-semibold flex items-center gap-2"><Award className="w-3.5 h-3.5" /> Community guidelines</div>
                <ul className="mt-2 space-y-1.5 text-[12px] leading-5 text-[var(--text-2)] list-disc list-inside">
                  <li>Be technical, be specific, be kind</li>
                  <li>Share verifiable work, cite sources</li>
                  <li>No recruitment spam, no low-effort posts</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
