-- Aegis Platform — 0002: audit logs + user login tracking
-- Run this in the Supabase SQL Editor AFTER 0001_init.sql.

-- Audit log for admin actions (written by /api/admin/* routes, service role)
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor text not null default 'admin',
  action text not null,          -- create | update | delete
  resource text not null,        -- users | videos | labs | ...
  target_id text,
  detail jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_audit_logs_created_at on public.audit_logs (created_at desc);
create index if not exists idx_audit_logs_resource on public.audit_logs (resource);

alter table public.audit_logs enable row level security;

-- Only admins can read audit logs via Supabase clients; the app writes them
-- with the service-role key which bypasses RLS.
create policy "admins can read audit logs"
  on public.audit_logs for select
  using (public.is_admin());

-- Track last login per user (stamped by /api/auth/login)
alter table public.users add column if not exists last_login_at timestamptz;

-- Helpful view: admin overview of users with last login
create or replace view public.admin_user_overview as
  select id, email, name, role, plan, status, reputation, provider, last_login_at, created_at
  from public.users
  order by created_at desc;
