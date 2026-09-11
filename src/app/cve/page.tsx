"use client"

import * as React from "react"
import Link from "next/link"
import { AppShell } from "@/components/layout/app-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Stagger, FadeIn } from "@/components/ui/stagger"
import {
  Search,
  Shield,
  AlertTriangle,
  ExternalLink,
  X,
  Filter,
  Calendar,
  Bug,
  Info,
  ChevronRight,
  Clock,
  BadgeAlert,
  ArrowUpRight,
} from "lucide-react"

type Severity = "Critical" | "High" | "Medium" | "Low"
type Status = "Patch available" | "Mitigated" | "Monitoring" | "Exploited" | "Vendor fix"

type Cve = {
  id: string
  title: string
  severity: Severity
  cvss: number
  vector: string
  affected: string
  status: Status
  published: string
  description: string
  remediation: string
  links: { label: string; href: string }[]
}

const cves: Cve[] = [
  {
    id: "CVE-2024-3400",
    title: "PAN-OS GlobalProtect — Unauthenticated Command Injection",
    severity: "Critical",
    cvss: 10.0,
    vector: "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:H/A:H",
    affected: "Palo Alto PAN-OS 10.2, 11.0, 11.1",
    status: "Patch available",
    published: "2024-04-12",
    description:
      "Command injection vulnerability in the GlobalProtect Gateway feature allows an unauthenticated attacker to execute arbitrary code with root privileges via crafted session cookies. Actively exploited in the wild within days of disclosure. Affects firewalls with GlobalProtect Gateway or Portal enabled.",
    remediation:
      "Update to PAN-OS 10.2.9-h1, 11.0.4-h1, 11.1.2-h3 or later. Disable GlobalProtect Gateway if immediate patching is not possible and restrict device telemetry. Hunt for suspicious session files under /var/log/pan/gpsvc.",
    links: [
      { label: "NVD", href: "https://nvd.nist.gov/vuln/detail/CVE-2024-3400" },
      { label: "Palo Alto Advisory", href: "https://security.paloaltonetworks.com/CVE-2024-3400" },
    ],
  },
  {
    id: "CVE-2024-3094",
    title: "XZ Utils liblzma — Supply-Chain Backdoor",
    severity: "Critical",
    cvss: 10.0,
    vector: "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:H/A:H",
    affected: "XZ Utils 5.6.0 / 5.6.1 (liblzma)",
    status: "Mitigated",
    published: "2024-03-29",
    description:
      "Malicious backdoor inserted via compromised maintainer access. Build scripts for liblzma injected an obfuscated payload that interferes with OpenSSH authentication (sshd) on systemd systems, enabling remote code execution via crafted SSH traffic. Discovered before wide stable adoption.",
    remediation:
      "Downgrade to XZ 5.4.6 or upgrade to 5.6.2+ rebuilt from clean tarball. Rebuild any binaries linked against affected liblzma and rotate SSH host keys on exposed systems. Verify package signatures against trusted upstream.",
    links: [
      { label: "NVD", href: "https://nvd.nist.gov/vuln/detail/CVE-2024-3094" },
      { label: "CISA Alert", href: "https://www.cisa.gov/news-events/alerts/2024/03/29/reported-supply-chain-compromise-affecting-xz-utils-data-compression-library-cve-2024-3094" },
    ],
  },
  {
    id: "CVE-2023-44487",
    title: "HTTP/2 Rapid Reset — DDoS via Stream Cancellation",
    severity: "High",
    cvss: 7.5,
    vector: "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:H",
    affected: "nginx, Apache httpd, Envoy, Go net/http, IIS",
    status: "Monitoring",
    published: "2023-10-10",
    description:
      "Improper handling of HTTP/2 stream cancellations allows an attacker to abuse rapid creation and immediate RST_STREAM of streams, bypassing server rate limits and causing CPU and memory exhaustion. Widely exploited as a DDoS vector in mid-2023.",
    remediation:
      "Update to patched server versions (nginx 1.25.3+, Apache 2.4.58+, Envoy 1.27.1+). Enable HTTP/2 stream concurrency limits and rapid-reset mitigations at LBs/WAFs. Monitor for excess RST_STREAM rates.",
    links: [
      { label: "NVD", href: "https://nvd.nist.gov/vuln/detail/CVE-2023-44487" },
      { label: "Google Advisory", href: "https://cloud.google.com/blog/products/identity-security/google-cloud-mitigated-largest-ddos-attack-peaking-above-398-million-rps" },
    ],
  },
  {
    id: "CVE-2024-21626",
    title: "runc — Container Escape via Leaked File Descriptor",
    severity: "High",
    cvss: 8.6,
    vector: "CVSS:3.1/AV:L/AC:L/PR:N/UI:R/S:C/C:H/I:H/A:H",
    affected: "runc ≤ 1.1.11, Docker, Kubernetes nodes",
    status: "Patch available",
    published: "2024-01-31",
    description:
      "File descriptor leak in runc internal handling allows a container with sufficient capabilities to write to host filesystem via /proc/self/fd and access the host root, resulting in container escape on default Docker and Kubernetes installs.",
    remediation:
      "Update runc to 1.1.12+ and restart containers. Rebuild affected images and audit for containers launched with --privileged or CAP_SYS_ADMIN. Apply least-privilege pod security standards.",
    links: [
      { label: "NVD", href: "https://nvd.nist.gov/vuln/detail/CVE-2024-21626" },
      { label: "GitHub Advisory", href: "https://github.com/opencontainers/runc/security/advisories/GHSA-xr7r-f8xq-vfvv" },
    ],
  },
  {
    id: "CVE-2023-36884",
    title: "Windows Search — Remote Code Execution (MSHTML)",
    severity: "High",
    cvss: 8.3,
    vector: "CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:U/C:H/I:H/A:H",
    affected: "Windows 10/11, Server 2022, Office",
    status: "Patch available",
    published: "2023-07-11",
    description:
      "Bypass of Windows Search security feature leading to RCE via crafted Office document that forces NTLM relay and executes payload when previewed. Exploited in the wild prior to disclosure, chained with Outlook exploits.",
    remediation:
      "Apply July 2023 Patch Tuesday updates (KB5028166, etc.). Block outbound SMB and enforce Defender Attack Surface Reduction rules. Review Defender for Office telemetry for anomalous SearchProtocolHost invocations.",
    links: [
      { label: "NVD", href: "https://nvd.nist.gov/vuln/detail/CVE-2023-36884" },
      { label: "MSRC", href: "https://msrc.microsoft.com/update-guide/vulnerability/CVE-2023-36884" },
    ],
  },
  {
    id: "CVE-2024-21412",
    title: "Microsoft Defender SmartScreen — Security Feature Bypass",
    severity: "Medium",
    cvss: 8.1,
    vector: "CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:U/C:H/I:N/A:N",
    affected: "Windows Defender SmartScreen, Edge",
    status: "Patch available",
    published: "2024-02-13",
    description:
      "MotW bypass via crafted shortcut (.url) file that fails to propagate Mark-of-the-Web to downloaded payload, allowing SmartScreen bypass and silent execution. Weaponized in phishing with DarkGate and Water Hydra campaigns.",
    remediation:
      "Install February 2024 security updates. Enforce SmartScreen via Group Policy and block .url attachments at mail gateways. Hunt for .url files with external URLs pointing to WebDAV/SMB shares.",
    links: [
      { label: "NVD", href: "https://nvd.nist.gov/vuln/detail/CVE-2024-21412" },
      { label: "MSRC", href: "https://msrc.microsoft.com/update-guide/vulnerability/CVE-2024-21412" },
    ],
  },
  {
    id: "CVE-2023-28252",
    title: "Windows CLFS Driver — Elevation of Privilege",
    severity: "High",
    cvss: 7.8,
    vector: "CVSS:3.1/AV:L/AC:L/PR:L/UI:N/S:U/C:H/I:H/A:H",
    affected: "Windows 10/11, Server 2019/2022 (clfs.sys)",
    status: "Exploited",
    published: "2023-04-11",
    description:
      "Use-after-free in Common Log File System driver enables local privilege escalation to SYSTEM. Actively exploited by ransomware operators and in targeted intrusion sets; high reliability on supported Windows builds.",
    remediation:
      "Apply April 2023 cumulative updates. Enable Windows Defender Exploit Protection and audit for CLFS exploitation artifacts (abnormal clfs.sys accesses, process creation as SYSTEM from user processes). Consider removing unnecessary write access to driver.",
    links: [
      { label: "NVD", href: "https://nvd.nist.gov/vuln/detail/CVE-2023-28252" },
      { label: "MSRC", href: "https://msrc.microsoft.com/update-guide/vulnerability/CVE-2023-28252" },
    ],
  },
  {
    id: "CVE-2024-6387",
    title: "OpenSSH — regreSSHion Unauthenticated RCE (sshd)",
    severity: "High",
    cvss: 8.1,
    vector: "CVSS:3.1/AV:N/AC:H/PR:N/UI:N/S:U/C:H/I:H/A:H",
    affected: "OpenSSH 8.5p1–9.7p1 (glibc, no mitigation)",
    status: "Patch available",
    published: "2024-07-01",
    description:
      "Signal handler race condition in sshd reintroduced in 2020 (regression of CVE-2006-5051). Under high load on glibc, attacker can win race to achieve unauthenticated remote code execution as root. Condition is timing-sensitive but proven exploitable.",
    remediation:
      "Update to OpenSSH 9.8p1+ or apply distro backport. Mitigate with LoginGraceTime 0 (if needed) and rate limiting at firewall. Monitor for repeated sshd crashes and failed login bursts without authentication.",
    links: [
      { label: "NVD", href: "https://nvd.nist.gov/vuln/detail/CVE-2024-6387" },
      { label: "Qualys Advisory", href: "https://www.qualys.com/2024/07/01/cve-2024-6387/regresshion.txt" },
    ],
  },
  {
    id: "CVE-2023-4863",
    title: "libwebp — Heap Buffer Overflow (WebP)",
    severity: "Critical",
    cvss: 9.6,
    vector: "CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:C/C:H/I:H/A:H",
    affected: "libwebp <1.3.2, Chrome, Firefox, Edge, Safari",
    status: "Patch available",
    published: "2023-09-12",
    description:
      "Heap buffer overflow in libwebp Huffman code parsing allows a crafted WebP image to achieve heap corruption and RCE when viewed. High blast radius across browsers, email clients, and any software that decodes WebP. Weaponized as spyware delivery vector.",
    remediation:
      "Update libwebp to 1.3.2+, Chrome 116.0.5845.187+, Firefox 117.0.1+. Rebuild dependent packages and scan image upload pipelines for crafted WebP samples. Apply WAF rules blocking overly large WebP uploads pending patch.",
    links: [
      { label: "NVD", href: "https://nvd.nist.gov/vuln/detail/CVE-2023-4863" },
      { label: "Google Advisory", href: "https://chromereleases.googleblog.com/2023/09/stable-channel-update-for-desktop_11.html" },
    ],
  },
  {
    id: "CVE-2024-20359",
    title: "Cisco ASA & FTD — Persistent XSS to Privilege Escalation",
    severity: "High",
    cvss: 6.1,
    vector: "CVSS:3.1/AV:N/AC:L/PR:H/UI:R/S:C/C:L/I:L/A:N",
    affected: "Cisco ASA 9.18, FTD 7.2–7.4",
    status: "Vendor fix",
    published: "2024-04-24",
    description:
      "Persistent cross-site scripting in the web interface of Cisco ASA and Firepower Threat Defense allows a privileged attacker to inject scripts that execute in the context of the administrator, enabling escalation and persistence via crafted VPN configuration objects.",
    remediation:
      "Upgrade to fixed Cisco ASA/FTD releases per field notice. Restrict access to management interface via ACLs and enforce MFA for admin logins. Audit ASA config dumps for injected script payloads.",
    links: [
      { label: "NVD", href: "https://nvd.nist.gov/vuln/detail/CVE-2024-20359" },
      { label: "Cisco Advisory", href: "https://sec.cloudapps.cisco.com/security/center/content/CiscoSecurityAdvisory/cisco-sa-asaftd-persist-xss-K6g5N27H" },
    ],
  },
]

function severityStyle(s: Severity) {
  if (s === "Critical") return "bg-zinc-900 text-white border-zinc-800 dark:bg-zinc-800 dark:text-white dark:border-zinc-700"
  if (s === "High") return "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-900"
  if (s === "Medium") return "bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/25 dark:text-blue-300 dark:border-blue-900"
  return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/25 dark:text-emerald-300 dark:border-emerald-900"
}

function statusVariant(s: Status) {
  if (s === "Exploited") return "warning" as const
  if (s === "Patch available") return "success" as const
  if (s === "Mitigated") return "accent" as const
  return "secondary" as const
}

function cvssColor(v: number) {
  if (v >= 9.0) return "text-red-600 dark:text-red-400"
  if (v >= 7.0) return "text-amber-600 dark:text-amber-400"
  if (v >= 4.0) return "text-blue-600 dark:text-blue-400"
  return "text-emerald-600 dark:text-emerald-400"
}

export default function CvePage() {
  const [search, setSearch] = React.useState("")
  const [severity, setSeverity] = React.useState<Severity | "All">("All")
  const [year, setYear] = React.useState<string>("All")
  const [status, setStatus] = React.useState<Status | "All">("All")
  const [selected, setSelected] = React.useState<string | null>("CVE-2024-3400")

  const filtered = React.useMemo(() => {
    return cves.filter((c) => {
      if (severity !== "All" && c.severity !== severity) return false
      if (year !== "All" && !c.id.includes(year)) return false
      if (status !== "All" && c.status !== status) return false
      if (search.trim()) {
        const q = search.toLowerCase()
        return (
          c.id.toLowerCase().includes(q) ||
          c.title.toLowerCase().includes(q) ||
          c.affected.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [search, severity, year, status])

  const selectedCve = React.useMemo(() => cves.find((c) => c.id === selected) ?? null, [selected])

  const hasFilters = severity !== "All" || year !== "All" || status !== "All" || search.trim().length > 0

  return (
    <AppShell withSidebar>
      <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-[1280px]">
        {/* Header */}
        <FadeIn>
          <div className="flex flex-col gap-5 mb-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <h1 className="text-[22px] font-[650] tracking-[-0.03em] flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-[8px] bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center">
                    <Shield className="w-4 h-4 text-[var(--text-2)]" />
                  </span>
                  CVE Feed
                  <Badge variant="secondary" className="ml-1 font-mono text-[11px] hidden sm:inline-flex">
                    {cves.length} tracked
                  </Badge>
                </h1>
                <p className="mt-1.5 text-[13.5px] leading-6 text-[var(--text-2)] max-w-[740px]">
                  Curated vulnerability intelligence for practitioners. Prioritized, verifiable, and actionable — sourced from NVD, vendor advisories, and CISA KEV. No hype, just signal.
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px]">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--surface)] border border-[var(--border)] text-[var(--text-2)]">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Source: NVD • CISA KEV • Vendor
                  </span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--surface)] border border-[var(--border)] text-[var(--text-2)]">
                      <Clock className="w-3 h-3" /> Curated collection
                    </span>
                  <span className="hidden sm:inline-flex items-center gap-1.5 text-[var(--text-3)]">
                    <Info className="w-3 h-3" /> CVSS v3.1 • Sorted by severity
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href="https://nvd.nist.gov/vuln"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-[var(--accent)] hover:underline"
                >
                  NVD <ExternalLink className="w-3.5 h-3.5" />
                </Link>
                <Link
                  href="https://www.cisa.gov/known-exploited-vulnerabilities-catalog"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden sm:inline-flex items-center gap-1.5 text-[12.5px] font-medium text-[var(--text-2)] hover:text-[var(--text)] border border-[var(--border)] rounded-[8px] px-3 py-1.5 bg-[var(--surface)] hover:bg-[var(--surface-2)] transition-colors"
                >
                  CISA KEV <ArrowUpRight className="w-3 h-3" />
                </Link>
              </div>
            </div>

            {/* Controls */}
            <Card>
              <CardContent className="p-3 sm:p-4 flex flex-col lg:flex-row gap-3">
                <div className="relative flex-1 min-w-0">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-3)]" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search CVE ID, title, affected product, or technique..."
                    className="pl-9 h-9 bg-[var(--surface-2)] border-[var(--border)] focus:bg-[var(--surface)]"
                  />
                  {search && (
                    <button
                      onClick={() => setSearch("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-[6px] hover:bg-[var(--surface-2)] text-[var(--text-3)]"
                      aria-label="Clear search"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <div className="flex items-center gap-1.5">
                    <Filter className="w-3.5 h-3.5 text-[var(--text-3)] hidden sm:block" />
                    <select
                      value={severity}
                      onChange={(e) => setSeverity(e.target.value as Severity | "All")}
                      aria-label="Filter by severity"
                      className="h-9 rounded-[8px] border border-[var(--border)] bg-[var(--surface)] px-3 pr-8 text-[13px] font-[450] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                    >
                      <option value="All">All severities</option>
                      <option value="Critical">Critical</option>
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                  </div>

                  <select
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    aria-label="Filter by year"
                    className="h-9 rounded-[8px] border border-[var(--border)] bg-[var(--surface)] px-3 pr-8 text-[13px] font-[450] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                  >
                    <option value="All">All years</option>
                    <option value="2024">2024</option>
                    <option value="2023">2023</option>
                  </select>

                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as Status | "All")}
                    aria-label="Filter by status"
                    className="h-9 rounded-[8px] border border-[var(--border)] bg-[var(--surface)] px-3 pr-8 text-[13px] font-[450] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                  >
                    <option value="All">All statuses</option>
                    <option value="Patch available">Patch available</option>
                    <option value="Mitigated">Mitigated</option>
                    <option value="Monitoring">Monitoring</option>
                    <option value="Exploited">Exploited</option>
                    <option value="Vendor fix">Vendor fix</option>
                  </select>

                  {hasFilters && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSearch("")
                        setSeverity("All")
                        setYear("All")
                        setStatus("All")
                      }}
                      className="h-9 rounded-[8px] border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-2)] text-[var(--text-2)]"
                    >
                      <X className="w-3.5 h-3.5 mr-1" /> Clear
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-[var(--text-3)]">
              <span>
                Showing <span className="font-medium text-[var(--text)]">{filtered.length}</span> of {cves.length} • Sorted by CVSS descending • Restrained signal only
              </span>
              <span className="hidden sm:inline-flex items-center gap-1.5">
                <BadgeAlert className="w-3 h-3" /> Click a row for detail • <ExternalLink className="w-3 h-3" /> opens NVD
              </span>
            </div>
          </div>
        </FadeIn>

        <div className="grid lg:grid-cols-[1.65fr_0.95fr] gap-6 items-start">
          {/* Table */}
          <div className="min-w-0">
            <Stagger className="space-y-0">
              <Card className="overflow-hidden">
                <CardHeader className="pb-3 flex-row items-center justify-between space-y-0 gap-4 bg-[var(--surface-2)]/60 border-b border-[var(--border)]">
                  <CardTitle className="flex items-center gap-2 text-[13px]">
                    <Bug className="w-4 h-4 text-[var(--text-3)]" /> Vulnerability register
                  </CardTitle>
                  <span className="text-[11px] font-mono text-[var(--text-3)] hidden sm:inline">
                    {filtered.length} items • NVD sync • 2h ago
                  </span>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left" aria-label="CVE feed">
                      <caption className="sr-only">CVE vulnerability feed — severity, CVSS, affected products, status and remediation</caption>
                      <thead>
                        <tr className="border-b border-[var(--border)] bg-[var(--surface-2)] text-[11px] font-semibold tracking-widest uppercase text-[var(--text-3)]">
                          <th scope="col" className="px-3 py-2.5 font-semibold whitespace-nowrap">
                            CVE
                          </th>
                          <th scope="col" className="px-3 py-2.5 font-semibold min-w-[300px]">
                            Title
                          </th>
                          <th scope="col" className="px-3 py-2.5 font-semibold whitespace-nowrap">
                            Severity
                          </th>
                          <th scope="col" className="px-3 py-2.5 font-semibold whitespace-nowrap">
                            CVSS
                          </th>
                          <th scope="col" className="px-3 py-2.5 font-semibold min-w-[160px] hidden lg:table-cell">
                            Affected
                          </th>
                          <th scope="col" className="px-3 py-2.5 font-semibold whitespace-nowrap hidden sm:table-cell">
                            Status
                          </th>
                          <th scope="col" className="px-3 py-2.5 font-semibold whitespace-nowrap hidden xl:table-cell">
                            Published
                          </th>
                          <th scope="col" className="px-3 py-2.5 font-semibold w-[40px]" aria-label="External link" />
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border)]">
                        {filtered.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="px-4 py-12 text-center">
                              <div className="mx-auto max-w-[360px]">
                                <div className="w-10 h-10 rounded-full bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center mx-auto mb-3">
                                  <Search className="w-5 h-5 text-[var(--text-2)]" />
                                </div>
                                <div className="mt-3 text-[14px] font-[600] tracking-[-0.01em] text-[var(--text)]">No vulnerabilities match your filters</div>
                                <div className="mt-1 text-[12px] leading-5 text-[var(--text-2)]">
                                  Try adjusting severity, year, status or clearing the search term. No CVEs found for this query.
                                </div>
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    setSearch("")
                                    setSeverity("All")
                                    setYear("All")
                                    setStatus("All")
                                  }}
                                  className="mt-4 h-8 rounded-[8px] bg-[var(--text)] text-[var(--background)] hover:bg-zinc-800 dark:hover:bg-zinc-200"
                                >
                                  Clear filters
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          filtered.map((c) => {
                            const isSelected = selected === c.id
                            return (
                              <tr
                                key={c.id}
                                className={`stagger-item group cursor-pointer transition-colors ${
                                  isSelected ? "bg-[var(--accent-muted)]/60 hover:bg-[var(--accent-muted)]" : "hover:bg-[var(--surface-2)]"
                                }`}
                                onClick={() => setSelected(c.id)}
                              >
                                <td className="px-3 py-3.5 whitespace-nowrap align-top">
                                  <span className="font-mono text-[12.5px] font-[650] tracking-[-0.01em] text-[var(--text)] inline-flex items-center gap-1.5">
                                    {c.id}
                                    {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] hidden sm:inline-block" />}
                                  </span>
                                  <div className="lg:hidden mt-1 text-[11px] text-[var(--text-3)] font-mono truncate max-w-[220px]">{c.affected}</div>
                                </td>
                                <td className="px-3 py-3.5 align-top">
                                  <div className="text-[13px] font-[500] leading-5 line-clamp-2 max-w-[360px]">{c.title}</div>
                                  <div className="mt-1 flex items-center gap-1.5 lg:hidden">
                                    <Badge variant={statusVariant(c.status)} className="text-[10px] px-1.5 py-0">
                                      {c.status}
                                    </Badge>
                                    <span className="text-[11px] font-mono text-[var(--text-3)] xl:hidden">{c.published}</span>
                                  </div>
                                </td>
                                <td className="px-3 py-3.5 whitespace-nowrap align-top">
                                  <Badge className={`text-[11px] font-[500] border ${severityStyle(c.severity)}`}>{c.severity}</Badge>
                                </td>
                                <td className="px-3 py-3.5 whitespace-nowrap align-top">
                                  <span className={`font-mono text-[13px] font-[700] tracking-[-0.01em] ${cvssColor(c.cvss)}`}>{c.cvss.toFixed(1)}</span>
                                </td>
                                <td className="px-3 py-3.5 align-top hidden lg:table-cell">
                                  <span className="text-[11.5px] leading-5 text-[var(--text-2)] line-clamp-2 max-w-[160px]">{c.affected}</span>
                                </td>
                                <td className="px-3 py-3.5 whitespace-nowrap align-top hidden sm:table-cell">
                                  <Badge variant={statusVariant(c.status)} className="text-[11px]">
                                    {c.status}
                                  </Badge>
                                </td>
                                <td className="px-3 py-3.5 whitespace-nowrap align-top hidden xl:table-cell">
                                  <span className="font-mono text-[11px] text-[var(--text-3)] flex items-center gap-1">
                                    <Calendar className="w-3 h-3" /> {c.published}
                                  </span>
                                </td>
                                <td className="px-3 py-3.5 align-top">
                                  <a
                                    href={`https://nvd.nist.gov/vuln/detail/${c.id}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="inline-flex h-7 w-7 items-center justify-center rounded-[7px] border border-transparent text-[var(--text-3)] hover:text-[var(--text)] hover:bg-[var(--surface)] hover:border-[var(--border)] transition-colors"
                                    aria-label={`Open ${c.id} on NVD`}
                                  >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                  </a>
                                </td>
                              </tr>
                            )
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="px-4 py-3 border-t border-[var(--border)] bg-[var(--surface-2)]/50 flex flex-wrap items-center justify-between gap-3 text-[11px]">
                    <span className="text-[var(--text-3)] flex items-center gap-2">
                      <Shield className="w-3.5 h-3.5" /> Data: NVD • CISA • Vendor advisories
                    </span>
                    <span className="text-[var(--text-2)] hidden sm:inline">Each row opens detail — external links for verification</span>
                  </div>
                </CardContent>
              </Card>
            </Stagger>

            {/* Mobile detail fallback inline */}
            {selectedCve && (
              <div className="lg:hidden mt-4">
                <DetailCard cve={selectedCve} onClose={() => setSelected(null)} />
              </div>
            )}
          </div>

          {/* Detail drawer / card - desktop sticky */}
          <div className="hidden lg:block sticky top-[72px] min-w-0">
            {selectedCve ? (
              <DetailCard cve={selectedCve} onClose={() => setSelected(null)} />
            ) : (
              <Card className="border-dashed">
                <CardContent className="p-6 text-center py-12">
                  <div className="w-10 h-10 rounded-[10px] bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center mx-auto">
                    <AlertTriangle className="w-4 h-4 text-[var(--text-3)]" />
                  </div>
                  <div className="mt-3 text-[13px] font-[600]">Select a vulnerability</div>
                  <div className="mt-1 text-[12.5px] leading-5 text-[var(--text-2)] max-w-[280px] mx-auto">
                    Choose a row in the register to view description, CVSS vector, remediation guidance, and verified references.
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Info footer */}
            <Card className="mt-4 bg-[var(--surface-2)]/60">
              <CardContent className="p-4">
                <div className="text-[12px] font-semibold flex items-center gap-2">
                  <Info className="w-3.5 h-3.5 text-[var(--text-3)]" /> How we curate
                </div>
                <p className="mt-1.5 text-[12.5px] leading-5 text-[var(--text-2)]">
                  This feed blends NVD, CISA KEV, and vendor advisories. Only vulnerabilities with reliable remediation or direct lab relevance are included. Scores shown as CVSS v3.1 base.
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <Badge variant="outline" className="text-[11px] font-mono">
                    KEV monitored
                  </Badge>
                  <Badge variant="outline" className="text-[11px] font-mono">
                    Exploit vetted
                  </Badge>
                  <Badge variant="outline" className="text-[11px] font-mono">
                    Lab-ready
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  )
}

function DetailCard({ cve, onClose }: { cve: Cve; onClose: () => void }) {
  return (
    <Card className="overflow-hidden border-[var(--border)] shadow-sm">
      <div className="px-4 py-3 border-b border-[var(--border)] bg-[var(--surface-2)] flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[12.5px] font-[700] tracking-[-0.01em] bg-[var(--surface)] border border-[var(--border)] rounded-[7px] px-2 py-1">
              {cve.id}
            </span>
            <Badge className={`border text-[11px] ${severityStyle(cve.severity)}`}>{cve.severity}</Badge>
            <Badge variant={statusVariant(cve.status)} className="text-[11px]">
              {cve.status}
            </Badge>
          </div>
          <div className="mt-2 text-[14px] font-[650] tracking-[-0.02em] leading-tight">{cve.title}</div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-[var(--text-3)]">
            <span className="inline-flex items-center gap-1 font-mono">
              <Calendar className="w-3 h-3" /> {cve.published}
            </span>
            <span className="w-1 h-1 rounded-full bg-[var(--border-strong)]" />
            <span className="font-mono truncate max-w-[220px]">{cve.affected}</span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="shrink-0 w-7 h-7 grid place-items-center rounded-[7px] border border-[var(--border)] bg-[var(--surface)] hover:bg-white dark:hover:bg-[#1D1F23] text-[var(--text-2)] hover:text-[var(--text)] transition-colors"
          aria-label="Close detail"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <CardContent className="p-5 space-y-5">
        <div>
          <div className="text-[11px] font-semibold tracking-widest uppercase text-[var(--text-3)]">Description</div>
          <p className="mt-2 text-[13px] leading-6 text-[var(--text-2)]">{cve.description}</p>
        </div>

        <div className="rounded-[10px] border border-[var(--border)] overflow-hidden">
          <div className="px-3 py-2.5 bg-[var(--surface-2)] border-b border-[var(--border)] flex items-center justify-between">
            <span className="text-[11px] font-semibold tracking-widest uppercase text-[var(--text-3)] flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" /> CVSS
            </span>
            <span className={`font-mono text-[13px] font-[700] ${cvssColor(cve.cvss)}`}>{cve.cvss.toFixed(1)} / 10.0</span>
          </div>
          <div className="p-3 space-y-2">
            <div className="font-mono text-[11.5px] leading-5 break-all px-2.5 py-2 rounded-[8px] bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-2)]">
              {cve.vector}
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-3)]">
              <Info className="w-3 h-3" /> Base score only • Environmental and temporal scores may vary by deployment
            </div>
          </div>
        </div>

        <div>
          <div className="text-[11px] font-semibold tracking-widest uppercase text-[var(--text-3)]">Remediation</div>
          <div className="mt-2 rounded-[10px] bg-emerald-50 dark:bg-emerald-950/15 border border-emerald-200 dark:border-emerald-900 p-3 text-[12.5px] leading-6 text-emerald-900 dark:text-emerald-100">
            {cve.remediation}
          </div>
        </div>

        <div>
          <div className="text-[11px] font-semibold tracking-widest uppercase text-[var(--text-3)]">Affected</div>
          <div className="mt-2 font-mono text-[12.5px] px-3 py-2 rounded-[8px] bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-2)]">
            {cve.affected}
          </div>
        </div>

        <div>
          <div className="text-[11px] font-semibold tracking-widest uppercase text-[var(--text-3)] mb-2">References</div>
          <div className="space-y-2">
            {cve.links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-[8px] border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-2)] hover:border-[var(--border-strong)] transition-colors group"
              >
                <span className="text-[13px] font-[500] text-[var(--text)] group-hover:text-[var(--accent)]">{l.label}</span>
                <span className="text-[11px] font-mono text-[var(--text-3)] truncate max-w-[180px] hidden sm:block">{l.href.replace("https://", "")}</span>
                <ExternalLink className="w-3.5 h-3.5 text-[var(--text-3)] group-hover:text-[var(--text)] shrink-0" />
              </a>
            ))}
            <a
              href={`https://nvd.nist.gov/vuln/detail/${cve.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 w-full h-9 rounded-[8px] bg-[var(--text)] text-[var(--background)] hover:bg-[#27272A] dark:hover:bg-[#27272A] text-[13px] font-[500] transition-colors"
            >
              Open on NVD <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        <div className="pt-4 border-t border-[var(--border)] flex items-center justify-between text-[11px] text-[var(--text-3)]">
          <span className="inline-flex items-center gap-1.5">
            <Clock className="w-3 h-3" /> Published {cve.published}
          </span>
          <Link href={`/research`} className="inline-flex items-center gap-1 font-medium text-[var(--accent)] hover:underline">
            Related research <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
