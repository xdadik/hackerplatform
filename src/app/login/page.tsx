"use client"
import Link from "next/link"
import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TopNav } from "@/components/layout/top-nav"
import { CommandPalette } from "@/components/layout/command-palette"
import { FadeIn, ScaleIn } from "@/components/ui/stagger"
import { useAuth } from "@/components/auth-provider"
import { Eye, EyeOff, ArrowRight, ShieldCheck, AlertCircle } from "lucide-react"
import { sanitizeEmail } from "@/lib/sanitize"
import { loginLimiter } from "@/lib/rate-limit"

export default function LoginPage() {
  const { login } = useAuth()
  const [show, setShow] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // Rate limiting — 5 attempts / 15 min
    const rl = loginLimiter.check()
    if (rl.limited) {
      setError(`Too many attempts. Try again in ${Math.ceil(rl.resetMs/60000)} min.`)
      return
    }
    setError(null)
    setLoading(true)
    const form = e.target as HTMLFormElement
    const emailRaw = (form.elements.namedItem("email") as HTMLInputElement).value
    const password = (form.elements.namedItem("password") as HTMLInputElement).value
    const email = sanitizeEmail(emailRaw) || emailRaw.trim()
    if (!email.includes("@") || password.length < 8) {
      setLoading(false)
      loginLimiter.record(false)
      const rem = loginLimiter.check().remaining
      setError(`Invalid email or password. Attempts left: ${rem}`)
      const card = document.getElementById("login-card")
      if (card && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        import("animejs").then(({ animate }) => {
          animate(card, { x: [0, -6, 6, -4, 4, 0], duration: 420, ease: "outQuad" })
        })
      }
      return
    }
    const result = await login(email, password)
    setLoading(false)
    if (!result.ok) {
      loginLimiter.record(false)
      setError(result.error || "Invalid email or password.")
      return
    }
    loginLimiter.reset()
    window.location.href = "/dashboard"
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <TopNav />
      <CommandPalette />
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid lg:grid-cols-[1.1fr_420px] gap-10 lg:gap-16 items-start max-w-[960px] mx-auto">
          <FadeIn>
            <div className="hidden lg:block pt-8">
              <Badge variant="outline" className="rounded-full mb-4">Aegis Platform</Badge>
              <h1 className="text-[28px] font-[700] tracking-[-0.04em] leading-[1.05]">Welcome back.</h1>
              <p className="mt-3 text-[14px] leading-6 text-[var(--text-2)] max-w-[44ch]">Professional cybersecurity training — labs, challenges, research, and team operations. Your progress is saved, verifiable, and portable.</p>
              <div className="mt-8 space-y-3">
                <div className="flex gap-3 p-3 rounded-[10px] border border-[var(--border)] bg-[var(--surface)]">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 mt-0.5" />
                  <div>
                    <div className="text-[12.5px] font-[600]">Enterprise-ready</div>
                    <div className="text-[11px] text-[var(--text-2)]">RBAC, audit logs, isolated lab environments.</div>
                  </div>
                </div>
                <div className="flex gap-3 p-3 rounded-[10px] border border-[var(--border)] bg-[var(--surface)]">
                  <ShieldCheck className="w-4 h-4 text-[var(--accent)] mt-0.5" />
                  <div>
                    <div className="text-[12.5px] font-[600]">Verifiable credentials</div>
                    <div className="text-[11px] text-[var(--text-2)]">Certificates and reputation you can prove.</div>
                  </div>
                </div>
              </div>
              <p className="mt-8 text-[11px] text-[var(--text-3)]">© 2026 Aegis. All systems operational • Support • Security</p>
            </div>
          </FadeIn>

          <ScaleIn>
            <Card id="login-card" className="shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-[18px] tracking-[-0.02em]">Log in to your account</CardTitle>
                <CardDescription>Enter your email and password to continue. No social clutter.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={onSubmit} className="space-y-4 pt-2" noValidate>
                  <div>
                    <label htmlFor="email" className="text-[12px] font-medium">Email</label>
                    <Input id="email" name="email" type="email" placeholder="you@company.com" required autoComplete="email" className="mt-1 h-9 bg-[var(--surface)]" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between">
                      <label htmlFor="password" className="text-[12px] font-medium">Password</label>
                      <Link href="#" className="text-[11px] text-[var(--accent)] hover:underline">Forgot?</Link>
                    </div>
                    <div className="relative mt-1">
                      <Input id="password" name="password" type={show ? "text" : "password"} placeholder="••••••••" required autoComplete="current-password" className="h-9 bg-[var(--surface)] pr-9" />
                      <button type="button" onClick={() => setShow(v => !v)} className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 rounded-[6px] hover:bg-[var(--surface-2)] text-[var(--text-3)]" aria-label={show ? "Hide password" : "Show password"}>
                        {show ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <p className="mt-1.5 text-[11px] text-[var(--text-3)]">At least 6 characters. Server validates securely.</p>
                  </div>

                  {error && (
                    <div className="flex items-start gap-2 p-2.5 rounded-[8px] bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 text-[12px] text-red-700 dark:text-red-300">
                      <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" /> {error}
                    </div>
                  )}

                  <Button type="submit" disabled={loading} className="w-full h-9 rounded-[8px] font-[500]">
                    {loading ? "Signing in..." : "Log in"} {!loading && <ArrowRight className="w-3.5 h-3.5 ml-1" />}
                  </Button>

                  <div className="relative flex items-center gap-3 py-1">
                    <span className="h-px flex-1 bg-[var(--border)]" />
                    <span className="text-[11px] text-[var(--text-3)]">or</span>
                    <span className="h-px flex-1 bg-[var(--border)]" />
                  </div>

                  <Button type="button" variant="secondary" className="w-full h-9 rounded-[8px] border border-[var(--border)] bg-[var(--surface)]" onClick={() => window.location.href = "/signup"}>
                    Create account
                  </Button>

                  <p className="text-center text-[11px] text-[var(--text-3)]">
                    By continuing you agree to our <Link href="#" className="underline hover:text-[var(--text)]">Terms</Link> and <Link href="#" className="underline hover:text-[var(--text)]">Privacy</Link>.
                  </p>
                </form>

                <div className="mt-6 pt-4 border-t border-[var(--border)] text-center text-[12px]">
                  <span className="text-[var(--text-2)]">Don't have an account?</span> <Link href="/signup" className="font-medium text-[var(--text)] hover:underline">Sign up</Link>
                </div>
              </CardContent>
            </Card>
          </ScaleIn>
        </div>
      </div>
    </div>
  )
}
