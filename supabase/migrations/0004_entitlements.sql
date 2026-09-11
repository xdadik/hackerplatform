-- Aegis Platform — per-user access entitlements (labs, lessons/videos, challenges)
-- Run this in Supabase SQL Editor after 0003_messages.sql.

create table if not exists public.entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  resource_type text not null check (resource_type in ('lab','lesson','video','challenge')),
  resource_id text not null,
  granted_by text default 'admin',
  created_at timestamptz default now(),
  unique(user_id, resource_type, resource_id)
);

create index if not exists idx_entitlements_user_id on public.entitlements (user_id);

alter table public.entitlements enable row level security;

drop policy if exists "admins manage entitlements" on public.entitlements;
create policy "admins manage entitlements"
  on public.entitlements for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "users view own entitlements" on public.entitlements;
create policy "users view own entitlements"
  on public.entitlements for select
  using (auth.uid() = user_id);
