"use client"
import Link from "next/link"
import * as React from "react"
import { use } from "react"
import { notFound } from "next/navigation"
import { AppShell } from "@/components/layout/app-shell"
import { VideoPlayer } from "@/components/video-player"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp, Star, ChevronRight, Clock, Play, CheckCircle2 } from "lucide-react"

type Lesson = {
  id: string
  title: string
  subtitle: string
  duration: string
  youtubeId: string
  embedUrl: string
  src: string | null
  description: string
}

export default function LearnInside({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const [lessons, setLessons] = React.useState<Lesson[] | null>(null)
  const [missing, setMissing] = React.useState(false)
  const [activeLesson, setActiveLesson] = React.useState("")
  const [expanded, setExpanded] = React.useState(true)
  const [completed, setCompleted] = React.useState(false)

  React.useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await fetch(`/api/videos?path=${encodeURIComponent(slug)}`)
        const body = await res.json().catch(() => ({ videos: [] }))
        const vids = (body.videos ?? []).map((v: Record<string, unknown>, i: number) => ({
          id: String(v.id ?? i),
          title: String(v.title ?? `Lesson ${i + 1}`),
          subtitle: String(v.description ?? `Lesson ${i + 1}`).slice(0, 80),
          duration: String(v.duration ?? ""),
          youtubeId: String(v.youtubeId ?? ""),
          embedUrl: String(v.embedUrl ?? ""),
          src: null,
          description: String(v.description ?? ""),
        }))
        if (!cancelled) {
          if (vids.length === 0) { setMissing(true); return }
          setLessons(vids)
          setActiveLesson(vids[0].title)
        }
      } catch {
        if (!cancelled) setMissing(true)
      }
    }
    load()
    return () => { cancelled = true }
  }, [slug])

  const storageKey = `aegis_lesson_${slug}_${activeLesson}`

  React.useEffect(() => {
    try { setCompleted(localStorage.getItem(storageKey) === "true") } catch {}
  }, [storageKey])

  if (missing) {
    notFound()
  }

  if (!lessons) {
    return (
      <AppShell withSidebar>
        <div className="flex min-h-[calc(100vh-56px)] bg-[var(--background)] -m-6 lg:-m-8 p-6 lg:p-8">
          <div className="max-w-[720px] mx-auto w-full">
            <div className="h-8 w-2/3 rounded bg-[var(--surface-2)] animate-pulse" />
            <div className="mt-2 h-4 w-1/2 rounded bg-[var(--surface-2)] animate-pulse" />
            <div className="mt-6 aspect-video rounded-[12px] bg-[var(--surface-2)] animate-pulse" />
          </div>
        </div>
      </AppShell>
    )
  }

  const handleVideoEnd = () => {
    try { localStorage.setItem(storageKey, "true") } catch {}
    setCompleted(true)
  }

  const currentIndex = lessons.findIndex((l) => l.title === activeLesson)
  const hasNext = currentIndex >= 0 && currentIndex < lessons.length - 1
  const hasPrev = currentIndex > 0
  const nextLesson = hasNext ? lessons[currentIndex + 1] : null
  const prevLesson = hasPrev ? lessons[currentIndex - 1] : null
  const goNext = () => {
    if (nextLesson) {
      setActiveLesson(nextLesson.title)
      try { window.scrollTo({ top: 0, behavior: "smooth" }) } catch {}
    }
  }
  const goPrev = () => {
    if (prevLesson) {
      setActiveLesson(prevLesson.title)
      try { window.scrollTo({ top: 0, behavior: "smooth" }) } catch {}
    }
  }

  const active = lessons[currentIndex] ?? lessons[0]
  const pathTitle = slug.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())

  return (
    <AppShell withSidebar>
      <div className="flex min-h-[calc(100vh-56px)] bg-[var(--background)] -m-6 lg:-m-8 p-6 lg:p-8">
        <div className="max-w-[720px] mx-auto w-full">
          <nav aria-label="Breadcrumb">
            <div className="flex items-center gap-2 text-[12px] text-[var(--text-3)] mb-4">
              <span className="w-5 h-5 rounded-full bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center text-[10px]">◉</span>
              <Link href="/learn" className="hover:text-[var(--text)]">Learn</Link>
              <span className="text-[var(--text-3)]">/</span>
              <span className="text-[var(--text)]">{pathTitle}</span>
            </div>
          </nav>
          <h1 className="text-[24px] font-[700] tracking-[-0.03em] text-[var(--text)]">{active?.title || pathTitle}</h1>
          <p className="mt-1 text-[12px] text-[var(--text-3)]">{pathTitle} • Lesson {currentIndex >=0 ? currentIndex+1 : 1} of {lessons.length}</p>
          {active?.description && <p className="mt-2 text-[13px] text-[var(--text-2)]">{active.description}</p>}
          <div className="mt-6">
            {active?.embedUrl ? (
              <div className="relative rounded-[12px] overflow-hidden bg-black aspect-video">
                <iframe
                  key={active.id}
                  src={active.embedUrl}
                  title={active.title}
                  className="absolute inset-0 w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : active?.src ? (
              <VideoPlayer key={active.id} src={active.src} onEnd={handleVideoEnd} />
            ) : (
              <div className="rounded-[12px] border border-dashed border-[var(--border)] bg-[var(--surface-2)] aspect-video flex items-center justify-center text-[13px] text-[var(--text-2)]">
                Video source not available yet.
              </div>
            )}
          </div>

          <div className="mt-6 rounded-[12px] border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
            <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-[var(--surface-2)] transition-colors" aria-expanded={expanded} aria-controls="lesson-list">
              <span className="text-[13px] font-[600] text-[var(--text)]">Lessons • {lessons.length}</span>
              {expanded ? <ChevronUp className="w-4 h-4 text-[var(--text-3)]" /> : <ChevronDown className="w-4 h-4 text-[var(--text-3)]" />}
            </button>
            {expanded && (
              <ul id="lesson-list" className="divide-y divide-[var(--border)] border-t border-[var(--border)]">
                {lessons.map((lesson, idx) => {
                  const isActive = lesson.title === activeLesson
                  return (
                    <li key={lesson.id}>
                      <button
                        onClick={() => setActiveLesson(lesson.title)}
                        className={`w-full flex items-center justify-between px-4 py-3 text-left hover:bg-[var(--surface-2)] transition-colors ${isActive ? "bg-blue-50 dark:bg-blue-950/20 border-l-2 border-l-blue-600" : ""}`}
                        aria-current={isActive ? "true" : undefined}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-[12px] ${isActive ? "bg-blue-600 text-white" : "bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-3)]"}`}>
                            {isActive ? <Play className="w-3.5 h-3.5 fill-white" /> : idx + 1}
                          </span>
                          <div className="min-w-0">
                            <div className={`text-[13px] font-[500] truncate ${isActive ? "text-blue-700 dark:text-blue-300" : "text-[var(--text)]"}`}>{lesson.title}</div>
                            <div className="text-[11px] text-[var(--text-3)]">{lesson.subtitle}{lesson.duration ? ` • ${lesson.duration}` : ""}</div>
                          </div>
                        </div>
                        <span className="ml-2 text-[11px] font-mono text-[var(--text-3)] shrink-0">{lesson.duration}</span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <Button
              variant="secondary"
              size="sm"
              disabled={!hasPrev}
              onClick={goPrev}
              className="h-9 gap-1.5 justify-center border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-2)] disabled:opacity-40"
              aria-label="Previous lesson"
            >
              <ChevronRight className="w-4 h-4 rotate-180" /> Previous
            </Button>
            <div className="hidden sm:flex flex-col items-center">
              <span className="text-[11px] tracking-widest uppercase text-[var(--text-3)]">Up next</span>
              <span className="text-[12px] font-[600] text-[var(--text)] truncate max-w-[220px]">{hasNext && nextLesson ? nextLesson.title : "No more lessons"}</span>
            </div>
            <Button
              disabled={!hasNext}
              onClick={goNext}
              className="h-9 gap-1.5 justify-center bg-[var(--text)] text-[var(--background)] hover:bg-zinc-800 disabled:opacity-40"
              aria-label="Next lesson"
            >
              Next video <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          {hasNext && nextLesson && (
            <button onClick={goNext} className="mt-3 w-full flex items-center justify-between p-3 rounded-[10px] border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors text-left" aria-label={`Next lesson: ${nextLesson.title}`}>
              <div>
                <div className="text-[11px] font-semibold tracking-widest uppercase text-blue-700 dark:text-blue-300">Next up</div>
                <div className="text-[13px] font-[600] text-blue-900 dark:text-blue-100">{nextLesson.title} • {nextLesson.subtitle}</div>
                <div className="text-[11px] text-blue-700/70 dark:text-blue-300/70">{nextLesson.duration}</div>
              </div>
              <div className="w-8 h-8 rounded-full bg-[#2563EB] text-white flex items-center justify-center shrink-0">
                <Play className="w-4 h-4 fill-white" />
              </div>
            </button>
          )}
          {!hasNext && (
            <div className="mt-3 p-4 rounded-[12px] border border-[var(--border)] bg-[var(--surface)] shadow-sm text-center">
              <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="mt-3 text-[14px] font-[700] tracking-[-0.02em] text-[var(--text)]">You finished this path 🎉</div>
              <div className="mt-1 text-[12.5px] text-[var(--text-2)]">Great work — pick your next challenge and keep the streak going.</div>
              <Link href="/learn" className="mt-3 inline-flex items-center justify-center h-9 px-5 rounded-full bg-[var(--text)] text-[var(--background)] hover:bg-zinc-800 text-[13px] font-[600] shadow-sm">
                Browse other paths <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
          )}
          {completed && (
            <div className="mt-3 flex items-center gap-2 text-[13px] text-emerald-600 dark:text-emerald-400 font-[500]">
              <CheckCircle2 className="w-4 h-4" />
              <span>Lesson completed</span>
              <span className="flex items-center gap-0.5 ml-1">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              </span>
            </div>
          )}
          <div className="mt-4 flex items-center gap-3 text-[12px] text-[var(--text-2)]">
            <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {active?.duration || "—"}</span>
            <span className="flex items-center gap-1.5"><Play className="w-3.5 h-3.5" /> Video lesson</span>
            <span className="ml-auto text-[11px] font-mono text-[var(--text-3)]">{currentIndex >=0 ? currentIndex+1 : 1} / {lessons.length}</span>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
