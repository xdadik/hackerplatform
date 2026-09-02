"use client"
import * as React from "react"
import { AppShell } from "@/components/layout/app-shell"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Search, Settings, User, CreditCard, Palette, MonitorSmartphone } from "lucide-react"

const nav = [
  { label: "General", icon: Settings, id: "general" },
  { label: "Account", icon: User, id: "account" },
  { label: "Billing", icon: CreditCard, id: "billing" },
]

export default function SettingsPage() {
  const [active, setActive] = React.useState("profile")
  const [accountTab, setAccountTab] = React.useState("profile")

  return (
    <AppShell withSidebar>
      <div className="flex min-h-[calc(100vh-56px)] bg-white dark:bg-[#0A0A0A] -m-6 lg:-m-8">
        {/* Left settings nav - Claude style */}
        <div className="w-[240px] shrink-0 border-r border-zinc-200 dark:border-zinc-800 bg-[#F9F9F7] dark:bg-[#0F0F0F] hidden lg:flex flex-col">
          <div className="p-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
              <input placeholder="Search" className="w-full h-8 pl-8 pr-3 rounded-[8px] border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-[13px] placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white" />
            </div>
          </div>
          <div className="px-2 py-2 space-y-4 overflow-y-auto flex-1">
            <div>
              <div className="px-2 mb-1 text-[11px] font-semibold tracking-widest uppercase text-zinc-500">Settings</div>
              <div className="space-y-1">
                {nav.map(item => (
                  <button
                    key={item.id}
                    onClick={() => {
                      if (item.id === "account" || item.id === "billing") setAccountTab(item.id)
                      else setActive(item.id)
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-[13px] font-[500] text-left transition-colors ${ (active === item.id || accountTab === item.id) ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-sm" : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700"}`}
                  >
                    <item.icon className="w-[18px] h-[18px]" />
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="p-3 border-t border-zinc-200 dark:border-zinc-800">
            <button className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-[8px] text-[13px] text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-left">
              <Palette className="w-4 h-4" /> Customize
            </button>
          </div>
        </div>

        {/* Right content */}
        <div className="flex-1 min-w-0 bg-white dark:bg-[#0A0A0A] p-6 lg:p-8 overflow-y-auto">
          {accountTab === "billing" ? (
            <BillingView onBack={() => setAccountTab("profile")} />
          ) : accountTab === "account" ? (
            <AccountView />
          ) : active === "profile" || accountTab === "profile" ? (
            <ProfileView />
          ) : (
            <div className="max-w-[720px]">
              <h2 className="text-[16px] font-[600]">{nav.find(n => n.id === active)?.label || "General"}</h2>
              <p className="text-[13px] text-zinc-500 mt-1">This section is under construction. Your settings will appear here.</p>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}

function ProfileView() {
  return (
    <div className="max-w-[720px]">
      <div className="flex items-center justify-between">
        <h2 className="text-[20px] font-[700] tracking-[-0.02em]">Profile</h2>
        <button onClick={() => window.history.back()} className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:hover:text-white">✕</button>
      </div>

      <div className="mt-8 space-y-6">
        <div className="flex items-center justify-between py-4 border-b border-zinc-200 dark:border-zinc-800">
          <span className="text-[14px] font-[500]">Avatar</span>
          <div className="w-10 h-10 rounded-full bg-[#7C3AED] flex items-center justify-center text-[13px] font-bold text-white">NL</div>
        </div>

        <div className="flex items-center justify-between py-4 border-b border-zinc-200 dark:border-zinc-800">
          <span className="text-[14px] font-[500]">Full name</span>
          <Input placeholder="Enter your full name" defaultValue="" className="w-[320px] h-10 bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-[14px]" />
        </div>

        <div className="flex items-center justify-between py-4 border-b border-zinc-200 dark:border-zinc-800">
          <span className="text-[14px] font-[500]">What should Claude call you?</span>
          <Input placeholder="Enter preferred name" defaultValue="" className="w-[320px] h-10 bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-[14px]" />
        </div>

        <div className="flex items-center justify-between py-3 border-b border-zinc-100 dark:border-zinc-800">
          <span className="text-[13px] font-[500]">What best describes your work?</span>
          <button className="text-[13px] text-zinc-500 flex items-center gap-1">Select <span>⌄</span></button>
        </div>

        <div className="py-3 border-b border-zinc-100 dark:border-zinc-800">
          <div className="text-[13px] font-[500]">Instructions for Claude</div>
          <p className="text-[11px] text-zinc-500 mt-1">Claude will keep these in mind for this and any of your associated accounts across chats and Cowork within Anthropic’s guidelines. <a className="underline">Learn more</a></p>
          <textarea placeholder="e.g. when learning new concepts, I find analogies particularly helpful" className="mt-3 w-full min-h-[100px] rounded-[8px] border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-3 text-[13px] focus:outline-none focus:ring-2 focus:ring-zinc-900" />
        </div>

        <div className="pt-2">
          <h3 className="text-[15px] font-[600]">Preferences</h3>
          <div className="mt-4 flex items-center justify-between py-3 border-b border-zinc-100 dark:border-zinc-800">
            <span className="text-[13px] font-[500]">Appearance</span>
            <div className="flex items-center gap-1 p-1 rounded-full bg-zinc-100 dark:bg-zinc-800">
              <button className="w-7 h-7 rounded-full bg-white dark:bg-transparent flex items-center justify-center text-zinc-600 shadow-sm"><span className="text-[12px]">🖥</span></button>
              <button className="w-7 h-7 rounded-full bg-white shadow-sm flex items-center justify-center text-amber-500"><span className="text-[12px]">☀</span></button>
              <button className="w-7 h-7 rounded-full flex items-center justify-center text-zinc-500"><span className="text-[12px]">◐</span></button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function AccountView() {
  return (
    <div className="max-w-[720px]">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-[16px] font-[600]">Account</h2>
        <button onClick={() => window.history.back()} className="w-6 h-6 flex items-center justify-center text-zinc-500">✕</button>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between py-3 border-b border-zinc-100 dark:border-zinc-800">
          <span className="text-[13px]">Log out of all devices</span>
          <Button variant="secondary" size="sm" className="h-7 rounded-full border">Log out</Button>
        </div>
        <div className="flex items-center justify-between py-3 border-b border-zinc-100 dark:border-zinc-800">
          <span className="text-[13px]">Delete account</span>
          <Button variant="secondary" size="sm" className="h-7 rounded-full border">Contact support</Button>
        </div>
        <div className="flex items-center justify-between py-3 border-b border-zinc-100 dark:border-zinc-800">
          <span className="text-[13px]">Organization ID</span>
          <span className="font-mono text-[11px] bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded">c9eb1ad5-7163-4234-ba8e-0ed12c30d915</span>
        </div>
      </div>

      <h3 className="mt-8 text-[15px] font-[600]">Trusted devices</h3>
      <p className="text-[12px] text-zinc-500">Devices that can control your local machine through remote sessions.</p>
      <Card className="mt-3 border-dashed rounded-[12px] bg-zinc-50 dark:bg-zinc-900/50">
        <CardContent className="p-6 text-center">
          <div className="w-10 h-10 rounded-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center mx-auto">
            <MonitorSmartphone className="w-5 h-5 text-zinc-500" />
          </div>
          <div className="mt-3 text-[14px] font-[600] tracking-[-0.01em] text-zinc-900 dark:text-white">No trusted devices</div>
          <div className="mt-1 text-[12px] leading-5 text-[var(--text-2)] max-w-[320px] mx-auto">Devices that can control your local machine through remote sessions will appear here. Trust a device to enable remote access.</div>
          <Button size="sm" className="mt-4 h-8 rounded-[8px] bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100">Add trusted device</Button>
        </CardContent>
      </Card>

      <h3 className="mt-8 text-[15px] font-[600]">Active sessions</h3>
      <div className="mt-3 border border-zinc-200 dark:border-zinc-800 rounded-[8px] overflow-hidden">
        <div className="grid grid-cols-4 gap-4 px-4 py-2 bg-zinc-50 dark:bg-zinc-900 text-[11px] font-semibold text-zinc-500">
          <span>Device</span><span>Location</span><span>Created</span><span>Updated</span>
        </div>
        <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
          <div className="grid grid-cols-4 gap-4 px-4 py-3 text-[12px]">
            <span className="flex items-center gap-2">Chrome ... <Badge className="bg-blue-100 text-blue-700 text-[10px]">Current</Badge></span>
            <span>Tashkent, Tashkent, UZ</span><span>Aug 16, 2026, 8:55 PM</span><span>Sep 1, 2026, 9:13 PM</span>
          </div>
          <div className="grid grid-cols-4 gap-4 px-4 py-3 text-[12px]">
            <span>Chrome (Windows)</span><span>Tashkent, Tashkent, UZ</span><span>Aug 9, 2026, 5:11 AM</span><span>Aug 9, 2026, 5:11 AM</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function BillingView({ onBack }: { onBack: () => void }) {
  return (
    <div className="max-w-[720px]">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 rounded-full border border-zinc-300 flex items-center justify-center">◈</div>
        <div>
          <div className="text-[14px] font-[600]">Free plan</div>
          <div className="text-[12px] text-zinc-500">Try Claude</div>
        </div>
        <Button size="sm" className="ml-auto h-8 rounded-full bg-zinc-900 text-white">Upgrade plan</Button>
      </div>

      <ul className="space-y-2 text-[13px] text-zinc-700 dark:text-zinc-300">
        <li className="flex gap-2"><span className="text-zinc-400">✓</span> Chat on web, iOS, Android, and on your desktop</li>
        <li className="flex gap-2"><span className="text-zinc-400">✓</span> Generate code and visualize data</li>
        <li className="flex gap-2"><span className="text-zinc-400">✓</span> Write, edit, and create content</li>
        <li className="flex gap-2"><span className="text-zinc-400">✓</span> Ability to search the web</li>
        <li className="flex gap-2"><span className="text-zinc-400">✓</span> Memory across conversations</li>
        <li className="flex gap-2"><span className="text-zinc-400">✓</span> Create files and execute code</li>
        <li className="flex gap-2"><span className="text-zinc-400">✓</span> Unlock more from Claude with desktop extensions</li>
        <li className="flex gap-2"><span className="text-zinc-400">✓</span> Connect Slack and Google Workspace services</li>
        <li className="flex gap-2"><span className="text-zinc-400">✓</span> Integrate any context or tool through connectors with remote MCP</li>
        <li className="flex gap-2"><span className="text-zinc-400">✓</span> Extended thinking for complex work</li>
      </ul>

      <h3 className="mt-8 text-[14px] font-[600]">Invoices</h3>
      <p className="text-[13px] text-zinc-900 dark:text-white mt-2">We have not sent you an invoice yet.</p>
    </div>
  )
}
