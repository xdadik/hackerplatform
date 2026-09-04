"use client"

import * as React from "react"
import Link from "next/link"
import { AppShell } from "@/components/layout/app-shell"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Check,
  Sparkles,
  Zap,
  Infinity,
  ShieldCheck,
  ArrowRight,
  HelpCircle,
  CreditCard,
  Receipt,
  Settings,
} from "lucide-react"
import { cn } from "@/lib/utils"

export default function BillingPage() {
  const [plan, setPlan]=React.useState<"free"|"go"|"plus">("free")
  const [paymentAdded, setPaymentAdded]=React.useState(false)
  React.useEffect(()=>{
    try{
      const raw=localStorage.getItem("aegis_user")
      if(raw){ const u=JSON.parse(raw); if(u.plan) setPlan(u.plan)}
      else{
        const p=localStorage.getItem("aegis_plan") as any
        if(p) setPlan(p)
      }
      const pay=localStorage.getItem("aegis_payment_added")
      if(pay==="1") setPaymentAdded(true)
    }catch{}
  },[])
  const upgrade=(next:"go"|"plus")=>{
    try{
      const raw=localStorage.getItem("aegis_user")
      if(raw){
        const u=JSON.parse(raw); u.plan=next; localStorage.setItem("aegis_user", JSON.stringify(u))
      }
      localStorage.setItem("aegis_plan", next)
      localStorage.setItem("aegis_auth","1")
    }catch{}
    setPlan(next)
    alert(`Upgraded to ${next==="go"?"Go":"Plus"} — plan saved to localStorage (aegis_plan, aegis_user). Labs & challenges unlocked.`)
  }
  const addPayment=()=>{
    try{ localStorage.setItem("aegis_payment_added","1")}catch{}
    setPaymentAdded(true)
    alert("Payment method added (mock) — saved to localStorage.")
  }
  const managePlan=()=>{
    if(plan==="free") alert("You are on Free — upgrade to unlock labs.")
    else if(confirm(`Downgrade from ${plan} to Free?`)){
      try{
        const raw=localStorage.getItem("aegis_user")
        if(raw){ const u=JSON.parse(raw); u.plan="free"; localStorage.setItem("aegis_user", JSON.stringify(u))}
        localStorage.setItem("aegis_plan","free")
      }catch{}
      setPlan("free")
    }
  }

  return (
    <AppShell withSidebar>
      {/* Light billing experience - white background to match whole site */}
      <div className="min-h-[calc(100vh-56px)] w-full bg-[var(--background)] text-[var(--text)]">
        <div className="mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-[12px] text-[var(--text-3)]">
            <Link href="/settings" className="hover:text-[var(--text)] transition-colors inline-flex items-center gap-1">
              <Settings className="w-3.5 h-3.5" />
              Settings
            </Link>
            <span className="text-[var(--border-strong)]">/</span>
            <span className="text-[var(--text-2)]">Billing — {plan}</span>
          </div>

          {/* Header */}
          <div className="mt-6 text-center max-w-[640px] mx-auto">
            <h1 className="text-[28px] sm:text-[32px] font-[700] tracking-[-0.03em] text-[var(--text)]">Upgrade your plan</h1>
            <p className="mt-2 text-[14px] leading-[1.6] text-[var(--text-2)]">
              Choose the plan that fits your workflow. Downgrade or cancel anytime. All plans include secure labs,
              community access, and core platform features. {plan!=="free" && <span className="text-emerald-600 font-[600]">Current: {plan.toUpperCase()}</span>}
            </p>
          </div>

          {/* Plans grid — 3 cards, UZS */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
            {/* Free */}
            <Card
              className={cn(
                "relative flex flex-col rounded-[16px] border bg-[var(--surface)] border-[var(--border)]",
                "shadow-sm overflow-hidden", plan==="free" && "ring-2 ring-zinc-900 dark:ring-white"
              )}
            >
              <div className="p-5 sm:p-6 flex flex-col flex-1">
                {/* Plan header */}
                <div className="flex items-start justify-between">
                  <div className="w-8 h-8 rounded-full bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center">
                    <Infinity className="w-4 h-4 text-[var(--text-2)]" />
                  </div>
                  <Badge
                    variant="outline"
                    className="rounded-full bg-[var(--surface-2)] border-[var(--border)] text-[var(--text-2)] text-[11px] font-medium px-2.5 py-0.5"
                  >
                    {plan==="free" ? "Current" : "Free"}
                  </Badge>
                </div>

                <h3 className="mt-4 text-[18px] font-[700] tracking-[-0.02em] text-[var(--text)]">Free</h3>
                <p className="text-[13px] text-[var(--text-2)]">Try Aegis</p>

                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-[28px] font-[700] tracking-[-0.02em] text-[var(--text)]">0</span>
                  <span className="text-[13px] text-[var(--text-3)]">so'm / oy</span>
                </div>

                <Button
                  disabled={plan==="free"}
                  onClick={managePlan}
                  className={`mt-5 w-full rounded-full h-9 border text-[13px] font-[600] ${plan==="free" ? "bg-[var(--surface-2)] text-[var(--text-2)] border-[var(--border)] hover:bg-[var(--surface-2)] cursor-default" : "bg-[var(--surface-2)] text-[var(--text)] border-[var(--border)]"}`}
                >
                  {plan==="free" ? "Your current plan" : "Downgrade to Free"}
                </Button>

                <div className="mt-6 pt-5 border-t border-[var(--border)] flex-1">
                  <ul className="space-y-3">
                    {[
                      "Core model access",
                      "Limited messages",
                      "Limited image generation",
                      "Limited memory",
                      "Limited file uploads",
                    ].map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-[13px] leading-[1.5] text-[var(--text-2)]">
                        <span className="mt-0.5 w-5 h-5 rounded-full bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center shrink-0">
                          <Check className="w-3 h-3 text-[var(--text-2)]" strokeWidth={2.5} />
                        </span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Card>

            {/* Go */}
            <Card className={`relative flex flex-col rounded-[16px] border bg-[var(--surface)] shadow-sm overflow-hidden ${plan==="go" ? "ring-2 ring-zinc-900 dark:ring-white border-zinc-900" : "border-[var(--border)]"}`}>
              <div className="p-5 sm:p-6 flex flex-col flex-1">
                <div className="flex items-start justify-between">
                  <div className="w-8 h-8 rounded-full bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center">
                    <Zap className="w-4 h-4 text-[var(--text-2)]" />
                  </div>
                  {plan==="go" && <Badge className="rounded-full bg-zinc-900 text-white text-[11px]">Current</Badge>}
                </div>

                <h3 className="mt-4 text-[18px] font-[700] tracking-[-0.02em] text-[var(--text)]">Go</h3>
                <p className="text-[13px] text-[var(--text-2)]">Keep chatting</p>

                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-[28px] font-[700] tracking-[-0.02em] text-[var(--text)]">65 000</span>
                  <span className="text-[13px] text-[var(--text-3)]">so'm / oy</span>
                </div>

                <Button onClick={()=>upgrade("go")} disabled={plan==="go"} className={`mt-5 w-full rounded-full h-9 border text-[13px] font-[600] shadow-sm ${plan==="go" ? "bg-emerald-600 text-white border-emerald-600" : "bg-[var(--text)] text-[var(--background)] hover:bg-zinc-800 border-transparent"}`}>
                  {plan==="go" ? "✓ Current plan" : "Upgrade to Go"}
                </Button>

                <div className="mt-6 pt-5 border-t border-[var(--border)] flex-1">
                  <p className="text-[12px] font-[600] text-[var(--text-3)] mb-3">Everything in Free, and:</p>
                  <ul className="space-y-3">
                    {[
                      "Core model access",
                      "More messages",
                      "More image generation",
                      "Longer memory",
                      "Expanded voice",
                      "More file uploads",
                    ].map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-[13px] leading-[1.5] text-[var(--text-2)]">
                        <span className="mt-0.5 w-5 h-5 rounded-full bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center shrink-0">
                          <Check className="w-3 h-3 text-[var(--text-2)]" strokeWidth={2.5} />
                        </span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Card>

            {/* Plus — RECOMMENDED, light with blue accent to match white site */}
            <Card
              className={cn(
                "relative flex flex-col rounded-[16px] border shadow-[0_8px_32px_rgba(59,130,246,0.12)] overflow-visible",
                "bg-[var(--surface)]", plan==="plus" ? "ring-2 ring-[#2563EB] border-blue-400" : "border-blue-200 dark:border-blue-900"
              )}
            >
              {/* RECOMMENDED pill - centered overlapping top border */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                <span className="inline-flex items-center rounded-full bg-[#2563EB] text-white text-[11px] font-[700] tracking-[0.08em] px-3 py-1 shadow-md border border-blue-400/30 whitespace-nowrap">
                  RECOMMENDED
                </span>
              </div>

              <div className="p-5 sm:p-6 pt-7 flex flex-col flex-1">
                <div className="flex items-start justify-between">
                  <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-[#2563EB]" />
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 px-2.5 py-1 text-[11px] font-medium text-[#2563EB] dark:text-blue-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Most popular
                  </span>
                </div>

                <h3 className="mt-4 text-[18px] font-[700] tracking-[-0.02em] text-[var(--text)]">Plus</h3>
                <p className="text-[13px] text-[var(--text-2)]">Your AI assistant</p>

                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-[28px] font-[700] tracking-[-0.02em] text-[var(--text)]">250 000</span>
                  <span className="text-[13px] text-[var(--text-3)]">so'm / oy</span>
                </div>

                <Button onClick={()=>upgrade("plus")} disabled={plan==="plus"} className={`mt-5 w-full rounded-full h-9 border text-[13px] font-[700] shadow-sm ${plan==="plus" ? "bg-emerald-600 text-white border-emerald-600" : "bg-[#2563EB] text-white hover:bg-[#1D4ED8] border-transparent"}`}>
                  {plan==="plus" ? "✓ Current plan" : "Upgrade to Plus"}
                </Button>

                <div className="mt-6 pt-5 border-t border-blue-100 dark:border-blue-900 flex-1">
                  <p className="text-[12px] font-[600] text-[var(--text-3)] mb-3">Everything in Go, and:</p>
                  <ul className="space-y-3">
                    {[
                      "Advanced models",
                      "Advanced image generation",
                      "Expanded memory & context",
                      "Deep research",
                      "Connectors & automations",
                      "Priority support",
                      "Private labs access",
                    ].map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-[13px] leading-[1.5] text-[var(--text-2)]">
                        <span className="mt-0.5 w-5 h-5 rounded-full bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 flex items-center justify-center shrink-0">
                          <Check className="w-3 h-3 text-[#2563EB]" strokeWidth={2.5} />
                        </span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Card>

          </div>

          {/* Subtext */}
          <p className="mt-6 text-center text-[12px] text-[var(--text-3)]">
            Prices in UZS. Go and Plus include higher rate limits, advanced models, and longer memory.{" "}
            <Link href="#" onClick={(e)=>{ e.preventDefault(); alert("Feature comparison: Free 20 msgs/day, Go 200, Plus unlimited + private labs.")}} className="underline decoration-[var(--border-strong)] underline-offset-4 hover:text-[var(--text)]">
              Compare all features
            </Link>
          </p>

          {/* Billing management row */}
          <div className="mt-10 grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="rounded-[16px] border bg-[var(--surface)] border-[var(--border)]">
              <div className="p-6 text-center">
                <div className="w-10 h-10 rounded-full bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center mx-auto">
                  <CreditCard className="w-5 h-5 text-[var(--text-2)]" />
                </div>
                <div className="mt-3 text-[14px] font-[600] tracking-[-0.01em] text-[var(--text)]">{paymentAdded ? "Payment method on file" : "No payment method on file"}</div>
                <div className="mt-1 text-[12px] leading-5 text-[var(--text-2)] max-w-[260px] mx-auto">{paymentAdded ? "Card ending 4242 • Exp 12/27" : "Add a card to upgrade instantly. Securely stored and used for plan upgrades."}</div>
                <Button size="sm" className="mt-4 h-8 rounded-[8px] bg-[var(--text)] text-[var(--background)] hover:bg-zinc-800 text-[13px] font-[600]" onClick={addPayment}>
                  {paymentAdded ? "Update payment method" : "Add payment method"}
                </Button>
              </div>
            </Card>

            <Card className="rounded-[16px] border bg-[var(--surface)] border-[var(--border)]">
              <div className="p-6 text-center">
                <div className="w-10 h-10 rounded-full bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center mx-auto">
                  <Receipt className="w-5 h-5 text-[var(--text-2)]" />
                </div>
                <div className="mt-3 text-[14px] font-[600] tracking-[-0.01em] text-[var(--text)]">No invoices yet</div>
                <div className="mt-1 text-[12px] leading-5 text-[var(--text-2)] max-w-[260px] mx-auto">Your invoices will appear here after your first charge. Billing is monthly.</div>
                <Link href="/settings" className="mt-4 inline-flex items-center justify-center h-8 px-4 rounded-[8px] bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text)] text-[12px] font-[600] hover:bg-[var(--surface)] transition-colors">
                  Manage in Settings <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Link>
              </div>
            </Card>

            <Card className="rounded-[16px] border bg-[var(--surface)] border-[var(--border)]">
              <div className="p-5">
                <div className="flex items-center gap-2 text-[13px] font-[600] text-[var(--text)]">
                  <ShieldCheck className="w-4 h-4 text-[var(--text-2)]" />
                  Current plan
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center">
                    <Infinity className="w-4 h-4 text-[var(--text)]" />
                  </div>
                    <div>
                    <div className="text-[13px] font-[600] text-[var(--text)]">{plan==="free"?"Free — 0 so'm / oy": plan==="go"?"Go — 65 000 so'm / oy":"Plus — 250 000 so'm / oy"}</div>
                    <div className="text-[12px] text-[var(--text-3)]">Renews monthly • Cancel anytime</div>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={managePlan}
                    className="inline-flex items-center justify-center rounded-full h-8 px-4 bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text)] text-[12px] font-[600] hover:bg-[var(--surface)] transition-colors"
                  >
                    Manage plan
                  </button>
                  <span className="inline-flex items-center text-[11px] text-[var(--text-3)] px-2">
                    Need help? <Link href="#" onClick={(e)=>{ e.preventDefault(); alert("Support: support@aegis.lab — response <24h")}} className="ml-1 underline hover:text-[var(--text)]">Contact support</Link>
                  </span>
                </div>
              </div>
            </Card>
          </div>

          {/* Enterprise / FAQ */}
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="rounded-[16px] border bg-[var(--surface)] border-[var(--border)]">
              <div className="p-5 flex items-start justify-between gap-4">
                <div>
                  <h4 className="text-[13px] font-[600] text-[var(--text)]">Need more for your team?</h4>
                  <p className="mt-1 text-[13px] leading-[1.5] text-[var(--text-2)]">
                    Enterprise gives you SSO, private labs, advanced analytics, and dedicated support. Ideal for
                    security teams and academies.
                  </p>
                  <Link
                    href="/organizations"
                    className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[var(--text)] text-[var(--background)] px-4 h-8 text-[12px] font-[600] hover:bg-zinc-800 transition-colors"
                  >
                    Contact sales <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
                <div className="hidden sm:flex w-10 h-10 rounded-full bg-[var(--surface-2)] border border-[var(--border)] items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5 text-[var(--text-2)]" />
                </div>
              </div>
            </Card>

            <Card className="rounded-[16px] border bg-[var(--surface)] border-[var(--border)]">
              <div className="p-5">
                <h4 className="text-[13px] font-[600] text-[var(--text)] flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-[var(--text-3)]" />
                  FAQ
                </h4>
                <div className="mt-3 space-y-3 text-[13px] leading-[1.5]">
                  <div>
                    <div className="font-[600] text-[var(--text)]">Can I cancel anytime?</div>
                    <div className="text-[var(--text-2)]">Yes. Downgrade to Free at any time — you keep access until the end of the period.</div>
                  </div>
                  <div>
                    <div className="font-[600] text-[var(--text)]">What happens to my limits?</div>
                    <div className="text-[var(--text-2)]">Higher plans increase messages, image generations, memory, and agent usage.</div>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Trust footer */}
          <p className="mt-8 text-center text-[11px] tracking-wide text-[var(--text-3)]">
            Secure payments • Cancel anytime • <Link href="/settings" className="underline hover:text-[var(--text)]">Terms</Link> •{" "}
            <Link href="#" onClick={(e)=>{ e.preventDefault(); alert("Privacy: localStorage only, no server billing in demo.")}} className="underline hover:text-[var(--text)]">
              Privacy
            </Link>
          </p>
        </div>
      </div>
    </AppShell>
  )
}
