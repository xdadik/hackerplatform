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

export const learningPaths = [
  { id: "cybersecurity-101", name: "What is Cybersecurity", lessons: 1, duration: "50 min", level: "Beginner", progress: 0, color: "#F59E0B" },
  { id: "networking", name: "Networking", lessons: 24, duration: "18h", level: "Beginner", progress: 72, color: "#2563EB" },
  { id: "linux", name: "Linux Fundamentals", lessons: 18, duration: "12h", level: "Beginner", progress: 45, color: "#059669" },
  { id: "web", name: "Web Security", lessons: 32, duration: "28h", level: "Intermediate", progress: 72, color: "#7C3AED" },
  { id: "cloud", name: "Cloud Security", lessons: 21, duration: "20h", level: "Intermediate", progress: 12, color: "#0E7490" },
  { id: "ad", name: "Active Directory", lessons: 28, duration: "26h", level: "Advanced", progress: 0, color: "#DC2626" },
  { id: "re", name: "Reverse Engineering", lessons: 19, duration: "22h", level: "Advanced", progress: 0, color: "#EA580C" },
  { id: "forensics", name: "Digital Forensics", lessons: 16, duration: "14h", level: "Intermediate", progress: 30, color: "#0891B2" },
  { id: "soc", name: "Security Operations", lessons: 22, duration: "19h", level: "Intermediate", progress: 60, color: "#4F46E5" },
]

export const labs: Lab[] = [
  { id: "lab-1", title: "SQL Injection Fundamentals", category: "Web Security", difficulty: "Beginner", duration: "45 min", progress: 72, status: "in_progress", description: "Learn to identify and exploit SQL injection vulnerabilities in a controlled environment.", objectives: 5, participants: 12403 },
  { id: "lab-2", title: "Linux Privilege Escalation", category: "Linux", difficulty: "Intermediate", duration: "90 min", status: "not_started", description: "Enumerate and exploit misconfigurations to escalate privileges on Linux systems.", objectives: 7, participants: 8921 },
  { id: "lab-3", title: "Active Directory Enumeration", category: "Active Directory", difficulty: "Advanced", duration: "120 min", status: "not_started", description: "Map Active Directory structure and identify attack paths using BloodHound-style analysis.", objectives: 8, participants: 5432 },
  { id: "lab-4", title: "Cloud IAM Misconfiguration", category: "Cloud Security", difficulty: "Intermediate", duration: "60 min", progress: 100, status: "completed", description: "Audit AWS IAM policies and exploit overly permissive roles to access sensitive data.", objectives: 6, participants: 3421 },
  { id: "lab-5", title: "Memory Forensics with Volatility", category: "Forensics", difficulty: "Advanced", duration: "75 min", status: "not_started", description: "Analyze memory dumps to recover artifacts and detect malware presence.", objectives: 4, participants: 2891 },
  { id: "lab-6", title: "Network Traffic Analysis", category: "Network Security", difficulty: "Beginner", duration: "50 min", progress: 20, status: "in_progress", description: "Use Wireshark and tshark to analyze PCAP files and detect anomalous traffic.", objectives: 5, participants: 7123 },
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

// Real-user note: leaderboard below is mock data for local development.
// It will be replaced by GET /api/users after the backend ships.
// Leaderboard is sorted by real reputation (descending); rank is computed server-side — do not hard-code rank in UI.
export const leaderboard = [
  { rank: 1, username: "sophiachen", reputation: 9842, labs: 142, challenges: 89, avatar: "SC" },
  { rank: 2, username: "marcusreid", reputation: 9210, labs: 138, challenges: 92, avatar: "MR" },
  { rank: 3, username: "alexmorgan", reputation: 8841, labs: 124, challenges: 76, avatar: "AM" },
  { rank: 4, username: "priya_n", reputation: 8623, labs: 118, challenges: 81, avatar: "PN" },
  { rank: 5, username: "james.k", reputation: 8433, labs: 112, challenges: 74, avatar: "JK" },
  { rank: 6, username: "elenav", reputation: 8211, labs: 109, challenges: 69, avatar: "EV" },
  { rank: 7, username: "davidpark", reputation: 8023, labs: 102, challenges: 71, avatar: "DP" },
].sort((a, b) => b.reputation - a.reputation).map((row, i) => ({ ...row, rank: i + 1 }))
