"use client"
import Link from "next/link"
import * as React from "react"
import { notFound } from "next/navigation"
import { AppShell } from "@/components/layout/app-shell"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Bookmark, MessageSquare, Eye, Share2, FileText, Trash2 } from "lucide-react"
import { sanitizeInput } from "@/lib/sanitize"
import { commentLimiter } from "@/lib/rate-limit"

type Article = {
  id: string
  title: string
  excerpt: string
  author: string
  tags: string[]
  views: number
  content: string
  createdAt: string
}

export default function ResearchDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = (React as any).use(params) as { id: string }
  const [article, setArticle] = React.useState<Article | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [missing, setMissing] = React.useState(false)
  const [bookmarked, setBookmarked] = React.useState(false)
  const [comments, setComments] = React.useState<{user:string,text:string,time:string}[]>([])
  const [newComment, setNewComment] = React.useState("")

  React.useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await fetch(`/api/news/${encodeURIComponent(id)}`)
        if (res.status === 404) {
          if (!cancelled) { setMissing(true); setLoading(false) }
          return
        }
        if (!res.ok) throw new Error("load failed")
        const body = await res.json()
        if (!cancelled) { setArticle(body.article); setLoading(false) }
      } catch {
        if (!cancelled) { setMissing(true); setLoading(false) }
      }
    }
    load()
    return () => { cancelled = true }
  }, [id])

  React.useEffect(()=>{
    try{
      const bm=localStorage.getItem("aegis_research_bookmarks")
      if(bm){ const s=new Set(JSON.parse(bm)); setBookmarked((s as Set<string>).has(id)) }
      const c=localStorage.getItem(`aegis_research_comments_${id}`)
      if(c) setComments(JSON.parse(c))
    }catch{}
  },[id])
  React.useEffect(()=>{ try{ localStorage.setItem(`aegis_research_comments_${id}`, JSON.stringify(comments))}catch{}},[comments,id])

  if (missing) {
    notFound()
  }

  if (loading || !article) {
    return (
      <AppShell withSidebar>
        <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-[860px]">
          <div className="h-5 w-24 rounded bg-[var(--surface-2)] animate-pulse" />
          <div className="mt-4 h-8 w-2/3 rounded bg-[var(--surface-2)] animate-pulse" />
          <div className="mt-2 h-4 w-1/2 rounded bg-[var(--surface-2)] animate-pulse" />
          <div className="mt-6 h-[280px] rounded-[12px] bg-[var(--surface-2)] animate-pulse" />
        </div>
      </AppShell>
    )
  }

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

  const paragraphs = article.content.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean)

  return (
    <AppShell withSidebar>
      <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-[860px]">
        <Link href="/research" className="inline-flex items-center gap-1.5 text-[13px] text-[var(--text-2)] hover:text-[var(--text)] mb-4"><ArrowLeft className="w-3.5 h-3.5" /> Back to research</Link>

        <div className="flex items-center gap-2 mb-3">
          <span className="text-[11px] text-[var(--text-3)]">{article.createdAt ? new Date(article.createdAt).toLocaleDateString() : ""}</span>
          <span className="ml-auto hidden sm:flex items-center gap-1 text-[11px] text-[var(--text-3)]"><Eye className="w-3 h-3" />{article.views.toLocaleString()} • <Bookmark className="w-3 h-3" />{bookmarked?1:0} • <MessageSquare className="w-3 h-3" />{comments.length}</span>
        </div>

        <h1 className="text-[24px] sm:text-[28px] font-[700] tracking-[-0.04em] leading-tight">{article.title}</h1>
        {article.excerpt && <p className="mt-3 text-[14px] leading-7 text-[var(--text-2)]">{article.excerpt}</p>}

        <div className="mt-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[var(--text)] text-[var(--background)] flex items-center justify-center text-[12px] font-bold">{(article.author || "?").slice(0,2).toUpperCase()}</div>
            <div>
              <div className="text-[13px] font-[600]">{article.author || "Aegis Team"}</div>
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

        {article.tags.length > 0 && (
          <div className="mt-6 flex gap-2 flex-wrap">
            {article.tags.map(t => <Badge key={t} variant="secondary">#{t}</Badge>)}
          </div>
        )}

        <Card className="mt-6">
          <CardContent className="p-0 overflow-hidden">
            <article className="max-w-none p-6 sm:p-8">
              {paragraphs.length === 0 ? (
                <p className="text-[13px] leading-7 text-[var(--text-2)]">Full article body has not been published yet.</p>
              ) : paragraphs.map((p, i) => (
                <p key={i} className="text-[13px] leading-7 text-[var(--text-2)] mt-4 first:mt-0">{p}</p>
              ))}
            </article>
            <div className="px-6 sm:px-8 py-4 bg-[var(--surface-2)] border-t border-[var(--border)] flex items-center justify-between text-[12px]">
              <span className="text-[var(--text-3)] flex items-center gap-2"><FileText className="w-3 h-3" /> Published by {article.author || "Aegis Team"}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardContent className="p-5">
            <div className="text-[13px] font-semibold flex items-center gap-2"><MessageSquare className="w-3.5 h-3.5" /> Discussion • {comments.length} comments</div>
            <div className="mt-4 space-y-3">
              {comments.length === 0 && (
                <div className="p-3 rounded-[10px] border border-dashed border-[var(--border)] text-center text-[12px] text-[var(--text-2)]">No comments yet — start the discussion.</div>
              )}
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
              <div className="text-[11px] text-[var(--text-3)]">Your comments are deletable. Comments are stored in this browser.</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
