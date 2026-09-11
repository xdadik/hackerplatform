-- Aegis Platform — platform settings (key/value, admin-managed)
-- Run this in Supabase SQL Editor after 0001_init.sql.

create table if not exists public.settings (
  key text primary key,
  value text not null default '',
  updated_at timestamptz not null default now()
);

alter table public.settings enable row level security;

-- No public read policy: settings are admin-only (service role bypasses RLS).
create policy "admins manage settings"
  on public.settings for all
  using (public.is_admin())
  with check (public.is_admin());

create trigger trg_settings_updated_at
  before update on public.settings
  for each row execute function public.touch_updated_at();

-- Defaults
insert into public.settings (key, value) values
  ('announcement', ''),
  ('maintenance', '0')
on conflict (key) do nothing;
