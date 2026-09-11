"use client"
import * as React from "react"
import { AppShell } from "@/components/layout/app-shell"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, Settings, User, CreditCard, Palette, MonitorSmartphone, Menu, X } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { useTheme } from "@/components/layout/theme-provider"
import Link from "next/link"
import { sanitizeInput } from "@/lib/sanitize"

const nav = [
  { label: "General", icon: Settings, id: "general" },
  { label: "Account", icon: User, id: "account" },
  { label: "Billing", icon: CreditCard, id: "billing" },
]

export default function SettingsPage() {
  const [tab, setTab] = React.useState<"general" | "account" | "billing" | "profile">("profile")
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false)

  // Close mobile nav on tab change
  React.useEffect(()=>{ setMobileNavOpen(false)},[tab])

  return (
    <AppShell withSidebar>
      <div className="flex min-h-[calc(100vh-56px)] bg-white dark:bg-[#0A0A0A] -m-6 lg:-m-8">
        {/* Mobile drawer toggle */}
        <div className="lg:hidden absolute top-2 left-2 z-10">
          <Button variant="secondary" size="sm" className="h-9 gap-2" onClick={()=>setMobileNavOpen(v=>!v)} aria-expanded={mobileNavOpen} aria-controls="settings-nav" aria-label={mobileNavOpen ? "Close settings navigation" : "Open settings navigation"}>
            {mobileNavOpen ? <X className="w-4 h-4" aria-hidden="true" /> : <Menu className="w-4 h-4" aria-hidden="true" />} Settings
          </Button>
        </div>
        {/* Left settings nav - Claude style */}
        <div id="settings-nav" className={`${mobileNavOpen ? "flex" : "hidden"} lg:flex w-[240px] shrink-0 border-r border-zinc-200 dark:border-zinc-800 bg-[#F9F9F7] dark:bg-[#0F0F0F] flex-col absolute lg:static inset-0 top-12 lg:top-0 z-20 max-w-[85vw] lg:max-w-none`}>
          <div className="p-3 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" aria-hidden="true" />
              <input placeholder="Search" aria-label="Search settings" className="w-full h-8 pl-8 pr-3 rounded-[8px] border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-[13px] placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white" />
            </div>
            <button onClick={()=>setMobileNavOpen(false)} className="lg:hidden p-2 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800" aria-label="Close navigation"><X className="w-4 h-4" aria-hidden="true" /></button>
          </div>
          <div className="px-2 py-2 space-y-4 overflow-y-auto flex-1">
            <div>
              <div className="px-2 mb-1 text-[11px] font-semibold tracking-widest uppercase text-zinc-500">Settings</div>
              <div className="space-y-1" role="tablist" aria-label="Settings sections">
                {nav.map(item => (
                  <button
                    key={item.id}
                    role="tab"
                    aria-selected={tab===item.id}
                    aria-controls={`panel-${item.id}`}
                    onClick={() => setTab(item.id as any)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-[13px] font-[500] text-left transition-colors min-h-[44px] ${ tab === item.id ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-sm" : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700"}`}
                  >
                    <item.icon className="w-[18px] h-[18px]" aria-hidden="true" />
                    {item.label}
                  </button>
                ))}
                <button
                  role="tab"
                  aria-selected={tab==="profile"}
                  aria-controls="panel-profile"
                  onClick={()=>setTab("profile")}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-[13px] font-[500] text-left transition-colors min-h-[44px] ${ tab==="profile" ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-sm" : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"}`}
                >
                  <User className="w-[18px] h-[18px]" aria-hidden="true" /> Profile
                </button>
              </div>
            </div>
          </div>
          <div className="p-3 border-t border-zinc-200 dark:border-zinc-800">
            <button onClick={()=> setTab("profile")} className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-[8px] text-[13px] text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-left min-h-[44px]" aria-label="Customize appearance">
              <Palette className="w-4 h-4" aria-hidden="true" /> Customize
            </button>
          </div>
        </div>
        {mobileNavOpen && <div className="fixed inset-0 top-[56px] bg-black/30 z-10 lg:hidden" onClick={()=>setMobileNavOpen(false)} aria-hidden="true" />}

        {/* Right content */}
        <div className="flex-1 min-w-0 bg-white dark:bg-[#0A0A0A] p-6 lg:p-8 overflow-y-auto pt-12 lg:pt-6">
          {tab === "billing" ? (
            <div id="panel-billing" role="tabpanel"><BillingView onBack={() => setTab("profile")} /></div>
          ) : tab === "account" ? (
            <div id="panel-account" role="tabpanel"><AccountView /></div>
          ) : tab === "profile" ? (
            <div id="panel-profile" role="tabpanel"><ProfileView /></div>
          ) : (
            <div id="panel-general" role="tabpanel" className="max-w-[720px]">
              <h2 className="text-[16px] font-[600]">{nav.find(n => n.id === tab)?.label || "General"}</h2>
              <p className="text-[13px] text-zinc-500 mt-1">This section is under construction. Your settings will appear here.</p>
              <Button size="sm" className="mt-4 h-11 sm:h-8 min-h-[44px] sm:min-h-0" onClick={()=>setTab("billing")}>Go to Billing</Button>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}

function ProfileView() {
  const { theme, toggle, setTheme } = useTheme()
  const { user, refresh } = useAuth()
  const [fullName, setFullName] = React.useState("")
  const [preferred, setPreferred] = React.useState("")
  const [work, setWork] = React.useState("Select")
  const [instructions, setInstructions] = React.useState("")
  const [saved, setSaved] = React.useState(false)
  const [saveError, setSaveError] = React.useState<string | null>(null)
  React.useEffect(()=>{
    if (user?.name) { setFullName(user.name); setPreferred(user.name.split(" ")[0] || "") }
  },[user?.name])
  React.useEffect(()=>{
    try{
      const inst=localStorage.getItem("aegis_instructions")
      if(inst) setInstructions(inst)
      const w=localStorage.getItem("aegis_work")
      if(w) setWork(w)
    }catch{}
  },[])
  const save=async()=>{
    const cleanName = sanitizeInput(fullName, 64)
    const cleanPref = sanitizeInput(preferred, 32)
    const cleanInst = sanitizeInput(instructions, 500)
    const cleanWork = sanitizeInput(work, 32)
    setSaveError(null)
    try{
      localStorage.setItem("aegis_instructions", cleanInst)
      localStorage.setItem("aegis_work", cleanWork)
      localStorage.setItem("aegis_preferred", cleanPref)
    }catch{}
    if (cleanName) {
      try {
        const res = await fetch("/api/auth/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: cleanName }),
        })
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          setSaveError(typeof body.error === "string" ? body.error : "Could not save name")
          return
        }
        await refresh()
      } catch {
        setSaveError("Could not reach the server")
        return
      }
    }
    setSaved(true); setTimeout(()=>setSaved(false),2000)
  }
  return (
    <div className="max-w-[720px]">
      <div className="flex items-center justify-between">
        <h2 className="text-[20px] font-[700] tracking-[-0.02em]">Profile</h2>
        <button onClick={() => window.history.back()} aria-label="Close profile" className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:hover:text-white">✕</button>
      </div>

      <div className="mt-8 space-y-6">
        <div className="flex items-center justify-between py-4 border-b border-zinc-200 dark:border-zinc-800">
          <span className="text-[14px] font-[500]">Avatar</span>
          <div className="w-10 h-10 rounded-full bg-[#7C3AED] flex items-center justify-center text-[13px] font-bold text-white" aria-hidden="true">{(fullName||"NL").split(" ").map(s=>s[0]).join("").slice(0,2).toUpperCase()}</div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between py-4 border-b border-zinc-200 dark:border-zinc-800 gap-2">
          <label htmlFor="full-name" className="text-[14px] font-[500]">Full name</label>
          <Input id="full-name" value={fullName} onChange={e=>setFullName(e.target.value)} placeholder="Enter your full name" className="w-full sm:w-[320px] h-11 sm:h-10 min-h-[44px] sm:min-h-0 bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-[14px]" />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between py-4 border-b border-zinc-200 dark:border-zinc-800 gap-2">
          <label htmlFor="preferred-name" className="text-[14px] font-[500]">What should Claude call you?</label>
          <Input id="preferred-name" value={preferred} onChange={e=>setPreferred(e.target.value)} placeholder="Enter preferred name" className="w-full sm:w-[320px] h-11 sm:h-10 min-h-[44px] sm:min-h-0 bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-[14px]" />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between py-3 border-b border-zinc-100 dark:border-zinc-800 gap-2">
          <label htmlFor="work-select" className="text-[13px] font-[500]">What best describes your work?</label>
          <select id="work-select" value={work} onChange={e=>setWork(e.target.value)} aria-label="Work description" className="text-[13px] border border-zinc-200 dark:border-zinc-700 rounded-[8px] px-3 py-2 min-h-[44px] sm:min-h-0 bg-white dark:bg-zinc-900">
            <option>Select</option><option>Security Engineer</option><option>Student</option><option>SOC Analyst</option><option>Pentester</option><option>Researcher</option>
          </select>
        </div>

        <div className="py-3 border-b border-zinc-100 dark:border-zinc-800">
          <label htmlFor="instructions" className="text-[13px] font-[500]">Instructions for Claude</label>
          <p className="text-[11px] text-zinc-500 mt-1">Claude will keep these in mind for this and any of your associated accounts across chats and Cowork within Anthropic’s guidelines. <a className="underline">Learn more</a></p>
          <textarea id="instructions" value={instructions} onChange={e=>setInstructions(e.target.value)} placeholder="e.g. when learning new concepts, I find analogies particularly helpful" className="mt-3 w-full min-h-[100px] rounded-[8px] border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-3 text-[13px] focus:outline-none focus:ring-2 focus:ring-zinc-900" />
        </div>

        <div className="pt-2">
          <h3 className="text-[15px] font-[600]">Preferences</h3>
          <div className="mt-4 flex items-center justify-between py-3 border-b border-zinc-100 dark:border-zinc-800">
            <span className="text-[13px] font-[500]">Appearance — {theme}</span>
            <div className="flex items-center gap-1 p-1 rounded-full bg-zinc-100 dark:bg-zinc-800" role="group" aria-label="Appearance">
              <button onClick={()=>setTheme("light")} aria-label="Light theme" aria-pressed={theme==="light"} className={`w-7 h-7 rounded-full flex items-center justify-center min-h-0 ${theme==="light" ? "bg-white shadow-sm text-amber-500" : "text-zinc-500"}`}><span className="text-[12px]" aria-hidden="true">☀</span></button>
              <button onClick={()=>setTheme("dark")} aria-label="Dark theme" aria-pressed={theme==="dark"} className={`w-7 h-7 rounded-full flex items-center justify-center min-h-0 ${theme==="dark" ? "bg-white dark:bg-zinc-700 shadow-sm text-zinc-700" : "text-zinc-500"}`}><span className="text-[12px]" aria-hidden="true">◐</span></button>
              <button onClick={toggle} aria-label="Toggle theme" className="w-7 h-7 rounded-full flex items-center justify-center text-zinc-500 min-h-0"><span className="text-[12px]" aria-hidden="true">🖥</span></button>
            </div>
          </div>
          <div className="mt-4 flex gap-2 items-center">
            <Button size="sm" className="h-11 sm:h-8 min-h-[44px] sm:min-h-0" onClick={save} aria-label="Save preferences">{saved ? "✓ Saved" : "Save preferences"}</Button>
            <span className="text-[11px] text-zinc-500">Name syncs to your account • Other preferences stay in this browser</span>
          </div>
          {saveError && <div className="mt-2 text-[12px] text-red-600">{saveError}</div>}
        </div>
      </div>
    </div>
  )
}

function AccountView() {
  const { logout } = useAuth()
  const [devices, setDevices] = React.useState<{ id:string; name:string; added:string }[]>(()=>{
    if(typeof window!=="undefined"){
      try{ const raw=localStorage.getItem("aegis_trusted_devices"); if(raw) return JSON.parse(raw)}catch{}
    }
    return []
  })
  const [dialogOpen, setDialogOpen]=React.useState(false)
  const [newDeviceName, setNewDeviceName]=React.useState("")
  const [deviceError, setDeviceError]=React.useState<string|null>(null)
  React.useEffect(()=>{ try{ localStorage.setItem("aegis_trusted_devices", JSON.stringify(devices))}catch{}},[devices])
  const openAddDialog=()=>{ setNewDeviceName(""); setDeviceError(null); setDialogOpen(true)}
  const confirmAdd=()=>{
    const clean=sanitizeInput(newDeviceName, 64).trim()
    if(!clean) { setDeviceError("Device name required"); return }
    setDevices(prev=>[...prev, {id:Date.now().toString(), name:clean, added:new Date().toLocaleDateString()}])
    setDialogOpen(false)
  }
  const removeDevice=(id:string)=> setDevices(prev=>prev.filter(d=>d.id!==id))
  const handleLogoutAll=()=>{
    if(confirm("Log out of all devices? Clears localStorage auth.")){
      try{ localStorage.clear()}catch{}
      logout()
    }
  }
  return (
    <div className="max-w-[720px]">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-[16px] font-[600]">Account</h2>
        <button onClick={() => window.history.back()} aria-label="Close account" className="w-6 h-6 flex items-center justify-center text-zinc-500">✕</button>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between py-3 border-b border-zinc-100 dark:border-zinc-800 gap-2">
          <span className="text-[13px]">Log out of all devices</span>
          <Button variant="secondary" size="sm" className="h-11 sm:h-7 min-h-[44px] sm:min-h-0 rounded-full border" onClick={handleLogoutAll} aria-label="Log out of all devices">Log out</Button>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between py-3 border-b border-zinc-100 dark:border-zinc-800 gap-2">
          <span className="text-[13px]">Delete account</span>
          <Button variant="secondary" size="sm" className="h-11 sm:h-7 min-h-[44px] sm:min-h-0 rounded-full border" onClick={()=>{ if(confirm("Contact support to delete account?")) window.location.href="mailto:support@aegis.lab"}} aria-label="Contact support to delete account">Contact support</Button>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between py-3 border-b border-zinc-100 dark:border-zinc-800 gap-2">
          <span className="text-[13px]">Organization ID</span>
          <span className="font-mono text-[11px] bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded">c9eb1ad5-7163-4234-ba8e-0ed12c30d915</span>
        </div>
      </div>

      <h3 className="mt-8 text-[15px] font-[600]">Trusted devices — {devices.length}</h3>
      <p className="text-[12px] text-zinc-500">Devices that can control your local machine through remote sessions.</p>
      {devices.length===0 ? (
        <Card className="mt-3 border-dashed rounded-[12px] bg-zinc-50 dark:bg-zinc-900/50">
          <CardContent className="p-6 text-center">
            <div className="w-10 h-10 rounded-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center mx-auto" aria-hidden="true">
              <MonitorSmartphone className="w-5 h-5 text-zinc-500" aria-hidden="true" />
            </div>
            <div className="mt-3 text-[14px] font-[600] tracking-[-0.01em] text-zinc-900 dark:text-white">No trusted devices</div>
            <div className="mt-1 text-[12px] leading-5 text-[var(--text-2)] max-w-[320px] mx-auto">Devices that can control your local machine through remote sessions will appear here. Trust a device to enable remote access.</div>
            <Button size="sm" className="mt-4 h-11 sm:h-8 min-h-[44px] sm:min-h-0 rounded-[8px] bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100" onClick={openAddDialog} aria-label="Add trusted device">Add trusted device</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="mt-3 space-y-2">
          {devices.map(d=>(
            <div key={d.id} className="flex items-center justify-between p-3 rounded-[10px] border border-[var(--border)] bg-[var(--surface)]">
              <span className="text-[13px] font-medium">{d.name} • {d.added}</span>
              <Button variant="ghost" size="sm" className="h-11 sm:h-7 min-h-[44px] sm:min-h-0 border" onClick={()=>removeDevice(d.id)} aria-label={`Remove device ${d.name}`}>Remove</Button>
            </div>
          ))}
          <Button size="sm" className="mt-2 h-11 sm:h-8 min-h-[44px] sm:min-h-0" onClick={openAddDialog} aria-label="Add another device">Add another device</Button>
        </div>
      )}

      {dialogOpen && (
        <div role="dialog" aria-modal="true" aria-label="Add trusted device" className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={()=>setDialogOpen(false)} aria-hidden="true" />
          <div className="relative w-full max-w-[400px] rounded-[12px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 shadow-xl">
            <h3 className="text-[14px] font-[600]">Add trusted device</h3>
            <p className="text-[12px] text-zinc-500 mt-1">Enter a name for this device (e.g., MacBook Pro).</p>
            <Input value={newDeviceName} onChange={e=>setNewDeviceName(e.target.value)} placeholder="Device name" className="mt-3 h-11 sm:h-9 min-h-[44px] sm:min-h-0" aria-label="Device name" autoFocus />
            {deviceError && <div className="text-[12px] text-red-600 mt-2" role="alert">{deviceError}</div>}
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="ghost" size="sm" className="h-11 sm:h-8 min-h-[44px] sm:min-h-0" onClick={()=>setDialogOpen(false)}>Cancel</Button>
              <Button size="sm" className="h-11 sm:h-8 min-h-[44px] sm:min-h-0" onClick={confirmAdd}>Add device</Button>
            </div>
          </div>
        </div>
      )}

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
  const { user } = useAuth()
  const plan = user?.plan || "free"
  return (
    <div className="max-w-[720px]">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 rounded-full border border-zinc-300 flex items-center justify-center" aria-hidden="true">◈</div>
        <div>
          <div className="text-[14px] font-[600]">{plan==="plus"?"Plus plan":plan==="go"?"Go plan":"Free plan"}</div>
          <div className="text-[12px] text-zinc-500">{plan==="free"?"Try Claude":"Active"}</div>
        </div>
        <Link href="/billing" className="ml-auto"><Button size="sm" className="h-11 sm:h-8 min-h-[44px] sm:min-h-0 rounded-full bg-zinc-900 text-white">Upgrade plan</Button></Link>
      </div>

      <ul className="space-y-2 text-[13px] text-zinc-700 dark:text-zinc-300">
        <li className="flex gap-2"><span className="text-zinc-400" aria-hidden="true">✓</span> Chat on web, iOS, Android, and on your desktop</li>
        <li className="flex gap-2"><span className="text-zinc-400" aria-hidden="true">✓</span> Generate code and visualize data</li>
        <li className="flex gap-2"><span className="text-zinc-400" aria-hidden="true">✓</span> Write, edit, and create content</li>
        <li className="flex gap-2"><span className="text-zinc-400" aria-hidden="true">✓</span> Ability to search the web</li>
        <li className="flex gap-2"><span className="text-zinc-400" aria-hidden="true">✓</span> Memory across conversations</li>
        <li className="flex gap-2"><span className="text-zinc-400" aria-hidden="true">✓</span> Create files and execute code</li>
        <li className="flex gap-2"><span className="text-zinc-400" aria-hidden="true">✓</span> Unlock more from Claude with desktop extensions</li>
        <li className="flex gap-2"><span className="text-zinc-400" aria-hidden="true">✓</span> Connect Slack and Google Workspace services</li>
        <li className="flex gap-2"><span className="text-zinc-400" aria-hidden="true">✓</span> Integrate any context or tool through connectors with remote MCP</li>
        <li className="flex gap-2"><span className="text-zinc-400" aria-hidden="true">✓</span> Extended thinking for complex work</li>
      </ul>

      <h3 className="mt-8 text-[14px] font-[600]">Invoices</h3>
      <p className="text-[13px] text-zinc-900 dark:text-white mt-2">We have not sent you an invoice yet.</p>
      <Button variant="secondary" size="sm" className="mt-3 h-11 sm:h-8 min-h-[44px] sm:min-h-0" onClick={onBack} aria-label="Back to profile">Back to profile</Button>
    </div>
  )
}
