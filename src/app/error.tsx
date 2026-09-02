"use client"
import { Button } from "@/components/ui/button"

export default function Error({ error, reset }: { error: Error & { digest?: string }, reset: () => void }) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="w-12 h-12 rounded-[12px] bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 flex items-center justify-center mb-4 text-red-600">!</div>
      <h2 className="text-[18px] font-[650] tracking-[-0.02em]">Something went wrong</h2>
      <p className="mt-2 text-[13px] leading-6 text-[var(--text-2)] max-w-[520px]">
        We’ve logged the error and will investigate. Try again, or return to the dashboard. No sensitive details are exposed.
      </p>
      <div className="mt-6 flex gap-2">
        <Button onClick={() => reset()} className="rounded-[8px]">Try again</Button>
        <Button variant="secondary" onClick={() => window.location.href = "/"} className="rounded-[8px]">Go home</Button>
      </div>
      {error.digest && <div className="mt-4 text-[11px] font-mono text-[var(--text-3)]">Ref: {error.digest}</div>}
    </div>
  )
}
