"use client"
import Link from "next/link"
import * as React from "react"
import { AppShell } from "@/components/layout/app-shell"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Bookmark, MessageSquare, Eye, Clock, Award, Share2, FileText, Trash2 } from "lucide-react"
import { sanitizeInput } from "@/lib/sanitize"
import { commentLimiter } from "@/lib/rate-limit"

export default function ResearchDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = (React as any).use(params) as { id: string }
  const [bookmarked, setBookmarked] = React.useState(false)
  const [comments, setComments] = React.useState<{user:string,text:string,time:string}[]>([
    { user: "alexmorgan", text: "Great detection rule — we deployed variant with `userAgent` filter to reduce CI noise.", time: "2h ago" },
    { user: "priya_n", text: "Do you have data on prevalence of ExternalId reuse?", time: "5h ago" },
  ])
  const [newComment, setNewComment] = React.useState("")
  const [views, setViews] = React.useState(3421)

  React.useEffect(()=>{
    try{
      const bm=localStorage.getItem("aegis_research_bookmarks")
      if(bm){ const s=new Set(JSON.parse(bm)); setBookmarked((s as Set<string>).has(id)) }
      const c=localStorage.getItem(`aegis_research_comments_${id}`)
      if(c) setComments(JSON.parse(c))
      // increment view count mock
      const v=localStorage.getItem(`aegis_research_views_${id}`)
      if(!v){ localStorage.setItem(`aegis_research_views_${id}`,"1"); setViews(v=>v+1)} else setViews(v=>v+0)
    }catch{}
  },[id])
  React.useEffect(()=>{ try{ localStorage.setItem(`aegis_research_comments_${id}`, JSON.stringify(comments))}catch{}},[comments,id])

  const toggleBookmark=()=>{
    const next=!bookmarked
    setBookmarked(next)
    try{
      const raw=localStorage.getItem("aegis_research_bookmarks")
      const set=new Set<string>(raw?JSON.parse(raw):[])
      if(next) set.add(id); else set.delete(id)
      localStorage.setItem("aegis_research_bookmarks", JSON.stringify([...set]))
    }catch{}
  }
  const handleShare=async()=>{
    const url= typeof window!=="undefined"? window.location.href : ""
    try{ await navigator.clipboard.writeText(url); alert("Link copied: "+url)}catch{ alert(url)}
  }
  const handleComment=()=>{
    const rl = commentLimiter.check()
    if (rl.limited) return alert(`Rate limited: try again in ${Math.ceil(rl.resetMs/1000)}s`)
    const clean = sanitizeInput(newComment, 500)
    if(!clean.trim()) return alert("Write a comment")
    commentLimiter.record()
    const entry={user:"you", text:clean, time:"now"}
    setComments(prev=>[entry, ...prev])
    setNewComment("")
  }
  const deleteComment=(idx:number)=>{
    if(comments[idx].user!=="you") return alert("Can only delete your own comments")
    setComments(prev=>prev.filter((_,i)=>i!==idx))
  }

  return (
    <AppShell withSidebar>
      <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-[860px]">
        <Link href="/research" className="inline-flex items-center gap-1.5 text-[13px] text-[var(--text-2)] hover:text-[var(--text)] mb-4"><ArrowLeft className="w-3.5 h-3.5" /> Back to research</Link>

        <div className="flex items-center gap-2 mb-3">
          <Badge variant="accent">Vulnerability Analysis</Badge>
          <span className="text-[11px] text-[var(--text-3)]">• 12 min read • Jan 14, 2026</span>
          <span className="ml-auto hidden sm:flex items-center gap-1 text-[11px] text-[var(--text-3)]"><Eye className="w-3 h-3" />{views.toLocaleString()} • <Bookmark className="w-3 h-3" />{42 + (bookmarked?1:0)} • <MessageSquare className="w-3 h-3" />{comments.length}</span>
        </div>

        <h1 className="text-[24px] sm:text-[28px] font-[700] tracking-[-0.04em] leading-tight">Abusing Overly Permissive IAM Trust Policies in AWS Organizations</h1>
        <p className="mt-3 text-[14px] leading-7 text-[var(--text-2)]">We analyze 1,200 real trust policies, demonstrate a cross-account privilege escalation, and provide CloudTrail detection and Terraform remediation.</p>

        <div className="mt-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[var(--text)] text-[var(--background)] flex items-center justify-center text-[12px] font-bold">SC</div>
            <div>
              <div className="text-[13px] font-[600]">Sophia Chen <Badge variant="success" className="ml-2 text-[10px]">Staff Pick</Badge></div>
              <div className="text-[11px] text-[var(--text-2)]">Security Engineer • 4.2k reputation • sophiachen</div>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <Button variant={bookmarked?"default":"secondary"} size="sm" className="h-8" onClick={toggleBookmark}><Bookmark className={`w-3.5 h-3.5 mr-1 ${bookmarked?"fill-current":""}`} /> {bookmarked?"Bookmarked":"Bookmark"}</Button>
            <Button variant="secondary" size="sm" className="h-8" onClick={handleShare}><Share2 className="w-3.5 h-3.5 mr-1" /> Share</Button>
          </div>
        </div>
        <div className="flex sm:hidden gap-2 mt-4">
          <Button variant={bookmarked?"default":"secondary"} size="sm" className="flex-1 h-8" onClick={toggleBookmark}><Bookmark className={`w-3.5 h-3.5 mr-1 ${bookmarked?"fill-current":""}`} /> {bookmarked?"Bookmarked":"Bookmark"}</Button>
          <Button variant="secondary" size="sm" className="flex-1 h-8" onClick={handleShare}><Share2 className="w-3.5 h-3.5 mr-1" /> Share</Button>
        </div>

        <div className="mt-6 flex gap-2 flex-wrap">
          <Badge variant="secondary">#aws</Badge><Badge variant="secondary">#iam</Badge><Badge variant="secondary">#detection-engineering</Badge><Badge variant="secondary">#cloudtrail</Badge>
        </div>

        <Card className="mt-6">
          <CardContent className="p-0 overflow-hidden">
            <article className="prose prose-sm sm:prose-base max-w-none p-6 sm:p-8 prose-headings:tracking-[-0.02em] prose-headings:font-[650] prose-p:leading-7 prose-p:text-[var(--text-2)] prose-code:text-[12px] prose-code:font-mono prose-pre:bg-[#0F1012] prose-pre:border prose-pre:border-zinc-800">
              <h2>Summary</h2>
              <p>Many organizations allow <code>sts:AssumeRole</code> from <code>*</code> principals with weak externalId. We scanned 1,200 policies and found 18% permit cross-account assumption without MFA or IP restriction.</p>
              <h2>Exploitation</h2>
              <p>Attacker with compromised low-privilege account enumerates trusted roles via <code>iam:ListRoles</code>, then assumes:</p>
              <pre><code className="language-bash">aws sts assume-role --role-arn arn:aws:iam::123456789012:role/AdminCrossAccount --role-session-name x</code></pre>
              <p>From there, we pivot to sensitive S3 and escalate via <code>iam:PassRole</code> + <code>ec2:RunInstances</code>.</p>
              <h2>Detection — CloudTrail Sigma</h2>
              <pre><code className="language-yaml">{`title: Overly Permissive AssumeRole
detection:
  selection:
    eventName: AssumeRole
    errorCode: null
    requestParameters.roleArn|contains: 'arn:aws:iam'
  condition: selection | count() by userIdentity.arn > 5
falsepositives:
  - CI/CD roles
level: medium`}</code></pre>
              <h2>Terraform Remediation</h2>
              <pre><code className="language-hcl">{`data "aws_iam_policy_document" "trust" {
  statement {
    effect  = "Allow"
    principals { type = "AWS" identifiers = ["arn:aws:iam::123456789012:root"] }
    actions = ["sts:AssumeRole"]
    condition {
      test     = "StringEquals"
      variable = "sts:ExternalId"
      values   = [var.external_id]
    }
  }
}`}</code></pre>
              <h2>Related</h2>
              <ul>
                <li>Lab: Cloud IAM Misconfiguration — hands-on exploitation and audit (<Link href="/labs/lab-4" className="text-[var(--accent)]">open lab →</Link>)</li>
                <li>Detection: Entra ID Token Replay (<Link href="/research" className="text-[var(--accent)]">KQL + Sigma</Link>)</li>
              </ul>
            </article>
            <div className="px-6 sm:px-8 py-4 bg-[var(--surface-2)] border-t border-[var(--border)] flex items-center justify-between text-[12px]">
              <span className="text-[var(--text-3)] flex items-center gap-2"><FileText className="w-3 h-3" /> Markdown • Syntax highlighted • Verifiable authorship</span>
              <span className="hidden sm:block text-[var(--text-3)]">Last updated Jan 14, 2026 • CC BY-SA</span>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardContent className="p-5">
            <div className="text-[13px] font-semibold flex items-center gap-2"><MessageSquare className="w-3.5 h-3.5" /> Discussion • {comments.length} comments</div>
            <div className="mt-4 space-y-3">
              {comments.map((c,i) => (
                <div key={i} className="flex gap-2.5 p-3 rounded-[10px] border border-[var(--border)] bg-[var(--surface-2)] group">
                  <div className="w-7 h-7 rounded-full bg-[var(--text)] text-[var(--background)] flex items-center justify-center text-[11px] font-semibold">{c.user.slice(0,2).toUpperCase()}</div>
                  <div className="flex-1"><div className="text-[12.5px] font-medium">{c.user}</div><div className="text-[12px] text-[var(--text-2)] mt-1">{c.text}</div><div className="text-[11px] text-[var(--text-3)] mt-1">{c.time}</div></div>
                  {c.user==="you" && <button onClick={()=>deleteComment(i)} className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-[var(--surface)] text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>}
                </div>
              ))}
              <div className="flex gap-2">
                <input value={newComment} onChange={e=>setNewComment(e.target.value)} placeholder="Add a comment — be technical, cite sources..." className="flex-1 h-9 rounded-[8px] border border-[var(--border)] bg-[var(--surface)] px-3 text-[13px] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]" onKeyDown={e=>{ if(e.key==="Enter") handleComment()}} />
                <Button size="sm" className="h-9" onClick={handleComment}>Comment</Button>
              </div>
              <div className="text-[11px] text-[var(--text-3)]">Comments saved to localStorage (aegis_research_comments_{id}). Your comments deletable. Others read-only in demo.</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
