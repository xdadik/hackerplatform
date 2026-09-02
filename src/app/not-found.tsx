import Link from "next/link"
import { Button } from "@/components/ui/button"
import { TopNav } from "@/components/layout/top-nav"
import { Search, ArrowLeft } from "lucide-react"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <TopNav />
      <div className="mx-auto max-w-[640px] px-4 sm:px-6 lg:px-8 py-16 sm:py-24 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-[12px] bg-[var(--surface-2)] border border-[var(--border)] mb-6">
          <Search className="w-5 h-5 text-[var(--text-3)]" />
        </div>
        <h1 className="text-[28px] font-[700] tracking-[-0.03em]">404 — Page not found</h1>
        <p className="mt-3 text-[14px] leading-6 text-[var(--text-2)]">
          The page you’re looking for doesn’t exist or has been moved. Check the URL or use search (⌘K) to find labs, challenges, or research.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link href="/"><Button className="rounded-[8px]"><ArrowLeft className="w-4 h-4 mr-1" /> Back to home</Button></Link>
          <Link href="/explore"><Button variant="secondary" className="rounded-[8px]">Explore platform</Button></Link>
        </div>
        <div className="mt-8 pt-6 border-t border-[var(--border)] text-[12px] text-[var(--text-3)]">
          If you believe this is an error, contact support or check system status.
        </div>
      </div>
    </div>
  )
}
