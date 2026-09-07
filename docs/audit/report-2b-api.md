# Task 2-b — API Routes & Backend Logic Audit (READ-ONLY)

**Repo:** `/home/z/my-project/hackerplatform` @ `fa74ce9` (backend commits `2a8fa3a`, `fa74ce9` pushed; working tree clean — verified).
**Stack:** Next.js 16 App Router + TypeScript, Supabase Postgres, custom httpOnly cookie sessions (`aegis_session` → `sessions` table), HMAC admin cookie (`aegis_admin_session`), service-role client for privileged routes, Cloudflare Pages target.
**Scope:** every file under `src/app/api/**` (12 route files — Glob `**/route.ts` + full tree walk, no others exist; no Server Actions), `src/lib/{admin-api,auth-server,auth-edge,supabase,csrf,rate-limit-server,rate-limit-ip,sanitize,env,data}.ts`, `middleware.ts`, `next.config.ts`, `supabase/migrations/0001_init.sql`, `0002_audit_and_login_tracking.sql`.
**No repo files were modified.** Nothing was written to `worklog.md`.

---

## 1. Complete Route Map

Enumerated via Glob `**/route.ts` under `src/app` → exactly **12 route files**, no `route.js`, no Server Actions (`rg '"use server"'` → 0 hits), no other API-shaped endpoints.

| # | Route | Method(s) | Auth required | Rate limit (claimed / effective) | Input validation | Response shape |
|---|-------|-----------|---------------|----------------------------------|------------------|----------------|
| 1 | `/api/auth/signup` | POST | none | 5 / **15 min claimed** / **60 s effective** per IP | email: `sanitizeEmail` (regex, 254, lower, HTML-escaped); password: policy 8–128, letters+numbers, common-password blocklist; name: trim, 64 (unescaped) | 201 `{user:{id,email,name,plan,role,provider,reputation},ok}` + `Set-Cookie: aegis_session` (HttpOnly, SameSite=Strict, Secure prod, 30 d); 400/409/429/500 `{error}` |
| 2 | `/api/auth/login` | POST | none | 5 / **15 min claimed** / **60 s effective** per IP | email: `sanitizeEmail`; password: ≥8 | 200 `{user,ok}` + Set-Cookie; 400/401 (generic)/429/500 |
| 3 | `/api/auth/session` | GET | session cookie | none | — | 200 `{user,ok:true}` / 401 `{user:null,ok:false}`; **no `Cache-Control: no-store`** |
| 4 | `/api/auth/logout` | POST | session cookie (optional) | none | — | 200 `{ok}` + clear-cookie |
| 5 | `/api/admin/login` | POST | none | 5 / 15 min per IP (**correct** — `recordAttemptServer(key, 900_000)`) | username vs `ADMIN_USER` (ci, default `admin`); password vs `ADMIN_PASS` via `===` (non-timing-safe; RL-mitigated) | 200 `{ok}` + `aegis_admin_session` HMAC cookie (1 h); 401/429/500 (unconfigured) |
| 6 | `/api/admin/logout` | POST | none | none | — | 200 `{ok}` + clear-cookie |
| 7 | `/api/admin/[resource]` — users, videos, labs, challenges, events, news, cves | GET, POST, PATCH, DELETE (+OPTIONS) | admin cookie (middleware **and** in-route `verifyAdminToken`) + CSRF double-submit header/cookie on mutations | **none** | per-resource field whitelist (`ADMIN_RESOURCES`), enums, maxLen caps, numbers via parseInt; `id` from body (PATCH) / query (DELETE) — **no UUID validation** | list 200 `{data,resource}` (limit ≤500, default 200); create 201 `{data,resource,ok}`; update 200 `{data,resource,ok}`; delete 200 `{ok,id,resource}`; 400/401/403/404/409/500/503 `{error}`; users listColumns exclude `password_hash` |
| 8 | `/api/search` | GET | none | none (public cache `s-maxage=60`) | `q` trim + 100-char cap; page ≥1; limit 1–50 | 200 `{results,total,page,limit,query,totalPages,source:"supabase"\|"mock"}`; 200 `{results:[],source:"none"}` when empty q |
| 9 | `/api/progress` | GET, POST | session cookie (401 without) | **none** | labId/challengeId/pathId: non-empty strings, **no format/length/existence check** (FK catches garbage at insert → 500); status enum allow-list; progress clamped 0–100; `pathId` accepted but **never persisted** (no `path_id` column) | GET 200 `{userId,progress:[{id,lab_id,challenge_id,status,progress,updated_at}],source}`; POST 200 `{ok,progress,source}`; 401/400/500/503 `{error}` |
| 10 | `/api/labs/[id]/flag` | POST | none (session optional → saves progress) | 5 / 60 s per **lab+IP** (per-isolate) | flag: must match `^(flag\|aegis)\{[^}]+\}$`; `id` from path, unvalidated (non-UUID → DB error → demo fallback) | 200 `{correct,message,progressSaved}` / `{correct:false,message[,hint]}`; 400/429 |
| 11 | `/api/videos` | GET | none | none (public cache `s-maxage=3600`) | — | 200 `{videos:[…],source:"supabase"\|"mock"}`; `select("*")` (no sensitive columns in schema) |
| 12 | `/api/health` | GET | none | none | — | 200 `{status:"ok",timestamp,version,env,db:"ok"\|"unconfigured"\|"error"}` |

**Middleware** (`middleware.ts`): runs only on `/admin/:path*` + `/api/admin/:path*`; exempted `/api/admin/login|logout`; rejects bad admin cookie with 401 (API) or redirect `?login` (page). Site-wide security headers (CSP, HSTS, XFO, nosniff, etc.) **are** covered separately by `next.config.ts` `headers()` on `/(.*)` — verified, so middleware header application is redundant, not a gap. CSP includes `script-src 'unsafe-inline'` (weak but present).

---

## 2. Severity-Ranked Findings

### CRITICAL

**C-1. Public RLS on `users` exposes `password_hash` to anyone with the anon key.**
- **File:** `supabase/migrations/0001_init.sql:39-47` — `create policy "public profiles are viewable by everyone" on public.users for select using (true);`
- **Evidence:** RLS filters **rows**, not **columns**. `NEXT_PUBLIC_SUPABASE_ANON_KEY` is a public, client-bundle-exposed key. Anyone can `GET https://<project>.supabase.co/rest/v1/users?select=id,email,password_hash` and bulk-download every user row including scrypt password hashes and emails.
- **Impact:** total offline password-cracking surface for the whole user base; defeats every API-layer protection built in `2a8fa3a` (routes never return `password_hash` — confirmed — but the DB hands it to the anon role).
- **Fix:** `revoke select on public.users from anon, authenticated;` then `grant select (id, email, name, plan, provider, role, reputation, status, created_at) to anon;` (column-level grants), or drop the policy and expose a `public.user_profiles` **security-barrier view** without `password_hash`, granting the view to `anon`. Ship as migration `0003`.

### HIGH

**H-1. Public RLS on `labs`/`challenges` exposes `flag_hash` to the anon key.**
- **File:** `supabase/migrations/0001_init.sql:97-106` (labs) and `:121-130` (challenges) — `using (true)` select policies.
- **Evidence:** `GET /rest/v1/labs?select=id,flag_hash` with the public anon key returns all flag hashes. Flags are low-entropy, format-constrained strings (`flag{...}`, regex-published in the route source) → scrypt hash + low entropy = practical offline dictionary/brute-force.
- **Impact:** CTF integrity collapse; also undermines the online rate limiting on `/api/labs/[id]/flag` entirely (attack moves offline).
- **Fix:** same pattern as C-1 — revoke column `flag_hash` from `anon` (column-level grant or public views without `flag_hash`). Verified server-side reads go through service-role, which bypasses RLS and is unaffected.

**H-2. Login/signup rate-limit window mismatch — protection is 15× weaker than documented.**
- **File:** `src/app/api/auth/login/route.ts:12` (check `900_000`) vs `:29,33,39` (`recordAttemptServer(key)` → default `windowMs = 60_000`); `src/app/api/auth/signup/route.ts:11` vs `:29,34,39,57`; root cause `src/lib/rate-limit-server.ts:20` (default 60 s).
- **Evidence:** the bucket's `resetAt` is set by `recordAttemptServer`, not by `checkRateLimitServer`, so the 15-minute window never materializes; counters reset after 60 s.
- **Impact:** effective 5 failures/min/IP sustained (≈7,200/day/IP per route) instead of 5/15 min — password brute-force surface greatly enlarged.
- **Fix:** pass the same window to both calls (`recordAttemptServer(key, 900_000)`), or make `checkRateLimitServer` create the bucket with its own window. (Admin login already passes `900_000` explicitly — only login/signup are wrong.)

**H-3. All rate limiting is in-memory per isolate — ineffective on Cloudflare Pages multi-isolate.**
- **File:** `src/lib/rate-limit-server.ts:6` (`const buckets = new Map()`); used by signup/login/admin-login/flag.
- **Evidence:** module-level Map; serverless isolates are recycled and run concurrently; buckets are neither shared nor durable.
- **Impact:** distributed or even casually parallel brute force on `auth/login`, `admin/login`, and flag submission is effectively unlimited; only warm per-isolate luck throttles anything.
- **Fix:** move counters to durable storage (Cloudflare KV/Durable Object, Upstash Redis, or a Postgres `rate_limits` table via the existing service client), or front the routes with a Cloudflare WAF rate-limiting rule on `/api/auth/*` and `/api/labs/*/flag`.

### MEDIUM

**M-1. `POST /api/progress` trusts client-supplied completion state; race duplicates; `pathId` silently dropped; no rate limit.**
- **File:** `src/app/api/progress/route.ts:27-42` (status/progress taken from body), `:99-117` (select-then-upsert; no unique index), `:101-106` (payload omits `path_id` although `pathId` is validated and required by `sanitizeBody:31`).
- **Evidence:** any logged-in user can POST `{"challengeId":"<any valid uuid>","status":"completed","progress":100}` — there is no verification the item was solved (no challenge-flag endpoint exists at all). Two concurrent first-writes for the same (user, null, null) key insert two rows (documented "single-writer" assumption, `:108-110`). Learning-path progress is accepted then discarded — and collides: all `pathId` posts match the same `lab_id IS NULL AND challenge_id IS NULL` row (`:112-117`). No rate limit on this mutating route.
- **Impact:** gamification integrity (fake completions), duplicate progress rows, broken path progress UX, unauthenticated-throttled write amplification for logged-in users (bounded by FK to valid lab/challenge UUIDs — invalid ids produce a 500 from Postgres, itself a minor robustness bug).
- **Fix:** add a challenge-flag verification endpoint and only allow `completed` via it (or accept the client-trust model explicitly); add `unique(user_id, lab_id, challenge_id)`-style covering index (or partial indexes for the NULL cases) and switch to a real upsert; persist `path_id` (schema + route) or stop accepting it; add a rate limit (e.g., 30/min/user); return 400 on non-UUID ids instead of letting Postgres 500.

**M-2. `DEMO_FLAGS` hardcoded in source of a public repo.**
- **File:** `src/app/api/labs/[id]/flag/route.ts:13-20`.
- **Listed values:** `lab-1: flag{sqli_fundamentals_2026}`, `lab-2: flag{privesc_linux_2026}`, `lab-3: flag{ad_enumeration_master}`, `lab-4: flag{iam_misconfig_pwned}`, `lab-5: flag{volatility_memory_win}`, `lab-6: flag{wireshark_traffic_hunter}`.
- **Assessment:** acceptable bootstrap tradeoff as documented (labs stay solvable pre-seeding; DB `flag_hash` is authoritative once seeded — `:91-104`). The repo is public (`xdadik/hackerplatform`), so the six demo flags are trivially readable. Additionally, demo-lab solves never persist progress (`:116` requires `labRow && supabase`), so the exposure grants at most "solved" UI feedback, not data.
- **Fix:** once the DB is seeded, delete `DEMO_FLAGS` and make "DB unconfigured" return 503 instead of falling back. Note: DB lookup errors for non-UUID ids (`lab-1`) also route into this fallback even when the DB is configured.

**M-3. Admin token is HMAC-keyed by `ADMIN_PASS` itself; single shared admin identity; admin logins not audited.**
- **File:** `src/lib/auth-server.ts:239-264` (`buildAdminToken`/`verifyAdminToken` — `hmacSign(unsigned, secret)` where secret = `ADMIN_PASS`), `src/app/api/admin/login/route.ts:42`, `src/lib/admin-api.ts:255-261` (`actor: "admin"` constant).
- **Evidence:** leakage of `ADMIN_PASS` (env var, also accepted via `AEGIS_ADMIN_PASS`/`ADMIN_PASSWORD` aliases — `src/lib/env.ts:73`) lets an attacker mint valid admin tokens directly, with no revocation short of rotating the env var; all admin actions are attributed to the indistinguishable actor `"admin"`; `admin/login` success/failure never reaches `audit_logs` (only CRUD mutations do, `admin-api.ts:368,407,428`).
- **Impact:** blast radius of one shared secret = full unrevokable admin; no per-action attribution or login trail for forensics.
- **Fix:** derive the signing key as `HMAC(ADMIN_PASS, NEXTAUTH_SECRET)` or a dedicated `ADMIN_SESSION_SECRET`; add `audit_logs` writes for admin login success/failure (with IP); longer term, per-admin DB accounts.

**M-4. `audit_logs` writes are best-effort, post-hoc, and silently droppable.**
- **File:** `src/lib/admin-api.ts:251-265` (`writeAudit` — `catch { /* non-fatal */ }`, returns early if service client is null), called only **after** a successful mutation (`:368,407,428`).
- **Evidence:** if the audit table is missing (pre-`0002` migration), the insert fails, or Supabase hiccups, the mutation stands with no record; failures are swallowed with no counter/log.
- **Impact:** audit trail cannot be relied on as evidence; an attacker with transient DB write errors (or a dropped table) gets unaudited mutations.
- **Fix:** at minimum `console.error` on audit failure and surface a warning header/field in the response; better: write the audit row first (intent) then the mutation, or use a Postgres trigger on the 7 tables so logging cannot be bypassed by the API layer at all.

**M-5. No password-reset path; admin-created users can be permanently locked out.**
- **File:** `src/lib/admin-api.ts:49-55` (`users.update` rules have no `password` field), `:59-70` (`beforeWrite` sets `password_hash = null` on create when password <8 chars), signup is the only password entry point.
- **Evidence:** an admin creating a user with a 7-char password (passes `str(128, optional)`) yields `password_hash = null`; `authenticateUser` (`auth-server.ts:103`) rejects null hashes; no reset endpoint exists anywhere.
- **Impact:** silent account lockouts + support burden; also no email verification, no forgot-password, no password change for anyone.
- **Fix:** add `password` to `users.update` rules (hashed via existing `beforeWrite`), and build a reset flow; validate password policy on admin user-create too.

**M-6. User enumeration: signup 409 + login timing oracle.**
- **File:** `src/app/api/auth/signup/route.ts:56-58` (explicit `409 "account already exists"`); `src/lib/auth-server.ts:101-108` (`authenticateUser` returns null **before** running scrypt when the user doesn't exist or has no hash → response-time difference ≈ one scrypt computation).
- **Impact:** account-existence harvesting via direct response (signup) and via timing (login, mitigated only partially by the 5/min limit).
- **Fix:** keep the 409 (common product tradeoff) but fix the timing oracle: when the user is missing, verify against a fixed dummy scrypt hash so both paths cost the same.

### LOW

**L-1. Middleware env alias mismatch can lock the admin out.** `middleware.ts:47` reads `ADMIN_PASS || AEGIS_ADMIN_PASS` (no `ADMIN_PASSWORD`), while `env.ts:73` accepts all three. With only `ADMIN_PASSWORD` set, `/api/admin/login` succeeds and signs a token, but middleware (different secret, empty → `verifyAdminTokenEdge` false) 401s every subsequent admin API call. Fix: read through one shared env module.

**L-2. Admin API leaks raw Supabase error text; no UUID validation on ids.** `admin-api.ts:332,365,404,424` return `error.message` verbatim in 500s (schema details; Postgres 22P02 for non-UUID ids). Fix: log internally, return generic text; validate `id` with a UUID regex → 400.

**L-3. Search: ILIKE wildcard injection, no SQLi, no users-table access.** `search/route.ts:43` builds `%${query}%` without escaping `%`/`_`/`\`; a `q=%` matches 25 rows/table (bounded by `.limit(25)` + 100-char cap + 60 s public cache). PostgREST parameterizes the value → no SQL injection. No `users` table queried (privacy OK). Mock fallback (`searchStatic`) returns only public demo content — nothing sensitive; the `source:"mock"` field does tell a caller the DB is unconfigured (trivial recon). Fix: `query.replace(/[\\%_]/g, m => "\\" + m)` for correctness; optional.

**L-4. `/api/health` discloses backend state.** Unauthenticated `db: ok/unconfigured/error`, app version, NODE_ENV (`health/route.ts:35-48`); unlimited service-role DB pings per request (light DoS vector). Fix: restrict detail behind admin auth or strip `db`/`version` in prod.

**L-5. `/api/auth/session` lacks `Cache-Control: no-store`.** `session/route.ts:5-12` — defaults are safe today (Cloudflare doesn't cache JSON by extension) but the endpoint returns PII; add the header like progress/flag do.

**L-6. CSRF token is client-generated and not session-bound.** `csrf.ts:6-30`: 32-byte `crypto.getRandomValues` hex, stored in `sessionStorage` + a **JS-set non-httpOnly `SameSite=Strict` cookie without `Secure`**; server compares cookie vs `x-csrf-token` with a constant-time loop (`admin-api.ts:239-249`). Valid double-submit; the admin session cookie being `SameSite=Strict` independently blocks cross-site requests. Residual risks: cookie injection via sibling subdomains (`Domain=` override) and any XSS (which wins regardless). Fix: have `/api/admin/login` set a server-issued, session-bound CSRF cookie (httpOnly optional, `Secure`, bound into the HMAC payload).

**L-7. Signup stores `name` unescaped** (trim + 64 only, `signup/route.ts:26`); React auto-escaping makes stored XSS unlikely; every other consumer should remain careful. `sanitizeEmail` HTML-escaping emails is unusual but consistent on both login and signup.

**L-8. Rate-limit Map grows unboundedly** (`rate-limit-server.ts:6`) — expired entries are never evicted, only overwritten; per-IP/per-lab keys accumulate → slow memory growth in a long-lived isolate.

**L-9. OPTIONS "discovery" endpoint is dead code.** `admin/[resource]/route.ts:48-53` returns the resource list, but middleware 401s unauthenticated requests to `/api/admin/*` — the endpoint can never serve its intended (public) purpose; harmless but misleading.

**L-10. CSP allows `script-src 'unsafe-inline'`** (`next.config.ts:17`, mirrored in middleware) — weakens XSS defense sitewide; out of backend scope but noted for completeness.

**Non-findings verified (defense done right):**
- **Mass assignment:** `applyRules` (`admin-api.ts:271-308`) only copies whitelisted fields; `id`/`created_at`/`updated_at`/`password_hash` are not in any rule set; `role`/`plan`/`status`/`difficulty`/etc. are enum-clamped; `users.beforeWrite` derives `password_hash` server-side and strips plaintext `password`/`flag` before persisting. Signup hardcodes `role:"user"` (`auth-server.ts:85`). No client-controlled identity or timestamps.
- **`password_hash` at the API layer:** never returned — `users.listColumns` (`admin-api.ts:56`) excludes it, create/update `.select(listColumns)`, `rowToSessionUser` whitelists output fields, login/signup payloads are hand-built. (The C-1 exposure is DB-layer.)
- **Timing-safe comparisons:** `verifyPassword` → `timingSafeEqual` (`auth-server.ts:37`); admin token → length check + `timingSafeEqual` (`:259-262`); CSRF compare is a manual constant-time XOR loop (`admin-api.ts:245-248`).
- **Sessions:** 32-byte random tokens, SHA-256-hashed at rest, HttpOnly+SameSite=Strict+Secure(prod), 30 d TTL, sliding refresh + opportunistic expired-session cleanup, banned users rejected at session validation.
- **Admin defense-in-depth:** middleware cookie gate **and** in-route `verifyAdminToken` re-verification **and** CSRF on every mutation; `ADMIN_PASS="change-me"`/unset → hard fail (login 500, guards 401).
- **Error hygiene:** no stack traces or internals in normal responses (raw `error.message` only in admin 500s — L-2); login failure is a generic 401; rate-limited responses include `Retry-After`.

---

## 3. Coverage Gaps (what the backend still doesn't do)

1. **`src/lib/data.ts` mock data still ships and is imported by 8 page files** — `challenges/[id]`, `challenges`, `dashboard`, `leaderboard` (empty array), `labs`, `learn/paths`, `learn`, plus `api/search` + `api/videos` fallbacks. So labs/challenges/learn/dashboard pages render static content, **not** DB data — only admin, search, videos, progress, and auth are DB-wired. The "kill mocks" goal is only half-realized at the page layer.
2. **No challenge flag endpoint** — `challenges.flag_hash` exists in schema and admin API, but there is no `/api/challenges/[id]/flag`; challenge completion is only fakeable via `/api/progress` (M-1).
3. No password reset / change / email verification flows (M-5).
4. No user-facing profile endpoints (`/api/users/me`), no leaderboard API (table absent from schema too).
5. Progress GET has no pagination; admin list has pagination via `limit` only (no offset/cursor).
6. No admin-session revocation/logout invalidation (stateless token) — logout only clears the cookie.
7. Search never queries `users` (good) — but also can't search videos/events/learning paths server-side (paths come only from the static fallback).

---

## 4. Service-Role Usage Map

Client factories: `src/lib/supabase.ts` — `getSupabase()` (anon/publishable key, lines 134-161) and `getServiceSupabase()` (service-role key, 166-189). No `createServerClient` (no `@supabase/ssr`); no other `createClient` call sites (verified by rg).

| Consumer | Key | Server-side auth check before privileged work? |
|---|---|---|
| `src/lib/auth-server.ts` (createUser, getUserByEmail/authenticateUser, create/delete/get session — used by auth/signup, login, session, logout) | **service-role** | N/A — these *are* the auth layer; signup/login rate-limited; password_hash read/write stays server-side |
| `src/app/api/progress/route.ts` (GET/POST) | **service-role** | ✅ session → user resolved first; 401 before any DB access (reason: custom sessions can't satisfy `auth.uid()` RLS — documented) |
| `src/app/api/labs/[id]/flag/route.ts` | **service-role** | ✅ by design public: only reads `flag_hash` for server-side verify; writes progress only when a session resolves; rate-limited |
| `src/app/api/admin/[resource]/route.ts` → `src/lib/admin-api.ts` (all CRUD + audit) | **service-role** | ✅ middleware cookie gate + in-route `verifyAdminToken` + CSRF double-submit on mutations |
| `src/app/api/auth/login/route.ts` (`last_login_at` stamp) | **service-role** | ✅ runs only after successful password verification |
| `src/app/api/health/route.ts` (connectivity probe) | **service-role** | ⚠️ none — public probe, discards data (L-4) |
| `src/app/api/search/route.ts` | anon | N/A — public content tables only |
| `src/app/api/videos/route.ts` | anon | N/A — public content (`select("*")`, no sensitive columns per schema) |

**Every service-role usage performs its own server-side auth/identity resolution except the health probe and the flag route's read-only verification, both of which are intentional and non-privileged in effect.** The residual service-role risk is not the routes but the RLS policies (C-1/H-1) that expose the same secrets through the anon key.

---

## 5. Rate-Limit Coverage on Mutating Routes

| Mutating route | Rate limited? |
|---|---|
| `POST /api/auth/signup` | ✅ (5/IP — but 60 s effective window, H-2; per-isolate, H-3) |
| `POST /api/auth/login` | ✅ (same H-2/H-3 caveats) |
| `POST /api/auth/logout` | ❌ (harmless — no state beyond cookie clear + row delete) |
| `POST /api/admin/login` | ✅ 5/15 min/IP (correct window; per-isolate caveat) |
| `POST /api/admin/logout` | ❌ (harmless) |
| `POST/PATCH/DELETE /api/admin/[resource]` | ❌ (admin-gated; pre-auth requests are rejected cheaply by middleware; post-auth unlimited is acceptable) |
| `POST /api/progress` | ❌ **← the real gap** (authenticated write amplification, M-1) |
| `POST /api/labs/[id]/flag` | ✅ 5/60 s/lab/IP (per-isolate caveat; offline attack route via H-1 dominates) |

---

## 6. Recommended Next Actions (priority order)

1. **Migration 0003 (C-1, H-1):** revoke `anon` SELECT on `users.password_hash`, `labs.flag_hash`, `challenges.flag_hash` (column grants or barrier views). This is the single highest-impact fix.
2. **Fix the rate-limit window bug (H-2):** one-line changes in `login/route.ts` + `signup/route.ts` (pass `900_000`).
3. **Durable rate limiting (H-3):** Cloudflare WAF rules or KV/DO/Postgres-backed counters before launch.
4. **Progress hardening (M-1):** unique index + real upsert, UUID validation, `path_id` decision, rate limit, challenge-flag endpoint.
5. **Admin auth hardening (M-3/M-4):** dedicated signing secret, login auditing, audit-failure logging (or DB triggers).
6. **Password reset flow (M-5)** and login timing-oracle fix (M-6).
7. Delete `DEMO_FLAGS` after seeding (M-2); wire pages to the DB to retire `data.ts` (Gap 1).
