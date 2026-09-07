# BACKEND MAP — Aegis Platform (Product-Ready)

**You work the backend. Friend works the frontend. Commit + push from GitHub.**

## 1. What's DONE (pushed `0d25f98`)

### Auth (real, server-side)
| File | What it does |
|---|---|
| `src/lib/auth-server.ts` | scrypt password hashing, opaque session tokens (hashed in DB), httpOnly cookies, admin signed tokens |
| `src/app/api/auth/signup/route.ts` | POST — create user + session cookie (rate-limited 5/15min) |
| `src/app/api/auth/login/route.ts` | POST — verify password, set httpOnly `aegis_session` |
| `src/app/api/auth/logout/route.ts` | POST — delete session + clear cookie |
| `src/app/api/auth/session/route.ts` | GET — return current user from cookie |
| `src/app/api/admin/login/route.ts` | POST — server-only `ADMIN_PASS` check, signed 1h admin cookie |
| `src/app/api/admin/logout/route.ts` | POST — clear admin cookie |
| `middleware.ts` | Guards `/admin` + `/api/admin`, verifies signed token (edge-safe), adds HSTS/CSP/COOP headers |

### Database
| File | What it does |
|---|---|
| `supabase/migrations/0001_init.sql` | **Run in Supabase SQL Editor**: tables `users, sessions, videos, labs, challenges, progress, events, news, cves`, RLS, `is_admin()`, updated_at triggers |
| `src/lib/supabase.ts` | `getSupabase()` (anon/REST client) + `getServiceSupabase()` (bypasses RLS, service-role) |
| `src/lib/env.ts` | Reads `ADMIN_PASS`, `ADMIN_USER`, Supabase keys, `NEXTAUTH_SECRET` (tolerant, never crashes build) |

### API routes (mostly mock fallback still)
| Route | Status |
|---|---|
| `/api/health` | exists |
| `/api/videos` | Supabase-first, mock fallback from `src/lib/data.ts` |
| `/api/search` | **hardcoded mock** — needs Supabase |
| `/api/progress` | **in-memory Map** — needs Supabase |
| `/api/labs/[id]/flag` | hardcoded `DEMO_FLAGS` — needs DB |

## 2. What's NOT done (your tasks)

### P0 — Make it real
1. **Run migration**: Supabase dashboard → your project → SQL Editor → paste `supabase/migrations/0001_init.sql` → Run. (Tables don't exist yet — auth will 500 until you do this.)
2. **Wire frontend auth**: `src/components/auth-provider.tsx` still uses localStorage. Replace with `fetch('/api/auth/session')` on load + `fetch('/api/auth/login')` in `src/app/login/page.tsx` + same for signup.
3. **Automatic `is_admin`**: when a user signs up, `role` defaults `user`. Make the FIRST background check: after creating the admin once via SQL (`update users set role='admin' where email='...'`), done.

### P1 — Kill the mocks, use Supabase
- `api/search/route.ts` — query `labs, challenges, news, cves` tables instead of the hardcoded array at line 15.
- `api/progress/route.ts` — replace `progressStore` Map with `progress` table (user id from `aegis_uid` cookie → better: from `aegis_session`).
- `api/labs/[id]/flag/route.ts` — replace `DEMO_FLAGS` with `labs.flag_hash` (scrypt-hash the flag server-side, store hash; verify on submit). Keep rate limit.
- `api/videos/route.ts` — you planned to skip YouTube; instead seed `videos` table from admin and drop mock file `src/lib/data.ts` dependency.

### P2 — Admin panel to DB
- `src/app/admin/page.tsx` CRUD still writes localStorage. Replace with server routes:
  - Add `/api/admin/users` GET/POST/PATCH/DELETE (service-role, verify admin cookie)
  - Same for videos/events/news/cves/labs
- Or use a Supabase admin REST helper: `src/lib/admin-api.ts` with `getServiceSupabase()` + role check.

## 3. Env / secrets (for production)
Set in `.env.local` (already partially set) and as GitHub Actions secrets for deploy:
```
ADMIN_USER=admin
ADMIN_PASS=<strong>            # currently "change-me-..." — MUST change
NEXT_PUBLIC_SUPABASE_URL=https://rijdajzrkpuuochzwcsk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<set>
SUPABASE_SERVICE_ROLE_KEY=<set>
NEXTAUTH_SECRET=<random 32+ chars>            # signs admin cookie
```
CLOUDFLARE secrets (if using workflow): `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`.

## 4. Verify
```bash
npx tsc --noEmit         # must be 0 errors
npm run build            # 30 static pages
npm run dev              # localhost:3000 → test /api/auth/signup via curl
curl -X POST localhost:3000/api/auth/signup -H "Content-Type: application/json" -d '{"email":"a@b.c","password":"12345678","name":"A"}'
```

## 5. Deploy
```bash
git add -A; git commit -m "..."; git push
```
→ GitHub Actions `.github/workflows/deploy-cloudflare.yml` builds with `@cloudflare/next-on-pages` → live on `aegis.pages.dev`. (Or Vercel: Framework Next.js, install `@supabase/supabase-js`.)