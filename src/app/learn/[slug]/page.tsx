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
          <h1 className="text-[24px] font-[700] tracking-[-0.03em] text-[var(--text)]">{data.title}</h1>
          <p className="mt-2 text-[13px] text-[var(--text-2)]">This lesson covers the foundations of cybersecurity — threats, attack surfaces, defense principles, and why this field matters.</p>
          <div className="mt-6">
            <VideoPlayer src="/videos/cybersecurity-101-intro.mp4" onEnd={handleVideoEnd} />
          </div>
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
            <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> 10:34</span>
            <span className="flex items-center gap-1.5"><Play className="w-3.5 h-3.5" /> Video lesson</span>
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
