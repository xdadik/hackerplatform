# Security Audit & Hardening — 2026-09-08

**Repo:** `xdadik/hackerplatform` `master`
**Method:** 4 parallel white-box audit agents (auth & sessions / API routes / frontend & secrets / database & RLS), full findings in [`docs/audit/`](./audit/).
**Scope:** every API route, every auth path, the admin panel, all client pages that touch auth or flags, the database schema, RLS policies, git history, and repo contents.

---

## Executive summary

The audit found **4 critical and several high-severity issues**. All code-side issues are fixed in this commit; database-side fixes ship as **`supabase/migrations/0003_security_fixes.sql`** (run it in the Supabase SQL Editor after 0001 + 0002). One issue is permanently outside code's reach: **an admin password was committed to this public repository in the past** — rotate `ADMIN_PASS` and optionally scrub git history.

| # | Severity | Finding | Status |
|---|----------|---------|--------|
| 1 | CRITICAL | `users` table world-readable with the anon key — RLS `using(true)` exposed **all columns including `password_hash` and emails** (`GET /rest/v1/users?select=password_hash`) | Fixed in 0003 §2 |
| 2 | CRITICAL | `admin_user_overview` view bypassed users RLS (owner privileges) **and was auto-updatable** — anon could dump all users and forge admin rows via PostgREST | Fixed in 0003 §4 |
| 3 | CRITICAL | Admin password `control2026$?>luz` committed in `platform.md` at HEAD + git history (also `Aegis2026!` in history, client bundle era) | Redacted at HEAD; **rotating `ADMIN_PASS` is on you** |
| 4 | CRITICAL | Flag "verification" on lab/challenge pages was a client-side regex that accepted **any** `flag{...}` text and faked the solve — zero CTF integrity | Fixed: pages now call the real scrypt-verifying server routes |
| 5 | HIGH | `flag_hash` on labs/challenges readable with the anon key → offline brute-forcing of flags | Fixed in 0003 §3 |
| 6 | HIGH | Rate-limit bug: attempts recorded in a **60 s window** but checked against 15 min — effectively 5/min, and the client limiter blocked 15 min while **counting typos and never resetting on success** (this is the lockout users hit) | Fixed: correct windows, only real failures count, success resets, login raised to 10/15 min |
| 7 | HIGH | Rate-limit IP taken from spoofable `X-Forwarded-For[0]` — attackers could rotate fake IPs and bypass limits | Fixed: `cf-connecting-ip` → rightmost XFF |
| 8 | HIGH | In-memory rate limiter — per-instance on Cloudflare, reset on every restart | Fixed: Supabase-backed `rate_limits` table + RPCs (0003 §6), memory fallback for dev |
| 9 | HIGH | `ADMIN_PASS` compared with `===` (timing leak) and used as the admin-cookie HMAC key (leak = offline brute-force oracle) | Fixed: SHA-256 + `timingSafeEqual`; cookie now signed with `NEXTAUTH_SECRET` |
| 10 | HIGH | `public/admin.php` (29 KB) shipped statically — full source disclosure; legacy `supabase.sql` with an all-open progress policy | Deleted from repo |
| 11 | MEDIUM | Login timing oracle + 409 on signup revealed which emails have accounts | Fixed: dummy scrypt verify on miss; signup caps |
| 12 | MEDIUM | scrypt at Node defaults (N=2^14, below OWASP 2^15), parameters not stored in the hash | Fixed: N=2^15, versioned `scrypt2$N$r$p$salt$hash` format, legacy hashes still verify |
| 13 | MEDIUM | Progress route: non-UUID ids caused 500s, no rate limit, duplicate rows under races | Fixed: UUID validation, 30/min limit, retry-on-race; 0003 §5 unique indexes |
| 14 | MEDIUM | Admin-created users with short passwords got `password_hash = null` → permanent lockout | Fixed: rejected with 400 |
| 15 | MEDIUM | Admin 500s echoed raw Supabase error text | Fixed: generic messages, details stay in server logs |
| 16 | LOW | Malformed cookie `%ZZ` could 500 auth routes; clear/CSRF cookies missing `Secure`; env alias drift (`ADMIN_PASSWORD` vs `ADMIN_PASS`) | Fixed |

**Verified clean by the audit:** no `password_hash` in any API response; no stack traces in client errors; mass-assignment blocked by whitelists; CSRF double-submit is server-enforced with constant-time compare; XSS sweep clean (no `dangerouslySetInnerHTML` with user input, no `eval`); `.env*` never committed; middleware + in-route double admin verification; session tokens 256-bit, SHA-256-hashed at rest, revoked on logout, sliding expiry.

---

## What changed in this commit (code)

**Rate limiting — `src/lib/rate-limit-server.ts` + `src/lib/rate-limit-ip.ts` (rewritten)**
- Durable DB-backed limiter via `rate_limit_check` / `rate_limit_hit` / `rate_limit_reset` RPCs (requires 0003). Automatic in-memory fallback when the DB or the RPCs are unavailable, with a 60 s circuit breaker so a missing migration never slows requests.
- Spoof-resistant IP extraction: `cf-connecting-ip` first, rightmost XFF entry, `x-real-ip`.
- Login: **10 attempts / 15 min per IP and per account**, counting only real credential failures (401), reset on success.
- Signup: 5/15 min per IP + **3 accounts / 24 h per email**.
- Admin login: 5/15 min (timing-safe compare now). Flags: 5/min per item+IP. Progress writes: 30/min per user.
- Client-side: signup no longer shares the login limiter bucket (a failed signup used to lock you out of login too).

**Auth — `src/lib/auth-server.ts`, `src/lib/auth-edge.ts`, `src/lib/csrf.ts`**
- scrypt cost raised to N=2^15 with a self-describing hash format; old hashes keep verifying (no forced logouts).
- Dummy scrypt verification when the email doesn't exist (flat timing, no account enumeration).
- Cookie decoding can no longer 500 on malformed input; clear/CSRF cookies now `Secure` in production.
- Admin cookie is signed with `NEXTAUTH_SECRET` (not `ADMIN_PASS`); the chain `NEXTAUTH_SECRET || ADMIN_PASS` is identical in `/api/admin/login`, `middleware.ts`, and `admin-api.ts` so tokens always validate.

**Flag verification — `src/app/labs/[id]/page.tsx`, `src/app/challenges/[id]/page.tsx`, new `/api/challenges/[id]/flag`**
- The client no longer decides correctness. Both pages POST to the server, which verifies against the scrypt `flag_hash` (admin panel hashes flags on save). Correct solves persist progress for logged-in users.
- New challenge endpoint mirrors the labs one (no demo fallback: a challenge not in the DB has no valid flag).
- DEMO_FLAGS for `lab-1..6` remain as a bootstrap fallback until the labs table is seeded — delete them once real labs exist.

**Admin & progress routes**
- `POST /api/progress`: UUID validation (clean 400s), 30/min per-user rate limit, retry-once on unique-index races.
- Admin API: short passwords rejected with 400 (previously created permanently locked-out users); raw DB errors no longer echoed to clients.

**Repo hygiene**
- Deleted: `admin.php`, `public/admin.php` (static source disclosure), `supabase.sql` (stale legacy schema with an all-open progress policy), `build*.log`, `tsc*.log`, `tsconfig.tsbuildinfo`.
- Redacted leaked passwords from `platform.md` and `docs/SECURITY_FIXES.md`.
- `.gitignore` now blocks `*.log`.

---

## What you must do (5 minutes, dashboard only)

1. **Run the migrations** in the Supabase SQL Editor, in order: `0001_init.sql` → `0002_audit_and_login_tracking.sql` → **`0003_security_fixes.sql`** (all in `supabase/migrations/`).
2. **Verify** with the anon key in a browser: `https://<project>.supabase.co/rest/v1/users?select=password_hash` → should return `permission denied`. And `select * from public.rate_limit_hit('selftest', 2, 60000);` three times in the SQL Editor → true, true, false, then `select public.rate_limit_reset('selftest');`.
3. **Rotate `ADMIN_PASS`** — the old one (`control2026$?>luz`) is in git history forever. Pick a new strong password, put it in `.env.local` AND Cloudflare Pages env vars. Also set `NEXTAUTH_SECRET` (32+ random chars — it now signs the admin cookie).
4. Optional: scrub git history (`git filter-repo` + force-push) or make the repo private. Rotation makes the leaked password useless, so this is optional.
5. When the DB is seeded with real labs, delete the `DEMO_FLAGS` map from `src/app/api/labs/[id]/flag/route.ts`.

## Known limitations (documented, not urgent)

- Rate-limit RPCs execute per request; a determined flood can still cost DB round-trips (Cloudflare WAF/rate rules in front would be the next layer).
- ~20 pages still render static/mock catalog data (dashboard, events, research, community, messages…). Only auth, search, progress, flags, videos, health, and all admin CRUD are DB-backed. The flag *verification* is real everywhere now; the catalog *content* is the remaining mock work.
- CSP still allows `unsafe-inline` (Next.js inline scripts); tightening requires nonce-based CSP.
- `pathId`-only progress posts are accepted but not persisted (no column for it); 0003 caps them at one sentinel row per user.
