-- Aegis Platform — schema sync (idempotent)
-- Run this in Supabase SQL Editor AFTER 0001..0004.
-- Safe to run multiple times and on databases seeded with an older schema:
-- every statement uses IF NOT EXISTS.

-- Helpers ---------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select
    exists (
      select 1 from public.users
      where id = auth.uid() and role = 'admin'
    );
$$;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Users -----------------------------------------------------------------
create table if not exists public.users (
  id uuid primary key,
  email text not null unique,
  name text not null,
  plan text not null default 'free',
  provider text not null default 'email',
  role text not null default 'user',
  reputation integer not null default 0,
  status text not null default 'Active',
  password_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.users add column if not exists plan text not null default 'free';
alter table public.users add column if not exists provider text not null default 'email';
alter table public.users add column if not exists role text not null default 'user';
alter table public.users add column if not exists reputation integer not null default 0;
alter table public.users add column if not exists status text not null default 'Active';
alter table public.users add column if not exists password_hash text;
alter table public.users add column if not exists created_at timestamptz not null default now();
alter table public.users add column if not exists updated_at timestamptz not null default now();
alter table public.users add column if not exists last_login_at timestamptz;

-- Sessions --------------------------------------------------------------
create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  token_hash text not null unique,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  last_seen_at timestamptz not null default now()
);
create index if not exists idx_sessions_token_hash on public.sessions (token_hash);
create index if not exists idx_sessions_user_id on public.sessions (user_id);

-- Videos ----------------------------------------------------------------
create table if not exists public.videos (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  created_at timestamptz not null default now()
);
alter table public.videos add column if not exists title text not null default '';
alter table public.videos add column if not exists subtitle text default '';
alter table public.videos add column if not exists duration text default '00:00';
alter table public.videos add column if not exists module text default 'General';
alter table public.videos add column if not exists path text default 'general';
alter table public.videos add column if not exists youtube_id text;
alter table public.videos add column if not exists description text;
alter table public.videos add column if not exists category text;
alter table public.videos add column if not exists featured boolean not null default false;
alter table public.videos add column if not exists created_at timestamptz not null default now();

-- Labs ------------------------------------------------------------------
create table if not exists public.labs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  created_at timestamptz not null default now()
);
alter table public.labs add column if not exists title text not null default '';
alter table public.labs add column if not exists category text not null default 'Web Security';
alter table public.labs add column if not exists difficulty text not null default 'Beginner';
alter table public.labs add column if not exists duration text not null default '30 min';
alter table public.labs add column if not exists description text default '';
alter table public.labs add column if not exists objectives integer not null default 1;
alter table public.labs add column if not exists participants integer not null default 0;
alter table public.labs add column if not exists youtube_id text;
alter table public.labs add column if not exists flag_hash text;
alter table public.labs add column if not exists created_at timestamptz not null default now();

-- Challenges ------------------------------------------------------------
create table if not exists public.challenges (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);
alter table public.challenges add column if not exists name text not null default '';
alter table public.challenges add column if not exists category text not null default 'Web';
alter table public.challenges add column if not exists difficulty text not null default 'Easy';
alter table public.challenges add column if not exists points integer not null default 100;
alter table public.challenges add column if not exists solves integer not null default 0;
alter table public.challenges add column if not exists tags text[] not null default '{}';
alter table public.challenges add column if not exists flag_hash text;
alter table public.challenges add column if not exists created_at timestamptz not null default now();

-- Progress --------------------------------------------------------------
create table if not exists public.progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  lab_id uuid references public.labs(id) on delete cascade,
  challenge_id uuid references public.challenges(id) on delete cascade,
  status text not null default 'not_started',
  progress integer not null default 0,
  updated_at timestamptz not null default now()
);

-- Events ----------------------------------------------------------------
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  created_at timestamptz not null default now()
);
alter table public.events add column if not exists title text not null default '';
alter table public.events add column if not exists type text not null default 'CTF';
alter table public.events add column if not exists date text not null default '';
alter table public.events add column if not exists status text not null default 'Upcoming';
alter table public.events add column if not exists participants integer not null default 0;
alter table public.events add column if not exists created_at timestamptz not null default now();

-- News ------------------------------------------------------------------
create table if not exists public.news (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  created_at timestamptz not null default now()
);
alter table public.news add column if not exists title text not null default '';
alter table public.news add column if not exists excerpt text default '';
alter table public.news add column if not exists author text default '';
alter table public.news add column if not exists tags text default '';
alter table public.news add column if not exists views integer not null default 0;
alter table public.news add column if not exists status text not null default 'Draft';
alter table public.news add column if not exists content text default '';
alter table public.news add column if not exists created_at timestamptz not null default now();

-- CVEs ------------------------------------------------------------------
create table if not exists public.cves (
  id uuid primary key default gen_random_uuid(),
  cve_id text not null unique,
  title text not null,
  created_at timestamptz not null default now()
);
alter table public.cves add column if not exists title text not null default '';
alter table public.cves add column if not exists severity text not null default 'High';
alter table public.cves add column if not exists status text not null default 'Draft';
alter table public.cves add column if not exists publish_date date;
alter table public.cves add column if not exists created_at timestamptz not null default now();

-- RLS (public read where the app needs it; writes via service role) -----
alter table public.users enable row level security;
alter table public.sessions enable row level security;
alter table public.videos enable row level security;
alter table public.labs enable row level security;
alter table public.challenges enable row level security;
alter table public.progress enable row level security;
alter table public.events enable row level security;
alter table public.news enable row level security;
alter table public.cves enable row level security;

drop policy if exists "public profiles are viewable by everyone" on public.users;
create policy "public profiles are viewable by everyone" on public.users for select using (true);
drop policy if exists "videos are viewable by everyone" on public.videos;
create policy "videos are viewable by everyone" on public.videos for select using (true);
drop policy if exists "labs are viewable by everyone" on public.labs;
create policy "labs are viewable by everyone" on public.labs for select using (true);
drop policy if exists "challenges are viewable by everyone" on public.challenges;
create policy "challenges are viewable by everyone" on public.challenges for select using (true);
drop policy if exists "events are viewable by everyone" on public.events;
create policy "events are viewable by everyone" on public.events for select using (true);
drop policy if exists "news are viewable when published" on public.news;
create policy "news are viewable when published" on public.news for select using (status = 'Published' or public.is_admin());
drop policy if exists "cves are viewable when published" on public.cves;
create policy "cves are viewable when published" on public.cves for select using (status = 'Published' or public.is_admin());
