// xss helpers

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

export function sanitizeInput(input: string, maxLen = 500): string {
  if (typeof input !== "string") return ""
  let s = input.trim().slice(0, maxLen)
  s = s.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
  return escapeHtml(s)
}

// username 3-32
export function sanitizeUsername(input: string): string {
  const raw = input.trim().slice(0, 32)
  const cleaned = raw.replace(/[^a-zA-Z0-9._-]/g, "")
  return escapeHtml(cleaned)
}

export function sanitizeEmail(input: string): string | null {
  const trimmed = input.trim().slice(0, 254).toLowerCase()
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!re.test(trimmed)) return null
  return escapeHtml(trimmed)
}

// strip tags — use DOMPurify in prod
export function sanitizeHtml(dirty: string): string {
  if (typeof dirty !== "string") return ""
  // strip tags
  let s = dirty.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
  s = s.replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
  s = s.replace(/<iframe[\s\S]*?>[\s\S]*?<\/iframe>/gi, "")
  s = s.replace(/on\w+\s*=\s*["'][^"']*["']/gi, "")
  s = s.replace(/on\w+\s*=\s*[^\s>]+/gi, "")
  s = s.replace(/javascript\s*:/gi, "")
  return escapeHtml(s)
}

export function sanitizeFileName(name: string): string {
  const base = name.split("/").pop()?.split("\\").pop() || "file"
  const cleaned = base.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 100)
  if (cleaned.startsWith(".") || cleaned === "" ) return "file_" + Date.now()
  return cleaned
}

export function isSafeUrl(url: string): boolean {
  try {
    if (url.startsWith("/") && !url.startsWith("//")) return true
    const u = new URL(url)
    return u.protocol === "https:" || u.protocol === "http:"
  } catch {
    return false
  }
}
