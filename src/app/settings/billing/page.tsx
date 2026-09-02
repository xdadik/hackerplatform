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

  return (
    <AppShell withSidebar>
      {/* Force dark billing experience - black background, dark cards like ChatGPT */}
      <div className="min-h-[calc(100vh-56px)] w-full bg-[#0A0A0A] text-white">
        <div className="mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-[12px] text-zinc-500">
            <Link href="/settings" className="hover:text-zinc-300 transition-colors inline-flex items-center gap-1">
              <Settings className="w-3.5 h-3.5" />
              Settings
            </Link>
            <span className="text-zinc-600">/</span>
            <span className="text-zinc-300">Billing</span>
          </div>

          {/* Header */}
          <div className="mt-6 text-center max-w-[640px] mx-auto">
            <h1 className="text-[28px] sm:text-[32px] font-[700] tracking-[-0.03em] text-white">Upgrade your plan</h1>
            <p className="mt-2 text-[14px] leading-[1.6] text-zinc-400">
              Choose the plan that fits your workflow. Downgrade or cancel anytime. All plans include secure labs,
              community access, and core platform features.
            </p>
          </div>

          {/* Plans grid — 3 cards, UZS */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
            {/* Free */}
            <Card
              className={cn(
                "relative flex flex-col rounded-[16px] border bg-[#1A1A1A] border-zinc-800",
                "shadow-sm overflow-hidden"
              )}
            >
              <div className="p-5 sm:p-6 flex flex-col flex-1">
                {/* Plan header */}
                <div className="flex items-start justify-between">
                  <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                    <Infinity className="w-4 h-4 text-zinc-300" />
                  </div>
                  <Badge
                    variant="outline"
                    className="rounded-full bg-zinc-800 border-zinc-700 text-zinc-400 text-[11px] font-medium px-2.5 py-0.5"
                  >
                    Current
                  </Badge>
                </div>

                <h3 className="mt-4 text-[18px] font-[700] tracking-[-0.02em] text-white">Free</h3>
                <p className="text-[13px] text-zinc-400">Try Aegis</p>

                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-[28px] font-[700] tracking-[-0.02em] text-white">0</span>
                  <span className="text-[13px] text-zinc-500">so'm / oy</span>
                </div>

                <Button
                  disabled
                  className="mt-5 w-full rounded-full h-9 bg-zinc-800 text-zinc-300 border border-zinc-700 hover:bg-zinc-800 cursor-default text-[13px] font-[600]"
                >
                  Your current plan
                </Button>

                <div className="mt-6 pt-5 border-t border-zinc-800 flex-1">
                  <ul className="space-y-3">
                    {[
                      "Core model access",
                      "Limited messages",
                      "Limited image generation",
                      "Limited memory",
                      "Limited file uploads",
                    ].map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-[13px] leading-[1.5] text-zinc-300">
                        <span className="mt-0.5 w-5 h-5 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0">
                          <Check className="w-3 h-3 text-zinc-300" strokeWidth={2.5} />
                        </span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Card>

            {/* Go */}
            <Card className="relative flex flex-col rounded-[16px] border bg-[#1A1A1A] border-zinc-800 shadow-sm overflow-hidden">
              <div className="p-5 sm:p-6 flex flex-col flex-1">
                <div className="flex items-start justify-between">
                  <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                    <Zap className="w-4 h-4 text-zinc-300" />
                  </div>
                </div>

                <h3 className="mt-4 text-[18px] font-[700] tracking-[-0.02em] text-white">Go</h3>
                <p className="text-[13px] text-zinc-400">Keep chatting</p>

                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-[28px] font-[700] tracking-[-0.02em] text-white">65 000</span>
                  <span className="text-[13px] text-zinc-500">so'm / oy</span>
                </div>

                <Button className="mt-5 w-full rounded-full h-9 bg-white text-zinc-900 hover:bg-zinc-100 border border-transparent text-[13px] font-[600] shadow-sm">
                  Upgrade to Go
                </Button>

                <div className="mt-6 pt-5 border-t border-zinc-800 flex-1">
                  <p className="text-[12px] font-[600] text-zinc-400 mb-3">Everything in Free, and:</p>
                  <ul className="space-y-3">
                    {[
                      "Core model access",
                      "More messages",
                      "More image generation",
                      "Longer memory",
                      "Expanded voice",
                      "More file uploads",
                    ].map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-[13px] leading-[1.5] text-zinc-300">
                        <span className="mt-0.5 w-5 h-5 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0">
                          <Check className="w-3 h-3 text-zinc-300" strokeWidth={2.5} />
                        </span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Card>

            {/* Plus — RECOMMENDED, blue background */}
            <Card
              className={cn(
                "relative flex flex-col rounded-[16px] border shadow-[0_8px_32px_rgba(59,130,246,0.18)] overflow-visible",
                "bg-[#2A3F5F] border-[#3A5A85]"
              )}
            >
              {/* RECOMMENDED pill - centered overlapping top border */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                <span className="inline-flex items-center rounded-full bg-[#3B82F6] text-white text-[11px] font-[700] tracking-[0.08em] px-3 py-1 shadow-md border border-[#60A5FA]/30 whitespace-nowrap">
                  RECOMMENDED
                </span>
              </div>

              <div className="p-5 sm:p-6 pt-7 flex flex-col flex-1">
                <div className="flex items-start justify-between">
                  <div className="w-8 h-8 rounded-full bg-white/10 border border-white/15 flex items-center justify-center backdrop-blur">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/10 border border-white/15 px-2.5 py-1 text-[11px] font-medium text-white/90">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Most popular
                  </span>
                </div>

                <h3 className="mt-4 text-[18px] font-[700] tracking-[-0.02em] text-white">Plus</h3>
                <p className="text-[13px] text-white/70">Your AI assistant</p>

                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-[28px] font-[700] tracking-[-0.02em] text-white">250 000</span>
                  <span className="text-[13px] text-white/60">so'm / oy</span>
                </div>

                <Button className="mt-5 w-full rounded-full h-9 bg-white text-[#1E3347] hover:bg-zinc-100 border border-transparent text-[13px] font-[700] shadow-sm">
                  Upgrade to Plus
                </Button>

                <div className="mt-6 pt-5 border-t border-white/10 flex-1">
                  <p className="text-[12px] font-[600] text-white/60 mb-3">Everything in Go, and:</p>
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
                      <li key={f} className="flex items-start gap-2.5 text-[13px] leading-[1.5] text-white">
                        <span className="mt-0.5 w-5 h-5 rounded-full bg-white/10 border border-white/15 flex items-center justify-center shrink-0">
                          <Check className="w-3 h-3 text-white" strokeWidth={2.5} />
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
          <p className="mt-6 text-center text-[12px] text-zinc-500">
            Prices in UZS. Go and Plus include higher rate limits, advanced models, and longer memory.{" "}
            <Link href="#" className="underline decoration-zinc-600 underline-offset-4 hover:text-zinc-300">
              Compare all features
            </Link>
          </p>

          {/* Billing management row */}
          <div className="mt-10 grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="rounded-[16px] border bg-[#1A1A1A] border-zinc-800">
              <div className="p-6 text-center">
                <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center mx-auto">
                  <CreditCard className="w-5 h-5 text-zinc-400" />
                </div>
                <div className="mt-3 text-[14px] font-[600] tracking-[-0.01em] text-white">No payment method on file</div>
                <div className="mt-1 text-[12px] leading-5 text-zinc-400 max-w-[260px] mx-auto">Add a card to upgrade instantly. Securely stored and used for plan upgrades.</div>
                <Button size="sm" className="mt-4 h-8 rounded-[8px] bg-white text-zinc-900 hover:bg-zinc-100 text-[13px] font-[600]">
                  Add payment method
                </Button>
              </div>
            </Card>

            <Card className="rounded-[16px] border bg-[#1A1A1A] border-zinc-800">
              <div className="p-6 text-center">
                <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center mx-auto">
                  <Receipt className="w-5 h-5 text-zinc-400" />
                </div>
                <div className="mt-3 text-[14px] font-[600] tracking-[-0.01em] text-white">No invoices yet</div>
                <div className="mt-1 text-[12px] leading-5 text-zinc-400 max-w-[260px] mx-auto">Your invoices will appear here after your first charge. Billing is monthly.</div>
                <Link href="/settings" className="mt-4 inline-flex items-center justify-center h-8 px-4 rounded-[8px] bg-zinc-800 border border-zinc-700 text-white text-[12px] font-[600] hover:bg-zinc-700 transition-colors">
                  Manage in Settings <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Link>
              </div>
            </Card>

            <Card className="rounded-[16px] border bg-[#1A1A1A] border-zinc-800">
              <div className="p-5">
                <div className="flex items-center gap-2 text-[13px] font-[600] text-white">
                  <ShieldCheck className="w-4 h-4 text-zinc-400" />
                  Current plan
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                    <Infinity className="w-4 h-4 text-white" />
                  </div>
                    <div>
                    <div className="text-[13px] font-[600] text-white">Free — 0 so'm / oy</div>
                    <div className="text-[12px] text-zinc-500">Renews monthly • Cancel anytime</div>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <Link
                    href="/settings"
                    className="inline-flex items-center justify-center rounded-full h-8 px-4 bg-zinc-800 border border-zinc-700 text-white text-[12px] font-[600] hover:bg-zinc-700 transition-colors"
                  >
                    Manage plan
                  </Link>
                  <span className="inline-flex items-center text-[11px] text-zinc-500 px-2">
                    Need help? <Link href="#" className="ml-1 underline hover:text-zinc-300">Contact support</Link>
                  </span>
                </div>
              </div>
            </Card>
          </div>

          {/* Enterprise / FAQ */}
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="rounded-[16px] border bg-[#1A1A1A] border-zinc-800">
              <div className="p-5 flex items-start justify-between gap-4">
                <div>
                  <h4 className="text-[13px] font-[600] text-white">Need more for your team?</h4>
                  <p className="mt-1 text-[13px] leading-[1.5] text-zinc-400">
                    Enterprise gives you SSO, private labs, advanced analytics, and dedicated support. Ideal for
                    security teams and academies.
                  </p>
                  <Link
                    href="/organizations"
                    className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white text-zinc-900 px-4 h-8 text-[12px] font-[600] hover:bg-zinc-100 transition-colors"
                  >
                    Contact sales <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
                <div className="hidden sm:flex w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5 text-zinc-300" />
                </div>
              </div>
            </Card>

            <Card className="rounded-[16px] border bg-[#1A1A1A] border-zinc-800">
              <div className="p-5">
                <h4 className="text-[13px] font-[600] text-white flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-zinc-500" />
                  FAQ
                </h4>
                <div className="mt-3 space-y-3 text-[13px] leading-[1.5]">
                  <div>
                    <div className="font-[600] text-zinc-200">Can I cancel anytime?</div>
                    <div className="text-zinc-400">Yes. Downgrade to Free at any time — you keep access until the end of the period.</div>
                  </div>
                  <div>
                    <div className="font-[600] text-zinc-200">What happens to my limits?</div>
                    <div className="text-zinc-400">Higher plans increase messages, image generations, memory, and agent usage.</div>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Trust footer */}
          <p className="mt-8 text-center text-[11px] tracking-wide text-zinc-600">
            Secure payments • Cancel anytime • <Link href="/settings" className="underline hover:text-zinc-400">Terms</Link> •{" "}
            <Link href="#" className="underline hover:text-zinc-400">
              Privacy
            </Link>
          </p>
        </div>
      </div>
    </AppShell>
  )
}
