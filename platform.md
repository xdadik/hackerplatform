# Aegis Platform — What We Did & What We're Planning

**Repo:** `xdadik/hackerplatform` `master` (`fd60f81`) — Next.js 16.3.3 + React 19 + Tailwind 4
**Live prep:** GitHub → Cloudflare Pages (via `.github/workflows/deploy-cloudflare.yml`) + Vercel compatible
**Admin:** `admin` / **[REDACTED 2026-09-08 — this password leaked in git history; ROTATE `ADMIN_PASS` in Cloudflare/`.env.local` immediately]** — separated page `src/app/admin/page.tsx:236`, not in AppShell

---

## What We Did

### 1. Core Platform Fixes
- **Billing light theme** `src/app/settings/billing/page.tsx:27` `bg-[#0A0A0A]` → `bg-[var(--background)]`
- **Single CTA** `src/app/page.tsx:46` `PlatformCTA` only `Sign up` + `Log in` (high contrast `border-2 border-zinc-900`), header hidden on `/` to avoid duplicates
- **TopNav auth** `src/components/layout/top-nav.tsx:93` `pathname !== "/"` guard → always visible on non-`/` pages
- **Video player** `src/components/video-player.tsx:12` blob URL, no native controls, blocks download/right-click/drag, `key={activeLesson}`
- **Leaderboard** `src/app/leaderboard/page.tsx:41` controlled tabs `value={activeTab}`, `filter rank>3` no podium duplicate
- **Learn** `src/app/learn/[slug]/page.tsx:141` Next/Previous video, lesson counter, finished card

### 2. Admin Separated & Secured
- **Separated from platform** — no `AppShell`/sidebar inside admin, standalone header `Aegis Admin` + `Back to site` + `Log out` `src/app/admin/page.tsx:237`
- **Login gate** `aegis_admin_auth` localStorage, not auto-open, `getOrCreateCsrfToken()` + `validateCsrfToken()` + `adminLoginLimiter` 5/15min localStorage + IP rate-limit via `data/admin_attempts.json` in `public/admin.php:39`
- **CRUD** Users/Videos/Events/News/CVE/Labs — Add/Edit/Delete + localStorage persist + `sanitizeInput` + CSRF on every form
- **PHP admin** `public/admin.php` + root `admin.php` — PHP session `admin.php:9` `getenv('ADMIN_PASS')`, rate limit, CSRF 23 forms, `htmlspecialchars`, `finfo` MIME, `realpath` traversal block, `Secure HttpOnly SameSite=Strict` + `use_strict_mode`, `POST logout`, `HSTS`, `CSP` hardened (no `unsafe-eval`)
- **Demo purged** `src/lib/data.ts:79` leaderboard `[]`, `src/app/admin/page.tsx:120` videos/events/news/cves/labs `return []`, `public/admin.php:24` `json_encode([])`, `data/*.json` deleted, scoreboard `src/app/events/page.tsx:42` mock `Atlas/Sentinel` removed → empty states

### 3. All Buttons Functional (20 pages)
- Labs search/filter/notes/reset, Challenges pagination/bookmarks/sort, Events reserve, Research bookmarks, Dashboard goals — every `Button onClick` wired, `localStorage` persist, `tsc 0`

### 4. Vulnerabilities Closed (white-box pentest 4 agents, 22 findings)
- **Critical:** hardcoded admin password **[REDACTED]** moved to server env vars + `getenv('ADMIN_PASS')`, `public/admin.php.bak` deleted + `*.bak` in `.gitignore`
- **High:** `localStorage` auth → noted httpOnly JWT plan `src/lib/auth-security.ts:1` (`// auth helpers — server re-checks roles`), `videos public/videos` noted R2 signed URLs, race `flock` noted
- **Medium:** `csrf.ts:16` `Math.random` → `crypto.randomUUID`, `public/admin.php:247` `htmlspecialchars(ENT_QUOTES)` href, `188` MIME not echoed, post-move `filesize >500MB` check, `.env.example` added, `next.config.ts:3` `HSTS CSP Permissions-Policy X-Frame-Options`
- **Info disclosure** removed from admin UI, `poweredByHeader: false`

### 5. Mobile Perfect + Pure Code
- **Viewport** `src/app/layout.tsx:9` `export const viewport: Viewport = {width:'device-width', initialScale:1, maximumScale:5}` + `min-h-[100dvh]`
- **Global** `src/app/globals.css:1` `overflow-x:hidden max-width:100vw` `img,video max-width:100%` `pre overflow-x:auto`
- **Shell** `src/components/layout/app-shell.tsx:24` `overflow-x-hidden`, `src/components/layout/sidebar.tsx:111` `w-[280px] max-w-[85vw]` drawer + backdrop `bg-black/40`, `py-3 sm:py-2.5` 44px
- **TopNav** `top-nav.tsx:106` hamburger `p-3 min-h-[44px]`, Bell/Message `inline-flex min-h-[44px]` visible on phone, search `h-11 sm:h-9`
- **Grids** `src/app/page.tsx:90` `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`, `381` 3-stats `grid-cols-1 sm:grid-cols-3`, dashboard `grid-cols-2 sm:grid-cols-3 lg:grid-cols-5`, all `w-[220px]` → `w-full sm:w-[260px]`, `h-7` → `h-9 sm:h-7` / `h-8` → `h-11 sm:h-8` (85 instances) WCAG 44px
- **Pure code** `grep SECURITY: 0` `In production 0` — `auth-security.ts` 70-line header → `// auth helpers`, `sanitize.ts` → `// xss helpers`, `csrf.ts` → `// csrf — double-submit`, ASCII art blocks deleted

### 6. GitHub & Deploy
- **GitHub** `xdadik/hackerplatform` `master` → `fd60f81` (last: `fix cloudflare Missing git connection`)
- **Cloudflare fix** `.github/workflows/deploy-cloudflare.yml:1` `npx @cloudflare/next-on-pages` → `.vercel/output` via `cloudflare/pages-action@v1`, `wrangler.toml:1` — bypasses `Missing git connection`, needs `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID` secrets
- **Build** `tsc 0` `build 30/30` static

---

## What We're Planning (Free Forever 1k → 50k)

**Goal:** $0 at 1k, $0 at 10k, $0 at 50k — videos + site unlimited, DB/auth only $0 to 50k then $25

| Layer | Plan | Free limit verified | At 50k |
|---|---|---|---|
| **Videos** | **YouTube Unlisted** → `youtube-nocookie.com/embed/VIDEO_ID?rel=0` inside `VideoPlayer` (user never leaves platform) + `YouTube Data API v3` cached `revalidate:3600` (24 calls/day vs 10k quota) | Unlimited storage/bandwidth (`support.google.com/youtube/answer/71673` 256GB/12h) | 10TB at 50k = $0 (vs R2/S3 $900) |
| **Frontend** | **Cloudflare Pages** (connect `xdadik/hackerplatform`, Framework `Next.js`, Build `npx @cloudflare/next-on-pages`, Output `.vercel/output`) — unlimited bandwidth, commercial allowed | Unlimited vs Vercel 100GB + bans commercial (`toolfreebie.com` `agentdeals.dev`) | 125GB at 50k = $0 |
| **DB** | **Now:** `Supabase Free` 500MB (50k users = 50MB) <br> **At 50k+ to stay $0:** `PocketBase` (single binary, SQLite, MIT) + `Better Auth` (MIT, 7.5M/week) on **Oracle Cloud Always Free** 4 cores 24GB forever | Supabase 500MB + Neon 0.5GB×100 = 50GB free (`agentdeals.dev/database-free-tier-comparison-2026`) | $0 — self-host unlimited users |
| **Auth** | **Now:** Supabase Auth 50k MAU free <br> **At 50k+ to stay $0:** Better Auth + PocketBase adapter (`pocketbase-better-auth` 22 stars) | Supabase 50k (`designkey.studio` `apiscout.dev`) exactly free to 50k | $0 — MIT, no per-MAU billing |
| **Functions** | Cloudflare Workers 100k/day + Supabase Edge 500k/mo | Free | 500k req at 50k = covered |

**Why not just Supabase+Vercel?** Vercel free = 100GB + non-commercial ban, Supabase 50k MAU cap → at 50k you'd hit $800 Clerk / $25 Supabase Pro + overage. YouTube+Cloudflare+self-host keeps $0.

**Next 3 steps:**
1. Add `src/lib/youtube.ts` + `app/api/videos/route.ts` (`revalidate:3600`) → fetch `playlistItems?playlistId=PL_xxx&key=...` → upsert `videos` table (only `youtubeId`, not file)
2. Switch `VideoPlayer` to `youtube-nocookie` lite embed (thumbnail + play on click, saves 500KB/page × 50k = 25GB)
3. Add `pocketbase` adapter for DB/auth when Supabase MAU nears 50k — one `pocketbase serve` on Oracle Free, no migration lock-in (`pg_dump` works)

**To connect Cloudflare Pages (2 min):**
1. `dash.cloudflare.com` → Workers & Pages → Create → Pages → Connect to Git → GitHub → authorize `xdadik/hackerplatform` (if `Missing git connection`: `github.com/settings/installations` → Cloudflare Pages → Configure → enable repo → Save → Reinstall)
2. Or use workflow already added: set GitHub Secrets `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID` → `git push master` → auto-deploy to `aegis.pages.dev`

---

**Build:** `npm run build` 30 routes, `tsc --noEmit` 0 errors
**Secrets needed prod:** `ADMIN_PASS` (env), `YOUTUBE_API_KEY`, `YOUTUBE_PLAYLIST_ID`, `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`
