# Task 2-d — Database Schema & RLS Audit (READ-ONLY)

**Repo:** `/home/z/my-project/hackerplatform` (branch `master`, HEAD `fa74ce9`)
**Auditor:** sub-agent 2-d · **Date:** 2026-09-05
**Scope:** `supabase/migrations/0001_init.sql`, `supabase/migrations/0002_audit_and_login_tracking.sql`, root `supabase.sql`, cross-checked against every DB-touching file in `src/`.
**Rules honored:** no repo files modified, no `worklog.md` writes. Fix SQL is consolidated in §6 (draft only — no `.sql` file created).

**Architecture context (critical):** the app uses **custom auth** — `public.users.password_hash` (scrypt), opaque tokens hashed in `public.sessions.token_hash`, all server routes use the **service-role key** (bypasses RLS). The browser holds only the **anon key**. Therefore any RLS expression containing `auth.uid()` evaluates to **NULL** for every real app user. RLS policies referencing `auth.uid()` are effectively "deny for anon/authenticated" — which is *safe but useless* — while any `using (true)` policy is a **live unauthenticated leak** via PostgREST.

**Anon-key usage map (verified by grepping every `.from('…')` in `src/`):**

| Route | Client | Tables touched |
|---|---|---|
| `/api/search` (`src/app/api/search/route.ts:47-68`) | **anon** | labs, challenges, news, cves (SELECT) |
| `/api/videos` (`src/app/api/videos/route.ts:41-45`) | **anon** | videos (SELECT `*`) |
| `/api/health`, `/api/auth/*`, `/api/progress`, `/api/labs/[id]/flag`, `/api/admin/[resource]` | **service-role** | users, sessions, progress, audit_logs, all content tables |

⇒ **No code path ever reads `public.users` with the anon key.** The world-readable users policy protects nothing the app needs.

---

## 1. Severity-ranked findings

### CRITICAL-1 — `public.users` is world-readable through the anon key (all columns, incl. `password_hash`)

**Evidence** — `supabase/migrations/0001_init.sql:41-43`:
```sql
create policy "public profiles are viewable by everyone"
  on public.users for select
  using (true);
```
Postgres RLS is **row**-level only — it cannot hide columns. Supabase's default privileges grant `SELECT` on public tables to `anon`, so **anyone holding the public anon key** can run:

```
GET https://<ref>.supabase.co/rest/v1/users?select=*
GET /rest/v1/users?select=password_hash,email,role&role=eq.admin
```

**Every column leaks** (0001 + 0002):

| Column | Sensitivity |
|---|---|
| `password_hash` | **Critical** — scrypt hash `scrypt$salt$hex`; offline dictionary attack. Password policy only requires 8 chars + letters + numbers (`src/lib/auth-server.ts:213-223`), so many accounts will crack. |
| `email` | **High** — full PII dump, phishing/targeting list. |
| `role` | **High** — identifies admins (`role=eq.admin`) for targeted account takeover. |
| `last_login_at` | Medium — activity reconnaissance. |
| `status`, `plan`, `provider`, `reputation` | Medium — metadata disclosure. |
| `id`, `name`, `created_at`, `updated_at` | Low. |

**Fix** (drop world-read; own-row-only; strip grants as defense in depth — safe because the app only touches `users` via service-role):
```sql
drop policy if exists "public profiles are viewable by everyone" on public.users;
drop policy if exists "users can select own row" on public.users;
create policy "users can select own row"
  on public.users for select
  using (id = auth.uid());
revoke all on public.users from anon, authenticated;
```
After this: anon → 0 rows (and PostgREST hides the table entirely); a hypothetical Supabase-Auth (`authenticated`) caller sees only their own row; service-role unaffected. The `users can update own profile` policy (0001:45-47) can stay — `auth.uid()` never matches an app `users.id` (ids are `crypto.randomUUID()` values from `src/lib/auth-server.ts:74`, unrelated to GoTrue uids).

*If a public profile feature is ever wanted*, do not re-open the table: create a safe projection view (id, name, reputation) or use column-level grants.

### CRITICAL-2 — `admin_user_overview` VIEW: unauthenticated full PII dump **and a write/privilege-escalation path**

**Evidence** — `supabase/migrations/0002_audit_and_login_tracking.sql:30-33`:
```sql
create or replace view public.admin_user_overview as
  select id, email, name, role, plan, status, reputation, provider, last_login_at, created_at
  from public.users
  order by created_at desc;
```
Three compounding problems:

1. **Default exposure.** Objects created by `postgres` in schema `public` get Supabase's default privileges — `GRANT ALL ON TABLES … TO anon, authenticated` — and views count as tables for grants. PostgREST therefore serves `GET /rest/v1/admin_user_overview` to the anon key.
2. **Owner-privilege execution.** The view has no `security_invoker` (default off), so the underlying `users` query runs with the **view owner's** identity (postgres, the table owner, who bypasses users RLS). **Fixing CRITICAL-1 alone does NOT stop this view** — it leaks `id, email, name, role, plan, status, reputation, provider, last_login_at, created_at` for **every user** (`password_hash` is not in the select list — the only mercy).
3. **It gets worse — the view is auto-updatable.** It's a simple single-table view (plain column list; `ORDER BY` does not break auto-updatability), so Postgres allows `INSERT`/`UPDATE`/`DELETE` **through** the view, executed with owner privileges → users-RLS bypassed. With `GRANT ALL` to anon, an unauthenticated attacker can potentially do:

```
PATCH /rest/v1/admin_user_overview?id=eq.<victim-uuid>  body: {"role":"admin"}
POST  /rest/v1/admin_user_overview  body: {"email":"x@x","name":"x","role":"admin"}
```
i.e. read every user **and escalate to admin / forge accounts** without ever logging in.

**Fix** (the app never queries this view — admin panel reads `users` directly via service-role with an explicit column list, `src/lib/admin-api.ts:56`; keep it only as a dashboard convenience, hardened):
```sql
revoke all on public.admin_user_overview from anon, authenticated;   -- kills PostgREST exposure (read AND write)
alter view public.admin_user_overview set (security_invoker = true); -- PG15+: underlying RLS now evaluated as the CALLER
```
Equally valid (cleanest): `drop view if exists public.admin_user_overview;` — nothing in `src/` references it (verified via repo-wide grep).

### HIGH-3 — Root `supabase.sql`: stale legacy init that poisons the schema if run alongside (or before) 0001 — and the live project probably already contains it

See full verdict in §4. Headline: it contains

```sql
create policy "progress_owner_all" on public.progress for all using (true) with check (true);  -- supabase.sql:77
```
If this file (or the legacy schema it created in commit `3188a47` — "prod: supabase rijdajzrkpuuochzwcsk live (6 labs, 8 challenges)") is applied, **any anon key holder gains full read/write/delete on every progress row**, because RLS policies OR together and this one always passes. It also seeds text ids (`'lab-1'`) that violate 0001's `uuid` keys, so running it after 0001 fails mid-file (in the SQL Editor's single transaction everything rolls back; under psql the poison policy survives).

### MEDIUM-4 — `progress` has no unique constraint → duplicate rows under races

**Evidence:** 0001:133-141 defines no unique key (the legacy `supabase.sql:57` had `unique (user_id, lab_id, challenge_id, path_id)` — dropped during the redesign). The app compensates with select-then-upsert:
- `src/app/api/progress/route.ts:112-137` (select by `user_id`+`lab_id`/`challenge_id` is-null, then update-or-insert)
- `src/app/api/labs/[id]/flag/route.ts:123-142` (same pattern for lab completion)

Two concurrent requests (double-submit, or progress POST racing flag completion) both take the insert branch → **two rows for the same (user, lab)**. GET then returns duplicates and the "limit 1" update path only ever touches the first.

**Fix:**
```sql
-- dedupe existing (keeps newest), then:
create unique index if not exists uq_progress_user_lab       on public.progress (user_id, lab_id);
create unique index if not exists uq_progress_user_challenge on public.progress (user_id, challenge_id);
create unique index if not exists uq_progress_user_sentinel  on public.progress (user_id) where lab_id is null and challenge_id is null;
```
Design notes:
- The lab/challenge indexes are deliberately **non-partial**: NULLs are distinct in Postgres unique indexes, so challenge rows (`lab_id` null) are unaffected by the lab index and vice versa, **and** `ON CONFLICT (user_id, lab_id)` inference works — the app can switch to `.upsert(row, { onConflict: 'user_id,lab_id' })` (PostgREST `on_conflict=user_id,lab_id` cannot express the `WHERE` of a partial index, so partial indexes would break upserts).
- The partial "sentinel" index caps the junk `(user, null, null)` rows the API currently creates for `pathId`-only requests at one per user (integrity guard only; not ON CONFLICT-usable — fine, the app doesn't upsert those).
- **App change (out of SQL scope, recommended):** replace select-then-insert with upsert; under a race the second writer now gets a unique-violation (retry/update) instead of a silent duplicate.

### MEDIUM-5 — Rate limiting is in-memory only; no persistent `rate_limits`; no per-email signup cap

**Evidence:** `src/lib/rate-limit-server.ts:5-6` — `const buckets = new Map<string, Entry>()`. Used by login (5/15min/IP), signup (5/15min/IP), flag (5/min/lab/IP). Problems: resets on every deploy/restart; **per-instance** (Cloudflare Pages/Workers runs multiple isolates → effective limit ×N); no cross-instance sharing; signup limiter is IP-only — an attacker rotating IPs (or hitting different instances) can mass-register accounts (only the `users.email` unique constraint caps repeats of one address).

**Fix:** DB-backed fixed-window limiter table + atomic RPC, service-role-only (full design + SQL in §6 Section 5). Buckets: `login:ip:<ip>` 5/15m, `signup:ip:<ip>` 5/15m, **`signup:email:<email>` 3/day** (per-email cap), `flag:<lab>:<ip>` 5/min. Code change: swap `checkRateLimitServer/recordAttemptServer` calls for `svc.rpc('rate_limit_hit', …)` — one round-trip, atomic via row lock on the PK conflict.

### LOW-6 — `is_admin()`: must become `security definer` (with pinned `search_path`) to survive the CRITICAL-1 fix

**Evidence** — 0001:219-229: `language sql stable`, invoker rights, body fully schema-qualified (`public.users`, `auth.uid()`).

Analysis per the audit questions:
- **Today (pre-fix):** works. Policy evaluation runs the function with the *caller's* privileges; anon's subquery on `users` passes the `using (true)` policy; `id = auth.uid()` is NULL-comparison → `exists` = false. No error.
- **After CRITICAL-1 fix:** invoker-rights `is_admin()` would read `users` under the new `id = auth.uid()` policy → 0 rows for anon → still `false` (functionally fine for anon), but a legitimate Supabase-Auth admin (`authenticated`, `role='admin'`) would also get `false`, and any future tightening of the users policy silently neuters every admin-gated policy. **Make it `security definer`** — the function then reads `users` as its owner (postgres, table owner → RLS bypass), giving the correct answer independent of users-policy changes.
- **RLS recursion:** none today — no `users` policy calls `is_admin()` (users policies are `id = auth.uid()` style), so the call graph `video/labs/news/cves policies → is_admin() → users policies` is acyclic. Security definer additionally *breaks* any future cycle (owner context is not subject to users RLS), so it also future-proofs against the classic "infinite recursion detected in policy" error.
- **SQL injection surface:** none — zero arguments, static body, fully-qualified names.
- **Volatility:** `stable` is correct (`auth.uid()` is stable; per-statement caching possible — fine).
- **EXECUTE grant:** the default `PUBLIC` grant **must stay**. RLS policy evaluation checks function EXECUTE with the *caller's* privileges — the news/cves SELECT policies (`status = 'Published' or public.is_admin()`) run for every anon SELECT, and revoking EXECUTE from anon would turn public news search into `permission denied for function is_admin` errors. (This is the one place where "revoke everything from anon" is wrong.)

**Fix:**
```sql
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''   -- pinned per Supabase security guidance; body is schema-qualified
as $$
  select exists (
    select 1 from public.users
    where id = auth.uid() and role = 'admin'
  );
$$;
```
(Order matters in non-transactional runs: replace `is_admin()` **before** swapping the users select policy — the consolidated file in §6 does this; the SQL Editor's implicit single transaction makes the whole script atomic anyway.)

### LOW-7 — Missing operational indexes

- `users.last_login_at` — stamped on every login (`src/app/api/auth/login/route.ts:48`) and surfaced in admin overview; no index. **Add** `(last_login_at desc)`.
- `users.created_at` — every admin list orders by it (`admin-api.ts:57`); no index. **Add** `(created_at desc)`.
- `sessions.expires_at` — opportunistic cleanup deletes by `expires_at < now()` (`auth-server.ts:158`); no index. **Add** `(expires_at)`.
- `progress (user_id, updated_at desc)` — GET filters by user and orders by `updated_at desc` (`progress/route.ts:57-61`); only a bare `user_id`-less layout exists (no index at all on progress!). **Add composite.**

### INFO-8 — Minor / hardening notes

1. **`idx_sessions_token_hash` is redundant** (0001:29): the `token_hash text not null unique` constraint already creates a unique index; the extra index only adds write amplification. Harmless; optionally `drop index if exists idx_sessions_token_hash;`.
2. **`FORCE ROW LEVEL SECURITY` deliberately NOT proposed** for `users`: it would make RLS apply to the table owner (`postgres`), which is the role the Supabase Dashboard Table Editor / SQL Editor runs as — the admin would see zero rows in the UI. The view hardening (CRITICAL-2) closes the owner-bypass abuse vector instead.
3. **GoTrue is enabled by default** on Supabase projects. Attackers can mint `authenticated` JWTs via `/auth/v1/signup` with the anon key. With the fixed policies this grants nothing (their `auth.uid()` matches no `users.id`), but if the app will never use Supabase Auth, disable email sign-ups in Dashboard → Authentication to shrink the surface.
4. **`users.id` has no default** (0001:6) — app always supplies `randomUUID()`, but a manual insert without id errors. Add `default gen_random_uuid()`.
5. **Optional CHECK constraints** on `news.status` / `cves.status` keep hand-written rows consistent with the RLS string match (see CRITICAL-6/status verdict below).
6. **Search `.or()` patterns** (`search/route.ts:51,56,61,66`) interpolate user text into PostgREST `ilike` patterns without escaping `%`/`_`/`,` — a `q=%` matches everything (DoS-ish, not SQL injection; PostgREST parameterizes). Code-level fix, noted for a future task.
7. **`challenges.flag_hash` is stored but never verified server-side** — there is no `/api/challenges/[id]/flag` route; the challenge page "validates" with a client-side regex (`src/app/challenges/[id]/page.tsx:68-71`), so any well-formed `flag{...}` is accepted. Code-level gap, out of SQL scope.
8. **`audit_logs` OK** (see §3).

---

## 2. Answers to the ten audit questions (quick index)

1. **users exposure** → CRITICAL-1. Leaks: *all 12 columns* incl. `password_hash`, `email`, `role`. App needs **zero** public users columns (no anon-key read of `users` anywhere in `src/`). Fix SQL above.
2. **admin_user_overview** → CRITICAL-2. Yes, anon can GET it (default privileges) and dump emails/roles/login times — *and* it is auto-updatable, so unauthenticated writes (admin escalation) are plausible. Fix: revoke + `security_invoker = true`, or drop (app doesn't use it).
3. **is_admin()** → LOW-6. Must become `security definer set search_path = ''` to survive the users lockdown; no recursion risk (and definer mode breaks future cycles); no injection; `stable` correct; keep PUBLIC EXECUTE (needed by policy evaluation for anon).
4. **sessions** → no leak path. The only policy is `using/with check (auth.uid() = user_id)` → NULL/mismatch for anon & authenticated → 0 rows; service-role bypasses. No API route selects or returns `token_hash` (`auth-server.ts:140` selects `id, user_id, expires_at, last_seen_at` only). 0003 adds `revoke all … from anon, authenticated` as belt-and-braces. OK.
5. **status strings** → **MATCH.** RLS: `status = 'Published'` (0001:189, 211). Code writes exactly `'Draft' | 'Published' | 'Pending'` for news (`src/lib/admin-api.ts:191,200`) and `'Draft' | 'Published'` for cves (`admin-api.ts:212,219`); the admin UI toggle writes the same Title-Case strings (`src/app/admin/page.tsx:696,720,770,784`); schema defaults `'Draft'`. No seeds write news/cves. No lowercase variants anywhere — nothing hidden/exposed by case. (Postgres `=` is case-sensitive, so this is a real match, not an accident.)
6. **progress uniqueness** → MEDIUM-4 fix above; app upsert `onConflict` target must be `user_id,lab_id` (labs) / `user_id,challenge_id` (challenges) — the non-partial indexes are chosen precisely so ON CONFLICT inference works.
7. **audit_logs** → OK: service-role-only writes (no INSERT policy → anon denied), reads gated by `is_admin()` (false for anon/GoTrue users), no UPDATE/DELETE policy → tamper-proof even for "admins" via PostgREST. 0003 adds the revoke for depth.
8. **rate_limits** → MEDIUM-5 / §6 Section 5 (table + atomic `rate_limit_hit()` RPC, service-role only; per-email signup bucket).
9. **schema-vs-code** → table in §5.
10. **supabase.sql verdict** → §4.

---

## 3. Confirmed-safe (no action)

| Item | Why |
|---|---|
| `sessions` RLS | Only policy requires `auth.uid() = user_id`; anon/authenticated never match; service-role writes only; `token_hash` is sha256-at-rest and never returned by any route. |
| `audit_logs` | Write path = service-role only; read policy `is_admin()` → false for anon; no update/delete policy → append-only. |
| Content-table SELECT policies (`using (true)` on labs/challenges/videos, `status='Published' or is_admin()` on news/cves) | Required — `/api/search` and `/api/videos` legitimately use the anon client; nothing sensitive in those tables (flag_hash included, but it's a scrypt hash — safe to expose; brute-forcing a flag hash offline is equivalent to guessing the flag). |
| news/cves write policies | All gated by `is_admin()` → false for every PostgREST client; all writes go through service-role admin routes. |
| Signup/login password handling | scrypt (N default, 64-byte key), timing-safe compare, httpOnly cookies — out of scope, no DB issue. |

---

## 4. `supabase.sql` (repo root) — verdict

**What it is:** the original, pre-migration init script from commit `3188a47` ("prod: supabase rijdajzrkpuuochzwcsk live (6 labs, 8 challenges)"), superseded by `supabase/migrations/0001_init.sql` in `0d25f98`. It references the live project URL and is a **stale, conflicting duplicate** — not a parallel source of truth, and **must not be run** on a project that has (or will have) 0001.

**Differences vs 0001:** `labs/challenges/videos` use **text** ids ('lab-1'…) vs uuid; `videos` has `lab_id`/`path_id` but not `subtitle/module/path/featured`; `progress` has `user_id text` (no FK to users), a `path_id` column, a `unique (user_id, lab_id, challenge_id, path_id)` constraint and **check constraints** (difficulty enums, status enum, progress 0-100) that 0001 dropped; no `users/sessions/events/news/cves/audit_logs`, no `is_admin()`, no `touch_updated_at` triggers; different policy names; demo seeds; trailing verification SELECT.

**What happens if BOTH run:**

- **0001 first, then supabase.sql:** all `create table if not exists` silently no-op. The legacy policies then get **added** alongside 0001's (names differ, no collision, no error): `labs_free_read`/`challenges_free_read`/`videos_free_read` are redundant SELECT policies — harmless; **`progress_owner_all` (`for all using (true) with check (true)`) is a CRITICAL hole** — full anon read/write/delete on progress (policies OR together; the restrictive 0001 policy can't veto it). The seed inserts then fail with `ERROR: invalid input syntax for type uuid: "lab-1"` — in the Supabase SQL Editor (single implicit transaction) the entire run rolls back, so the practical result is a confusing failure; under psql (autocommit) **the poison policy survives**.
- **supabase.sql first (e.g. already applied to the live project in 2024), then 0001:** 0001's `create table if not exists` **no-ops on the four legacy tables** → silent hybrid schema: labs/challenges/videos/progress keep text ids and legacy columns; users/sessions/events/news/cves get created fresh; both policy sets coexist (progress stays wide open via `progress_owner_all`). App consequences: every DB lab reports "Flag not configured" (no `flag_hash` column), admin video CRUD fails (no `subtitle/module/path/featured`), `progress` has no FK to users and keeps the open policy. **No duplicate-policy/trigger NAME errors occur** (0001's names differ), which is exactly why the failure is *silent*.

**Action (report-only, repo untouched):**
1. Delete or archive `supabase.sql` from the repo (recommend `git rm supabase.sql` — the migrations folder is the single source of truth). *Not performed — read-only task.*
2. Before running 0001 on the live project `rijdajzrkpuuochzwcsk`, **detect** the legacy schema:
   ```sql
   select column_name, data_type from information_schema.columns
   where table_schema = 'public' and table_name = 'labs' and column_name = 'id';
   -- data_type 'text'  → legacy schema is live (0001 will silently no-op!)
   -- data_type 'uuid'  → clean 0001 state
   ```
3. If legacy is live, clean it first (demo data only; export `progress` first if it matters — its `user_id` is a text blob with no user linkage anyway):
   ```sql
   drop policy if exists "progress_owner_all" on public.progress;
   drop table if exists public.progress    cascade;
   drop table if exists public.videos      cascade;
   drop table if exists public.challenges  cascade;
   drop table if exists public.labs        cascade;
   -- then run 0001 → 0002 → 0003 (0003 Section 0 re-neutralizes stray legacy policies).
   ```

---

## 5. Schema-vs-code mismatch list (0001/0002 ↔ `src/`)

| # | Code | Expects | Schema | Severity |
|---|---|---|---|---|
| 1 | `src/app/api/videos/route.ts:59-60` maps `row.lab_id`, `row.path_id` | videos `lab_id`, `path_id` | 0001 videos has neither (has `path`, plus `subtitle/module/featured`); the legacy `supabase.sql` HAD both | LOW — DB-backed videos always return `labId/pathId: null` (harmless nulls; the columns only ever worked on the legacy schema) |
| 2 | `src/app/api/videos/route.ts:49` also reads `row.youtubeId` | camelCase column | exists nowhere | INFO — defensive fallback, always null |
| 3 | `src/app/api/progress/route.ts:15,30-31,41,94` accepts `pathId` | progress `path_id` | 0001 progress has **no `path_id`** (legacy had it) | MED-LOW — `pathId`-only requests pass validation but persist a junk `(user, null, null)` sentinel row; learning-path progress is silently not stored |
| 4 | `src/lib/supabase.ts:51-63` `DbUser` | `last_login_at` | missing from the TS type (column exists since 0002) | INFO — type-only drift; runtime uses `select("*")` |
| 5 | `src/lib/supabase.ts:36` `DbProgress.progress: number \| null` | nullable | 0001: `progress integer not null default 0` | INFO — type-only |
| 6 | `src/lib/admin-api.ts:213` `publish_date` as free string (≤20 chars) | text | 0001 cves `publish_date date` | LOW — PostgREST coerces ISO `YYYY-MM-DD`; anything else 500s. Current admin UI never sends it |
| 7 | `src/app/api/labs/[id]/flag/route.ts:13-20` DEMO_FLAGS keyed `'lab-1'…'lab-6'` | text lab ids | 0001 labs ids are uuid | INFO — demo fallback only fires for labs absent from the DB; DB-seeded labs never match the static frontend ids |
| 8 | `src/lib/admin-api.ts` writes `challenges.flag_hash` | — | no server route ever verifies it (challenge flag UI is a client-side regex mock, `src/app/challenges/[id]/page.tsx:68-71`) | MED-LOW — code gap (flag stored but unverifiable) |
| 9 | users/sessions/progress/labs/challenges/events/news/cves/audit_logs column lists in `auth-server.ts`, `admin-api.ts`, `progress/route.ts`, `flag/route.ts`, `search/route.ts`, `videos/route.ts`, `login/route.ts` | — | **all match** 0001/0002 (verified column-by-column; `last_login_at` included; `news.tags` text vs code str ✓; `challenges.tags` text[] vs array join ✓; `events.date` text ✓) | OK |

**Bottom line:** no hard runtime column/type mismatches in the server paths; the drift is concentrated in the legacy-schema leftovers (`lab_id`/`path_id`/`pathId`) and the unimplemented challenge-flag verification.

---

## 6. Draft `0003_security_fixes.sql` (consolidated, fully idempotent)

> **This is a draft inside a report — no `.sql` file was created.** Run order: 0001 → 0002 → 0003, in the Supabase SQL Editor (its implicit single transaction makes the script atomic). Requires PG15+ for `security_invoker` (all current Supabase projects qualify). Mental idempotency verification: statement-by-statement table follows the SQL.

```sql
-- ============================================================================
-- Aegis Platform — 0003_security_fixes.sql  (DRAFT, audit task 2-d)
-- Run AFTER 0001_init.sql and 0002_audit_and_login_tracking.sql.
-- Fully idempotent: every statement is drop-if-exists / create-or-replace /
-- if-not-exists / guarded, so re-running never errors.
-- Requires PostgreSQL 15+ (security_invoker) — Supabase default.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- SECTION 0 — Neutralize legacy artifacts from the old root supabase.sql
-- (no-ops on a clean 0001 database; critical if the legacy script ever ran)
-- ---------------------------------------------------------------------------
drop policy if exists "progress_owner_all" on public.progress;
drop policy if exists "labs_free_read" on public.labs;
drop policy if exists "challenges_free_read" on public.challenges;
drop policy if exists "videos_free_read" on public.videos;
-- If the LIVE project still has the legacy schema (labs.id is TEXT), 0001
-- silently no-ops and this file is not enough — see audit/report-2d-db.md §4:
--   select data_type from information_schema.columns
--   where table_schema='public' and table_name='labs' and column_name='id';

-- ---------------------------------------------------------------------------
-- SECTION 1 — Harden is_admin() BEFORE locking down users.
-- SECURITY DEFINER so the inner users read is NOT subject to the new
-- restrictive users policy (function owner = postgres = table owner, no
-- FORCE RLS). Pinned search_path per Supabase guidance; body is fully
-- schema-qualified; no arguments => no SQL-injection surface; STABLE ok.
-- IMPORTANT: EXECUTE stays granted to PUBLIC (default). RLS policy
-- evaluation runs this function with the CALLER's privileges — the
-- news/cves SELECT policies call it for every anon request, and revoking
-- EXECUTE would break public reads with permission errors.
-- Recursion: none (no users policy references is_admin(); definer mode
-- would break any future cycle anyway).
-- ---------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.users
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ---------------------------------------------------------------------------
-- SECTION 2 — users: stop the world-readable leak
-- (password_hash, email, role, reputation, status, last_login_at, ...)
-- No app code reads users with the anon key (verified) — nothing public is
-- needed. anon -> 0 rows; Supabase-Auth users -> own row; service-role
-- (all app routes) unaffected.
-- ---------------------------------------------------------------------------
drop policy if exists "public profiles are viewable by everyone" on public.users;
drop policy if exists "users can select own row" on public.users;
create policy "users can select own row"
  on public.users for select
  using (id = auth.uid());

-- Defense in depth: strip direct table grants so PostgREST hides these
-- tables from anon entirely. Safe: every app path uses the service key.
revoke all on public.users       from anon, authenticated;
revoke all on public.sessions    from anon, authenticated;
revoke all on public.audit_logs  from anon, authenticated;
revoke all on public.progress    from anon, authenticated;

-- ---------------------------------------------------------------------------
-- SECTION 3 — admin_user_overview: close the anon READ and WRITE hole.
-- The view is auto-updatable and (security_invoker off) executes with the
-- OWNER's privileges, bypassing users RLS: anon could GET every
-- email/role/login AND patch rows through the view (admin escalation).
-- Fix (a) revoke kills PostgREST exposure incl. writes; fix (b) invoker
-- semantics makes the underlying RLS apply to the caller. Dropping the view
-- is an equally valid alternative (nothing in src/ uses it) — the guard
-- below keeps re-runs (and the dropped variant) error-free either way.
-- NOTE: deliberately NO "force row level security" on users — it would
-- blind the Supabase Dashboard Table Editor (runs as postgres).
-- ---------------------------------------------------------------------------
do $$
begin
  if exists (select 1 from pg_views
             where schemaname = 'public' and viewname = 'admin_user_overview') then
    revoke all on public.admin_user_overview from anon, authenticated;
    alter view public.admin_user_overview set (security_invoker = true);
  end if;
end $$;
-- Preferred alternative (choose one strategy, the guard tolerates both):
-- drop view if exists public.admin_user_overview;

-- ---------------------------------------------------------------------------
-- SECTION 4 — progress: one row per (user, lab) / (user, challenge)
-- ---------------------------------------------------------------------------
-- 4a. Deduplicate existing rows (keeps the most recent per key).
--     Idempotent: a second run deletes nothing.
with ranked_labs as (
  select id,
         row_number() over (partition by user_id, lab_id
                            order by updated_at desc, id) as rn
  from public.progress
  where lab_id is not null
)
delete from public.progress p
using ranked_labs r
where p.id = r.id and r.rn > 1;

with ranked_challenges as (
  select id,
         row_number() over (partition by user_id, challenge_id
                            order by updated_at desc, id) as rn
  from public.progress
  where challenge_id is not null
)
delete from public.progress p
using ranked_challenges r
where p.id = r.id and r.rn > 1;

-- 4b. Unique indexes. Deliberately NON-partial: NULLs are distinct, so
--     challenge-only rows (lab_id null) are untouched by the lab index and
--     vice versa, AND `ON CONFLICT (user_id, lab_id)` upserts infer them
--     (partial indexes cannot be inferred by PostgREST's on_conflict).
--     App note: switch /api/progress and /api/labs/[id]/flag to
--     .upsert(row, { onConflict: 'user_id,lab_id' }) (or
--     'user_id,challenge_id') so races retry instead of duplicating.
create unique index if not exists uq_progress_user_lab
  on public.progress (user_id, lab_id);
create unique index if not exists uq_progress_user_challenge
  on public.progress (user_id, challenge_id);

-- 4c. Sentinel rows (lab_id IS NULL AND challenge_id IS NULL — created by
--     the API's pathId-only requests) capped at one per user. Partial
--     index: data-integrity guard only, NOT usable as an ON CONFLICT target.
create unique index if not exists uq_progress_user_sentinel
  on public.progress (user_id)
  where lab_id is null and challenge_id is null;

-- ---------------------------------------------------------------------------
-- SECTION 5 — persistent rate limiting (replaces the in-memory Map that
-- resets on restart and diverges per Cloudflare instance) + per-email
-- signup cap. Service-role-only: RLS on, zero policies, explicit revokes.
-- Suggested buckets:
--   login:ip:<ip>        5 per  15 min   signup:ip:<ip>    5 per 15 min
--   signup:email:<mail>  3 per 24 h      flag:<lab>:<ip>   5 per  1 min
-- ---------------------------------------------------------------------------
create table if not exists public.rate_limits (
  bucket       text primary key,
  count        integer     not null default 0,
  window_start timestamptz not null default now(),
  window_ms    bigint      not null default 60000,
  updated_at   timestamptz not null default now()
);

create index if not exists idx_rate_limits_window_start
  on public.rate_limits (window_start);

alter table public.rate_limits enable row level security;
revoke all on public.rate_limits from anon, authenticated;

-- Atomic fixed-window counter (one round-trip, row-lock serialized):
--   const { data } = await svc.rpc("rate_limit_hit",
--     { p_bucket: `login:ip:${ip}`, p_max: 5, p_window_ms: 900_000 });
--   data === true  -> allow (and counted)   data === false -> 429
-- EXECUTE revoked from anon/authenticated so attackers cannot throttle
-- other users' buckets through the public REST RPC endpoint.
create or replace function public.rate_limit_hit(
  p_bucket   text,
  p_max      integer,
  p_window_ms bigint default 60000
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
begin
  insert into public.rate_limits as rl
    (bucket, count, window_start, window_ms, updated_at)
  values
    (p_bucket, 1, now(), p_window_ms, now())
  on conflict (bucket) do update
    set count        = case when rl.window_start <
                                now() - (rl.window_ms || ' milliseconds')::interval
                            then 1 else rl.count + 1 end,
        window_start = case when rl.window_start <
                                now() - (rl.window_ms || ' milliseconds')::interval
                            then now() else rl.window_start end,
        updated_at   = now()
  returning rl.count into v_count;
  return v_count <= p_max;
end $$;

revoke execute on function public.rate_limit_hit(text, integer, bigint)
  from public, anon, authenticated;
grant  execute on function public.rate_limit_hit(text, integer, bigint)
  to service_role;

-- Optional housekeeping (manual, or pg_cron if the extension is enabled):
--   delete from public.rate_limits
--   where window_start < now() - (window_ms || ' milliseconds')::interval;

-- ---------------------------------------------------------------------------
-- SECTION 6 — supporting indexes
-- ---------------------------------------------------------------------------
create index if not exists idx_users_last_login_at
  on public.users (last_login_at desc);          -- stamped on every login
create index if not exists idx_users_created_at
  on public.users (created_at desc);             -- admin lists + view order
create index if not exists idx_sessions_expires_at
  on public.sessions (expires_at);               -- expired-session cleanup
create index if not exists idx_progress_user_updated
  on public.progress (user_id, updated_at desc); -- GET progress ordering

-- ---------------------------------------------------------------------------
-- SECTION 7 — small hardening extras
-- ---------------------------------------------------------------------------
-- 7a. Default id for future manual inserts (app always supplies one today).
alter table public.users alter column id set default gen_random_uuid();

-- 7b. Status CHECK constraints — pin the exact strings the admin panel
--     writes and the RLS `status = 'Published'` match depends on.
do $$
begin
  if not exists (select 1 from pg_constraint
                 where conname = 'chk_news_status'
                   and conrelid = 'public.news'::regclass) then
    alter table public.news
      add constraint chk_news_status
      check (status in ('Draft', 'Published', 'Pending'));
  end if;
  if not exists (select 1 from pg_constraint
                 where conname = 'chk_cves_status'
                   and conrelid = 'public.cves'::regclass) then
    alter table public.cves
      add constraint chk_cves_status
      check (status in ('Draft', 'Published'));
  end if;
end $$;

-- ============================================================================
-- Verification (run after):
--   with anon key:  GET /rest/v1/users                 -> [] / permission denied
--                   GET /rest/v1/admin_user_overview   -> permission denied
--                   GET /rest/v1/news?select=id,title  -> only Published rows
--   select indexname from pg_indexes where schemaname='public';
--   select * from public.rate_limit_hit('selftest', 2, 60000);  -- true, true, false
-- ============================================================================
```

### Idempotency verification (statement by statement)

| Statement | Re-run behavior |
|---|---|
| S0 `drop policy if exists` ×4 | no-op once dropped |
| S1 `create or replace function` | replaces in place (same name/args/return); volatility & security flags updatable via REPLACE |
| S2 `drop policy if exists` ×2 + `create policy` | old & new names both dropped before create → no "already exists" |
| S2 `revoke …` | revoking already-revoked privileges is a silent no-op |
| S3 `do $$ … end $$` view guard | skipped if view absent (covers the "chose DROP" variant); REVOKE/ALTER inside are no-op-safe |
| S4a CTE-DELETEs | delete 0 rows on second run |
| S4b/4c `create unique index if not exists` | skipped once created (dupes already removed, so creation can't fail on re-run) |
| S5 `create table if not exists`, `create index if not exists`, `alter table enable RLS` (already enabled = no-op), `revoke`, `create or replace function`, `revoke/grant execute` | all natively idempotent |
| S6 `create index if not exists` ×4 | skipped once created |
| S7a `alter column set default` | setting the same default again is a no-op |
| S7b DO-guarded constraint adds | guarded on `pg_constraint` → skipped once added |

Ordering rationale: Section 1 (definer `is_admin`) precedes Section 2 (users lockdown) so a non-transactional runner never has a window where policies evaluate against a locked-down `users` with invoker-rights `is_admin` (which would merely return false for anon — still no error, but semantics are correct immediately). The SQL Editor's implicit transaction makes the whole script atomic regardless.

---

## 7. Next actions (for the main agent / user)

1. **Run order on the live project:** first run the §4 detection query — if `labs.id` is `text`, do the §4 cleanup (drop legacy 4 tables) → then 0001 → 0002 → 0003 (from §6).
2. **Repo hygiene (code change, not done here):** `git rm supabase.sql` to prevent future confusion.
3. **App-side follow-ups surfaced by this audit:** switch progress/flag routes to `.upsert(onConflict)`; persist or reject `pathId`; add `/api/challenges/[id]/flag` server verification (or stop writing `challenges.flag_hash`); swap in the `rate_limit_hit` RPC; consider disabling GoTrue email signups in the dashboard.
4. **Verify fixes** with the curl checks in §6's verification block.
