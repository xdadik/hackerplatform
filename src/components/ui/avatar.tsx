import * as React from "react"
import { cn } from "@/lib/utils"

const Avatar = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("relative flex h-9 w-9 shrink-0 overflow-hidden rounded-full border border-[var(--border)]", className)}
      {...props}
    />
  )
)
Avatar.displayName = "Avatar"

const AvatarFallback = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex h-full w-full items-center justify-center rounded-full bg-[var(--surface-2)] text-[12px] font-medium text-[var(--text-2)]", className)}
      {...props}
    />
  )
)
AvatarFallback.displayName = "AvatarFallback"

export { Avatar, AvatarFallback }
