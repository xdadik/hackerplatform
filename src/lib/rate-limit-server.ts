// server rate limiter — Supabase-backed (durable, shared across all
// instances) with an in-memory fallback for local dev / unconfigured DB /
// deployments that have not run migration 0003 yet.
//
// Buckets live in the public.rate_limits table and are manipulated through
// SECURITY DEFINER RPCs (rate_limit_check / rate_limit_hit /
// rate_limit_reset) that only the service role can execute. If the RPCs are
// unavailable the limiter transparently degrades to per-instance memory —
// nothing breaks, limits are just best-effort (as before).
//
// IMPORTANT: always pass windowMs explicitly at the call site. The old
// recordAttemptServer(key) default (60 s) silently turned the intended
// "5 attempts / 15 min" login lockout into "5 attempts / 60 s".

import { getServiceSupabase } from "./supabase"
import { getClientIp as getIpSupplied } from "./rate-limit-ip"

type Entry = { count: number; resetAt: number }
const buckets = new Map<string, Entry>()

function now(): number { return Date.now() }

// ---------------------------------------------------------------------------
// In-memory fallback (per-instance, resets on restart)
// ---------------------------------------------------------------------------

function memCheck(key: string, max: number, windowMs: number): { limited: boolean; remaining: number; resetMs: number } {
  const entry = buckets.get(key)
  if (!entry || now() > entry.resetAt) {
    return { limited: false, remaining: max, resetMs: 0 }
  }
  const limited = entry.count >= max
  const remaining = Math.max(0, max - entry.count)
  return { limited, remaining, resetMs: entry.resetAt - now() }
}

function memRecord(key: string, windowMs: number): void {
  const entry = buckets.get(key)
  if (!entry || now() > entry.resetAt) {
    buckets.set(key, { count: 1, resetAt: now() + windowMs })
  } else {
    entry.count += 1
  }
}

// ---------------------------------------------------------------------------
// DB-backed limiter (durable across instances — requires migration 0003)
// ---------------------------------------------------------------------------

let dbDisabledUntil = 0 // circuit breaker: skip RPCs briefly after a failure

async function rpc(fn: string, args: Record<string, unknown>): Promise<boolean | null> {
  if (now() < dbDisabledUntil) return null
  const supabase = getServiceSupabase()
  if (!supabase) return null
  try {
    const { data, error } = await supabase.rpc(fn, args)
    if (error) throw new Error(error.message)
    return data === true || data === "true"
  } catch {
    // RPC missing (0003 not run yet) or DB unreachable -> memory fallback.
    // Back off 60 s so we do not hammer the DB on every request.
    dbDisabledUntil = now() + 60_000
    return null
  }
}

export type RateLimitResult = { limited: boolean; remaining: number; resetMs: number }

/** Peek at a bucket WITHOUT counting an attempt. Returns limited=false when allowed. */
export async function rateLimitCheck(key: string, max: number, windowMs: number): Promise<RateLimitResult> {
  const allowed = await rpc("rate_limit_check", { p_bucket: key, p_max: max, p_window_ms: windowMs })
  if (allowed !== null) {
    return allowed
      ? { limited: false, remaining: max, resetMs: 0 }
      : { limited: true, remaining: 0, resetMs: windowMs }
  }
  return memCheck(key, max, windowMs)
}

/** Count one attempt against the bucket. Returns whether it is still allowed. */
export async function rateLimitRecord(key: string, max: number, windowMs: number): Promise<boolean> {
  const allowed = await rpc("rate_limit_hit", { p_bucket: key, p_max: max, p_window_ms: windowMs })
  if (allowed !== null) return allowed
  memRecord(key, windowMs)
  return !memCheck(key, max, windowMs).limited
}

/** Clear a bucket (e.g. successful login resets the failed-attempt counter). */
export async function rateLimitReset(key: string): Promise<void> {
  const done = await rpc("rate_limit_reset", { p_bucket: key })
  if (done === null) buckets.delete(key)
}

// ---------------------------------------------------------------------------
// Legacy sync API — kept for compatibility, window must now be explicit
// ---------------------------------------------------------------------------

export function checkRateLimitServer(key: string, max = 5, windowMs = 60_000): RateLimitResult {
  return memCheck(key, max, windowMs)
}

export function recordAttemptServer(key: string, windowMs = 60_000): void {
  memRecord(key, windowMs)
}

export function resetRateLimitServer(key: string): void {
  buckets.delete(key)
}

export function getClientIp(request: Request): string {
  return getIpSupplied(request)
}
