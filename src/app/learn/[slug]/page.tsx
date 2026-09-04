"use client"
import Link from "next/link"
import * as React from "react"
import { AppShell } from "@/components/layout/app-shell"
import { VideoPlayer } from "@/components/video-player"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp, Star, ChevronRight, Clock, MessageCircle, Play, Search, CheckCircle2 } from "lucide-react"

const modules = [
  {
    title: "1. Kirish",
    subtitle: "Module 1",
    count: "0 / 103",
    collapsed: true,
    lessons: [] as any[],
  },
  {
    title: "Linux",
    subtitle: "Module 2",
    collapsed: true,
    lessons: [] as any[],
  },
  {
    title: "2. Recon (Razvedka bosqichi)",
    subtitle: "Module 3",
    expanded: true,
    lessons: [
      { title: "Recon", subtitle: "Lesson 3.1", time: "06:02", active: false },
      { title: "Amaliyot: Pentest metodologiyasi — 6 ...", subtitle: "Lesson 3.2", time: "Practice", isPractice: true, active: false },
      { title: "Subdomain-enum", subtitle: "Lesson 3.3", time: "09:59", active: false },
      { title: "Shodan & Cencys", subtitle: "Lesson 3.4", time: "04:01", active: false },
      { title: "Directory enum", subtitle: "Lesson 3.5", time: "08:04", active: false },
      { title: "Information disclosure Lab", subtitle: "Lesson 3.6", time: "04:44", active: false },
      { title: "Nmap", subtitle: "Lesson 3.7", time: "12:10", active: false },
    ],
  },
]

const pathData: Record<string, { title: string; breadcrumb: string; lessons: { title: string; subtitle: string; time: string; isPractice?: boolean }[] }> = {
  "cybersecurity-101": {
    title: "What is Cybersecurity",
    breadcrumb: "1. Intro",
    lessons: [
      { title: "What is Cybersecurity?", subtitle: "Lesson 1.1", time: "10:34" },
    ],
  },
  networking: {
    title: "Networking Fundamentals",
    breadcrumb: "1. Networking",
    lessons: [
      { title: "OSI & TCP/IP", subtitle: "Lesson 1.1", time: "08:12" },
      { title: "Subnetting", subtitle: "Lesson 1.2", time: "12:40" },
      { title: "Wireshark Basics", subtitle: "Lesson 1.3", time: "14:20" },
      { title: "Lab: Traffic Analysis", subtitle: "Lab 1.4", time: "Practice", isPractice: true },
    ],
  },
  "web-security": {
    title: "Web Application Security",
    breadcrumb: "3. Web Security",
    lessons: [
      { title: "OWASP Top 10", subtitle: "Lesson 3.1", time: "10:05" },
      { title: "SQL Injection", subtitle: "Lesson 3.2", time: "Practice", isPractice: true },
      { title: "XSS & CSRF", subtitle: "Lesson 3.3", time: "09:10" },
      { title: "SSRF & XXE", subtitle: "Lesson 3.4", time: "11:20" },
    ],
  },
  linux: {
    title: "Linux Fundamentals",
    breadcrumb: "2. Linux",
    lessons: [
      { title: "File System", subtitle: "Lesson 2.1", time: "07:30" },
      { title: "Permissions", subtitle: "Lesson 2.2", time: "09:15" },
      { title: "Lab: Privilege Escalation", subtitle: "Lab 2.3", time: "Practice", isPractice: true },
    ],
  },
}

export default function LearnInside({ params }: { params: Promise<{ slug: string }> }) {
  const resolved = React.use(params as any) as { slug: string }
  const slug = resolved?.slug || "networking"
  const data = pathData[slug] || {
    title: slug.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()),
    breadcrumb: "2. Recon (Razvedka bosqichi)",
    lessons: [
      { title: "Recon", subtitle: "Lesson 3.1", time: "06:02" },
      { title: "Amaliyot: Pentest metodologiyasi — 6 ...", subtitle: "Lesson 3.2", time: "Practice", isPractice: true },
      { title: "Subdomain-enum", subtitle: "Lesson 3.3", time: "09:59" },
      { title: "Shodan & Cencys", subtitle: "Lesson 3.4", time: "04:01" },
    ],
  }
  const [activeLesson, setActiveLesson] = React.useState(data.lessons[0]?.title || "DVWA installation")
  const [expanded, setExpanded] = React.useState(true)
  const storageKey = `aegis_lesson_${slug}_completed`
  const [completed, setCompleted] = React.useState(false)

  React.useEffect(() => {
    try { setCompleted(localStorage.getItem(storageKey) === "true") } catch {}
  }, [storageKey])

  const handleVideoEnd = () => {
    try { localStorage.setItem(storageKey, "true") } catch {}
    setCompleted(true)
  }

  // Next / Previous video logic
  const currentIndex = React.useMemo(() => data.lessons.findIndex((l: any) => l.title === activeLesson), [data.lessons, activeLesson])
  const hasNext = currentIndex >= 0 && currentIndex < data.lessons.length - 1
  const hasPrev = currentIndex > 0
  const nextLesson = hasNext ? data.lessons[currentIndex + 1] : null
  const prevLesson = hasPrev ? data.lessons[currentIndex - 1] : null
  const goNext = () => {
    if (nextLesson) {
      setActiveLesson(nextLesson.title)
      setCompleted(false)
      try { window.scrollTo({ top: 0, behavior: "smooth" }) } catch {}
    }
  }
  const goPrev = () => {
    if (prevLesson) {
      setActiveLesson(prevLesson.title)
      setCompleted(false)
      try { window.scrollTo({ top: 0, behavior: "smooth" }) } catch {}
    }
  }

  return (
    <AppShell withSidebar>
      <div className="flex min-h-[calc(100vh-56px)] bg-[var(--background)] -m-6 lg:-m-8 p-6 lg:p-8">
        <div className="max-w-[720px] mx-auto w-full">
          <div className="flex items-center gap-2 text-[12px] text-[var(--text-3)] mb-4">
            <span className="w-5 h-5 rounded-full bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center text-[10px]">◉</span>
            <span>{data.breadcrumb}</span>
            <span className="text-[var(--text-3)]">/</span>
            <span className="text-[var(--text)]">{data.title}</span>
          </div>
          <h1 className="text-[24px] font-[700] tracking-[-0.03em] text-[var(--text)]">{activeLesson || data.title}</h1>
          <p className="mt-1 text-[12px] text-[var(--text-3)]">{data.title} • {data.lessons[currentIndex]?.subtitle || data.breadcrumb} • Lesson {currentIndex >=0 ? currentIndex+1 : 1} of {data.lessons.length}</p>
          <p className="mt-2 text-[13px] text-[var(--text-2)]">This lesson covers the foundations of cybersecurity — threats, attack surfaces, defense principles, and why this field matters.</p>
          <div className="mt-6">
            <VideoPlayer key={activeLesson} src="/videos/cybersecurity-101-intro.mp4" onEnd={handleVideoEnd} />
          </div>
          {/* Next / Previous controls */}
          <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <Button
              variant="secondary"
              size="sm"
              disabled={!hasPrev}
              onClick={goPrev}
              className="h-9 gap-1.5 justify-center border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-2)] disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4 rotate-180" /> Previous
            </Button>
            <div className="hidden sm:flex flex-col items-center">
              <span className="text-[11px] tracking-widest uppercase text-[var(--text-3)]">Up next</span>
              <span className="text-[12px] font-[600] text-[var(--text)] truncate max-w-[220px]">{hasNext ? nextLesson!.title : "No more lessons"}</span>
            </div>
            <Button
              disabled={!hasNext}
              onClick={goNext}
              className="h-9 gap-1.5 justify-center bg-[var(--text)] text-[var(--background)] hover:bg-zinc-800 disabled:opacity-40"
            >
              Next video <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          {hasNext && nextLesson && (
            <button onClick={goNext} className="mt-3 w-full flex items-center justify-between p-3 rounded-[10px] border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors text-left">
              <div>
                <div className="text-[11px] font-semibold tracking-widest uppercase text-blue-700 dark:text-blue-300">Next up</div>
                <div className="text-[13px] font-[600] text-blue-900 dark:text-blue-100">{nextLesson.title} • {nextLesson.subtitle}</div>
                <div className="text-[11px] text-blue-700/70 dark:text-blue-300/70">{nextLesson.time}</div>
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
            <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {data.lessons[currentIndex]?.time || "10:34"}</span>
            <span className="flex items-center gap-1.5"><Play className="w-3.5 h-3.5" /> Video lesson</span>
            <span className="ml-auto text-[11px] font-mono text-[var(--text-3)]">{currentIndex >=0 ? currentIndex+1 : 1} / {data.lessons.length}</span>
          </div>
          <div className="mt-6 rounded-[12px] border border-[var(--border)] bg-[var(--surface)] p-5">
            <h3 className="text-[13px] font-[600] text-[var(--text)]">What you will learn</h3>
            <ul className="mt-3 space-y-2 text-[12.5px] text-[var(--text-2)]">
              <li className="flex items-start gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] mt-1.5 shrink-0" /> What cybersecurity is and why it matters</li>
              <li className="flex items-start gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] mt-1.5 shrink-0" /> Types of threats: malware, phishing, social engineering</li>
              <li className="flex items-start gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] mt-1.5 shrink-0" /> Attack surfaces and the CIA triad</li>
              <li className="flex items-start gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] mt-1.5 shrink-0" /> Careers and roles in cybersecurity</li>
            </ul>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
