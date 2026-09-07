-- Aegis Platform — initial schema
-- Run this in Supabase SQL Editor.

-- Users ---------------------------------------------------------------
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

-- Sessions (opaque token, hashed at rest) -----------------------------
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

alter table public.sessions enable row level security;

create policy "users manage own sessions"
  on public.sessions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

alter table public.users enable row level security;

create policy "public profiles are viewable by everyone"
  on public.users for select
  using (true);

create policy "users can update own profile"
  on public.users for update
  using (auth.uid() = id);

-- Videos --------------------------------------------------------------
create table if not exists public.videos (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subtitle text default '',
  duration text default '00:00',
  module text default 'General',
  path text default 'cybersecurity-101',
  youtube_id text,
  description text,
  category text,
  featured boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.videos enable row level security;

create policy "videos are viewable by everyone"
  on public.videos for select
  using (true);

create policy "admins can insert videos"
  on public.videos for insert
  with check (public.is_admin());

create policy "admins can update videos"
  on public.videos for update
  using (public.is_admin());

create policy "admins can delete videos"
  on public.videos for delete
  using (public.is_admin());

-- Labs ----------------------------------------------------------------
create table if not exists public.labs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null default 'Web Security',
  difficulty text not null default 'Beginner',
  duration text not null default '30 min',
  description text default '',
  objectives integer not null default 1,
  participants integer not null default 0,
  youtube_id text,
  flag_hash text,
  created_at timestamptz not null default now()
);

alter table public.labs enable row level security;

create policy "labs are viewable by everyone"
  on public.labs for select
  using (true);

create policy "admins manage labs"
  on public.labs for all
  using (public.is_admin())
  with check (public.is_admin());

-- Challenges ----------------------------------------------------------
create table if not exists public.challenges (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null default 'Web',
  difficulty text not null default 'Easy',
  points integer not null default 100,
  solves integer not null default 0,
  tags text[] not null default '{}',
  flag_hash text,
  created_at timestamptz not null default now()
);

alter table public.challenges enable row level security;

create policy "challenges are viewable by everyone"
  on public.challenges for select
  using (true);

create policy "admins manage challenges"
  on public.challenges for all
  using (public.is_admin())
  with check (public.is_admin());

-- Progress ------------------------------------------------------------
create table if not exists public.progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  lab_id uuid references public.labs(id) on delete cascade,
  challenge_id uuid references public.challenges(id) on delete cascade,
  status text not null default 'not_started',
  progress integer not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.progress enable row level security;

create policy "users manage own progress"
  on public.progress for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Events --------------------------------------------------------------
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  type text not null default 'CTF',
  date text not null,
  status text not null default 'Upcoming',
  participants integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.events enable row level security;

create policy "events are viewable by everyone"
  on public.events for select
  using (true);

create policy "admins manage events"
  on public.events for all
  using (public.is_admin())
  with check (public.is_admin());

-- News ----------------------------------------------------------------
create table if not exists public.news (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  excerpt text default '',
  author text default '',
  tags text default '',
  views integer not null default 0,
  status text not null default 'Draft',
  content text default '',
  created_at timestamptz not null default now()
);

alter table public.news enable row level security;

create policy "news are viewable when published"
  on public.news for select
  using (status = 'Published' or public.is_admin());

create policy "admins manage news"
  on public.news for all
  using (public.is_admin())
  with check (public.is_admin());

-- CVEs ----------------------------------------------------------------
create table if not exists public.cves (
  id uuid primary key default gen_random_uuid(),
  cve_id text not null unique,
  title text not null,
  severity text not null default 'High',
  status text not null default 'Draft',
  publish_date date,
  created_at timestamptz not null default now()
);

alter table public.cves enable row level security;

create policy "cves are viewable when published"
  on public.cves for select
  using (status = 'Published' or public.is_admin());

create policy "admins manage cves"
  on public.cves for all
  using (public.is_admin())
  with check (public.is_admin());

-- Admin helper (role-based) -------------------------------------------
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

-- Trigger: keep updated_at fresh ---------------------------------------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_users_updated_at
  before update on public.users
  for each row execute function public.touch_updated_at();

create trigger trg_progress_updated_at
  before update on public.progress
  for each row execute function public.touch_updated_at();