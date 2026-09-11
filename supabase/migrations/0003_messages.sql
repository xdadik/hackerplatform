-- Aegis Platform — user ↔ admin support messages
-- Run this in Supabase SQL Editor after 0002_settings.sql.

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  from_role text not null default 'user',
  text text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_messages_user_id on public.messages (user_id);
create index if not exists idx_messages_created_at on public.messages (created_at);

alter table public.messages enable row level security;

create policy "users manage own messages"
  on public.messages for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "admins manage messages"
  on public.messages for all
  using (public.is_admin())
  with check (public.is_admin());
