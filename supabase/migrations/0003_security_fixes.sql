-- ============================================================================
-- Aegis Platform — 0003_security_fixes.sql
-- Run AFTER 0001_init.sql and 0002_audit_and_login_tracking.sql.
--
-- Fixes the critical findings of the 2026-09 security audit:
--   * users table was world-readable via the anon key (password_hash leak)
--   * admin_user_overview view bypassed RLS and was writable by anon
--   * flag_hash on labs/challenges readable with the anon key (offline cracking)
--   * progress rows could duplicate (no unique constraints)
--   * rate limiting was in-memory only (per-instance, reset on restart)
--
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
-- silently no-ops and this file alone is not enough. Detect it with:
--   select data_type from information_schema.columns
--   where table_schema='public' and table_name='labs' and column_name='id';
-- If that returns 'text', drop the legacy tables first (see audit report 2-d §4).

-- ---------------------------------------------------------------------------
-- SECTION 1 — Harden is_admin() BEFORE locking down users.
-- SECURITY DEFINER so the inner users read is NOT subject to the new
-- restrictive users policy (function owner = postgres = table owner, no
-- FORCE RLS). Pinned search_path per Supabase guidance; the body is fully
-- schema-qualified; no arguments => no SQL-injection surface; STABLE ok.
-- IMPORTANT: EXECUTE stays granted to PUBLIC (default). RLS policy
-- evaluation runs this function with the CALLER's privileges — the
-- news/cves SELECT policies call it for every anon request, and revoking
-- EXECUTE would break public reads with permission errors.
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
-- RLS is ROW-level only — the old `using (true)` select policy exposed every
-- column to anyone holding the public anon key via PostgREST. No app code
-- reads users with the anon key (verified: only search+videos use anon, on
-- labs/challenges/news/cves/videos), so nothing public is needed:
--   anon/authenticated -> 0 rows; service-role (all app routes) unaffected.
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
-- SECTION 3 — flag_hash lockdown (labs, challenges).
-- Same class of leak as Section 2: the tables are legitimately public-read
-- (search + catalog pages), but flag_hash must never reach the anon key or
-- the flags can be brute-forced offline. Column-level revokes keep every
-- other column readable — PostgREST honours column privileges and simply
-- omits flag_hash from `select=*` results for anon/authenticated.
-- The service-role (flag verification routes, admin CRUD) is unaffected.
-- ---------------------------------------------------------------------------
revoke select (flag_hash) on public.labs from anon, authenticated;
revoke select (flag_hash) on public.challenges from anon, authenticated;

-- ---------------------------------------------------------------------------
-- SECTION 4 — admin_user_overview: close the anon READ and WRITE hole.
-- The view is auto-updatable and (security_invoker off) executes with the
-- OWNER's privileges, bypassing users RLS: anon could GET every
-- email/role/login AND patch rows through the view (admin escalation).
-- Fix (a) revoke kills the PostgREST exposure incl. writes; fix (b) invoker
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
-- SECTION 5 — progress: one row per (user, lab) / (user, challenge)
-- ---------------------------------------------------------------------------
-- 5a. Deduplicate existing rows (keeps the most recent per key).
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

-- 5b. Unique indexes. Deliberately NON-partial: NULLs are distinct in
--     Postgres unique indexes, so challenge-only rows (lab_id null) are
--     untouched by the lab index and vice versa. The app writes via
--     select-then-upsert and retries on the rare duplicate-key race.
create unique index if not exists uq_progress_user_lab
  on public.progress (user_id, lab_id);
create unique index if not exists uq_progress_user_challenge
  on public.progress (user_id, challenge_id);

-- 5c. Sentinel rows (lab_id IS NULL AND challenge_id IS NULL — created by
--     pathId-only API requests) capped at one per user. Partial index: a
--     data-integrity guard (cannot be used as an ON CONFLICT target).
create unique index if not exists uq_progress_user_sentinel
  on public.progress (user_id)
  where lab_id is null and challenge_id is null;

-- ---------------------------------------------------------------------------
-- SECTION 6 — persistent rate limiting. Replaces the in-memory Map that
-- reset on every restart and diverged per Cloudflare isolate.
-- Buckets used by the app:
--   login:ip:<ip>        10 per 15 min   login:acct:<email> 10 per 15 min
--   signup:ip:<ip>        5 per 15 min   signup:email:<mail>  3 per 24 h
--   admin_login:ip:<ip>   5 per 15 min   flag:<lab>:<ip>      5 per 1 min
--   cflag:<ch>:<ip>       5 per 1 min    progress:<user>     30 per 1 min
-- Service-role-only: RLS on, zero policies, explicit revokes, RPC EXECUTE
-- granted to service_role alone so attackers cannot throttle other users'
-- buckets through the public REST RPC endpoint.
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

-- rate_limit_check: PEEK at a bucket WITHOUT counting an attempt.
--   returns true  -> request allowed
--   returns false -> over the limit (429)
create or replace function public.rate_limit_check(
  p_bucket    text,
  p_max       integer,
  p_window_ms bigint default 60000
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select not exists (
    select 1 from public.rate_limits rl
    where rl.bucket = p_bucket
      and rl.window_start > now() - (rl.window_ms || ' milliseconds')::interval
      and rl.count >= p_max
  );
$$;

-- rate_limit_hit: atomically COUNT one attempt and evaluate the limit.
--   returns true  -> attempt allowed (and counted)
--   returns false -> over the limit (still counted)
-- One round-trip, row-lock serialized via ON CONFLICT DO UPDATE.
-- Opportunistic 1% housekeeping sweep keeps the table from growing forever.
create or replace function public.rate_limit_hit(
  p_bucket    text,
  p_max       integer,
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

  if random() < 0.01 then
    delete from public.rate_limits
    where window_start < now() - interval '7 days';
  end if;

  return v_count <= p_max;
end $$;

-- rate_limit_reset: clear a bucket (successful login resets its counters).
create or replace function public.rate_limit_reset(
  p_bucket text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.rate_limits where bucket = p_bucket;
end $$;

revoke execute on function public.rate_limit_check(text, integer, bigint) from public, anon, authenticated;
revoke execute on function public.rate_limit_hit(text, integer, bigint)   from public, anon, authenticated;
revoke execute on function public.rate_limit_reset(text)                  from public, anon, authenticated;
grant execute on function public.rate_limit_check(text, integer, bigint) to service_role;
grant execute on function public.rate_limit_hit(text, integer, bigint)   to service_role;
grant execute on function public.rate_limit_reset(text)                  to service_role;

-- ---------------------------------------------------------------------------
-- SECTION 7 — supporting indexes
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
-- SECTION 8 — small hardening extras
-- ---------------------------------------------------------------------------
-- 8a. Default id for future manual inserts (app always supplies one today).
alter table public.users alter column id set default gen_random_uuid();

-- 8b. Status CHECK constraints — pin the exact Title-Case strings the admin
--     panel writes and that the RLS `status = 'Published'` match depends on.
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
--   with the ANON key (REST):
--     GET /rest/v1/users?select=password_hash  -> permission denied / []
--     GET /rest/v1/admin_user_overview          -> permission denied
--     GET /rest/v1/labs?select=*                -> rows WITHOUT flag_hash
--     GET /rest/v1/news?select=id,title         -> only Published rows
--   with SQL:
--     select indexname from pg_indexes where schemaname='public';
--     select * from public.rate_limit_hit('selftest', 2, 60000);  -- true, true, false
--     call rate_limit_reset('selftest');
-- ============================================================================
