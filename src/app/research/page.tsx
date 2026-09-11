"use client"
import Link from "next/link"
import * as React from "react"
import { AppShell } from "@/components/layout/app-shell"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, FileText, Bookmark, MessageSquare, Eye, X } from "lucide-react"
import { Stagger, FadeIn } from "@/components/ui/stagger"

type Article = {
  id: string
  title: string
  excerpt: string
  author: string
  tags: string[]
  views: number
  createdAt: string
}

export default function ResearchPage() {
  const [articles, setArticles] = React.useState<Article[] | null>(null)
  const [q, setQ] = React.useState("")
  const [bookmarked, setBookmarked] = React.useState<Set<string>>(new Set())
  const mountedRef = React.useRef(false)

  React.useEffect(()=>{
    let cancelled = false
    async function load() {
      try {
        const res = await fetch("/api/news")
        const body = await res.json().catch(() => ({ articles: [] }))
        if (!cancelled) setArticles(body.articles ?? [])
      } catch {
        if (!cancelled) setArticles([])
      }
    }
    load()
    try{ const b=localStorage.getItem("aegis_research_bookmarks"); if(b) setBookmarked(new Set(JSON.parse(b)))}catch{}
    mountedRef.current = true
    return ()=> { mountedRef.current = false; cancelled = true }
  },[])
  React.useEffect(()=>{
    if(!mountedRef.current) return
    const t = setTimeout(()=>{ try{ localStorage.setItem("aegis_research_bookmarks", JSON.stringify([...bookmarked]))}catch{} }, 300)
    return ()=> clearTimeout(t)
  },[bookmarked])
  const toggleBookmark = (id:string)=> setBookmarked(prev=>{ const n=new Set(prev); if(n.has(id)) n.delete(id); else n.add(id); return n })

  const filtered = React.useMemo(()=> (articles ?? []).filter(a=>{
    if(q.trim()){
      const s=q.toLowerCase()
      return a.title.toLowerCase().includes(s) || a.excerpt.toLowerCase().includes(s) || a.tags.some(t=>t.includes(s)) || a.author.toLowerCase().includes(s)
    }
    return true
  }),[q,articles])

  return (
    <AppShell withSidebar>
      <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-[1080px]">
        <FadeIn>
          <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
            <div>
              <h1 className="text-[22px] font-[650] tracking-[-0.03em]">Research</h1>
              <p className="mt-1 text-[13.5px] text-[var(--text-2)]">Technical publications with verifiable authorship. Quality over quantity.</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-3)]" aria-hidden="true" />
                <Input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search research, authors, tags..." className="pl-8 h-8 w-[220px] sm:w-[260px] bg-[var(--surface)]" aria-label="Search research" />
                {q && <button onClick={()=>setQ("")} aria-label="Clear search" className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-[var(--surface-2)]"><X className="w-3 h-3" aria-hidden="true" /></button>}
              </div>
            </div>
          </div>
        </FadeIn>

        <div className="grid lg:grid-cols-[1.7fr_0.9fr] gap-6">
          <Stagger className="space-y-4">
            {articles === null ? (
              [1,2].map(i => (
                <Card key={i}><CardContent className="p-5 sm:p-6">
                  <div className="h-5 w-3/4 rounded bg-[var(--surface-2)] animate-pulse" />
                  <div className="mt-2 h-4 w-full rounded bg-[var(--surface-2)] animate-pulse" />
                  <div className="mt-2 h-4 w-1/2 rounded bg-[var(--surface-2)] animate-pulse" />
                </CardContent></Card>
              ))
            ) : filtered.length===0 ? (
              <Card className="border-dashed bg-[var(--surface-2)]"><CardContent className="p-6 text-center"><div className="text-[13px] font-[600]">{q ? "No research matches" : "No research published yet"}</div><div className="text-[12px] text-[var(--text-2)]">{q ? "Try a different search." : "Published articles will appear here."}</div>{q && <Button size="sm" className="mt-3 h-8" onClick={()=>setQ("")} aria-label="Clear search">Clear search</Button>}</CardContent></Card>
            ) : filtered.map(a => {
              const isBm = bookmarked.has(a.id)
              return (
              <div key={a.id} className="stagger-item"><Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-5 sm:p-6">
                  <Link href={`/research/${a.id}`} className="block group">
                    <h2 className="text-[16px] sm:text-[17px] font-[650] tracking-[-0.02em] leading-tight group-hover:text-[var(--accent)] transition-colors">{a.title}</h2>
                    <p className="mt-2 text-[13px] leading-6 text-[var(--text-2)] line-clamp-2">{a.excerpt}</p>
                  </Link>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    {a.tags.map(tag => (
                      <button key={tag} onClick={()=>setQ(tag)} aria-label={`Search tag ${tag}`} className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-2)] hover:bg-[var(--text)] hover:text-[var(--background)] transition-colors min-h-[32px]">#{tag}</button>
                    ))}
                    <button onClick={()=>toggleBookmark(a.id)} aria-pressed={isBm} aria-label={isBm ? `Remove bookmark for ${a.title}` : `Bookmark ${a.title}`} className={`ml-auto inline-flex items-center gap-1 text-[11px] border rounded-full px-2 py-1 min-h-[32px] ${isBm ? "bg-[var(--text)] text-[var(--background)] border-[var(--text)]" : "bg-[var(--surface)] border-[var(--border)] text-[var(--text-2)] hover:bg-[var(--surface-2)]"}`}>
                      <Bookmark className={`w-3 h-3 ${isBm ? "fill-current" : ""}`} aria-hidden="true" /> {isBm ? "Bookmarked" : "Bookmark"}
                    </button>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center text-[11px] font-semibold" aria-hidden="true">{(a.author || "?").slice(0,2).toUpperCase()}</div>
                      <div>
                        <div className="text-[12.5px] font-[500] leading-none">{a.author || "Aegis Team"}</div>
                        <div className="text-[11px] text-[var(--text-3)]">{a.createdAt ? new Date(a.createdAt).toLocaleDateString() : ""}</div>
                      </div>
                    </div>
                    <div className="hidden sm:flex items-center gap-3 text-[11px] text-[var(--text-3)]" aria-hidden="true">
                      <span className="flex items-center gap-1"><Eye className="w-3 h-3" aria-hidden="true" /> {a.views.toLocaleString()}</span>
                      <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" aria-hidden="true" /> Discussion</span>
                    </div>
                  </div>
                </CardContent>
              </Card></div>
            )})}
          </Stagger>

          <div className="space-y-4">
            <Card>
              <CardContent className="p-5">
                <div className="text-[12px] font-semibold flex items-center gap-2"><FileText className="w-3.5 h-3.5" aria-hidden="true" /> Publish with confidence</div>
                <p className="mt-2 text-[12.5px] leading-5 text-[var(--text-2)]">Writeups, vulnerability analysis, and detection engineering. Articles are reviewed before publishing.</p>
                <Link href="/labs"><Button variant="secondary" size="sm" className="w-full mt-3 h-8">Browse labs</Button></Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
