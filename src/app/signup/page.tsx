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
import { Eye, EyeOff, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react"
import { sanitizeInput, sanitizeEmail } from "@/lib/sanitize"
import { loginLimiter } from "@/lib/rate-limit"

export default function SignupPage() {
  const { signup } = useAuth()
  const [show, setShow] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const rl = loginLimiter.check()
    if (rl.limited) {
      setError(`Too many attempts. Try again in ${Math.ceil(rl.resetMs/60000)} min.`)
      return
    }
    setError(null)
    setLoading(true)
    const form = e.target as HTMLFormElement
    const nameRaw = (form.elements.namedItem("name") as HTMLInputElement).value
    const emailRaw = (form.elements.namedItem("email") as HTMLInputElement).value
    const password = (form.elements.namedItem("password") as HTMLInputElement).value
    const name = sanitizeInput(nameRaw, 64)
    const email = sanitizeEmail(emailRaw) || emailRaw.trim()
    if (!name || !email.includes("@") || password.length < 8) {
      setLoading(false)
      loginLimiter.record(false)
      setError("Please enter a name, valid email, and password with at least 8 characters.")
      const card = document.getElementById("signup-card")
      if (card && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        import("animejs").then(({ animate }) => {
          animate(card, { x: [0, -6, 6, -4, 4, 0], duration: 420, ease: "outQuad" })
        })
      }
      return
    }
    const result = await signup(name, email, password)
    setLoading(false)
    if (!result.ok) {
      loginLimiter.record(false)
      setError(result.error || "Could not create account.")
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
              <Badge variant="outline" className="rounded-full mb-4">Create account</Badge>
              <h1 className="text-[28px] font-[700] tracking-[-0.04em] leading-[1.05]">Start training. <br />Stay for the practice.</h1>
              <p className="mt-3 text-[14px] leading-6 text-[var(--text-2)] max-w-[44ch]">Self-paced, technical, and verifiable. Structured paths, isolated labs, and research you can cite — without the noise.</p>
              <ul className="mt-8 space-y-2.5 text-[13px]">
                <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5" /> <span><b>Structured</b> learning paths • hands-on lessons</span></li>
                <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5" /> <span><b>Isolated</b> labs • real terminals</span></li>
                <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5" /> <span><b>Challenges</b> across multiple categories</span></li>
                <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5" /> <span><b>Verifiable</b> reputation & certificates</span></li>
              </ul>
            </div>
          </FadeIn>

          <ScaleIn>
            <Card id="signup-card" className="shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-[18px] tracking-[-0.02em]">Create an account</CardTitle>
                <CardDescription>Professional-grade — no spam, no gamification. Just serious tooling.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={onSubmit} className="space-y-4 pt-2" noValidate>
                  <div>
                    <label htmlFor="name" className="text-[12px] font-medium">Full name</label>
                    <Input id="name" name="name" placeholder="Your name" required autoComplete="name" className="mt-1 h-9 bg-[var(--surface)]" />
                  </div>
                  <div>
                    <label htmlFor="email" className="text-[12px] font-medium">Email</label>
                    <Input id="email" name="email" type="email" placeholder="you@company.com" required autoComplete="email" className="mt-1 h-9 bg-[var(--surface)]" />
                  </div>
                  <div>
                    <label htmlFor="password" className="text-[12px] font-medium">Password</label>
                    <div className="relative mt-1">
                      <Input id="password" name="password" type={show ? "text" : "password"} placeholder="At least 8 characters" required autoComplete="new-password" className="h-9 bg-[var(--surface)] pr-9" />
                      <button type="button" onClick={() => setShow(v => !v)} className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 rounded-[6px] hover:bg-[var(--surface-2)] text-[var(--text-3)]" aria-label={show ? "Hide" : "Show"}>
                        {show ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <p className="mt-1.5 text-[11px] text-[var(--text-3)]">8+ characters, server-side hashed with secure handling. No client trust.</p>
                  </div>

                  {error && (
                    <div className="flex items-start gap-2 p-2.5 rounded-[8px] bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 text-[12px] text-red-700 dark:text-red-300">
                      <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" /> {error}
                    </div>
                  )}

                  <Button type="submit" disabled={loading} className="w-full h-9 rounded-[8px] font-[500]">
                    {loading ? "Creating account..." : "Create account"} {!loading && <ArrowRight className="w-3.5 h-3.5 ml-1" />}
                  </Button>

                  <p className="text-[11px] leading-5 text-[var(--text-3)] text-center">
                    By creating an account you agree to our <Link href="/settings" className="underline hover:text-[var(--text)]">Terms</Link> and <Link href="/settings" className="underline hover:text-[var(--text)]">Privacy</Link>.
                  </p>

                  <div className="pt-4 border-t border-[var(--border)] text-center text-[12px]">
                    <span className="text-[var(--text-2)]">Already have an account?</span> <Link href="/login" className="font-medium text-[var(--text)] hover:underline">Log in</Link>
                  </div>
                </form>
              </CardContent>
            </Card>
          </ScaleIn>
        </div>
      </div>
    </div>
  )
}
