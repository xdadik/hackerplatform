import { getYoutubeEmbedUrl, getYoutubeThumbnail } from "./youtube"

export type Lab = {
  id: string
  title: string
  category: string
  difficulty: "Beginner" | "Intermediate" | "Advanced" | "Expert"
  duration: string
  progress?: number
  status: "not_started" | "in_progress" | "completed"
  description: string
  objectives: number
  participants: number
  youtubeId?: string | null
}

export type Challenge = {
  id: string
  name: string
  category: string
  difficulty: "Easy" | "Medium" | "Hard" | "Insane"
  points: number
  solves: number
  tags: string[]
  status: "solved" | "attempted" | "new"
}

export type Course = {
  id: string
  title: string
  path: string
  level: string
  lessons: number
  duration: string
  progress: number
  description: string
}

export type LearningPath = {
  id: string
  name: string
  lessons: number
  duration: string
  level: string
  progress: number
  color: string
  youtubeId?: string | null
}

export type Video = {
  id: string
  title: string
  description: string
  youtubeId: string
  duration: string
  category: string
  labId?: string | null
  pathId?: string | null
}

export const learningPaths: LearningPath[] = [
  { id: "cybersecurity-101", name: "What is Cybersecurity", lessons: 1, duration: "10 min", level: "Beginner", progress: 0, color: "#F59E0B", youtubeId: "dQw4w9WgXcQ" },
  { id: "networking", name: "Networking", lessons: 24, duration: "18h", level: "Beginner", progress: 72, color: "#2563EB", youtubeId: "qiQR5rTSshw" },
  { id: "linux", name: "Linux Fundamentals", lessons: 18, duration: "12h", level: "Beginner", progress: 45, color: "#059669", youtubeId: "ZtqBQ68cfJc" },
  { id: "web", name: "Web Security", lessons: 32, duration: "28h", level: "Intermediate", progress: 72, color: "#7C3AED", youtubeId: "2TofuQMN4_w" },
  { id: "cloud", name: "Cloud Security", lessons: 21, duration: "20h", level: "Intermediate", progress: 12, color: "#0E7490", youtubeId: "3Od1B_PW00M" },
  { id: "ad", name: "Active Directory", lessons: 28, duration: "26h", level: "Advanced", progress: 0, color: "#DC2626", youtubeId: "5T8y4L8L0pA" },
  { id: "re", name: "Reverse Engineering", lessons: 19, duration: "22h", level: "Advanced", progress: 0, color: "#EA580C", youtubeId: "7aC2hWv4u9I" },
  { id: "forensics", name: "Digital Forensics", lessons: 16, duration: "14h", level: "Intermediate", progress: 30, color: "#0891B2", youtubeId: "9bZkp7q19f0" },
  { id: "soc", name: "Security Operations", lessons: 22, duration: "19h", level: "Intermediate", progress: 60, color: "#4F46E5", youtubeId: "kJQP7kiw5Fk" },
]

export const labs: Lab[] = [
  { id: "lab-1", title: "SQL Injection Fundamentals", category: "Web Security", difficulty: "Beginner", duration: "45 min", progress: 72, status: "in_progress", description: "Learn to identify and exploit SQL injection vulnerabilities in a controlled environment.", objectives: 5, participants: 12403, youtubeId: "2TofuQMN4_w" },
  { id: "lab-2", title: "Linux Privilege Escalation", category: "Linux", difficulty: "Intermediate", duration: "90 min", status: "not_started", description: "Enumerate and exploit misconfigurations to escalate privileges on Linux systems.", objectives: 7, participants: 8921, youtubeId: "ZtqBQ68cfJc" },
  { id: "lab-3", title: "Active Directory Enumeration", category: "Active Directory", difficulty: "Advanced", duration: "120 min", status: "not_started", description: "Map Active Directory structure and identify attack paths using BloodHound-style analysis.", objectives: 8, participants: 5432, youtubeId: "5T8y4L8L0pA" },
  { id: "lab-4", title: "Cloud IAM Misconfiguration", category: "Cloud Security", difficulty: "Intermediate", duration: "60 min", status: "not_started", description: "Audit AWS IAM policies and exploit overly permissive roles to access sensitive data.", objectives: 6, participants: 3421, youtubeId: "3Od1B_PW00M" },
  { id: "lab-5", title: "Memory Forensics with Volatility", category: "Forensics", difficulty: "Advanced", duration: "75 min", status: "not_started", description: "Analyze memory dumps to recover artifacts and detect malware presence.", objectives: 4, participants: 2891, youtubeId: "9bZkp7q19f0" },
  { id: "lab-6", title: "Network Traffic Analysis", category: "Network Security", difficulty: "Beginner", duration: "50 min", progress: 20, status: "in_progress", description: "Use Wireshark and tshark to analyze PCAP files and detect anomalous traffic.", objectives: 5, participants: 7123, youtubeId: "qiQR5rTSshw" },
]

export const challenges: Challenge[] = [
  { id: "ch-1", name: "Auth Bypass", category: "Web", difficulty: "Easy", points: 100, solves: 3421, tags: ["auth", "jwt"], status: "solved" },
  { id: "ch-2", name: "Heap Overflow 101", category: "Pwn", difficulty: "Medium", points: 250, solves: 892, tags: ["heap", "libc"], status: "new" },
  { id: "ch-3", name: "RSA Common Modulus", category: "Crypto", difficulty: "Medium", points: 300, solves: 543, tags: ["rsa", "math"], status: "attempted" },
  { id: "ch-4", name: "Malware Unpacking", category: "Reverse", difficulty: "Hard", points: 450, solves: 212, tags: ["malware", "x86"], status: "new" },
  { id: "ch-5", name: "DFIR Timeline", category: "Forensics", difficulty: "Hard", points: 400, solves: 334, tags: ["timeline", "evtx"], status: "new" },
  { id: "ch-6", name: "Cloud SSRF to Metadata", category: "Cloud", difficulty: "Medium", points: 275, solves: 721, tags: ["ssrf", "aws"], status: "new" },
  { id: "ch-7", name: "OSINT - The Vanishing Vendor", category: "OSINT", difficulty: "Easy", points: 150, solves: 1823, tags: ["osint", "recon"], status: "solved" },
  { id: "ch-8", name: "SOC Alert Triage", category: "Blue Team", difficulty: "Medium", points: 200, solves: 1102, tags: ["siem", "detection"], status: "new" },
]

export const skillProgress = [
  { name: "Web Security", level: "Intermediate", progress: 72, next: "Advanced" },
  { name: "Networking", level: "Beginner", progress: 45, next: "Intermediate" },
  { name: "Linux", level: "Intermediate", progress: 68, next: "Advanced" },
  { name: "Cloud Security", level: "Beginner", progress: 22, next: "Intermediate" },
  { name: "Reverse Engineering", level: "Beginner", progress: 12, next: "Intermediate" },
]

// empty until api ready
export const leaderboard: { rank: number; username: string; reputation: number; labs: number; challenges: number; avatar: string }[] = []

// ---------------------------------------------------------------------------
// Video catalogue – aggregates lab/path videos with mock entries for the API
// ---------------------------------------------------------------------------

export const videos: Video[] = [
  ...labs.filter(l => l.youtubeId).map(l => ({
    id: `video-${l.id}`,
    title: l.title,
    description: l.description,
    youtubeId: l.youtubeId!,
    duration: l.duration,
    category: l.category,
    labId: l.id,
    pathId: null,
  })),
  ...learningPaths.filter(p => p.youtubeId).map(p => ({
    id: `video-path-${p.id}`,
    title: p.name,
    description: `${p.name} — ${p.lessons} lessons • ${p.duration}`,
    youtubeId: p.youtubeId!,
    duration: p.duration,
    category: p.level,
    labId: null,
    pathId: p.id,
  })),
]

// ---------------------------------------------------------------------------
// Helpers – keep existing exports compatible, add new accessors
// ---------------------------------------------------------------------------

export function getLabById(id: string): Lab | undefined {
  return labs.find(l => l.id === id)
}

export function getChallengeById(id: string): Challenge | undefined {
  return challenges.find(c => c.id === id)
}

export function getLearningPathById(id: string): LearningPath | undefined {
  return learningPaths.find(p => p.id === id)
}

export function getVideoById(id: string): Video | undefined {
  return videos.find(v => v.id === id)
}

export function getVideoByYoutubeId(youtubeId: string): Video | undefined {
  return videos.find(v => v.youtubeId === youtubeId)
}

export function getLabVideos(labId: string): Video[] {
  return videos.filter(v => v.labId === labId)
}

export function getPathVideos(pathId: string): Video[] {
  return videos.filter(v => v.pathId === pathId)
}

/** Enriched view with embed/thumbnail URLs – convenient for player components. */
export function getVideoWithUrls(id: string) {
  const v = getVideoById(id)
  if (!v) return undefined
  return {
    ...v,
    embedUrl: getYoutubeEmbedUrl(v.youtubeId),
    thumbnail: getYoutubeThumbnail(v.youtubeId),
  }
}
