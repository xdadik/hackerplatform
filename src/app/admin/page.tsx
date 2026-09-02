import { AppShell } from "@/components/layout/app-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Users, FlaskConical, Trophy, FileText, Shield, AlertTriangle, Activity, Settings } from "lucide-react"

export default function AdminPage() {
  return (
    <AppShell withSidebar>
      <div className="w-full max-w-[1280px] px-4 sm:px-6 lg:px-6 py-6">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-[22px] font-[650] tracking-[-0.03em] flex items-center gap-2"><Shield className="w-5 h-5" /> Admin</h1>
            <p className="mt-1 text-[13.5px] text-[var(--text-2)]">Manage users, courses, labs, challenges, competitions, moderation, teams, organizations, and audit logs.</p>
          </div>
          <Badge variant="secondary" className="rounded-full gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> System operational</Badge>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <Card><CardContent className="p-4"><div className="text-[11px] tracking-widest uppercase text-[var(--text-3)]">Users</div><div className="text-[22px] font-[700]">12,421</div><div className="text-[11px] text-[var(--text-2)]">+142 this week</div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="text-[11px] tracking-widest uppercase text-[var(--text-3)]">Labs</div><div className="text-[22px] font-[700]">124</div><div className="text-[11px] text-[var(--text-2)]">6 pending review</div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="text-[11px] tracking-widest uppercase text-[var(--text-3)]">Challenges</div><div className="text-[22px] font-[700]">1,204</div><div className="text-[11px] text-[var(--text-2)]">3 reported</div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="text-[11px] tracking-widest uppercase text-[var(--text-3)]">Reports</div><div className="text-[22px] font-[700]">7</div><div className="text-[11px] text-amber-600">Requires moderation</div></CardContent></Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader className="pb-3 flex-row items-center justify-between space-y-0 gap-3"><CardTitle className="flex items-center gap-2 leading-none"><Users className="w-4 h-4" /> Users</CardTitle><Button size="sm" variant="secondary" className="h-7 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-50 shrink-0 self-center">Manage</Button></CardHeader>
              <CardContent className="p-0">
                <div className="overflow-auto">
                  <table className="w-full text-left text-[13px] table-fixed">
                    <thead className="bg-[var(--surface-2)] border-y border-[var(--border)] text-[11px] tracking-widest uppercase text-[var(--text-3)]"><tr><th className="px-4 py-2.5 font-semibold text-left w-[36%]">User</th><th className="px-4 py-2.5 font-semibold text-left w-[22%]">Reputation</th><th className="px-4 py-2.5 font-semibold text-left w-[20%]">Status</th><th className="px-4 py-2.5 font-semibold text-right w-[22%]">Action</th></tr></thead>
                    <tbody className="divide-y divide-[var(--border)]">
                      {[
                        { u: "alexmorgan", rep: 8841, status: "Active" },
                        { u: "sophiachen", rep: 9842, status: "Active" },
                        { u: "new_user_42", rep: 12, status: "Pending" },
                      ].map(r => (
                        <tr key={r.u} className="hover:bg-[var(--surface-2)]">
                          <td className="px-4 py-3 font-medium truncate">{r.u}</td>
                          <td className="px-4 py-3 font-mono tabular-nums">{r.rep.toLocaleString()}</td>
                          <td className="px-4 py-3"><Badge className={`text-[11px] border ${r.status==="Active" ? "bg-emerald-600 text-white border-emerald-600 dark:bg-emerald-600 dark:text-white" : "bg-amber-100 text-amber-900 border-amber-200 dark:bg-amber-900/30 dark:text-amber-200 dark:border-amber-800"}`}>{r.status}</Badge></td>
                          <td className="px-4 py-3 text-right"><Button size="sm" variant="ghost" className="h-7 border border-[var(--border)] bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50">View</Button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2"><Activity className="w-4 h-4" /> Audit logs</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-[12px]">
                <div className="flex items-center justify-between gap-3 p-2.5 rounded-[8px] border border-[var(--border)] bg-[var(--surface)]"><span className="min-w-0 truncate">alexmorgan completed lab <b>lab-1</b></span><span className="text-[11px] font-mono text-[var(--text-3)] text-right shrink-0 ml-auto tabular-nums">2h ago • 10.10.14.2</span></div>
                <div className="flex items-center justify-between gap-3 p-2.5 rounded-[8px] border border-[var(--border)] bg-[var(--surface)]"><span className="min-w-0 truncate">admin updated challenge <b>heap101</b></span><span className="text-[11px] font-mono text-[var(--text-3)] text-right shrink-0 ml-auto tabular-nums">5h ago • RBAC: allowed</span></div>
                <div className="flex items-center justify-between gap-3 p-2.5 rounded-[8px] border border-amber-200 bg-amber-50 dark:bg-amber-950/20"><span className="flex items-center gap-1.5 min-w-0 truncate text-amber-900 dark:text-amber-200"><AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" /> rate limit hit for 192.0.2.1</span><span className="text-[11px] font-mono text-amber-700 dark:text-amber-300/80 text-right shrink-0 ml-auto tabular-nums">429 • 1 min ago</span></div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2"><FlaskConical className="w-4 h-4" /> Content moderation</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <div className="p-3.5 rounded-[10px] border border-amber-200 bg-amber-50 dark:bg-amber-950/20">
                  <div className="text-[12.5px] font-semibold text-zinc-900 dark:text-amber-100">3 research reports pending</div>
                  <div className="text-[11px] text-zinc-600 dark:text-amber-200/80">Review for policy compliance.</div>
                  <Button size="sm" variant="secondary" className="mt-2 h-7 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50">Review queue</Button>
                </div>
                <Button variant="secondary" size="sm" className="w-full h-8 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50"><FileText className="w-3.5 h-3.5 mr-1" /> Research moderation</Button>
                <Button variant="secondary" size="sm" className="w-full h-8 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50"><Trophy className="w-3.5 h-3.5 mr-1" /> Challenge reports</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-[14px] flex items-center gap-2"><Settings className="w-4 h-4" /> System</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="w-full">
                  <label htmlFor="announcement" className="text-[12px] font-medium block">Announcement</label>
                  <Input id="announcement" placeholder="Enter announcement text..." className="mt-1.5 h-9 w-full bg-[var(--surface)]" aria-label="Announcement" />
                </div>
                <div className="flex justify-start">
                  <Button size="sm" className="h-8 px-4 bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 border border-zinc-900 dark:border-zinc-700">Publish announcement</Button>
                </div>
                <div className="text-[11px] leading-relaxed text-[var(--text-3)] pt-1 border-t border-[var(--border)]">RBAC, rate limiting, and secure headers are enforced server-side. Lab isolation: containers/K8s ready.</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
