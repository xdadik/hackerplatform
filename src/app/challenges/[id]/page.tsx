import Link from "next/link"
import { AppShell } from "@/components/layout/app-shell"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Trophy, Clock, Users, Flag, Bookmark, Share2, AlertTriangle, CheckCircle2, Terminal, Code2 } from "lucide-react"

export default async function ChallengeDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return (
    <AppShell withSidebar>
      <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-[1080px]">
        <Link href="/challenges" className="inline-flex items-center gap-1.5 text-[13px] text-[var(--text-2)] hover:text-[var(--text)] mb-4"><ArrowLeft className="w-3.5 h-3.5" /> Back to challenges</Link>

        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="rounded-full">Web</Badge>
              <Badge variant="secondary">Medium • 250 pts</Badge>
              <span className="text-[11px] text-[var(--text-3)] flex items-center gap-1"><Users className="w-3 h-3" />892 solves</span>
              <span className="text-[11px] text-[var(--text-3)] flex items-center gap-1"><Clock className="w-3 h-3" />Avg 24 min</span>
            </div>
            <h1 className="text-[22px] font-[700] tracking-[-0.03em]">Heap Overflow 101</h1>
            <p className="mt-1 text-[13.5px] text-[var(--text-2)]">Exploit a classic heap overflow in a 64-bit binary. Bypass tcache mitigations in glibc 2.39. Flag in <code className="px-1 py-0.5 rounded bg-[var(--surface-2)] border border-[var(--border)] font-mono text-[11px]">/flag.txt</code></p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-[var(--surface-2)] border border-[var(--border)]">#heap</span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-[var(--surface-2)] border border-[var(--border)]">#pwn</span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-[var(--surface-2)] border border-[var(--border)]">#glibc2.39</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" className="h-8"><Bookmark className="w-3.5 h-3.5 mr-1" /> Bookmark</Button>
            <Button variant="secondary" size="sm" className="h-8"><Share2 className="w-3.5 h-3.5 mr-1" /> Share</Button>
            <Button size="sm" className="h-8"><Flag className="w-3.5 h-3.5 mr-1" /> Submit flag</Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-[1.7fr_1fr] gap-6">
          <div className="space-y-4">
            <Card>
              <CardContent className="p-5">
                <div className="text-[12px] font-semibold flex items-center gap-2"><Code2 className="w-3.5 h-3.5" /> Provided files</div>
                <div className="mt-3 grid sm:grid-cols-2 gap-2">
                  <a href="#" className="p-3 rounded-[10px] border border-[var(--border)] hover:bg-[var(--surface-2)] flex items-center gap-3 transition-colors">
                    <div className="w-8 h-8 rounded-[8px] bg-[#0F1012] text-zinc-300 flex items-center justify-center font-mono text-[11px] border border-zinc-800">ELF</div>
                    <div><div className="text-[12.5px] font-medium">heap101</div><div className="text-[11px] text-[var(--text-3)]">64-bit • 18 KB • SHA256: a3f...</div></div>
                  </a>
                  <a href="#" className="p-3 rounded-[10px] border border-[var(--border)] hover:bg-[var(--surface-2)] flex items-center gap-3 transition-colors">
                    <div className="w-8 h-8 rounded-[8px] bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center"><Terminal className="w-4 h-4 text-[var(--text-2)]" /></div>
                    <div><div className="text-[12.5px] font-medium">heap101.c</div><div className="text-[11px] text-[var(--text-3)]">Source • 89 lines</div></div>
                  </a>
                </div>
                <div className="mt-4 rounded-[10px] bg-[#0F1012] border border-zinc-800 p-3 font-mono text-[12px] leading-5 text-zinc-300 overflow-auto">
                  <div className="text-zinc-500">$ checksec heap101</div>
                  <div>Arch: amd64 • RELRO: Full • Canary: Yes • NX: Yes • PIE: Yes</div>
                  <div className="text-zinc-500 mt-2">$ nc challenges.aegis.lab 9001</div>
                  <div className="text-amber-300">Welcome to Heap 101 — try to get the flag!</div>
                  <div>{'> '} <span className="w-2 h-4 bg-zinc-500 inline-block animate-pulse align-middle" /></div>
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <input placeholder="aegis{...}" className="flex-1 h-8 rounded-[8px] border border-[var(--border)] bg-[var(--surface)] px-3 text-[13px] font-mono focus:outline-none focus:ring-2 focus:ring-[var(--accent)]" />
                  <Button size="sm" className="h-8">Submit</Button>
                </div>
                <div className="mt-2 text-[11px] text-[var(--text-3)]">Server validates flag server-side. 5 attempts/min. Instances are per-user and isolated.</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <div className="text-[12px] font-semibold">Writeup & discussion</div>
                <div className="mt-3 p-3 rounded-[10px] bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900">
                  <div className="text-[12px] font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Competition mode</div>
                  <div className="text-[11px] text-amber-700 dark:text-amber-400 mt-1">Writeups are hidden until you solve or the competition ends. Discuss in team channel instead.</div>
                </div>
                <div className="mt-4 space-y-3">
                  <div className="flex gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center text-[11px] font-semibold">AM</div>
                    <div className="flex-1 p-2.5 rounded-[10px] border border-[var(--border)] bg-[var(--surface-2)]">
                      <div className="text-[12px] font-medium">Any hint on tcache poisoning without double free?</div>
                      <div className="text-[11px] text-[var(--text-3)]">Alex • 2h ago • 4 replies</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-[12px] font-semibold">Challenge info</div>
                <div className="mt-3 space-y-2 text-[12px]">
                  <div className="flex justify-between"><span className="text-[var(--text-2)]">Points</span><span className="font-mono font-medium">250</span></div>
                  <div className="flex justify-between"><span className="text-[var(--text-2)]">Solves</span><span className="font-mono">892</span></div>
                  <div className="flex justify-between"><span className="text-[var(--text-2)]">Difficulty</span><Badge variant="secondary" className="text-[11px]">Medium</Badge></div>
                  <div className="flex justify-between"><span className="text-[var(--text-2)]">Author</span><span className="font-medium">marcusreid</span></div>
                  <div className="flex justify-between"><span className="text-[var(--text-2)]">Status</span><span className="flex items-center gap-1 text-amber-600"><Clock className="w-3 h-3" /> Not solved</span></div>
                </div>
                <Button variant="secondary" size="sm" className="w-full mt-3 h-7 text-[12px]">View scoreboard</Button>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="text-[12px] font-semibold flex items-center gap-2"><Trophy className="w-3.5 h-3.5" /> Recent solves</div>
                <div className="mt-3 space-y-2">
                  {[
                    { user: "sophiachen", time: "4 min ago" },
                    { user: "priya_n", time: "12 min ago" },
                    { user: "elenav", time: "28 min ago" },
                  ].map(r => (
                    <div key={r.user} className="flex items-center justify-between text-[12px]">
                      <span className="flex items-center gap-2"><span className="w-6 h-6 rounded-full bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center text-[10px] font-semibold">{r.user.slice(0,2).toUpperCase()}</span>{r.user}</span>
                      <span className="text-[11px] text-[var(--text-3)]">{r.time}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-dashed bg-[var(--surface-2)]">
              <CardContent className="p-4 text-center">
                <div className="text-[12px] font-semibold flex items-center justify-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Solve to unlock</div>
                <div className="text-[11px] text-[var(--text-2)] mt-1">Writeup, flag format, and author notes after solving.</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
