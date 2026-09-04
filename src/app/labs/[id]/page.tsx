"use client"
import Link from "next/link"
import * as React from "react"
import { AppShell } from "@/components/layout/app-shell"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { ArrowLeft, Clock, Target, Terminal, StickyNote, Flag, RotateCcw, AlertTriangle, CheckCircle2, Play, Shield, FileText, ChevronRight, Lock, Send } from "lucide-react"
import { sanitizeInput } from "@/lib/sanitize"
import { flagLimiter } from "@/lib/rate-limit"

const labData: Record<string, any> = {
  "lab-1": { title: "SQL Injection Fundamentals", category: "Web Security", diff: "Beginner", time: "45 min", progress: 72 },
  "lab-2": { title: "Linux Privilege Escalation", category: "Linux", diff: "Intermediate", time: "90 min", progress: 0 },
  "lab-3": { title: "Active Directory Enumeration", category: "Active Directory", diff: "Advanced", time: "120 min", progress: 0 },
  "sql-injection": { title: "SQL Injection Fundamentals", category: "Web Security", diff: "Beginner", time: "45 min", progress: 72 },
  "default": { title: "Lab Workspace", category: "Web Security", diff: "Intermediate", time: "60 min", progress: 0 },
}

export default function LabDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params as any) as { id: string }
  const lab = labData[id] || labData["default"]
  const [isPaid, setIsPaid] = React.useState(false)
  const [progress, setProgress] = React.useState(lab.progress)
  const [notes, setNotes] = React.useState("- tried ' OR 1=1--, got 500\n- ORDER BY 3 works, 4 fails -> 3 columns\n- union select null,null,null -> need to check")
  const [flag, setFlag] = React.useState("")
  const [flagMsg, setFlagMsg] = React.useState<string | null>(null)
  const [hintRevealed, setHintRevealed] = React.useState(false)
  const [reportOpen, setReportOpen] = React.useState(false)
  const [reportText, setReportText] = React.useState("")
  React.useEffect(() => {
    try {
      const rawUser = localStorage.getItem("aegis_user")
      if (rawUser) {
        const u = JSON.parse(rawUser) as { plan?: string }
        setIsPaid(u?.plan === "go" || u?.plan === "plus")
        return
      }
    } catch {}
    const plan = localStorage.getItem("aegis_plan")
    const auth = localStorage.getItem("aegis_auth")
    setIsPaid(!!auth && (plan === "go" || plan === "plus"))
    try {
      const savedNotes = localStorage.getItem(`aegis_lab_notes_${id}`)
      if (savedNotes) setNotes(savedNotes)
      const savedProgress = localStorage.getItem(`aegis_lab_progress_${id}`)
      if (savedProgress) setProgress(parseInt(savedProgress))
      const hint = localStorage.getItem(`aegis_lab_hint3_${id}`)
      if (hint === "1") setHintRevealed(true)
    } catch {}
  }, [id])
  React.useEffect(()=>{ try{ localStorage.setItem(`aegis_lab_notes_${id}`, notes)}catch{}},[notes, id])
  React.useEffect(()=>{ try{ localStorage.setItem(`aegis_lab_progress_${id}`, String(progress))}catch{}},[progress, id])

  const handleReset = () => {
    if(!isPaid){ alert("Upgrade to reset labs"); return}
    if(confirm("Reset this lab? Clears progress and notes from localStorage.")){
      setProgress(0); setFlag(""); setFlagMsg(null)
      try{ localStorage.removeItem(`aegis_lab_progress_${id}`); localStorage.removeItem(`aegis_lab_hint3_${id}`)}catch{}
      alert("Lab reset — progress cleared (localStorage).")
    }
  }
  const handleReport = () => setReportOpen(v=>!v)
  const submitReport = () => {
    if(!reportText.trim()) return alert("Describe issue")
    try{
      const prev=JSON.parse(localStorage.getItem("aegis_reports")||"[]")
      prev.push({id:Date.now().toString(), text:reportText, lab:id, at:new Date().toISOString()})
      localStorage.setItem("aegis_reports", JSON.stringify(prev))
    }catch{}
    alert("Report submitted (localStorage aegis_reports)")
    setReportText(""); setReportOpen(false)
  }
  const handleStart = () => {
    if(!isPaid) return
    const n = progress>0 ? progress : 10
    setProgress(n)
    alert(progress>0 ? "Resumed lab — workspace ready. Progress saved locally." : "Lab started! Progress 10% — complete objectives to advance.")
    try{ document.querySelector('[data-workspace]')?.scrollIntoView({behavior:"smooth"}) }catch{}
  }
  const handleOpenNewTab = () => {
    alert("Opening isolated lab in new tab (mock) — container at 10.10.14.2. In production this would proxy to K8s env.")
    try{ window.open(`/labs/${id}`, "_blank")}catch{}
  }
  const handleSubmitFlag = () => {
    const rl = flagLimiter.check(id)
    if (rl.limited) return setFlagMsg(`Rate limited: try again in ${Math.ceil(rl.resetMs/1000)}s (5/min) — server enforces same`)
    const cleanFlag = sanitizeInput(flag, 200).trim()
    if(!cleanFlag) return setFlagMsg("Enter flag (format: flag{...} or aegis{...})")
    flagLimiter.record(id)
    const ok = /^(aegis|flag)\{.+\}$/i.test(cleanFlag) || cleanFlag.toLowerCase().includes("admin")
    if(ok){
      setProgress(100)
      setFlagMsg("✅ Correct! Lab completed — 120 XP awarded (mock). Progress saved to localStorage.")
      try{
        const raw=localStorage.getItem("aegis_progress")
        let p={pct:0, completed:0, total:32}
        if(raw) try{ p=JSON.parse(raw)}catch{}
        p.completed=Math.min(p.total, (p.completed||0)+1)
        p.pct=Math.round((p.completed/p.total)*100)
        localStorage.setItem("aegis_progress", JSON.stringify(p))
      }catch{}
    } else {
      setFlagMsg("❌ Incorrect flag. Try UNION SELECT payload — check notes. 5 attempts/min rate limit (mock).")
    }
  }
  const handleRevealHint = () => {
    if(confirm("Reveal Hint 3? 50 XP penalty (mock).")){
      setHintRevealed(true)
      try{ localStorage.setItem(`aegis_lab_hint3_${id}`,"1")}catch{}
    }
  }

  return (
    <AppShell withSidebar>
      <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-[1280px]">
        <Link href="/labs" className="inline-flex items-center gap-1.5 text-[13px] text-[var(--text-2)] hover:text-[var(--text)] mb-4">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to labs
        </Link>

        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="rounded-full">{lab.category}</Badge>
              <Badge variant={lab.diff==="Beginner"?"success":lab.diff==="Advanced"?"secondary":"accent"}>{lab.diff}</Badge>
              <span className="text-[12px] text-[var(--text-3)] flex items-center gap-1"><Clock className="w-3 h-3" />{lab.time}</span>
              <span className="text-[12px] text-[var(--text-3)] flex items-center gap-1"><Target className="w-3 h-3" />5 objectives</span>
            </div>
            <h1 className="text-[20px] sm:text-[22px] font-[700] tracking-[-0.03em]">{lab.title}</h1>
            <p className="mt-1 text-[13.5px] text-[var(--text-2)] max-w-[640px]">Learn to identify and exploit SQL injection vulnerabilities in a controlled environment. Isolated container, dedicated network, resettable.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" className="h-8" onClick={handleReset}><RotateCcw className="w-3.5 h-3.5 mr-1" /> Reset</Button>
            <Button variant="secondary" size="sm" className="h-8" onClick={handleReport}><AlertTriangle className="w-3.5 h-3.5 mr-1" /> Report issue</Button>
            {!isPaid ? (
              <Link href="/settings/billing"><Button size="sm" className="h-8 gap-1.5 border-amber-200 bg-amber-50 text-amber-800 dark:bg-amber-950/20 dark:text-amber-300"><Lock className="w-3.5 h-3.5" /> Upgrade to unlock</Button></Link>
            ) : (
              <Button size="sm" className="h-8" onClick={handleStart}><Play className="w-3.5 h-3.5 mr-1" /> {progress>0?"Resume":"Start"} lab</Button>
            )}
          </div>
        </div>
        {reportOpen && (
          <Card className="mb-4"><CardContent className="p-4 flex gap-2">
            <input value={reportText} onChange={e=>setReportText(e.target.value)} placeholder="Describe issue..." className="flex-1 h-9 rounded-[8px] border border-[var(--border)] bg-[var(--surface)] px-3 text-[13px]" />
            <Button size="sm" className="h-9" onClick={submitReport}><Send className="w-3.5 h-3.5 mr-1" /> Send</Button>
            <Button size="sm" variant="ghost" className="h-9" onClick={()=>setReportOpen(false)}>Cancel</Button>
          </CardContent></Card>
        )}

        <div className="grid lg:grid-cols-[280px_1fr_300px] gap-4">
          {/* Left: Objectives */}
          <div className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-[11px] font-semibold tracking-widest uppercase text-[var(--text-3)] mb-3">Objectives • {progress}%</div>
                <div className="h-1.5 bg-[var(--surface-3)] rounded-full overflow-hidden mb-4">
                  <div className="h-full bg-[var(--accent)] rounded-full" style={{ width: `${progress}%` }} />
                </div>
                <div className="space-y-2">
                  <Obj done={progress>=20} label="Identify injection point" desc="Find vulnerable parameter via error response" />
                  <Obj done={progress>=40} label="Enumerate database" desc="Determine DB type and version" />
                  <Obj active={progress>=40 && progress<80} done={progress>=80} label="Extract user table" desc="UNION SELECT — 3 columns, 5 rows remaining" />
                  <Obj done={progress>=100} label="Bypass authentication" desc="Use injection to login as admin" />
                  <Obj done={progress>=100} label="Write remediation" desc="Submit report with fix recommendation" />
                </div>
                <div className="mt-4 p-2.5 rounded-[8px] bg-[var(--surface-2)] border border-[var(--border)]">
                  <div className="text-[11px] font-semibold">Prerequisites</div>
                  <div className="text-[11px] text-[var(--text-2)] mt-1">Web Security • Lesson 13 completed • Basic SQL</div>
                  <Link href="/learn" className="text-[11px] font-medium text-[var(--accent)] hover:underline mt-1 inline-block">View path →</Link>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="text-[12px] font-semibold flex items-center gap-2"><Shield className="w-3.5 h-3.5" /> Environment</div>
                <div className="mt-2 space-y-1.5 text-[12px]">
                  <div className="flex justify-between"><span className="text-[var(--text-2)]">Instance</span><span className="font-mono">lab-sql-01</span></div>
                  <div className="flex justify-between"><span className="text-[var(--text-2)]">IP</span><span className="font-mono">10.10.14.2</span></div>
                  <div className="flex justify-between"><span className="text-[var(--text-2)]">Status</span><span className="text-emerald-600 font-medium flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Running</span></div>
                  <div className="flex justify-between"><span className="text-[var(--text-2)]">Region</span><span>us-east-1 • isolated</span></div>
                </div>
                <Button variant="secondary" size="sm" className="w-full mt-3 h-7 text-[12px]" onClick={handleOpenNewTab}>Open in new tab</Button>
              </CardContent>
            </Card>
          </div>

          {/* Center: Workspace */}
          <div className="space-y-4 min-w-0" data-workspace>
            <Tabs defaultValue="workspace">
              <TabsList>
                <TabsTrigger value="workspace">Workspace</TabsTrigger>
                <TabsTrigger value="guide">Guide</TabsTrigger>
                <TabsTrigger value="notes">Notes</TabsTrigger>
              </TabsList>
              <TabsContent value="workspace">
                <Card className="overflow-hidden">
                  <div className="h-8 bg-[var(--surface-2)] border-b border-[var(--border)] flex items-center justify-between px-3">
                    <span className="text-[11px] font-medium flex items-center gap-1.5"><Terminal className="w-3 h-3" /> Lab VM — target@lab-01</span>
                    <span className="text-[11px] font-mono text-[var(--text-3)]">10.10.14.2 • 31:42 remaining</span>
                  </div>
                  <div className="bg-[#0F1012] p-3 font-mono text-[12px] leading-6 min-h-[280px]">
                    <div className="text-zinc-500 flex items-center gap-2 mb-2">
                      <span className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-[10px] tracking-widest uppercase">Terminal</span>
                      <span>target@lab-01:~$</span>
                      <span className="ml-auto w-2 h-2 rounded-full bg-emerald-500" />
                    </div>
                    <div className="space-y-1 text-zinc-300">
                      <div><span className="text-zinc-500">$</span> curl -s &quot;https://app.lab/api/user?id=1&apos; UNION SELECT null,username,password FROM users--&quot; | jq</div>
                      <div className="text-zinc-500">{'{'}</div>
                      <div className="pl-2 text-emerald-400">&quot;users&quot;: [
      {'"id": 1, "username": "admin", "hash": "$2b$12$...'},
      {'"id": 2, "username": "alice", "hash": "$2b$12$...'}
  ]</div>
                      <div className="text-zinc-500">{'}'}</div>
                      <div><span className="text-zinc-500">$</span> <span className="w-2 h-4 bg-zinc-500 inline-block animate-pulse align-middle" /></div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-zinc-800 grid grid-cols-3 gap-2 font-sans">
                      <div className="rounded bg-zinc-900 border border-zinc-800 p-2"><div className="text-[10px] tracking-widest uppercase text-zinc-500">Hint</div><div className="text-[12px] text-amber-300">2/3 used</div></div>
                      <div className="rounded bg-zinc-900 border border-zinc-800 p-2"><div className="text-[10px] tracking-widest uppercase text-zinc-500">Progress</div><div className="text-[12px] text-white">{progress}%</div></div>
                      <div className="rounded bg-zinc-900 border border-zinc-800 p-2"><div className="text-[10px] tracking-widest uppercase text-zinc-500">Submit</div><div className="text-[11px] text-emerald-400 font-mono">flag{"{...}"}</div></div>
                    </div>
                  </div>
                  <div className="p-3 bg-[var(--surface-2)] border-t border-[var(--border)] flex gap-2">
                    <input value={flag} onChange={e=>setFlag(e.target.value)} placeholder="Enter flag or answer..." className="flex-1 h-8 rounded-[8px] border border-[var(--border)] bg-[var(--surface)] px-3 text-[13px] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]" />
                    <Button size="sm" className="h-8" onClick={handleSubmitFlag}>Submit</Button>
                  </div>
                  {flagMsg && <div className="px-3 pb-3 text-[12px] leading-5" style={{color: flagMsg.includes("✅") ? "#059669" : "#DC2626"}}>{flagMsg}</div>}
                </Card>

                <Card className="mt-4">
                  <CardContent className="p-4">
                    <div className="text-[12px] font-semibold">How to validate</div>
                    <div className="text-[12px] text-[var(--text-2)] mt-1 leading-5">Submit the extracted admin hash or the flag from the users table. The environment validates server-side. Rate limited to 5/min.</div>
                    <div className="mt-3 flex items-center gap-2">
                      <Badge variant="outline" className="text-[11px] font-mono">target: 10.10.14.2</Badge>
                      <Badge variant="outline" className="text-[11px] font-mono">port: 443</Badge>
                      <span className="text-[11px] text-[var(--text-3)]">• Isolated from production</span>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="guide">
                <Card><CardContent className="p-5 prose prose-sm max-w-none dark:prose-invert"><h3 className="text-[14px] font-[650]">Guide</h3><p className="text-[13px] leading-6 text-[var(--text-2)]">1. Identify injection via error or boolean. 2. Determine column count via ORDER BY. 3. Use UNION SELECT to extract data. 4. Bypass auth with payload. 5. Document fix: parameterized queries.</p><pre className="bg-[#0F1012] text-zinc-300 p-3 rounded-[8px] text-[11px] font-mono overflow-auto">SELECT * FROM users WHERE id = &#39;1&apos; UNION SELECT null,null--</pre></CardContent></Card>
              </TabsContent>
              <TabsContent value="notes">
                <Card><CardContent className="p-5"><textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Private notes — saved automatically, per-lab, not shared..." className="w-full min-h-[180px] rounded-[8px] border border-[var(--border)] bg-[var(--surface)] p-3 text-[13px] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]" /><div className="mt-2 text-[11px] text-[var(--text-3)]">Auto-saved to localStorage (aegis_lab_notes_{id}) • Markdown supported • Private to you</div><div className="mt-3 flex gap-2"><Button size="sm" className="h-8" onClick={()=>alert("Notes saved to localStorage")}>Save notes</Button><Button size="sm" variant="ghost" className="h-8" onClick={()=>{ setNotes(""); try{ localStorage.removeItem(`aegis_lab_notes_${id}`)}catch{}}}>Clear</Button></div></CardContent></Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right: Hints / Progress */}
          <div className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-[12px] font-semibold flex items-center justify-between">
                  <span className="flex items-center gap-1.5"><Flag className="w-3.5 h-3.5" /> Hints</span>
                  <span className="text-[11px] font-mono text-[var(--text-3)]">2/3</span>
                </div>
                <div className="mt-3 space-y-2">
                  <div className="p-2.5 rounded-[8px] bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900">
                    <div className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300">Hint 1 — Revealed</div>
                    <div className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-1">Try single quote to trigger SQL error.</div>
                  </div>
                  <div className="p-2.5 rounded-[8px] bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900">
                    <div className="text-[11px] font-semibold text-amber-800 dark:text-amber-300">Hint 2 — Revealed</div>
                    <div className="text-[11px] text-amber-700 dark:text-amber-400 mt-1">Use UNION with ordered column count.</div>
                  </div>
                  <div className="p-2.5 rounded-[8px] bg-[var(--surface-2)] border border-dashed border-[var(--border)]">
                    <div className="text-[11px] font-semibold text-[var(--text-2)]">Hint 3 — 50 XP penalty</div>
                    {hintRevealed ? <div className="mt-2 text-[11px] text-[var(--text-2)] p-2 rounded bg-amber-50 dark:bg-amber-950/20 border border-amber-200">Payload: <code className="font-mono">&apos; UNION SELECT sql,null FROM sqlite_master--</code></div> : <Button size="sm" variant="secondary" className="w-full mt-2 h-7 text-[11px]" onClick={handleRevealHint}>Reveal hint</Button>}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="text-[12px] font-semibold flex items-center gap-2"><StickyNote className="w-3.5 h-3.5" /> Notes & progress</div>
                <div className="mt-3 space-y-2 text-[12px]">
                  <div className="flex justify-between"><span className="text-[var(--text-2)]">Progress</span><span className="font-mono">{progress}%</span></div>
                  <div className="h-1.5 bg-[var(--surface-3)] rounded-full overflow-hidden"><div className="h-full bg-[var(--accent)]" style={{width:`${progress}%`}} /></div>
                  <div className="flex justify-between"><span className="text-[var(--text-2)]">Time</span><span className="font-mono">31:42 remaining</span></div>
                  <div className="flex justify-between"><span className="text-[var(--text-2)]">XP</span><span className="font-mono">+120 on completion</span></div>
                </div>
                <Button variant="secondary" size="sm" className="w-full mt-3 h-7 text-[12px]" onClick={()=>alert("Certificate: complete lab to 100% to generate PDF (mock). Stored in localStorage).")}><FileText className="w-3 h-3 mr-1" /> View certificate</Button>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="text-[11px] font-semibold tracking-widest uppercase text-[var(--text-3)]">Next steps</div>
                <div className="mt-2 space-y-2">
                  <Link href="/labs/lab-2" className="flex items-center justify-between p-2.5 rounded-[8px] border border-[var(--border)] hover:bg-[var(--surface-2)] transition-colors">
                    <span className="text-[12.5px] font-[500]">Linux Privilege Escalation</span>
                    <ChevronRight className="w-3.5 h-3.5 text-[var(--text-3)]" />
                  </Link>
                  <Link href="/learn" className="flex items-center justify-between p-2.5 rounded-[8px] border border-[var(--border)] hover:bg-[var(--surface-2)] transition-colors">
                    <span className="text-[12.5px] font-[500]">Back to Web Security path</span>
                    <ChevronRight className="w-3.5 h-3.5 text-[var(--text-3)]" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  )
}

function Obj({ label, desc, done, active }: { label: string, desc: string, done?: boolean, active?: boolean }) {
  return (
    <div className={`p-2.5 rounded-[8px] border flex gap-2.5 ${active ? "bg-[var(--accent-muted)] border-[var(--accent-border)]" : done ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900" : "bg-[var(--surface-2)] border-[var(--border)]"}`}>
      <span className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${done ? "bg-emerald-600 border-emerald-600 text-white" : active ? "bg-[var(--accent)] border-[var(--accent)] text-white" : "bg-[var(--surface)] border-[var(--border-strong)]"}`}>
        {done ? <CheckCircle2 className="w-3 h-3" /> : active ? <span className="w-1.5 h-1.5 rounded-full bg-white" /> : null}
      </span>
      <div className="flex-1 min-w-0">
        <div className={`text-[12.5px] font-[550] leading-none ${done ? "text-emerald-800 dark:text-emerald-300" : active ? "text-[var(--accent)]" : "text-[var(--text-2)]"}`}>{label}</div>
        <div className="text-[11px] text-[var(--text-3)] mt-1 leading-4">{desc}</div>
      </div>
    </div>
  )
}
