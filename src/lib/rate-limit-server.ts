// server rate limiter (in-memory, per-instance)

import { getClientIp as getIpSupplied } from "./rate-limit-ip"

type Entry = { count: number; resetAt: number }
const buckets = new Map<string, Entry>()

function now(): number { return Date.now() }

export function checkRateLimitServer(key: string, max = 5, windowMs = 60_000): { limited: boolean; remaining: number; resetMs: number } {
  const entry = buckets.get(key)
  if (!entry || now() > entry.resetAt) {
    return { limited: false, remaining: max, resetMs: 0 }
  }
  const limited = entry.count >= max
  const remaining = Math.max(0, max - entry.count)
  return { limited, remaining, resetMs: entry.resetAt - now() }
}

export function recordAttemptServer(key: string, windowMs = 60_000): void {
  const entry = buckets.get(key)
  if (!entry || now() > entry.resetAt) {
    buckets.set(key, { count: 1, resetAt: now() + windowMs })
  } else {
    entry.count += 1
  }
}

export function resetRateLimitServer(key: string): void {
  buckets.delete(key)
}

export function getClientIp(request: Request): string {
  return getIpSupplied(request)
}