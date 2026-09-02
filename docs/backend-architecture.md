# Backend Architecture — Hack Platform

> Frontend: Next.js 16 (existing) → Backend: FastAPI + PostgreSQL + Redis + S3 + Kubernetes (labs). Prepared for GitHub + Vercel deployment with real users.

## 1. Stack Overview (Spec §28, §29)

| Layer | Technology | Purpose | Hosting |
|-------|------------|---------|---------|
| **Frontend** | Next.js 16 (App Router, TypeScript, Tailwind 4) | SSR/SSG, routing, UI | **Vercel** |
| **Backend API** | **FastAPI (Python 3.12)** + Pydantic v2 + SQLAlchemy 2.0 / SQLModel | REST API, validation, OpenAPI docs | Render / Fly.io / AWS ECS/Fargate |
| **Database** | **PostgreSQL 16** | Primary OLTP store | Neon / Supabase / RDS / Render Postgres |
| **Cache / Queue / Sessions** | **Redis 7** | JWT denylist, rate-limit, lab session locks, background jobs (Celery/ARQ) | Upstash / Redis Cloud / ElastiCache |
| **Object Storage** | **AWS S3** (or R2) | Avatars, course videos, lab artifacts, challenge exports | S3 + CloudFront |
| **Lab Isolation** | **Kubernetes (K8s) + Docker** (gVisor/Kata optional) | Ephemeral per-user lab containers | GKE / EKS / Civo / self-hosted k3s |
| **Auth** | JWT (access+refresh) + OAuth2 (Google) | Stateless auth, RBAC | FastAPI + Auth.js compatible |
| **Search** | Postgres FTS (initial) → Meilisearch later | Labs/challenges/courses search | — |
| **Observability** | Sentry + OpenTelemetry + Grafana | Logs, traces, metrics | — |

Why FastAPI: async, auto OpenAPI, Pydantic validation pairs well with Next.js `fetch`, easy to containerize for K8s labs.

## 2. Current Frontend — What to Replace

**`src/components/auth-provider.tsx:13-49`** — mock `localStorage` auth:
```ts
// current: localStorage.setItem("aegis_auth","1") / "aegis_email" / "aegis_provider"
// isLoggedIn = localStorage.getItem("aegis_auth")==="1"
```
No password, no JWT, no session validation. `loginWithGoogle()` just redirects.

**`src/lib/data.ts:36-83`** — all mock in-memory arrays: `learningPaths`, `labs`, `challenges`, `skillProgress`, `leaderboard`. No fetch, no pagination.

Both must be replaced by real API calls (see §7, §8).

## 3. Domain Model (Spec §31)

```
Users ──1──∞── Profiles (1:1 extension)
  │             ├── display_name, avatar_url (S3), bio, social links
  │             └── reputation, rank (computed)
  │
  ├──∞── UserSkills ──∞── Skills (e.g. Web Security: 72%)
  ├──∞── Enrollments ──∞── Courses ──∞── Lessons
  ├──∞── LabProgress ──∞── Labs
  ├──∞── ChallengeAttempts ──∞── Challenges
  └──∞── Memberships ──∞── Organizations / Teams (RBAC)
```

**Core tables (PostgreSQL):**

```sql
-- users: auth identity
users(id UUID PK, email TEXT UNIQUE, email_verified BOOL, password_hash TEXT NULLABLE,
      provider TEXT DEFAULT 'credentials', -- credentials|google|github
      role TEXT DEFAULT 'member', -- owner|admin|member (global fallback)
      created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ)

profiles(user_id FK→users, username TEXT UNIQUE, avatar_key TEXT, bio TEXT,
         reputation INT DEFAULT 0, is_public BOOL DEFAULT true)

skills(id UUID PK, slug TEXT UNIQUE, name TEXT, color TEXT)
user_skills(user_id FK, skill_id FK, level TEXT, progress INT, next_level TEXT, PRIMARY KEY(user_id,skill_id))

courses(id UUID PK, slug TEXT UNIQUE, title TEXT, level TEXT, duration TEXT, description TEXT)
lessons(id UUID PK, course_id FK, title TEXT, order INT, content_url TEXT, video_key TEXT NULLABLE)
enrollments(user_id FK, course_id FK, progress INT DEFAULT 0, status TEXT, PRIMARY KEY(user_id,course_id))

labs(id UUID PK, slug TEXT UNIQUE, title TEXT, category TEXT, difficulty TEXT, duration TEXT,
     description TEXT, objectives JSONB, docker_image TEXT, manifest JSONB, participants INT DEFAULT 0)
lab_progress(user_id FK, lab_id FK, status TEXT, progress INT, started_at TIMESTAMPTZ, completed_at TIMESTAMPTZ, PRIMARY KEY(user_id,lab_id))
lab_instances(id UUID PK, user_id FK, lab_id FK, k8s_pod_name TEXT, k8s_namespace TEXT, status TEXT, expires_at TIMESTAMPTZ)

challenges(id UUID PK, slug TEXT UNIQUE, name TEXT, category TEXT, difficulty TEXT, points INT, tags TEXT[], flag_hash TEXT, author_id FK)
challenge_attempts(id UUID PK, user_id FK, challenge_id FK, status TEXT, submitted_flag TEXT, solved_at TIMESTAMPTZ)

organizations(id UUID PK, slug TEXT UNIQUE, name TEXT, owner_id FK→users)
memberships(user_id FK, org_id FK, role TEXT CHECK(role IN ('owner','admin','member')), PRIMARY KEY(user_id,org_id))

leaderboard_cache(user_id FK, reputation INT, labs_completed INT, challenges_solved INT, rank INT) -- materialized view refreshed hourly via Redis
```

Indexes: `users(email)`, `labs(category,difficulty)`, `challenges(tags)` GIN, `memberships(org_id)`.

## 4. Auth Flow — JWT + RBAC

**Roles:** `Owner` (org creator, billing, delete org), `Admin` (manage members, create labs/challenges), `Member` (consume content, submit flags). Global `isAdmin` flag for platform admins.

**Flow:**

1.  **Signup/Login:** `POST /api/auth/register` / `/api/auth/login` → validate, hash with `argon2`, issue:
    - `access_token` (JWT, 15m, `sub`, `org_roles`, `exp`), stored in memory
    - `refresh_token` (opaque, 30d, httpOnly Secure cookie, stored hashed in Redis/Postgres)
2.  **Google OAuth:** `GET /api/auth/google` → redirect to Google → callback → find-or-create `users` → issue same tokens. Frontend `loginWithGoogle()` will call this instead of `localStorage`.
3.  **Middleware:** FastAPI dependency `get_current_user` verifies JWT, checks Redis denylist (logout), loads `memberships` for RBAC.
4.  **RBAC guard:** `require_role(org_id, ["owner","admin"])` — 403 if insufficient.
5.  **Logout:** `POST /api/auth/logout` → add `jti` to Redis denylist until `exp`, clear refresh cookie. Frontend `logout()` clears memory and calls endpoint.

Next.js: store `access_token` in `httpOnly` cookie via Next.js Route Handler proxy or in-memory Zustand/Jotai; never `localStorage`.

## 5. API Endpoints

Base: `NEXT_PUBLIC_API_URL=https://api.yourdomain.com`

```
Auth:
  POST   /api/auth/register          {email,password,username}
  POST   /api/auth/login             {email,password} -> {access_token}
  POST   /api/auth/refresh           (cookie) -> new access_token
  POST   /api/auth/logout
  GET    /api/auth/me                -> current user + profiles + org_roles
  GET    /api/auth/google
  GET    /api/auth/google/callback

Users / Profiles:
  GET    /api/users/me
  PATCH  /api/users/me               {username,bio,avatar}
  POST   /api/users/me/avatar        multipart -> S3 presigned upload
  GET    /api/leaderboard?limit=50

Courses / Skills:
  GET    /api/courses                ?level=&search=
  GET    /api/courses/{slug}
  GET    /api/courses/{slug}/lessons
  POST   /api/courses/{slug}/enroll
  GET    /api/skills/me
  PATCH  /api/progress/lessons/{id}  {completed: true}

Labs (K8s-backed):
  GET    /api/labs                   ?category=&difficulty=&status=
  GET    /api/labs/{id}
  POST   /api/labs/{id}/start        -> {instance_id, endpoint_url, expires_at} (spawns K8s pod)
  POST   /api/labs/{id}/stop         {instance_id}
  GET    /api/labs/{id}/progress
  POST   /api/labs/{id}/complete     {objective_id}

Challenges:
  GET    /api/challenges             ?category=&difficulty=&tags=
  GET    /api/challenges/{id}
  POST   /api/challenges/{id}/submit {flag} -> {correct, points}
  GET    /api/challenges/me/solves

Progress / Org:
  GET    /api/progress/me            -> aggregated dashboard data
  GET    /api/orgs
  POST   /api/orgs                  {name,slug}
  GET    /api/orgs/{id}/members
  POST   /api/orgs/{id}/invite      (admin/owner only)
  PATCH  /api/orgs/{id}/members/{userId} {role}
```

All list endpoints: `?page&limit` + `X-Total-Count` header. Rate-limit via Redis (60 req/min per IP, 10/min for flag submits).

## 6. Deployment — GitHub + Vercel

### Frontend (Vercel)
1. Push to GitHub:
   ```bash
   git init; git add .; git commit -m "feat: initial frontend"
   git remote add origin https://github.com/<org>/hack-platform.git
   git push -u origin main
   ```
2. Vercel → Import Project → select repo → Framework: Next.js → Build: `npm run build` → Env vars:
   ```
   NEXT_PUBLIC_API_URL=https://api.yourdomain.com
   NEXT_PUBLIC_S3_CDN=https://cdn.yourdomain.com
   ```
3. Add `vercel.json` rewrite for API proxy (optional):
   ```json
   { "rewrites": [{ "source": "/api/:path*", "destination": "https://api.yourdomain.com/api/:path*" }] }
   ```

### Backend (Render / Fly / ECS)
**Render example:**
1. Create PostgreSQL + Redis (Upstash) externally, copy URLs.
2. Create Web Service → connect same GitHub repo (`/backend` folder) → Docker → `Dockerfile` for FastAPI.
3. Env vars:
   ```
   DATABASE_URL=postgresql+asyncpg://user:pass@host/db
   REDIS_URL=redis://...
   JWT_SECRET=<openssl rand -hex 32>
   JWT_REFRESH_SECRET=<openssl rand -hex 32>
   S3_BUCKET=hack-platform-prod
   S3_REGION=us-east-1
   AWS_ACCESS_KEY_ID=...
   AWS_SECRET_ACCESS_KEY=...
   GOOGLE_CLIENT_ID=...
   GOOGLE_CLIENT_SECRET=...
   CORS_ORIGINS=https://yourdomain.vercel.app
   LABS_K8S_KUBECONFIG=<base64>  # or in-cluster SA
   LABS_NAMESPACE=labs
   LABS_IMAGE_REGISTRY=ghcr.io/<org>
   LABS_TTL_MINUTES=60
   ```
4. Deploy → `https://api.yourdomain.com/docs` for OpenAPI.

**Fly.io alternative:** `fly launch --dockerfile backend/Dockerfile; fly secrets set DATABASE_URL=...`

**ECS/Fargate:** push image to ECR, define Task Definition with env vars from Secrets Manager.

**Migrations:** `alembic upgrade head` on deploy hook.

## 7. Replace Mock Data in `src/lib/data.ts`

Do not delete types — keep `Lab`, `Challenge`, `Course` as contracts. Replace static arrays with fetchers.

**Create API client:**

```ts
// src/lib/api.ts
const API = process.env.NEXT_PUBLIC_API_URL!;

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null; // move to cookie later
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...init?.headers },
    credentials: "include",
    cache: "no-store",
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
```

**Replace exports:**

```ts
// src/lib/data.ts (after)
export async function getLabs(params?: string): Promise<Lab[]> {
  return apiFetch<Lab[]>(`/api/labs${params ? `?${params}` : ""}`);
}
export async function getChallenges(params?: string): Promise<Challenge[]> {
  return apiFetch<Challenge[]>(`/api/challenges${params ? `?${params}` : ""}`);
}
// In server components: const labs = await getLabs();
// In client components: useEffect(() => { getLabs().then(setLabs) }, [])
```

**Migration steps:**
1. Add `src/lib/api.ts`.
2. Change `src/app/labs/page.tsx`, `src/app/challenges/page.tsx`, `src/app/learn/page.tsx`, `src/app/leaderboard/page.tsx`, `src/app/dashboard/page.tsx` from `import { labs } from "@/lib/data"` to `await getLabs()` / `useQuery`.
3. Keep `src/lib/data.ts` types, delete static arrays after verified.
4. Add loading/error states (`src/app/labs/loading.tsx`, `error.tsx`).
5. Add `NEXT_PUBLIC_API_URL` to `.env.local` and Vercel env.

## 8. How to Make Users Real

### Replace `localStorage` mock (`src/components/auth-provider.tsx`)

```ts
// src/components/auth-provider.tsx (new)
type User = { id: string; email: string; username: string; role: string };
const AuthContext = React.createContext<{user: User|null, login: (e:string,p:string)=>Promise<void>, logout:()=>Promise<void>, loginWithGoogle:()=>void}>(null!);

export function AuthProvider({children}:{children:React.ReactNode}) {
  const [user, setUser] = React.useState<User|null>(null);
  React.useEffect(()=>{ apiFetch<User>("/api/auth/me").then(setUser).catch(()=>setUser(null)); },[]);
  const login = async (email:string, password:string) => {
    const {access_token} = await apiFetch<{access_token:string}>("/api/auth/login",{method:"POST", body: JSON.stringify({email,password})});
    localStorage.setItem("access_token", access_token); // migrate to httpOnly cookie via /api/auth/refresh
    setUser(await apiFetch<User>("/api/auth/me"));
  };
  const loginWithGoogle = () => { window.location.href = `${API}/api/auth/google`; };
  const logout = async () => { await apiFetch("/api/auth/logout",{method:"POST"}); localStorage.removeItem("access_token"); setUser(null); window.location.href="/login"; };
  return <AuthContext.Provider value={{user, isLoggedIn: !!user, login, logout, loginWithGoogle}}>{children}</AuthContext.Provider>;
}
```

- Passwords hashed with `argon2` in DB, never stored in frontend.
- Add email verification: `POST /api/auth/verify-email` with token sent via SES/SendGrid.
- Protect routes: `middleware.ts` checks `access_token` cookie, redirects to `/login` if missing; FastAPI validates every `/api/*`.

### Labs Isolation via Containers (K8s)

Per-user, per-lab ephemeral isolation:

1.  **Request:** `POST /api/labs/{id}/start` — API checks quota (max 2 concurrent labs per user via Redis `labs:user:{id}:count`).
2.  **Spawn:** Backend `K8sService.create_pod()` → `k8s_client.create_namespaced_pod(namespace="labs", body={
      metadata: {name: f"lab-{lab_id}-user-{user_id}-{uuid4()[:6]}", labels: {user_id, lab_id}},
      spec: {containers: [{name:"lab", image: lab.docker_image, ports: [{containerPort:8080}], resources: {limits:{cpu:"500m",memory:"512Mi"}} }],
             activeDeadlineSeconds: 3600} })`. Optional: NetworkPolicy `deny-all` + egress allowlist, `securityContext: {runAsNonRoot:true, readOnlyRootFilesystem:true}`.
3.  **Expose:** Ingress or `port-forward` via `lab_instances` table: `endpoint_url = https://labs.yourdomain.com/{instance_id}` (NGINX ingress with `auth` header forwarding). Store `pod_name`, `expires_at = now()+60m`.
4.  **TTL & Cleanup:** CronJob every 5m deletes pods where `expires_at < now()`; Redis key `lab:instance:{id}` expires triggers webhook; `POST /api/labs/{id}/stop` deletes pod immediately.
5.  **Cost control:** K8s `ResourceQuota` per namespace, `ClusterAutoscaler` with spot nodes, max 60m lifetime, idle culler (no HTTP traffic for 15m → stop).

Local dev without K8s: fallback `docker run --rm -p 0:8080 {image}` via `docker-py`.

---

**Next steps checklist:**
- [ ] Create `backend/` FastAPI scaffold (`fastapi init`, `alembic init`, `Dockerfile`)
- [ ] Provision Postgres + Redis + S3 bucket
- [ ] Implement `users`/`auth` endpoints + JWT + Google OAuth
- [ ] Replace `auth-provider.tsx` and `data.ts` usages incrementally (feature flag `USE_MOCK`)
- [ ] Deploy backend to Render/Fly, frontend to Vercel, set env vars
- [ ] Add `LABS_K8S_*` only after auth is stable; start with 1-2 lab images
