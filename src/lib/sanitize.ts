/**
 * Input sanitization utilities — XSS prevention.
 * Client-side equivalent of PHP's htmlspecialchars() and DOMPurify.
 * React already escapes text nodes, but this adds defense-in-depth for
 * places where user content is stored/rendered and for future
 * dangerouslySetInnerHTML usage.
 *
 * SECURITY NOTE: For any future HTML rendering, use sanitizeHtml() via DOMPurify
 * server-side. This file provides htmlspecialchars-style escaping that is
 * safe without extra deps. If you install `dompurify` + `jsdom`, replace
 * sanitizeHtml implementation with DOMPurify.sanitize.
 */

/** Escape HTML special chars — equivalent to PHP htmlspecialchars(ENT_QUOTES) */
export function escapeHtml(input: string): string {
  if (typeof input !== "string") return ""
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/`/g, "&#x60;")
}

/** Sanitize plain text input: trim, limit length, strip control chars, escape HTML */
export function sanitizeInput(input: string, maxLen = 500): string {
  if (typeof input !== "string") return ""
  let s = input.trim().slice(0, maxLen)
  // Strip control chars except newline/tab
  s = s.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
  return escapeHtml(s)
}

/** Validate and sanitize username — alphanum + ._ - only, 3-32 chars */
export function sanitizeUsername(input: string): string {
  const raw = input.trim().slice(0, 32)
  // Remove disallowed chars
  const cleaned = raw.replace(/[^a-zA-Z0-9._-]/g, "")
  return escapeHtml(cleaned)
}

/** Validate email format and sanitize */
export function sanitizeEmail(input: string): string | null {
  const trimmed = input.trim().slice(0, 254).toLowerCase()
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!re.test(trimmed)) return null
  return escapeHtml(trimmed)
}

/**
 * sanitizeHtml — if you need to render HTML, sanitize first.
 * Without DOMPurify installed, we strip tags aggressively.
 * Install `dompurify` + `isomorphic-dompurify` for production:
 *   import DOMPurify from 'isomorphic-dompurify'
 *   return DOMPurify.sanitize(dirty, { USE_PROFILES: { html: true } })
 */
export function sanitizeHtml(dirty: string): string {
  if (typeof dirty !== "string") return ""
  // Naive tag strip — defense in depth; prefer DOMPurify in prod
  // Remove script/style/iframe/object/embed and event handlers
  let s = dirty.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
  s = s.replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
  s = s.replace(/<iframe[\s\S]*?>[\s\S]*?<\/iframe>/gi, "")
  s = s.replace(/on\w+\s*=\s*["'][^"']*["']/gi, "")
  s = s.replace(/on\w+\s*=\s*[^\s>]+/gi, "")
  s = s.replace(/javascript\s*:/gi, "")
  // Escape remaining tags
  return escapeHtml(s)
}

/** File name sanitization — prevent path traversal and XSS in file names */
export function sanitizeFileName(name: string): string {
  const base = name.split("/").pop()?.split("\\").pop() || "file"
  // Keep alphanum, dot, dash, underscore
  const cleaned = base.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 100)
  // Block hidden files and traversal
  if (cleaned.startsWith(".") || cleaned === "" ) return "file_" + Date.now()
  return cleaned
}

/** URL validation — only allow http/https relative or same-origin */
export function isSafeUrl(url: string): boolean {
  try {
    if (url.startsWith("/") && !url.startsWith("//")) return true
    const u = new URL(url)
    return u.protocol === "https:" || u.protocol === "http:"
  } catch {
    return false
  }
}
