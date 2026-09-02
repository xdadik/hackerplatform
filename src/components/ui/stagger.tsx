"use client"
import * as React from "react"
import { animate, stagger } from "animejs"

export function Stagger({
  children,
  className,
  selector = ".stagger-item",
  y = 8,
  duration = 420,
  delayStep = 60,
  startDelay = 80,
}: {
  children: React.ReactNode
  className?: string
  selector?: string
  y?: number
  duration?: number
  delayStep?: number
  startDelay?: number
}) {
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!ref.current) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const targets = ref.current.querySelectorAll(selector)
    if (!targets.length) return
    try {
      // set initial state for JS animation
      animate(targets, {
        opacity: [0, 1],
        y: [y, 0],
        duration,
        delay: stagger(delayStep, { start: startDelay }),
        ease: "outQuad",
      })
    } catch {
      // fail silently - no animation is better than broken UI
    }
  }, [selector, y, duration, delayStep, startDelay])

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  )
}

export function FadeIn({
  children,
  className,
  delay = 0,
  y = 6,
  duration = 500,
}: {
  children: React.ReactNode
  className?: string
  delay?: number
  y?: number
  duration?: number
}) {
  const ref = React.useRef<HTMLDivElement>(null)
  React.useEffect(() => {
    if (!ref.current) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    try {
      animate(ref.current, {
        opacity: [0, 1],
        y: [y, 0],
        duration,
        delay,
        ease: "outQuad",
      })
    } catch {}
  }, [delay, y, duration])
  return (
    <div ref={ref} className={className} style={{ opacity: 0 }}>
      {children}
    </div>
  )
}

export function CountUp({
  value,
  duration = 900,
  className,
  formatter = (n: number) => n.toLocaleString(),
}: {
  value: number
  duration?: number
  className?: string
  formatter?: (n: number) => string
}) {
  const ref = React.useRef<HTMLSpanElement>(null)
  React.useEffect(() => {
    if (!ref.current) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      ref.current.textContent = formatter(value)
      return
    }
    const obj = { n: 0 }
    try {
      animate(obj, {
        n: value,
        duration,
        delay: 120,
        ease: "outExpo",
        onUpdate: () => {
          if (ref.current) ref.current.textContent = formatter(Math.round(obj.n))
        },
      })
    } catch {
      if (ref.current) ref.current.textContent = formatter(value)
    }
  }, [value, duration, formatter])
  return (
    <span ref={ref} className={className}>
      {formatter(value)}
    </span>
  )
}

export function ProgressAnimated({ value, className }: { value: number; className?: string }) {
  const ref = React.useRef<HTMLDivElement>(null)
  React.useEffect(() => {
    if (!ref.current) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      ref.current.style.width = `${value}%`
      return
    }
    try {
      animate(ref.current, {
        width: [`0%`, `${value}%`],
        duration: 900,
        delay: 200,
        ease: "outExpo",
      })
    } catch {
      ref.current.style.width = `${value}%`
    }
  }, [value])
  // container expects parent to have bg-surface-3 and rounded
  return <div ref={ref} className={className ?? "h-full bg-[var(--accent)] rounded-full"} style={{ width: "0%" }} />
}

export function ScaleIn({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  const ref = React.useRef<HTMLDivElement>(null)
  React.useEffect(() => {
    if (!ref.current) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    try {
      animate(ref.current, {
        opacity: [0, 1],
        scale: [0.96, 1],
        duration: 320,
        ease: "outQuad",
      })
    } catch {}
  }, [])
  return (
    <div ref={ref} className={className} style={{ opacity: 0 }}>
      {children}
    </div>
  )
}
