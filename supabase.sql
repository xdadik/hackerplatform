-- Aegis Platform — Supabase Init (run in Dashboard → SQL Editor)
-- Project: https://rijdajzrkpuuochzwcsk.supabase.co
-- Copy/paste this entire file and click "Run"

-- Enable UUID extension if not exists
create extension if not exists "uuid-ossp";

-- Labs
create table if not exists public.labs (
  id text primary key,
  title text not null,
  category text not null,
  difficulty text not null check (difficulty in ('Beginner','Intermediate','Advanced','Expert')),
  duration text not null,
  description text not null,
  objectives int not null default 5,
  participants int not null default 0,
  youtube_id text,
  created_at timestamp with time zone default now()
);

-- Challenges
create table if not exists public.challenges (
  id text primary key,
  name text not null,
  category text not null,
  difficulty text not null check (difficulty in ('Easy','Medium','Hard','Insane')),
  points int not null,
  solves int not null default 0,
  tags text[] not null default '{}',
  created_at timestamp with time zone default now()
);

-- Videos (for YouTube embeds)
create table if not exists public.videos (
  id text primary key,
  title text not null,
  description text,
  youtube_id text,
  duration text,
  category text,
  lab_id text references public.labs(id),
  path_id text,
  created_at timestamp with time zone default now()
);

-- Progress (user lab/challenge/path progress)
create table if not exists public.progress (
  id uuid primary key default uuid_generate_v4(),
  user_id text not null,
  lab_id text references public.labs(id),
  challenge_id text references public.challenges(id),
  path_id text,
  status text not null check (status in ('not_started','in_progress','completed')),
  progress int not null check (progress >=0 and progress <=100),
  updated_at timestamp with time zone default now(),
  unique (user_id, lab_id, challenge_id, path_id)
);

-- Enable RLS
alter table public.labs enable row level security;
alter table public.challenges enable row level security;
alter table public.videos enable row level security;
alter table public.progress enable row level security;

-- Policies: free read, authenticated write for progress, service_role full
drop policy if exists "labs_free_read" on public.labs;
create policy "labs_free_read" on public.labs for select using (true);

drop policy if exists "challenges_free_read" on public.challenges;
create policy "challenges_free_read" on public.challenges for select using (true);

drop policy if exists "videos_free_read" on public.videos;
create policy "videos_free_read" on public.videos for select using (true);

drop policy if exists "progress_owner_all" on public.progress;
create policy "progress_owner_all" on public.progress for all using (true) with check (true);
-- In production, replace with: using (auth.uid()::text = user_id)

-- Seed demo labs (6)
insert into public.labs (id, title, category, difficulty, duration, description, objectives, participants, youtube_id) values
('lab-1','SQL Injection Fundamentals','Web Security','Beginner','45 min','Learn to identify and exploit SQL injection vulnerabilities in a controlled environment.',5,12403,'dQw4w9WgXcQ'),
('lab-2','Linux Privilege Escalation','Linux','Intermediate','90 min','Enumerate and exploit misconfigurations to escalate privileges on Linux systems.',7,8921,null),
('lab-3','Active Directory Enumeration','Active Directory','Advanced','120 min','Map Active Directory structure and identify attack paths using BloodHound-style analysis.',8,5432,null),
('lab-4','Cloud IAM Misconfiguration','Cloud Security','Intermediate','60 min','Audit AWS IAM policies and exploit overly permissive roles to access sensitive data.',6,3421,null),
('lab-5','Memory Forensics with Volatility','Forensics','Advanced','75 min','Analyze memory dumps to recover artifacts and detect malware presence.',4,2891,null),
('lab-6','Network Traffic Analysis','Network Security','Beginner','50 min','Use Wireshark and tshark to analyze PCAP files and detect anomalous traffic.',5,7123,null)
on conflict (id) do nothing;

-- Seed challenges (8)
insert into public.challenges (id, name, category, difficulty, points, solves, tags) values
('ch-1','Auth Bypass','Web','Easy',100,3421,'{auth,jwt}'),
('ch-2','Heap Overflow 101','Pwn','Medium',250,892,'{heap,libc}'),
('ch-3','RSA Common Modulus','Crypto','Medium',300,543,'{rsa,math}'),
('ch-4','Malware Unpacking','Reverse','Hard',450,212,'{malware,x86}'),
('ch-5','DFIR Timeline','Forensics','Hard',400,334,'{timeline,evtx}'),
('ch-6','Cloud SSRF to Metadata','Cloud','Medium',275,721,'{ssrf,aws}'),
('ch-7','OSINT - The Vanishing Vendor','OSINT','Easy',150,1823,'{osint,recon}'),
('ch-8','SOC Alert Triage','Blue Team','Medium',200,1102,'{siem,detection}')
on conflict (id) do nothing;

-- Seed one video
insert into public.videos (id, title, description, youtube_id, duration, category, lab_id) values
('vid-intro','What is Cybersecurity Intro','Intro to cybersecurity fundamentals','dQw4w9WgXcQ','10:00','General','lab-1')
on conflict (id) do nothing;

-- Verify
select 'labs' as table_name, count(*) from public.labs
union all select 'challenges', count(*) from public.challenges
union all select 'videos', count(*) from public.videos;
