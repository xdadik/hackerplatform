import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-[8px] text-[13.5px] font-[500] tracking-[-0.01em] transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-[var(--text)] text-[var(--background)] hover:bg-[#27272A] dark:hover:bg-[#27272A] shadow-sm",
        primary: "bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] shadow-sm",
        secondary: "bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] hover:bg-[var(--surface-2)] shadow-sm",
        ghost: "text-[var(--text-2)] hover:text-[var(--text)] hover:bg-[var(--surface-2)]",
        outline: "border border-[var(--border-strong)] bg-transparent hover:bg-[var(--surface-2)] text-[var(--text)]",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-[7px] px-3 text-[13px]",
        lg: "h-10 rounded-[10px] px-6 text-[14px]",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, children, ...props }, ref) => {
    const classes = cn(buttonVariants({ variant, size, className }))
    if (asChild && React.isValidElement(children)) {
      const child = children as React.ReactElement<any>
      return React.cloneElement(child, {
        className: cn(classes, (child.props as any)?.className),
        // @ts-ignore
        ref,
        ...props,
      } as any)
    }
    return (
      <button
        className={classes}
        ref={ref}
        {...props}
      >
        {children}
      </button>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
