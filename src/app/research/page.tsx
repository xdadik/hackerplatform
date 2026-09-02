import Link from "next/link"
import { AppShell } from "@/components/layout/app-shell"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, FileText, Bookmark, MessageSquare, Clock, Eye, Award, Filter, TrendingUp } from "lucide-react"
import { Stagger, FadeIn } from "@/components/ui/stagger"

const articles = [
  { id: "1", title: "Abusing Overly Permissive IAM Trust Policies in AWS Organizations", excerpt: "We analyze 1,200 real trust policies and demonstrate a privilege escalation path from cross-account role assumption, with detection rules for CloudTrail.", author: "Sophia Chen", role: "Security Engineer", time: "Jan 14", read: "12 min", tags: ["aws","iam","detection-engineering"], views: 3421, comments: 18, bookmarks: 42, featured: true },
  { id: "2", title: "Heap Feng Shui in Modern glibc 2.39 — Tcache Poisoning Primer", excerpt: "Reproducible exploit for tcache poisoning with current mitigations. Includes PoC and mitigation checklist for developers.", author: "Marcus Reid", role: "Researcher", time: "Jan 10", read: "18 min", tags: ["pwn","heap","glibc"], views: 1823, comments: 12, bookmarks: 31 },
  { id: "3", title: "Volatility 3: Hunting Cobalt Strike in Memory Without Disk Artifacts", excerpt: "Workflow for extracting beacon configuration from memory dumps. Covers process hollowing indicators and YARA integration.", author: "Elena V.", role: "Forensic Analyst", time: "Jan 8", read: "14 min", tags: ["forensics","volatility","cobalt-strike"], views: 921, comments: 8, bookmarks: 19 },
  { id: "4", title: "KQL & Sigma for Entra ID Token Replay Detection", excerpt: "Detection engineering for impossible travel with token binding. Query pack included for Microsoft Sentinel.", author: "James K.", role: "Detection Engineer", time: "Jan 5", read: "10 min", tags: ["blue-team","entra-id","kql"], views: 1102, comments: 6, bookmarks: 27 },
]

export default function ResearchPage() {
  return (
    <AppShell withSidebar>
      <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-[1080px]">
        <FadeIn>
          <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
            <div>
              <h1 className="text-[22px] font-[650] tracking-[-0.03em]">Research</h1>
              <p className="mt-1 text-[13.5px] text-[var(--text-2)]">Technical publications with Markdown, code, and verifiable authorship. Quality over quantity.</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-3)]" />
                <Input placeholder="Search research, authors, tags..." className="pl-8 h-8 w-[220px] sm:w-[260px] bg-[var(--surface)]" />
              </div>
              <Link href="/research/new"><Button size="sm" className="h-8 rounded-[8px]">New research</Button></Link>
            </div>
          </div>
        </FadeIn>

        <div className="flex items-center gap-1.5 mb-6 overflow-x-auto pb-1">
          <button className="px-3 py-1.5 rounded-full text-[12.5px] font-[500] bg-[var(--text)] text-[var(--background)] whitespace-nowrap">All</button>
          <button className="px-3 py-1.5 rounded-full text-[12.5px] font-[500] bg-[var(--surface)] border border-[var(--border)] text-[var(--text-2)] whitespace-nowrap">Vulnerability Analysis</button>
          <button className="px-3 py-1.5 rounded-full text-[12.5px] font-[500] bg-[var(--surface)] border border-[var(--border)] text-[var(--text-2)] whitespace-nowrap">Writeups</button>
          <button className="px-3 py-1.5 rounded-full text-[12.5px] font-[500] bg-[var(--surface)] border border-[var(--border)] text-[var(--text-2)] whitespace-nowrap">Tools</button>
          <button className="px-3 py-1.5 rounded-full text-[12.5px] font-[500] bg-[var(--surface)] border border-[var(--border)] text-[var(--text-2)] whitespace-nowrap">Reports</button>
          <span className="ml-2 hidden sm:inline-flex items-center gap-2 text-[12px] text-[var(--text-3)] border-l border-[var(--border)] pl-3"><TrendingUp className="w-3.5 h-3.5" /> Trending this week</span>
        </div>

        <div className="grid lg:grid-cols-[1.7fr_0.9fr] gap-6">
          <Stagger className="space-y-4">
            {articles.map(a => (
              <div key={a.id} className="stagger-item"><Card className={`hover:shadow-md transition-shadow ${a.featured ? "border-[var(--accent-border)]" : ""}`}>
                <CardContent className="p-5 sm:p-6">
                  {a.featured && <Badge variant="accent" className="mb-3 gap-1.5"><Award className="w-3 h-3" /> Staff Pick</Badge>}
                  <Link href={`/research/${a.id}`} className="block group">
                    <h2 className="text-[16px] sm:text-[17px] font-[650] tracking-[-0.02em] leading-tight group-hover:text-[var(--accent)] transition-colors">{a.title}</h2>
                    <p className="mt-2 text-[13px] leading-6 text-[var(--text-2)] line-clamp-2">{a.excerpt}</p>
                  </Link>

                  {/* Code preview for featured */}
                  {a.featured && (
                    <div className="mt-4 rounded-[10px] border border-[var(--border)] overflow-hidden">
                      <div className="px-3 py-1.5 bg-[var(--surface-2)] border-b border-[var(--border)] flex items-center justify-between">
                        <span className="text-[11px] font-mono text-[var(--text-3)]">detection / cloudtrail sigma rule</span>
                        <span className="text-[11px] font-mono text-[var(--text-3)]">yaml</span>
                      </div>
                      <pre className="p-3 bg-[#0F1012] text-[11.5px] leading-5 font-mono text-zinc-300 overflow-x-auto">
                        <code>{`detection:
  selection:
    eventName: AssumeRole
    requestParameters.roleArn|contains: '*'
  condition: selection | count() by userIdentity.arn > 5`}</code>
                      </pre>
                    </div>
                  )}

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    {a.tags.map(tag => (
                      <span key={tag} className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-2)]">#{tag}</span>
                    ))}
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center text-[11px] font-semibold">{a.author.split(" ").map(n=>n[0]).join("").slice(0,2)}</div>
                      <div>
                        <div className="text-[12.5px] font-[500] leading-none">{a.author}</div>
                        <div className="text-[11px] text-[var(--text-3)]">{a.role} • {a.time} • {a.read} read</div>
                      </div>
                    </div>
                    <div className="hidden sm:flex items-center gap-3 text-[11px] text-[var(--text-3)]">
                      <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {a.views.toLocaleString()}</span>
                      <span className="flex items-center gap-1"><Bookmark className="w-3 h-3" /> {a.bookmarks}</span>
                      <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" /> {a.comments}</span>
                    </div>
                  </div>
                </CardContent>
              </Card></div>
            ))}
          </Stagger>

          <div className="space-y-4">
            <Card>
              <CardContent className="p-5">
                <div className="text-[12px] font-semibold flex items-center gap-2"><FileText className="w-3.5 h-3.5" /> Publish with confidence</div>
                <p className="mt-2 text-[12.5px] leading-5 text-[var(--text-2)]">Markdown, syntax highlighting, code blocks, images, diagrams, tags, authors, and related research.</p>
                <div className="mt-3 rounded-[8px] bg-[#0F1012] p-3 font-mono text-[11px] leading-4 text-zinc-400">
                  <div>```python</div>
                  <div className="text-zinc-200">def detect_ioc(evt):</div>
                  <div className="text-zinc-300 pl-2">return evt.arn.contains(&quot;:&quot;)</div>
                  <div>```</div>
                </div>
                <Link href="/research/new"><Button variant="secondary" size="sm" className="w-full mt-3 h-8">Create research</Button></Link>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <div className="text-[11px] font-semibold tracking-widest uppercase text-[var(--text-3)] mb-3">Top authors this month</div>
                <div className="space-y-3">
                  {[
                    { name: "Sophia Chen", rep: "4.2k", pubs: 4 },
                    { name: "Marcus Reid", rep: "3.9k", pubs: 7 },
                    { name: "Elena V.", rep: "3.4k", pubs: 3 },
                  ].map(p => (
                    <div key={p.name} className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-[var(--text)] text-[var(--background)] flex items-center justify-center text-[11px] font-semibold">{p.name.split(" ").map(n=>n[0]).join("")}</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[12.5px] font-[500] leading-none">{p.name}</div>
                        <div className="text-[11px] text-[var(--text-3)]">{p.rep} rep • {p.pubs} pubs</div>
                      </div>
                      <Button variant="ghost" size="sm" className="h-7 text-[11px] border border-[var(--border)]">Follow</Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <div className="text-[11px] font-semibold tracking-widest uppercase text-[var(--text-3)] mb-3">Related to your labs</div>
                <div className="space-y-2.5">
                  <Link href="#" className="block p-2.5 rounded-[8px] border border-[var(--border)] hover:bg-[var(--surface-2)] transition-colors">
                    <div className="text-[12.5px] font-[500] leading-tight">From Lab to Detection: SQLi to WAF Rule</div>
                    <div className="text-[11px] text-[var(--text-3)]">Related to SQL Injection Fundamentals</div>
                  </Link>
                  <Link href="#" className="block p-2.5 rounded-[8px] border border-[var(--border)] hover:bg-[var(--surface-2)] transition-colors">
                    <div className="text-[12.5px] font-[500] leading-tight">Linux Privesc Checklist for Auditors</div>
                    <div className="text-[11px] text-[var(--text-3)]">Related to Linux Privilege Escalation</div>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
