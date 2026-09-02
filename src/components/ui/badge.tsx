import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium tracking-wide transition-colors focus:outline-none",
  {
    variants: {
      variant: {
        default: "border-transparent bg-[var(--text)] text-[var(--background)]",
        secondary: "border-transparent bg-[var(--surface-2)] text-[var(--text-2)]",
        outline: "text-[var(--text-2)] border-[var(--border)]",
        success: "border-transparent bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900",
        warning: "border-transparent bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
        accent: "border-[var(--accent-border)] bg-[var(--accent-muted)] text-[var(--accent)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
