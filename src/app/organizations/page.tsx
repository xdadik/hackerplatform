import { AppShell } from "@/components/layout/app-shell"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Building2, Users, Shield, BarChart3, Lock } from "lucide-react"

export default function OrganizationsPage() {
  return (
    <AppShell withSidebar>
      <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-[1080px]">
        <h1 className="text-[22px] font-[650] tracking-[-0.03em]">Organizations</h1>
        <p className="mt-1 text-[13.5px] text-[var(--text-2)]">Private learning paths, labs, competitions, analytics, and permissions — isolated from production.</p>

        <Card className="mt-6">
          <CardContent className="p-6 sm:p-8">
            <div className="flex flex-col lg:flex-row gap-8 items-start">
              <div className="flex-1">
                <Badge variant="outline" className="mb-3 rounded-full">Enterprise-ready foundation</Badge>
                <h2 className="text-[18px] font-[650] tracking-[-0.02em]">Bring Aegis to your team</h2>
                <p className="mt-2 text-[13.5px] leading-6 text-[var(--text-2)]">Manage members, assign private content, run competitions, and track progress with audit logs and RBAC. Lab environments are container-isolated.</p>
                <ul className="mt-6 grid sm:grid-cols-2 gap-3 text-[13px]">
                  <li className="flex gap-2"><Shield className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" /> RBAC & audit logs</li>
                  <li className="flex gap-2"><Lock className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" /> Isolated labs (containers/VMs)</li>
                  <li className="flex gap-2"><Users className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" /> Member & team management</li>
                  <li className="flex gap-2"><BarChart3 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" /> Analytics & training programs</li>
                </ul>
                <div className="mt-6 flex gap-2">
                  <Button className="rounded-[8px]">Contact sales</Button>
                </div>
              </div>
              <div className="lg:w-[360px] w-full">
                <div className="rounded-[12px] border border-[var(--border)] bg-[var(--surface-2)] p-4">
                  <div className="text-[11px] font-semibold tracking-widest uppercase text-[var(--text-3)] mb-3">Preview — Organization panel</div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2.5 rounded-[8px] bg-[var(--surface)] border border-[var(--border)]">
                      <span className="text-[12.5px] font-medium flex items-center gap-2"><Building2 className="w-3.5 h-3.5" /> Acme Security</span>
                      <Badge variant="success" className="text-[11px]">Active</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-3 rounded-[8px] bg-[var(--surface)] border border-[var(--border)] text-center"><div className="text-[11px] text-[var(--text-3)]">Members</div><div className="text-[16px] font-[700]">142</div></div>
                      <div className="p-3 rounded-[8px] bg-[var(--surface)] border border-[var(--border)] text-center"><div className="text-[11px] text-[var(--text-3)]">Completion</div><div className="text-[16px] font-[700]">68%</div></div>
                    </div>
                    <div className="p-2.5 rounded-[8px] bg-[var(--surface)] border border-[var(--border)]">
                      <div className="text-[11px] font-medium">Private labs</div>
                      <div className="text-[11px] text-[var(--text-2)]">3 private • 12 assigned</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
