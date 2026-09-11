# BACKEND MAP — Aegis Platform (Product-Ready)

**You work the backend. Friend works the frontend. Commit + push from GitHub.**

> **2026-09-08 — full security audit + hardening pass applied.** See
> [`docs/SECURITY_AUDIT.md`](docs/SECURITY_AUDIT.md) for the 16 findings and
> their fixes, and [`docs/audit/`](docs/audit/) for the four full audit
> reports. The headline changes: rate limiting is now DB-backed and honest
> (no more false 15-minute lockouts), the admin cookie is signed with
> `NEXTAUTH_SECRET`, admin login uses a timing-safe compare, scrypt cost is
> N=2^15 with a versioned hash format, and lab/challenge flag submission is
> **actually server-verified** (the pages used to fake it with a regex).

## 1. What's DONE (this is the live backend now)

### Auth (real, server-side, wired end-to-end)
| File | What it does |
|---|---|
| `src/lib/auth-server.ts` | scrypt password hashing, opaque session tokens (hashed in DB), httpOnly cookies, sliding session expiration (auto-extends after 1h idle), password policy (letters+numbers, common-password blocklist), admin signed tokens |
| `src/app/api/auth/signup/route.ts` | POST — create user + session cookie (rate-limited 5/15min, password policy) |
| `src/app/api/auth/login/route.ts` | POST — verify password, set httpOnly `aegis_session`, stamp `users.last_login_at` |
| `src/app/api/auth/logout/route.ts` | POST — delete session + clear cookie |
| `src/app/api/auth/session/route.ts` | GET — return current user from cookie |
| `src/components/auth-provider.tsx` | **REAL auth now** — loads `/api/auth/session` on mount, login/signup/logout call the API, httpOnly cookie is the source of truth (localStorage only mirrors for legacy UI) |
| `src/app/login/page.tsx` + `src/app/signup/page.tsx` | **REAL calls** — no more fake setTimeout login. Google button shows "not configured" instead of faking |
| `src/app/api/admin/login/route.ts` | POST — server-only `ADMIN_PASS` check (timing-safe), signed 1h admin cookie (HMAC key = `NEXTAUTH_SECRET`, ADMIN_PASS fallback) |
| `src/app/api/admin/logout/route.ts` | POST — clear admin cookie |
| `middleware.ts` | Guards `/admin` + `/api/admin/*`, verifies signed token (edge-safe), security headers. **Fixed: login/logout endpoints are no longer blocked by the guard (was a deadlock bug)** |

### Admin CRUD (database-backed, replaces localStorage)
| File | What it does |
|---|---|
| `src/lib/admin-api.ts` | Generic whitelisted CRUD over service-role Supabase: field validation, enum whitelists, CSRF double-submit, admin cookie re-verification, audit logging |
| `src/app/api/admin/[resource]/route.ts` | GET/POST/PATCH/DELETE for `users, videos, labs, challenges, events, news, cves` |
| `src/app/admin/page.tsx` | **Rewired** — real login via `/api/admin/login`, all tabs (users/videos/events/news/cve/labs) read+write the DB through the API. Lab flags entered here are scrypt-hashed before storage. Fixed a syntax error (`const aintenance,` → `const [maintenance,`) |

### API routes — all mocks killed
| Route | Status |
|---|---|
| `/api/health` | DB connectivity check (`db: ok/unconfigured/error`) |
| `/api/videos` | Supabase-first, mock fallback only when DB empty |
| `/api/search` | **REAL** — queries `labs, challenges, news, cves` with ILIKE + scoring (static fallback only if Supabase not configured) |
| `/api/progress` | **REAL** — `progress` table keyed by session user (401 when logged out, service-role for RLS bypass); UUID-validated ids, 30 writes/min per user |
| `/api/labs/[id]/flag` | **REAL** — verifies against `labs.flag_hash` (scrypt); correct flags upsert `progress` for logged-in users; DEMO_FLAGS kept as fallback for lab-1..6 |
| `/api/challenges/[id]/flag` | **NEW** — server-side challenge flag verification (scrypt `flag_hash`), no demo fallback; the challenges page now calls this instead of faking solves |
| `src/lib/rate-limit-server.ts` | **REWRITTEN** — Supabase-backed durable limiter (`rate_limits` RPCs, needs 0003) with automatic in-memory fallback; spoof-resistant IP extraction (`cf-connecting-ip` / rightmost XFF) |

### Database
| File | What it does |
|---|---|
| `supabase/migrations/0001_init.sql` | Tables `users, sessions, videos, labs, challenges, progress, events, news, cves`, RLS, `is_admin()`, triggers |
| `supabase/migrations/0002_audit_and_login_tracking.sql` | `audit_logs` table (admin mutation history), `users.last_login_at`, `admin_user_overview` view |
| `supabase/migrations/0003_security_fixes.sql` | **NEW — REQUIRED** — locks `users`/`sessions`/`progress`/`audit_logs` away from the anon key, revokes `flag_hash` from anon, hardens `is_admin()` + the overview view, dedupes + constrains `progress`, creates the `rate_limits` table + RPCs, adds indexes and status CHECK constraints |
| `src/lib/supabase.ts` | `getSupabase()` (anon) + `getServiceSupabase()` (bypasses RLS, server-only) |
| `.env.example` | Documented template for all env vars |

## 2. What YOU must do manually (no code involved)

1. **Run migrations** (5 min, do FIRST — auth 500s without them):
   - Supabase → project `rijdajzrkpuuochzwcsk` → SQL Editor → paste `supabase/migrations/0001_init.sql` → Run
   - Then paste `supabase/migrations/0002_audit_and_login_tracking.sql` → Run
   - Then paste `supabase/migrations/0003_security_fixes.sql` → Run (**closes the anon-key leaks of `password_hash` / `flag_hash` and enables durable rate limiting**)
   - Verify: Table Editor shows `users, sessions, videos, labs, challenges, progress, events, news, cves, audit_logs, rate_limits`
2. **Set env vars in your deployment** (Cloudflare Pages → Settings → Environment variables):
   - `ADMIN_PASS` — **ROTATE IT**: the old one (`control2026$?>luz`) leaked in this repo's git history. Also in `.env.local` for local dev.
   - `NEXTAUTH_SECRET` (random 32+ chars: `openssl rand -hex 32`) — **now signs the admin cookie**; must be set in prod
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (all from Supabase → Settings → API)
3. **Test auth end-to-end**:
   ```bash
   npm run dev
   # second terminal:
   curl -X POST http://localhost:3000/api/auth/signup -H "Content-Type: application/json" -d '{"email":"test@x.com","password":"TestPass123","name":"Test"}'
   curl http://localhost:3000/api/auth/session            # with the cookie
   curl -X POST http://localhost:3000/api/auth/login  -H "Content-Type: application/json" -d '{"email":"test@x.com","password":"TestPass123"}'
   curl -X POST http://localhost:3000/api/auth/logout
   curl http://localhost:3000/api/health                  # db: "ok"
   ```
   (Password must contain letters AND numbers now — `12345678` is rejected by policy.)
4. **Make the first admin** — after your real signup, in SQL Editor:
   ```sql
   update public.users set role = 'admin' where email = 'your@email.com';
   ```
5. **Seed content** — log into `/admin` (ADMIN_USER + ADMIN_PASS) and add videos/labs/events/news/CVEs. Labs with flags become solvable instantly.

## 3. Security model (summary)
- User sessions: opaque token → sha256 → `sessions` table, httpOnly + SameSite=Strict + Secure(prod), 30-day sliding expiry, deleted on logout, expired rows cleaned opportunistically.
- Admin: separate 1h HMAC-signed cookie (**key = `NEXTAUTH_SECRET`**, ADMIN_PASS is only the dev fallback), guarded by edge middleware AND re-verified in every route handler; all mutations require CSRF double-submit (`x-csrf-token` header === non-httpOnly cookie).
- Passwords & lab flags: scrypt (N=2^15, versioned `scrypt2$N$r$p$salt$hash`), per-value salt, constant-time comparison. Login runs a dummy verify on unknown emails so timing cannot enumerate accounts. Flags never stored in plaintext.
- Rate limits (durable in `rate_limits` after 0003; in-memory fallback before): login 10/15min per IP **and** per account (counts only real failures, resets on success), signup 5/15min per IP + 3/24h per email, admin login 5/15min, flags 5/min per item+IP, progress writes 30/min per user. IPs from `cf-connecting-ip`/rightmost XFF (unspoofable order).
- Every admin mutation is audit-logged to `audit_logs`.
- DB: anon key can no longer read `users`, `sessions`, `progress`, `audit_logs`, or `flag_hash` (0003).

## 4. Deploy
```bash
git add -A; git commit -m "backend: ..."; git push
```
→ GitHub Actions `.github/workflows/deploy-cloudflare.yml` builds with `@cloudflare/next-on-pages` → live on `aegis.pages.dev`. Set the env vars from step 2 in the Cloudflare dashboard BEFORE the first real deployment, then trigger a rebuild (push an empty commit or use "Retry deployment").

> ⚠️ **CURRENT BLOCKER (account-level, not code)**: GitHub Actions runs fail with
> *"The job was not started because your account is locked due to a billing issue."*
> Fix at https://github.com/settings/billing (payment method / plan). The code is
> pushed and ready — once billing is unlocked, re-run the workflow from the Actions
> tab (or push an empty commit) and it will deploy. Cloudflare Workers Builds (the
> dashboard Git integration) also runs on push; check its logs at
> dash.cloudflare.com → Workers → hackerplatform → Builds if that path is preferred.

## 5. Known gaps (nice-to-haves, not blockers)
- `loginWithGoogle` is a stub — needs Supabase OAuth (add `signInWithOAuth` + callback route) if you want Google login.
- Before 0003 runs, rate limiting falls back to in-memory (per instance) — it logs a warning and retries the RPCs every 60 s.
- `/api/videos` keeps the static fallback when the table is empty — remove it once the videos table is seeded. Same for `DEMO_FLAGS` in the labs flag route once real labs exist.
- Frontend pages still render static mock content for labs/challenges/research lists (DB-backed search/flag/progress are ready; wiring the listing pages to `/api/*` is the next frontend task).
- CSP still allows `unsafe-inline` (Next.js inline scripts); nonce-based CSP is the next step.
- Repo history still contains the two old admin passwords (redacted at HEAD). Rotating `ADMIN_PASS` makes them harmless; `git filter-repo` + force-push is optional cleanup.
