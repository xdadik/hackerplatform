# Task 2a — Auth & Session Security Audit (READ-ONLY)

**Repo:** `/home/z/my-project/hackerplatform` (Next.js 16 App Router, custom auth, Supabase Postgres, Cloudflare Pages target)
**Scope:** `src/lib/auth-server.ts`, `src/lib/rate-limit-server.ts`, `src/lib/rate-limit-ip.ts`, `src/lib/auth-edge.ts`, `src/lib/csrf.ts`, `src/lib/env.ts`, all auth/admin API routes, `middleware.ts`, `auth-provider.tsx`, login/signup pages, plus supporting files (`admin-api.ts`, `[resource]/route.ts`, `supabase.ts`, migrations) for context.
**No repo files were modified.**

---

## Executive Summary

The auth core is fundamentally sound: 256-bit opaque session tokens hashed (SHA-256) at rest, scrypt password hashing with random salts and `timingSafeEqual` verification, httpOnly/SameSite=Strict/Secure-in-prod cookies, real logout revocation (DB row deleted), middleware **plus** route-handler re-verification of the admin HMAC cookie (genuine defense in depth), CSRF double-submit on all admin mutations, and audit logging. There is **no critical finding** — no plaintext secrets, no auth bypass, no injection.

However, four HIGH issues undermine the platform exactly where it is deployed:

1. **The rate limiter is trivially bypassable on Cloudflare** — it keys on the *first* `X-Forwarded-For` entry (client-forgeable; CF appends the real IP *after* forged entries) and is in-memory per-isolate, so on serverless it is effectively unenforced globally.
2. **Admin password check uses `===`** (timing-unsafe), and **`ADMIN_PASS` doubles as the HMAC signing key** while the dedicated `NEXTAUTH_SECRET` env var is generated per the runbook but never used — a captured admin cookie becomes an offline brute-force oracle for the admin password.
3. **Login rate limiting counts client-fixable validation errors (400s) and never resets on success** — combined with 5 attempts / 15 minutes, this is what just locked the end-user out; legitimate users burn their budget on typos.
4. **Admin session tokens are stateless and non-revocable** — logout only clears the browser cookie; a stolen token stays valid for its full 1-hour TTL, and the nonce is never tracked (replay within TTL is indistinguishable from normal use).

Medium findings cover email enumeration (signup 409 + login timing side-channel), scrypt at Node defaults (N=2¹⁴, one notch below OWASP's 2¹⁵ minimum, parameters not embedded in the stored hash), an env-var naming drift that can silently lock the admin panel out, and logout-CSRF. Lows are hygiene items (unhandled `decodeURIComponent` on malformed cookies, missing `Secure` on clear/CSRF cookies, unguarded OPTIONS discovery handler, minor info leaks).

---

## Findings (severity-ranked)

### HIGH-1 — Rate-limit IP extraction trusts spoofable `X-Forwarded-For[0]`

**File:** `src/lib/rate-limit-ip.ts:4-9`
```ts
const forwarded = request.headers.get("x-forwarded-for")
if (forwarded) return forwarded.split(",")[0].trim()   // ← first entry is CLIENT-SUPPLIED
```
**Impact:** Cloudflare *appends* the real client IP to any client-supplied `X-Forwarded-For` chain, so the first entry is attacker-controlled. An attacker rotates fake IPs (`X-Forwarded-For: 1.2.3.4`, `1.2.3.5`, …) to get a fresh `login:`/`admin_login:` bucket on every request → **all rate limits bypassed**. Conversely they can frame a victim IP. The `cf-connecting-ip` header (which CF always overwrites with the true IP) is checked *last* — it can never win. Fallback `"unknown"` also collapses all header-less traffic into one shared bucket.
**Fix:** Reorder to prefer `cf-connecting-ip` (and `x-real-ip`) before XFF; on generic proxies take the **rightmost** entry added by the trusted hop; in Node routes prefer `request.headers.get("cf-connecting-ip")`. Reject/ignore XFF entries that precede the trusted proxy count.

### HIGH-2 — In-memory, per-instance rate limiter is ineffective on Cloudflare Pages

**File:** `src/lib/rate-limit-server.ts:1-27` (`const buckets = new Map<string, Entry>()`)
**Impact:** On Cloudflare Pages/serverless, requests land on arbitrary isolates, each with its own empty `buckets` Map. The 5/15-min login lockout, admin lockout, and flag limiter are **not globally enforced** — an attacker's requests spread across isolates each see a fresh counter. This is security theater in the target deployment. Secondary: expired entries are only replaced lazily on the *same* key, so distinct-key entries accumulate forever (unbounded memory on a long-lived process).
**Fix:** Move state to a shared store — Cloudflare KV or a Durable Object (per-IP token bucket), or Upstash Redis via `@upstash/ratelimit` (works from Pages Functions). If a shared store is out of scope short-term, at least combine per-isolate counting with per-account DB-side lockout (e.g., `users.failed_login_count`/`locked_until` updated transactionally on 401) so credential-stuffing against a *single* account is stopped regardless of instance count.

### HIGH-3 — `ADMIN_PASS` compared with `===` (timing-unsafe)

**File:** `src/app/api/admin/login/route.ts:34-35`
```ts
const userOk = username.trim().toLowerCase() === expectedUser.trim().toLowerCase()
const passOk = password === pass    // ← plain string comparison
```
**Impact:** String `===` short-circuits on first differing byte; remote timing analysis of the admin login endpoint can leak password prefix bytes (practical difficulty is high over network jitter, but it is the single most brute-forced endpoint on the platform and the fix is one line). The username comparison is fine (not secret).
**Fix:** Hash both sides and compare in constant time:
```ts
import { createHash, timingSafeEqual } from "crypto"
const a = createHash("sha256").update(password).digest()
const b = createHash("sha256").update(pass).digest()
const passOk = timingSafeEqual(a, b)  // sha256 first avoids the length-leak of raw timingSafeEqual
```

### HIGH-4 — `ADMIN_PASS` doubles as the HMAC session-signing key; `NEXTAUTH_SECRET` is dead config

**Files:** `src/app/api/admin/login/route.ts:42` (`buildAdminToken(pass)`), `middleware.ts:47` (`process.env.ADMIN_PASS || ...`), `src/lib/admin-api.ts:233` (`const secret = env.ADMIN_PASS`), `src/lib/env.ts:75,84-86` (NEXTAUTH_SECRET parsed/warned, **never consumed anywhere**)
**Impact:**
- Key conflation: the *password* is the MAC key. Rotating the password force-invalidates all admin sessions (accidental feature), but any other password change/leak history reuses a low-entropy human-chosen secret as an HMAC key.
- Offline brute-force oracle: the admin cookie is `nonce.expiresAt.HMAC-SHA256(nonce.expiresAt.admin, ADMIN_PASS)` — message and tag are both visible in the cookie. An attacker who captures one cookie (logs, XSS-adjacent mishap, browser sync) can brute-force `ADMIN_PASS` *offline* at full speed. With a strong random pass this is infeasible; with a human password it is dictionary-crackable.
- The runbook tells the operator to generate `NEXTAUTH_SECRET` (worklog, `.env.example`, BACKEND_MAP.md) — pure dead weight today.
**Fix:** `buildAdminToken(env.NEXTAUTH_SECRET)` (require ≥32 chars in production), sign with `createHmac("sha256", secret)`; use the same secret in middleware and `admin-api.ts` via a single shared accessor. Keep `ADMIN_PASS` solely for the login comparison. This also gives a revocation lever: rotating `NEXTAUTH_SECRET` invalidates sessions without touching the login credential.

### MEDIUM-1 — Login/signup rate limits count 400 validation errors and never reset on success (the end-user's "15-minute block")

**Files:** `src/app/api/auth/login/route.ts:12,28-35,38-41` and `signup/route.ts:11,28-40,56-58`
```ts
const rl = checkRateLimitServer(`login:${ip}`, 5, 900_000)   // 5 / 15 min
...
if (password.length < PASS_MIN) { recordAttemptServer(`login:${ip}`); return 400 ... }  // typo counts!
...
if (!user) { recordAttemptServer(`login:${ip}`); return 401 ... }
// success path: no resetRateLimitServer(...) — exported but never called anywhere
```
**Impact:** A legitimate user who fat-fingers the email format, or types a 7-char password, burns one of only 5 attempts; 5 such mistakes → hard 429 until *first attempt + 15 min*. Successful login never clears the counter, so yesterday's 3 typos + today's 2 = lockout with zero wrong-password attempts this session. The client side compounds it: `login/page.tsx:50,62` records client-side validation failures into the same localStorage bucket, and `signup/page.tsx:14,45` **reuses `loginLimiter`** so signup mistakes also count against login. This is exactly the "too many attempts … 15 minutes" support ticket.
**Fix (concrete):** only call `recordAttemptServer` on the 401 path (real authentication failures), never on 400 validation paths; call `resetRateLimitServer(\`login:${ip}\`)` after a successful login; give signup its own client limiter key; optionally return remaining attempts in the 401 body (not the 429) so users get a warning before the cliff.

### MEDIUM-2 — Email enumeration: signup 409 + login timing side-channel

**Files:** `src/app/api/auth/signup/route.ts:56-58` (`409 "An account with this email already exists"`), `src/lib/auth-server.ts:101-107`
```ts
const user = await getUserByEmail(email)
if (!user || typeof user.password_hash !== "string") return null   // ← returns instantly (no scrypt)
const ok = await verifyPassword(password, user.password_hash)       // ← ~30-60 ms when user exists
```
**Impact:** Login returns a generic `401 "Invalid email or password"` (good), but response time differs by ~tens of ms between "user exists, wrong password" and "no such user" — a reliable account-existence oracle. The signup 409 confirms registered addresses outright (an accepted product tradeoff on many platforms, but combined with the timing leak the account map is fully recoverable). Also `login/route.ts:32-35` rejects `password.length < 8` with a *different* message before auth — leaks policy, not accounts (harmless).
**Fix:** When the user is not found (or `password_hash` is null), run `verifyPassword(password, DUMMY_SCRYPT_HASH)` (a precomputed hash of a random string) and return null after equal work. For signup, either keep the 409 (product choice — fastest UX) or return 201-silent / email-verification flow; at minimum document the decision. Embed a small random delay jitter (±10 ms) is *not* a substitute for equal-work.

### MEDIUM-3 — scrypt uses Node defaults (N=2¹⁴) and parameters are not embedded in the stored hash

**File:** `src/lib/auth-server.ts:6-8,25-29`
```ts
const scrypt = promisify(scryptCb) as (password: string, salt: string, keylen: number) => Promise<Buffer>
const SCRYPT_KEYLEN = 64
const derived = await scrypt(password, salt, SCRYPT_KEYLEN)   // defaults: N=16384, r=8, p=1
return `scrypt$${salt}$${derived.toString("hex")}`             // no N/r/p in the format
```
**Impact:** Node's default cost (N=16384, r=8, p=1; ~35 ms on this box, v24) is one notch below OWASP's Password Storage Cheat Sheet minimum (N=2¹⁵=32768, r=8, p=1). More importantly the parameters are *implicit*: any future cost increase breaks verification of every existing hash, and nothing documents the cost in the DB. Salt (16 random bytes) and `timingSafeEqual` with length check (line 37) are correct. Note: raising N to 2¹⁵ needs `maxmem ≥ 64MB` (128·N·r ≈ 33.5 MB > Node's 32 MB default cap) or scrypt throws.
**Fix:** `scrypt(password, salt, 64, { N: 1 << 15, r: 8, p: 1, maxmem: 64 * 1024 * 1024 })` and store `scrypt$N$r$p$salt$hash`; parse all six fields in `verifyPassword`, falling back to defaults for legacy `scrypt$salt$hash` rows. Verification is already timing-safe — keep it.

### MEDIUM-4 — Admin session token is stateless: no revocation, no replay protection

**Files:** `src/lib/auth-server.ts:239-264` (`buildAdminToken`/`verifyAdminToken`), `src/app/api/admin/logout/route.ts:5-7` (only `Set-Cookie` clear), nonce never persisted anywhere.
**Impact:** The 1-hour HMAC cookie cannot be revoked: logout merely clears the browser cookie, so a token exfiltrated via logs/proxy/XSS-adjacent bug remains fully valid until expiry (replay of the nonce is indistinguishable from normal use — the nonce exists only to make tokens unique, it is never tracked server-side). Only rotating `ADMIN_PASS` kills live tokens. For an admin surface with service-role DB writes behind it, 1 hour of un-revocable post-theft access is meaningful.
**Fix:** Cheapest: cut TTL to 10-15 min with silent re-issue on activity (sliding), and rotate the signing secret on admin logout… still weak. Correct: persist the nonce (or a SHA-256 of the token) in a `admin_sessions` table (or KV) on login, check-and-delete on logout → revocation + replay detection in one lookup; middleware keeps stateless HMAC as the fast gate, the route handler's `isAdminRequestAuthorized` becomes the revocation check (it already runs on every admin request — one extra `sessions`-style query).

### MEDIUM-5 — Env-var drift: `ADMIN_PASSWORD` fallback honored by route handlers but not middleware

**Files:** `src/lib/env.ts:73` (`ADMIN_PASS || AEGIS_ADMIN_PASS || ADMIN_PASSWORD`) vs `middleware.ts:47` (`process.env.ADMIN_PASS || process.env.AEGIS_ADMIN_PASS || ""`)
**Impact:** If the operator sets only `ADMIN_PASSWORD` (a name `env.ts` explicitly accepts), Node route handlers sign tokens with it, but the edge middleware verifies with `""` → `verifyAdminTokenEdge` fails closed → **the entire admin panel is unreachable** with a confusing "Unauthorized" loop. Additionally, `process.env` references in middleware are typically **inlined at build time** on Cloudflare edge runtimes — a `ADMIN_PASS` configured only as a runtime Pages env var can silently be empty in middleware while present in Node routes (same lockout, different cause).
**Fix:** Single source of truth: one canonical key (`ADMIN_PASS`), one shared accessor used by all three call sites, and document "set it in the Cloudflare build environment" (or read from `process.env` only in a shared Node context). Kill the `ADMIN_PASSWORD`/`AEGIS_ADMIN_PASS` aliases in `env.ts`.

### MEDIUM-6 — Logout endpoints have no CSRF protection

**Files:** `src/app/api/admin/logout/route.ts:5-7`, `src/app/api/auth/logout/route.ts:5-8`
**Impact:** Both are simple POSTs requiring no cookie value and no token; a cross-site page can auto-submit a form POST to either, and the response `Set-Cookie` (deletion) applies to the victim's browser → forced logout (nuisance/DoS; for the admin, repeated forced logouts disrupt operations). Login/signup are practically CSRF-safe (bodies must parse as JSON, which `text/plain` form tricks cannot produce with `:` separators, and no CORS headers are emitted) and session-bearing mutations are protected by `SameSite=Strict` — logout is the odd one out because it doesn't need the cookie.
**Fix:** Require the existing `x-csrf-token` double-submit pair on logout (cheap — `csrfOk(request)` already exists in `admin-api.ts`), or at minimum verify `Origin`/`Sec-Fetch-Site: same-origin`.

### LOW-1 — `decodeURIComponent` can throw on malformed cookies → unhandled 500

**Files:** `src/lib/auth-server.ts:178` and `:269`, `src/lib/auth-edge.ts:44`, `src/lib/admin-api.ts:242`
**Impact:** A cookie like `aegis_session=abc%ZZ` (percent signs are legal cookie octets) makes `decodeURIComponent` throw `URIError`. `/api/auth/session` and middleware have no try/catch → Next returns a 500 per request. Robustness bug / cheap DoS amplification, no data leak (Next's error boundary hides the stack).
**Fix:** Wrap in try/catch returning the raw match[1] on failure, or a safe decoder; also cap token length (e.g., 128 chars) before hashing.

### LOW-2 — Clear-cookie and CSRF cookie lack `Secure` in production

**Files:** `src/lib/auth-server.ts:186` (`aegis_session=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0` — no `Secure`), `:277` (same for admin), `src/lib/csrf.ts:24` (`document.cookie = "...; Path=/; SameSite=Strict"` — no `Secure`)
**Impact:** Mostly cosmetic for deletions (cookie identity ignores the Secure attribute, so deletion still works over HTTPS), but the non-httpOnly CSRF cookie is transmitted on any plain-HTTP request to the domain (mitigated by HSTS + `upgrade-insecure-requests`, still sloppy).
**Fix:** Add `Secure` conditionally in the clear strings (mirror `getCookieOptions`) and in `getOrCreateCsrfToken()` when `location.protocol === "https:"`.

### LOW-3 — Admin OPTIONS discovery handler has no route-level guard (middleware-only)

**File:** `src/app/api/admin/[resource]/route.ts:48-53`
```ts
export async function OPTIONS() {
  return Response.json({ resources: Object.keys(ADMIN_RESOURCES), methods: [...] })
}
```
**Impact:** The only admin route whose guard relies 100% on middleware (matcher does cover OPTIONS, so it 401s today), but if middleware is ever bypassed/misconfigured it discloses the resource whitelist. Inconsistent with the otherwise excellent defense-in-depth pattern.
**Fix:** Add `guardAdminRead(request)` to OPTIONS (accept a `Request` arg), or drop the handler.

### LOW-4 — Admin login 500 discloses unconfigured state to any caller

**File:** `src/app/api/admin/login/route.ts:27-32` (`"ADMIN_PASS is not configured. Set ADMIN_PASS in .env.local before using the admin panel."`)
**Impact:** Tells unauthenticated visitors the admin surface exists and is currently unprotected-by-config (reconnaissance aid). Verbose for an endpoint that needs no auth.
**Fix:** Return a generic `500 "Admin login unavailable"`; log the actionable detail server-side (console.error). Similarly, admin CRUD 500s echo Supabase `error.message` (`admin-api.ts:332,365,404,425`) — admin-only audience, but internal schema/driver details shouldn't cross the wire: log server-side, return generic text.

### LOW-5 — `/api/health` discloses version + environment mode publicly

**File:** `src/app/api/health/route.ts:6-11,36-42` (`version`, `env: "production"|"dev"`, `db` status)
**Impact:** Standard recon data (framework version, environment). No secrets.
**Fix:** Gate behind admin auth or strip `version`/`env` in production; keep `db` status.

### LOW-6 — No email verification on signup

**File:** `src/app/api/auth/signup/route.ts:42-54`
**Impact:** Anyone can register any not-yet-taken address → impersonation of a colleague's email inside the platform (no outbound mail exists to catch it). Combined with the signup 409, an attacker can also probe which emails *aren't* registered.
**Fix:** Add a verification step (Supabase Auth mail or a token table + sendgrid hook) or at minimum a `pending` status that gates admin-panel-visible features. Lower priority for a CTF-style education platform.

### LOW-7 — Data hygiene / minor

- `sanitizeEmail` (`src/lib/sanitize.ts:28-33`) HTML-escapes before storage: `o'brien@x.com` is stored as `o&#x27;brien@x.com`. Login applies the same transform so auth round-trips, but stored emails are corrupted for any future mail-out. Don't escape at rest; escape at render.
- No cap on sessions per user (each login inserts a row; expired rows are only lazily deleted on that user's next session refresh — `auth-server.ts:158`). A login loop can bloat `sessions`.
- No rate limit on `GET /api/auth/session` (two DB queries per hit) or `/api/progress` — fine while small.
- `login/route.ts:32-35` permanently blocks users whose stored password is < 8 chars (e.g., legacy/admin-created rows) from ever authenticating (400 before verify) — consider verifying first, enforcing policy only at signup/change.
- Client limiter (`src/lib/rate-limit.ts`) is localStorage-based → trivially bypassed; acceptable because the server also enforces, but note the signup page shares the login page's `login` key (`signup/page.tsx:14`).
- `auth-provider.tsx:60-77` mirrors the user object into localStorage (readable by any XSS). UI-only by design and the httpOnly cookie remains authoritative — acceptable, documented in code.
- Unbounded JSON body: `request.json()` on multi-MB bodies; a 64 KB–1 MB body cap on auth routes would be cheap hardening (scrypt cost is dominated by N, so this is about parse memory).

---

## Rate-limit thresholds (exact numbers, every limited route)

Server-side (`src/lib/rate-limit-server.ts`, in-memory fixed window; `limited` when `count >= max`; block ends at *first recorded attempt + window*):

| Route | Bucket key | Max attempts | Window | Effective block | What counts toward the limit |
|---|---|---|---|---|---|
| `POST /api/auth/login` (`login/route.ts:12`) | `login:${ip}` | **5** | **15 min** (900,000 ms) | up to 15 min from first counted attempt | 400 bad-email-format, 400 password < 8, 401 wrong credentials. **Success does NOT reset.** 429 `"Too many attempts. Try again later."` + `Retry-After` |
| `POST /api/auth/signup` (`signup/route.ts:11`) | `signup:${ip}` | **5** | **15 min** | up to 15 min | 400 invalid email, 400 password policy, 400 missing name, 409 email-taken |
| `POST /api/admin/login` (`admin/login/route.ts:9,38`) | `admin_login:${ip}` | **5** | **15 min** | up to 15 min | **401 wrong credentials only** (invalid JSON / missing fields do not count) |
| `POST /api/labs/[id]/flag` (`flag/route.ts:40`) | `flag:${labId}:${ip}` | **5** | **60 s** | up to 60 s | 400 invalid JSON / missing flag / bad format, wrong flag. Correct flag does not count |

Client-side (`src/lib/rate-limit.ts`, localStorage — bypassable, UX only): login `5/15 min`, admin_login `5/15 min`, flag `5/60 s` per lab, comment `10/60 s` (unused); **login and signup pages share one `"login"` bucket**.

**Not rate-limited at all:** `/api/auth/session`, `/api/auth/logout`, `/api/admin/logout`, `/api/admin/[resource]` (GET/POST/PATCH/DELETE/OPTIONS), `/api/progress`, `/api/search`, `/api/videos`, `/api/health`.

**Judgment:** 5 failures / 15 min per IP is *within* OWASP lockout norms (5–10) — the numbers themselves are not crazy. What makes it hostile to legitimate users: (a) 400 validation typos consume the budget, (b) success never resets the counter, (c) login+signup share one client bucket, (d) the message gives no attempt countdown before the cliff, and (e) in production on Cloudflare the limiter is per-isolate/XFF-spoofable anyway, so the pain lands on honest users while attackers skip it. **Tuning recommendation:**
- login: **10 attempts / 15 min per IP** and **10 / 15 min per account (email)**, counting **401s only**; reset the IP bucket on success; after 5 failures return remaining attempts in the 401 body and add a 30 s retry delay. Keep a hard lockout at 10.
- signup: keep **5 / 15 min** but count only *submitted* attempts (201/409), never 400 validation errors; give signup its own client key.
- admin login: keep **5 / 15 min** (already counts only real failures — the model implementation); optionally add per-username progressive delay.
- flag: **5 / 60 s** is fine (leave as is).
- Infrastructure first: without `cf-connecting-ip` ordering (HIGH-1) and a shared counter store (HIGH-2), no numbers are actually enforced in production.

---

## What's working well

- **Sessions:** 256-bit `randomBytes(32)` base64url tokens (auth-server.ts:113), SHA-256-hashed at rest with a unique index (0001_init.sql:23), 30-day TTL with 1-hour-idle sliding renewal + opportunistic per-user expired-row cleanup (150-162), expired tokens deleted on access (145-147), logout deletes the DB row (126-131) — real revocation for user sessions.
- **Password hashing:** scrypt with fresh 16-byte random salt per hash (26), `timingSafeEqual` with a length guard (37), corrupted/foreign formats fail closed to `false` (32-40); `verifyPassword` used for both user passwords and lab flag hashes.
- **Cookies:** `aegis_session` and `aegis_admin_session` both `Path=/; HttpOnly; SameSite=Strict; Max-Age=<ttl>` with `Secure` added in production via `env.IS_PRODUCTION` (43-52) — no cookie is missing httpOnly/SameSite on any state-changing flow.
- **Admin defense in depth:** middleware (edge, Web Crypto HMAC-SHA-256, constant-time compare) guards `/admin/:path*` + `/api/admin/:path*`, and `admin-api.ts` **re-verifies** the cookie in every Node route handler (guardAdminRead/guardAdminMutation, 433-448) — middleware bypass alone yields nothing. `/api/admin/login` + `/logout` correctly exempted from the middleware guard (the old deadlock is fixed).
- **CSRF:** double-submit (header `x-csrf-token` === non-httpOnly `aegis_csrf_token` cookie, constant-time XOR compare, 239-249) on **every** admin mutation (POST/PATCH/DELETE); 32-byte CSPRNG tokens; SameSite=Strict everywhere else.
- **Passwords/flags at rest:** admin panel accepts plaintext passwords/flags only as input — hashed with scrypt server-side before insert (`beforeWrite`, 59-70/126-133), `password_hash` never selected in list responses, plaintext flag fields deleted before persist.
- **Error hygiene:** signup/login 500s are generic strings with detail only in `console.error`; JSON parse failures → clean 400; no stack traces or internals in any client-visible auth error.
- **Failure modes:** missing Supabase env keys → `getSupabase()/getServiceSupabase()` return `null` (never throw, 145-188) → clean 401/503/generic-500 paths; `createUser` throws a caught "Supabase is not configured" → 500 `"Signup failed"`. Startup env validation is soft (warnings only, env.ts:80-89) so builds never break, `/api/health` distinguishes `unconfigured` vs `error` without leaking driver messages to the client, and `requireEnv` exists for future hard requirements.
- **Banned users** are rejected at session validation (171), not just login — a ban takes effect mid-session.
- **Security headers** (CSP, HSTS+preload, XFO, nosniff, COOP, Permissions-Policy) applied globally via `next.config.ts:56-68` (middleware duplicates them for admin paths), `poweredByHeader: false`.
- **Middleware matcher coverage:** `/admin/:path*` and `/api/admin/:path*` (Next.js `:path*` = zero-or-more segments, so the bases are included). Every admin API route lives under `/api/admin/*` and is covered; the only exemptions are `/api/admin/login|logout` (intentional); the only middleware-only spot is the OPTIONS discovery handler (LOW-3).

## Next actions (priority order)

1. Fix IP extraction (`cf-connecting-ip` first) and move rate-limit state to KV/DO/Upstash or per-account DB lockout (HIGH-1, HIGH-2).
2. Timing-safe `ADMIN_PASS` compare; sign admin tokens with `NEXTAUTH_SECRET` (HIGH-3, HIGH-4).
3. Stop counting 400s, reset on success, separate signup client bucket (MEDIUM-1 — the user-facing lockout).
4. Equal-work dummy scrypt on login miss (MEDIUM-2); scrypt N=2¹⁵ with versioned hash format (MEDIUM-3).
5. Revocable admin sessions (nonce table) + CSRF on logout (MEDIUM-4, MEDIUM-6); unify admin secret env resolution (MEDIUM-5).
6. Sweep the LOWs (safe cookie decode, Secure flags on clear/CSRF cookies, guard OPTIONS, generic 500s).
