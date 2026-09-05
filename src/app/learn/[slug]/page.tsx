"use client"
import Link from "next/link"
import * as React from "react"
import { use } from "react"
import { notFound } from "next/navigation"
import { AppShell } from "@/components/layout/app-shell"
import { VideoPlayer } from "@/components/video-player"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp, Star, ChevronRight, Clock, MessageCircle, Play, Search, CheckCircle2 } from "lucide-react"

type Lesson = { title: string; subtitle: string; time: string; isPractice?: boolean; src?: string; youtubeId?: string }

const knownSlugs = ["cybersecurity-101", "networking", "linux", "web", "cloud", "ad", "re", "forensics", "soc"]

const pathData: Record<string, { title: string; breadcrumb: string; lessons: Lesson[] }> = {
  "cybersecurity-101": {
    title: "What is Cybersecurity",
    breadcrumb: "1. Intro",
    lessons: [
      { title: "What is Cybersecurity?", subtitle: "Lesson 1.1", time: "10:34", src: "/videos/cybersecurity-101-intro.mp4" },
    ],
  },
  networking: {
    title: "Networking Fundamentals",
    breadcrumb: "1. Networking",
    lessons: [
      { title: "OSI & TCP/IP", subtitle: "Lesson 1.1", time: "08:12", src: "/videos/networking-1.mp4" },
      { title: "Subnetting", subtitle: "Lesson 1.2", time: "12:40", src: "/videos/networking-2.mp4" },
      { title: "Wireshark Basics", subtitle: "Lesson 1.3", time: "14:20", src: "/videos/networking-3.mp4" },
      { title: "Lab: Traffic Analysis", subtitle: "Lab 1.4", time: "Practice", isPractice: true, src: "/videos/networking-4.mp4" },
    ],
  },
  web: {
    title: "Web Application Security",
    breadcrumb: "3. Web Security",
    lessons: [
      { title: "OWASP Top 10", subtitle: "Lesson 3.1", time: "10:05", src: "/videos/web-1.mp4" },
      { title: "SQL Injection", subtitle: "Lesson 3.2", time: "Practice", isPractice: true, src: "/videos/web-2.mp4" },
      { title: "XSS & CSRF", subtitle: "Lesson 3.3", time: "09:10", src: "/videos/web-3.mp4" },
      { title: "SSRF & XXE", subtitle: "Lesson 3.4", time: "11:20", src: "/videos/web-4.mp4" },
    ],
  },
  "web-security": {
    title: "Web Application Security",
    breadcrumb: "3. Web Security",
    lessons: [
      { title: "OWASP Top 10", subtitle: "Lesson 3.1", time: "10:05", src: "/videos/web-1.mp4" },
      { title: "SQL Injection", subtitle: "Lesson 3.2", time: "Practice", isPractice: true, src: "/videos/web-2.mp4" },
      { title: "XSS & CSRF", subtitle: "Lesson 3.3", time: "09:10", src: "/videos/web-3.mp4" },
      { title: "SSRF & XXE", subtitle: "Lesson 3.4", time: "11:20", src: "/videos/web-4.mp4" },
    ],
  },
  linux: {
    title: "Linux Fundamentals",
    breadcrumb: "2. Linux",
    lessons: [
      { title: "File System", subtitle: "Lesson 2.1", time: "07:30", src: "/videos/linux-1.mp4" },
      { title: "Permissions", subtitle: "Lesson 2.2", time: "09:15", src: "/videos/linux-2.mp4" },
      { title: "Lab: Privilege Escalation", subtitle: "Lab 2.3", time: "Practice", isPractice: true, src: "/videos/linux-3.mp4" },
    ],
  },
  cloud: {
    title: "Cloud Security",
    breadcrumb: "4. Cloud",
    lessons: [
      { title: "IAM Basics", subtitle: "Lesson 4.1", time: "09:40", src: "/videos/cloud-1.mp4" },
      { title: "S3 Misconfigurations", subtitle: "Lesson 4.2", time: "11:15", src: "/videos/cloud-2.mp4" },
      { title: "Lab: Cloud Audit", subtitle: "Lab 4.3", time: "Practice", isPractice: true, src: "/videos/cloud-3.mp4" },
    ],
  },
  ad: {
    title: "Active Directory",
    breadcrumb: "5. AD",
    lessons: [
      { title: "AD Fundamentals", subtitle: "Lesson 5.1", time: "10:00", src: "/videos/ad-1.mp4" },
      { title: "Kerberoasting", subtitle: "Lesson 5.2", time: "13:20", src: "/videos/ad-2.mp4" },
      { title: "Lab: Enumeration", subtitle: "Lab 5.3", time: "Practice", isPractice: true, src: "/videos/ad-3.mp4" },
    ],
  },
  re: {
    title: "Reverse Engineering",
    breadcrumb: "6. RE",
    lessons: [
      { title: "Assembly Basics", subtitle: "Lesson 6.1", time: "12:00", src: "/videos/re-1.mp4" },
      { title: "Binary Analysis", subtitle: "Lesson 6.2", time: "14:30", src: "/videos/re-2.mp4" },
      { title: "Lab: Crackme", subtitle: "Lab 6.3", time: "Practice", isPractice: true, src: "/videos/re-3.mp4" },
    ],
  },
  forensics: {
    title: "Digital Forensics",
    breadcrumb: "7. Forensics",
    lessons: [
      { title: "Evidence Acquisition", subtitle: "Lesson 7.1", time: "08:45", src: "/videos/forensics-1.mp4" },
      { title: "Memory Analysis", subtitle: "Lesson 7.2", time: "12:10", src: "/videos/forensics-2.mp4" },
      { title: "Lab: Volatility", subtitle: "Lab 7.3", time: "Practice", isPractice: true, src: "/videos/forensics-3.mp4" },
    ],
  },
  soc: {
    title: "Security Operations",
    breadcrumb: "8. SOC",
    lessons: [
      { title: "SOC Overview", subtitle: "Lesson 8.1", time: "09:00", src: "/videos/soc-1.mp4" },
      { title: "SIEM Tuning", subtitle: "Lesson 8.2", time: "11:30", src: "/videos/soc-2.mp4" },
      { title: "Lab: Alert Triage", subtitle: "Lab 8.3", time: "Practice", isPractice: true, src: "/videos/soc-3.mp4" },
    ],
  },
}

export default function LearnInside({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)

  if (!knownSlugs.includes(slug) && !(slug in pathData)) {
    notFound()
  }

  const data = pathData[slug] || {
    title: slug.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()),
    breadcrumb: "2. Recon (Razvedka bosqichi)",
    lessons: [
      { title: "Recon", subtitle: "Lesson 3.1", time: "06:02", src: `/videos/${slug}-1.mp4` },
      { title: "Amaliyot: Pentest metodologiyasi — 6 ...", subtitle: "Lesson 3.2", time: "Practice", isPractice: true, src: `/videos/${slug}-2.mp4` },
      { title: "Subdomain-enum", subtitle: "Lesson 3.3", time: "09:59", src: `/videos/${slug}-3.mp4` },
      { title: "Shodan & Cencys", subtitle: "Lesson 3.4", time: "04:01", src: `/videos/${slug}-4.mp4` },
    ],
  }

  const [activeLesson, setActiveLesson] = React.useState(data.lessons[0]?.title || "DVWA installation")
  const [expanded, setExpanded] = React.useState(true)

  // Sync activeLesson when slug changes
  React.useEffect(() => {
    setActiveLesson(data.lessons[0]?.title || "")
  }, [slug, data.lessons])

  const storageKey = `aegis_lesson_${slug}_${activeLesson}`

  const [completed, setCompleted] = React.useState(false)

  React.useEffect(() => {
    try { setCompleted(localStorage.getItem(storageKey) === "true") } catch {}
  }, [storageKey])

  // Also sync when slug changes - reset completed check
  React.useEffect(() => {
    try {
      const key = `aegis_lesson_${slug}_${data.lessons[0]?.title || ""}`
      setCompleted(localStorage.getItem(key) === "true")
    } catch {}
  }, [slug, data.lessons])

  const handleVideoEnd = () => {
    try { localStorage.setItem(storageKey, "true") } catch {}
    setCompleted(true)
  }

  // Next / Previous video logic
  const currentIndex = React.useMemo(() => data.lessons.findIndex((l: Lesson) => l.title === activeLesson), [data.lessons, activeLesson])
  const hasNext = currentIndex >= 0 && currentIndex < data.lessons.length - 1
  const hasPrev = currentIndex > 0
  const nextLesson = hasNext ? data.lessons[currentIndex + 1] : null
  const prevLesson = hasPrev ? data.lessons[currentIndex - 1] : null
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

  const activeSrc = data.lessons[currentIndex]?.src || `/videos/${slug}-${currentIndex >=0 ? currentIndex+1 : 1}.mp4`

  return (
    <AppShell withSidebar>
      <div className="flex min-h-[calc(100vh-56px)] bg-[var(--background)] -m-6 lg:-m-8 p-6 lg:p-8">
        <div className="max-w-[720px] mx-auto w-full">
          <nav aria-label="Breadcrumb">
            <div className="flex items-center gap-2 text-[12px] text-[var(--text-3)] mb-4">
              <span className="w-5 h-5 rounded-full bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center text-[10px]">◉</span>
              <span>{data.breadcrumb}</span>
              <span className="text-[var(--text-3)]">/</span>
              <span className="text-[var(--text)]">{data.title}</span>
            </div>
          </nav>
          <h1 className="text-[24px] font-[700] tracking-[-0.03em] text-[var(--text)]">{activeLesson || data.title}</h1>
          <p className="mt-1 text-[12px] text-[var(--text-3)]">{data.title} • {data.lessons[currentIndex]?.subtitle || data.breadcrumb} • Lesson {currentIndex >=0 ? currentIndex+1 : 1} of {data.lessons.length}</p>
          <p className="mt-2 text-[13px] text-[var(--text-2)]">This lesson covers the foundations of cybersecurity — threats, attack surfaces, defense principles, and why this field matters.</p>
          <div className="mt-6">
            <VideoPlayer key={activeLesson} src={activeSrc} onEnd={handleVideoEnd} />
          </div>

          {/* Lesson list */}
          <div className="mt-6 rounded-[12px] border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
            <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-[var(--surface-2)] transition-colors" aria-expanded={expanded} aria-controls="lesson-list">
              <span className="text-[13px] font-[600] text-[var(--text)]">Lessons • {data.lessons.length}</span>
              {expanded ? <ChevronUp className="w-4 h-4 text-[var(--text-3)]" /> : <ChevronDown className="w-4 h-4 text-[var(--text-3)]" />}
            </button>
            {expanded && (
              <ul id="lesson-list" className="divide-y divide-[var(--border)] border-t border-[var(--border)]">
                {data.lessons.map((lesson, idx) => {
                  const isActive = lesson.title === activeLesson
                  return (
                    <li key={lesson.title}>
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
                            <div className="text-[11px] text-[var(--text-3)]">{lesson.subtitle} • {lesson.time}{lesson.isPractice ? " • Practice" : ""}</div>
                          </div>
                        </div>
                        <span className="ml-2 text-[11px] font-mono text-[var(--text-3)] shrink-0">{lesson.time}</span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          {/* Next / Previous controls */}
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
              <span className="text-[12px] font-[600] text-[var(--text)] truncate max-w-[220px]">{hasNext ? nextLesson!.title : "No more lessons"}</span>
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
