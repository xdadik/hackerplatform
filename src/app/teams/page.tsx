"use client"
import Link from "next/link"
import * as React from "react"
import { AppShell } from "@/components/layout/app-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Users, Crown, Shield, Trophy, Calendar, Activity, Settings, Plus, Trash2, LogOut, X, Save } from "lucide-react"

type Team = { id: string; name: string; members: number; rank: number; labs: number; challenges: number; reputation: number; role: string; activity: string; color: string }

export default function TeamsPage() {
  const initial: Team[] = [
    { id: "atlas", name: "Red Team — Atlas", members: 8, rank: 12, labs: 142, challenges: 89, reputation: 9842, role: "Member", activity: "Active 2h ago", color: "#1A56DB" },
    { id: "sentinel", name: "Blue Team — Sentinel", members: 12, rank: 4, labs: 201, challenges: 112, reputation: 12342, role: "Owner", activity: "Active now", color: "#059669" },
    { id: "forensics", name: "Forensics Unit", members: 5, rank: 28, labs: 67, challenges: 34, reputation: 5421, role: "Admin", activity: "Active yesterday", color: "#7C3AED" },
  ]
  const [teams, setTeams]=React.useState<Team[]>(()=>{
    if(typeof window!=="undefined"){
      try{ const r=localStorage.getItem("aegis_teams"); if(r) return JSON.parse(r)}catch{}
    }
    return initial
  })
  const [q,setQ]=React.useState("")
  const [editing, setEditing]=React.useState<Team|null>(null)
  const [showCreate, setShowCreate]=React.useState(false)
  const [newName, setNewName]=React.useState("")
  React.useEffect(()=>{ try{ localStorage.setItem("aegis_teams", JSON.stringify(teams))}catch{}},[teams])
  const filtered=teams.filter(t=> !q.trim() || t.name.toLowerCase().includes(q.toLowerCase()))
  const handleCreate=()=>{
    if(!newName.trim()) return alert("Team name required")
    setTeams(prev=>[...prev, {id:Date.now().toString(), name:newName.trim(), members:1, rank:99, labs:0, challenges:0, reputation:0, role:"Owner", activity:"Active now", color:"#64748B"}])
    setNewName(""); setShowCreate(false)
  }
  const handleDelete=(id:string)=>{
    if(confirm("Delete team? (localStorage)")) setTeams(prev=>prev.filter(t=>t.id!==id))
  }
  const handleLeave=(id:string)=>{
    if(confirm("Leave team?")) setTeams(prev=>prev.filter(t=>t.id!==id))
  }
  const saveEdit=()=>{
    if(!editing) return
    if(!editing.name.trim()) return alert("Name required")
    setTeams(prev=>prev.map(t=>t.id===editing.id? editing: t))
    setEditing(null)
  }

  return (
    <AppShell withSidebar>
      <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-[1080px]">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-[22px] font-[650] tracking-[-0.03em]">Teams</h1>
            <p className="mt-1 text-[13.5px] text-[var(--text-2)]">Collaborate, compete, and train together. Roles: Owner, Admin, Member — with proper permissions.</p>
          </div>
          <Button className="rounded-[8px]" onClick={()=>setShowCreate(v=>!v)}><Plus className="w-4 h-4 mr-1" /> Create team</Button>
        </div>

        {showCreate && (
          <Card className="mb-6"><CardContent className="p-4 flex gap-2">
            <Input value={newName} onChange={e=>setNewName(e.target.value)} placeholder="Team name (e.g., Red Team — Nova)" className="flex-1 h-9" />
            <Button size="sm" className="h-9" onClick={handleCreate}><Save className="w-3.5 h-3.5 mr-1" /> Create</Button>
            <Button size="sm" variant="ghost" className="h-9" onClick={()=>setShowCreate(false)}><X className="w-3.5 h-3.5" /></Button>
          </CardContent></Card>
        )}

        <div className="flex items-center gap-2 mb-6">
          <div className="relative flex-1 max-w-[360px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-3)]" />
            <Input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search teams, members..." className="pl-8 h-8 bg-[var(--surface)]" />
          </div>
          <Badge variant="outline" className="hidden sm:inline-flex rounded-full">{filtered.length} teams • {teams.filter(t=>t.role==="Owner").length} owned</Badge>
        </div>

        {editing && (
          <Card className="mb-4 border-blue-200 bg-blue-50/50 dark:bg-blue-950/20"><CardContent className="p-4 flex gap-2 items-end">
            <div className="flex-1"><label className="text-[11px] font-semibold">Team name</label><Input value={editing.name} onChange={e=>setEditing({...editing, name:e.target.value})} className="h-8 mt-1" /></div>
            <Button size="sm" className="h-8" onClick={saveEdit}><Save className="w-3.5 h-3.5 mr-1" /> Save</Button>
            <Button size="sm" variant="ghost" className="h-8" onClick={()=>setEditing(null)}><X className="w-3.5 h-3.5" /></Button>
          </CardContent></Card>
        )}

        <div className="grid gap-4">
          {filtered.map(team => (
            <Card key={team.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5 sm:p-6">
                <div className="flex flex-col lg:flex-row gap-6">
                  <div className="flex gap-4 flex-1 min-w-0">
                    <div className="w-12 h-12 rounded-[12px] flex items-center justify-center text-white font-bold shrink-0" style={{ background: team.color }}>
                      {team.name.split("—")[0].trim().slice(0,2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[15px] font-[650] tracking-[-0.02em]">{team.name}</span>
                        <Badge variant={team.role==="Owner" ? "default" : team.role==="Admin" ? "accent" : "secondary"} className="text-[11px] gap-1">
                          {team.role==="Owner" && <Crown className="w-3 h-3" />}{team.role}
                        </Badge>
                        <Badge variant="outline" className="text-[11px]">Rank #{team.rank}</Badge>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-[12px] text-[var(--text-2)]">
                        <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {team.members} members</span>
                        <span className="flex items-center gap-1"><Trophy className="w-3.5 h-3.5" /> {team.reputation.toLocaleString()} rep</span>
                        <span className="flex items-center gap-1"><Activity className="w-3.5 h-3.5" /> {team.activity}</span>
                      </div>
                      <div className="mt-3 flex items-center gap-2">
                        <div className="flex -space-x-1.5">
                          {["MR","SC","AM","PN"].slice(0, team.members > 4 ? 4 : team.members).map(m => (
                            <span key={m} className="w-7 h-7 rounded-full bg-[var(--surface-2)] border-2 border-[var(--surface)] flex items-center justify-center text-[10px] font-semibold">{m}</span>
                          ))}
                          {team.members > 4 && <span className="w-7 h-7 rounded-full bg-[var(--text)] text-[var(--background)] border-2 border-[var(--surface)] flex items-center justify-center text-[10px] font-semibold">+{team.members-4}</span>}
                        </div>
                        <span className="text-[11px] text-[var(--text-3)] ml-1">{team.members} members • {team.labs} labs • {team.challenges} challenges</span>
                      </div>
                    </div>
                  </div>

                  <div className="lg:w-[340px] shrink-0 space-y-3">
                    <div className="grid grid-cols-3 gap-2">
                      <div className="rounded-[10px] bg-[var(--surface-2)] border border-[var(--border)] p-2.5 text-center">
                        <div className="text-[11px] tracking-widest uppercase text-[var(--text-3)]">Labs</div>
                        <div className="text-[16px] font-[700]">{team.labs}</div>
                      </div>
                      <div className="rounded-[10px] bg-[var(--surface-2)] border border-[var(--border)] p-2.5 text-center">
                        <div className="text-[11px] tracking-widest uppercase text-[var(--text-3)]">Challenges</div>
                        <div className="text-[16px] font-[700]">{team.challenges}</div>
                      </div>
                      <div className="rounded-[10px] bg-[var(--surface-2)] border border-[var(--border)] p-2.5 text-center">
                        <div className="text-[11px] tracking-widest uppercase text-[var(--text-3)]">Rank</div>
                        <div className="text-[16px] font-[700]">#{team.rank}</div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/teams/${team.id}`} className="flex-1"><Button size="sm" className="w-full rounded-[8px]">Open team</Button></Link>
                      <Button size="sm" variant="secondary" className="rounded-[8px]" onClick={()=>setEditing(team)} title="Edit team"><Settings className="w-3.5 h-3.5" /></Button>
                      <Button size="sm" variant="ghost" className="rounded-[8px] border border-[var(--border)]" onClick={()=>handleLeave(team.id)} title="Leave team"><LogOut className="w-3.5 h-3.5" /></Button>
                      <Button size="sm" variant="ghost" className="rounded-[8px] border text-red-600" onClick={()=>handleDelete(team.id)} title="Delete team"><Trash2 className="w-3.5 h-3.5" /></Button>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-[var(--text-3)]">
                      <Calendar className="w-3 h-3" /> Next event: Winter CTF in 6 days
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {filtered.length === 0 && (
            <Card className="border-dashed rounded-[12px] bg-[var(--surface-2)]">
              <CardContent className="p-6 text-center">
                <div className="w-10 h-10 rounded-full bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center mx-auto">
                  <Users className="w-5 h-5 text-[var(--text-2)]" />
                </div>
                <div className="mt-3 text-[14px] font-[600] tracking-[-0.01em] text-[var(--text)]">No teams yet</div>
                <div className="mt-1 text-[12px] leading-5 text-[var(--text-2)] max-w-[320px] mx-auto">Create or join a team to collaborate, compete, and train together.</div>
                <Button size="sm" className="mt-4 h-8 rounded-[8px] bg-[var(--text)] text-[var(--background)] hover:bg-zinc-800 dark:hover:bg-zinc-200" onClick={()=>setShowCreate(true)}>Create team</Button>
              </CardContent>
            </Card>
          )}
        </div>

        <Card className="mt-6 border-dashed bg-[var(--surface-2)]">
          <CardContent className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex gap-3">
              <div className="w-9 h-9 rounded-[9px] bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center shrink-0">
                <Shield className="w-4 h-4 text-[var(--text-2)]" />
              </div>
              <div>
                <div className="text-[13px] font-[600]">Organization teams</div>
                <div className="text-[12px] text-[var(--text-2)]">Manage private teams, labs, and competitions for your organization.</div>
              </div>
            </div>
            <Link href="/organizations"><Button variant="secondary" size="sm" className="rounded-[8px] shrink-0">View organizations</Button></Link>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
