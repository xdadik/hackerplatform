import { AppShell } from "@/components/layout/app-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, MessageSquare, Users, Calendar, Award, ArrowRight, TrendingUp, Pin } from "lucide-react"

export default function CommunityPage() {
  return (
    <AppShell withSidebar>
      <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-[1080px]">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-[22px] font-[650] tracking-[-0.03em]">Community</h1>
            <p className="mt-1 text-[13.5px] text-[var(--text-2)]">Focused, professional discussions. No social-media clutter — technical quality first.</p>
          </div>
          <Button className="rounded-[8px]">New discussion</Button>
        </div>

        <div className="grid lg:grid-cols-[1.7fr_1fr] gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-3)]" />
                <Input placeholder="Search discussions, groups, people..." className="pl-8 h-8 bg-[var(--surface)]" />
              </div>
              <Badge variant="secondary" className="hidden sm:inline-flex">342 discussions</Badge>
            </div>

            <div className="flex gap-1.5 overflow-x-auto pb-1">
              <button className="px-3 py-1.5 rounded-full text-[12.5px] font-[500] bg-[var(--text)] text-[var(--background)] whitespace-nowrap">All</button>
              <button className="px-3 py-1.5 rounded-full text-[12.5px] font-[500] bg-[var(--surface)] border border-[var(--border)] text-[var(--text-2)] whitespace-nowrap">Technical</button>
              <button className="px-3 py-1.5 rounded-full text-[12.5px] font-[500] bg-[var(--surface)] border border-[var(--border)] text-[var(--text-2)] whitespace-nowrap">Groups</button>
              <button className="px-3 py-1.5 rounded-full text-[12.5px] font-[500] bg-[var(--surface)] border border-[var(--border)] text-[var(--text-2)] whitespace-nowrap">Mentorship</button>
              <button className="px-3 py-1.5 rounded-full text-[12.5px] font-[500] bg-[var(--surface)] border border-[var(--border)] text-[var(--text-2)] whitespace-nowrap">Events</button>
            </div>

            {[
              { pin: true, title: "Welcome: How to get the most from Aegis Community", author: "Aegis Team", time: "Pinned", replies: 42, excerpt: "Guidelines for high-quality technical discussion, mentorship, and research review. Please read before posting." },
              { title: "Best way to practice AD enumeration without a full lab?", author: "alexmorgan", time: "2 hours ago", replies: 12, excerpt: "Looking for lightweight options to practice BloodHound-style analysis. Any recommended datasets or GoAD setups?" },
              { title: "Detection engineering: Sigma vs. KQL for Entra ID — which do you prefer in production?", author: "james.k", time: "5 hours ago", replies: 18, excerpt: "We’re standardizing on Sentinel. Curious how teams handle rule portability and testing." },
              { title: "[Writeup] Cloud SSRF to Metadata — alternative path via IMDSv2 bypass", author: "priya_n", time: "Yesterday", replies: 8, excerpt: "Found a different bypass using header injection. Would love review before publishing." },
            ].map((d, i) => (
              <Card key={i} className={`${d.pin ? "border-amber-200 bg-amber-50/30 dark:bg-amber-950/10 dark:border-amber-900" : "hover:shadow-sm"} transition-shadow`}>
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center text-[11px] font-semibold shrink-0">
                      {d.author.split(" ").map(n=>n[0]).join("").slice(0,2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {d.pin && <Badge variant="warning" className="gap-1 text-[11px]"><Pin className="w-3 h-3" /> Pinned</Badge>}
                        <span className="text-[13px] font-[600] leading-tight">{d.title}</span>
                      </div>
                      <div className="mt-1 text-[12.5px] leading-5 text-[var(--text-2)] line-clamp-2">{d.excerpt}</div>
                      <div className="mt-3 flex items-center gap-3 text-[11px] text-[var(--text-3)]">
                        <span>{d.author} • {d.time}</span>
                        <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" /> {d.replies} replies</span>
                        <span className="hidden sm:inline-flex items-center gap-1"><TrendingUp className="w-3 h-3" /> {Math.floor(Math.random()*40)+5} views</span>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-[var(--text-3)] shrink-0 hidden sm:block" />
                  </div>
                </CardContent>
              </Card>
            ))}

            <Card className="border-dashed bg-[var(--surface-2)] rounded-[12px]">
              <CardContent className="p-6 text-center">
                <div className="w-10 h-10 rounded-full bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center mx-auto">
                  <MessageSquare className="w-5 h-5 text-[var(--text-2)]" />
                </div>
                <div className="mt-3 text-[14px] font-[600] tracking-[-0.01em] text-[var(--text)]">No discussions match your filters</div>
                <div className="mt-1 text-[12px] leading-5 text-[var(--text-2)] max-w-[320px] mx-auto">Try adjusting filters or start a new technical post. Your search returned no results.</div>
                <Button size="sm" className="mt-4 h-8 rounded-[8px] bg-[var(--text)] text-[var(--background)] hover:bg-zinc-800 dark:hover:bg-zinc-200">Create post</Button>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2"><Users className="w-4 h-4" /> Groups</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  { name: "Web Security Practitioners", members: 3421 },
                  { name: "Cloud Security Research", members: 1823 },
                  { name: "DFIR & Forensics", members: 921 },
                ].map(g => (
                  <div key={g.name} className="flex items-center justify-between p-2.5 rounded-[8px] border border-[var(--border)] hover:bg-[var(--surface-2)] transition-colors">
                    <span className="text-[12.5px] font-[500]">{g.name}</span>
                    <span className="text-[11px] text-[var(--text-3)]">{g.members.toLocaleString()} members</span>
                  </div>
                ))}
                <Button variant="secondary" size="sm" className="w-full mt-2 h-7 text-[12px]">Browse groups</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2"><Calendar className="w-4 h-4" /> Events</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 rounded-[10px] border border-[var(--border)]">
                  <div className="text-[12.5px] font-[600]">SOC Simulation Workshop</div>
                  <div className="text-[11px] text-[var(--text-2)]">Feb 22 • 14:00 CET • Live</div>
                  <Badge variant="accent" className="mt-2 text-[11px]">12 seats left</Badge>
                </div>
                <div className="p-3 rounded-[10px] border border-[var(--border)]">
                  <div className="text-[12.5px] font-[600]">Mentorship Office Hours</div>
                  <div className="text-[11px] text-[var(--text-2)]">Weekly • Thursdays • 18:00 CET</div>
                  <span className="text-[11px] text-[var(--text-3)]">With Sophia Chen & Marcus Reid</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <div className="text-[12px] font-semibold flex items-center gap-2"><Award className="w-3.5 h-3.5" /> Community guidelines</div>
                <ul className="mt-2 space-y-1.5 text-[12px] leading-5 text-[var(--text-2)] list-disc list-inside">
                  <li>Be technical, be specific, be kind</li>
                  <li>Share verifiable work, cite sources</li>
                  <li>No recruitment spam, no low-effort posts</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
