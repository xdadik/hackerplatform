# Audit Report 2-c — Frontend, Admin Panel & Secrets
**Repo:** /home/z/my-project/hackerplatform (public GitHub repo `xdadik/hackerplatform`, branch `master`, HEAD `fa74ce9`)
**Scope:** READ-ONLY. No repo files were modified.
**Date of audit:** post-commit `fa74ce9` (backend wired, commits 2a8fa3a + fa74ce9 pushed)

---

## 0. Executive summary

The **server side** of the admin panel is genuinely solid (httpOnly HMAC cookie, middleware guard, server-side rate limit, CSRF double-submit with constant-time compare, whitelisted field rules, scrypt-hashed passwords/flags, audit log, no secrets in the client bundle today). **However:**

1. **The real admin password `control2026$?>luz` is committed in `platform.md` at HEAD of a public repo** (live leak), and both the old (`Aegis2026!`) and new passwords live in git history — including a window (`43bc49b`..`4c96aea`) where the password was hardcoded **in the client JS bundle**.
2. **The frontend was never wired to the real flag-verification API** — `/labs/[id]` and `/challenges/[id]` still accept ANY input shaped like `flag{...}` client-side and award "solved" via localStorage. The backend flag route is dead code from the UI's perspective.
3. A **legacy `public/admin.php`** is shipped in the static folder (source-disclosure at `/admin.php`) and most public pages still run on hardcoded arrays / localStorage mocks.

**Verdict: git history = LEAKED (admin credentials). Working tree = one live leak (`platform.md`) + no API-key leaks. Rotate ADMIN_PASS immediately.**

---

## 1. Severity-ranked findings

### CRITICAL

#### C-1 — Live admin password in tracked doc at HEAD (public repo)
- **File:** `platform.md:5` and `platform.md:30`
- **Evidence:**
  ```
  platform.md:5: **Admin:** `admin` / `control2026$?>luz` (env var in prod)
  platform.md:30: - **Critical:** hardcoded `control2026$?>luz` moved to ...
  ```
  `git ls-files` confirms `platform.md` is tracked; repo is public.
- **Impact:** Anyone who visits the GitHub repo can read the production admin password. Full admin-panel compromise (user management, content CRUD, user creation with admin role) if this password is the deployed `ADMIN_PASS` — which the commit message ("real admin pass") strongly suggests.
- **Fix:**
  1. **Rotate `ADMIN_PASS` now** (treat the current value as burned). Generate `openssl rand -hex 32`; update `.env.local` and Cloudflare env vars.
  2. Remove the password from `platform.md` (delete the doc or redact lines 5 & 30).
  3. Scrub history (see C-2) — with a public repo, rotation alone is the minimum; scrubbing avoids future confusion.

#### C-2 — Admin credentials leaked in git history (incl. client bundle)
- **Commits:** `e5d8379` (introduced `Aegis2026!`), `43bc49b` ("admin: real credentials admin/control2026$?>luz"), removed in `4c96aea` (partially — doc `platform.md` re-leaked it in `b5cf8a9`).
- **Evidence (from `git show 43bc49b`):**
  ```
  admin.php:            define('ADMIN_PASS', 'control2026$?>luz');
  public/admin.php:     define('ADMIN_PASS', 'control2026$?>luz');
  src/app/admin/page.tsx: if (cleanUser === "admin" && adminPass === "control2026$?>luz") {
  ```
  Between `43bc49b` and `4c96aea` the password was in the **client-side React bundle** — every visitor of the deployed site could read it via view-source/devtools. `4c96aea` replaced it with `process.env.NEXT_PUBLIC_ADMIN_PASS` (never set → benign but the pattern was dangerous); `2a8fa3a` finally removed client-side credential checks entirely.
- **History verdict for other secret classes:** **CLEAN** —
  - `.env.local` / `.env` **never committed** (`git log --all -- .env.local .env` empty; only `.env.example` ever added, empty values).
  - No `SUPABASE_SERVICE_ROLE` values, no `sbp_`/`sk-` tokens, no `github_pat_` anywhere in history (full-rev grep across all 60+ commits).
  - The only `eyJ…` hits are the canonical **jwt.io demo token** in `src/app/tools/page.tsx:785` — benign.
  - Supabase project ref `rijdajzrkpuuochzwcsk` is exposed (URL) — that's public-by-design, not a secret.
- **Fix:** Rotate `ADMIN_PASS`; optionally rewrite history with `git filter-repo` (or BFG) removing `Aegis2026!`, `control2026$?>luz`, and the `43bc49b`/`e5d8379` blobs, then force-push (coordinate: repo is public, so rotation is the real control).

### HIGH

#### H-1 — Flag submission is still a client-side regex mock; real API never called
- **Files:**
  - `src/app/labs/[id]/page.tsx:90-111` (`handleSubmitFlag`)
  - `src/app/challenges/[id]/page.tsx:63-71` (`submitFlag`)
- **Evidence:**
  ```ts
  // labs/[id]/page.tsx:96-99
  const ok = /^(flag|aegis)\{[^}]+\}$/i.test(cleanFlag)
  if(ok){ setProgress(100); setFlagMsg("✅ Correct! Lab completed — 120 XP awarded (mock)..."); /* localStorage */ }
  ```
  No `fetch` to `/api/labs/[id]/flag` anywhere in `src/app` (grep: only `/api/health` and commented-out `/api/events`). The backend route `src/app/api/labs/[id]/flag/route.ts` (scrypt verify, DB upsert, rate limit) exists but **no page calls it**.
- **Impact:** Total loss of CTF integrity — any user "solves" every lab/challenge by typing `flag{x}`. The mocked UI claims "server enforces same" rate limit (`labs/[id]/page.tsx:92`) — false, nothing is sent to the server. XP/progress is localStorage-only, so leaderboards/progress are meaningless.
- **Fix:** Wire `handleSubmitFlag` → `POST /api/labs/[id]/flag` (and create/point to the challenge equivalent), render server verdict, remove the client regex and the "(mock)" strings. Remove client `flagLimiter` or keep purely as UX (server already rate-limits 5/min, route.ts:40).

#### H-2 — Legacy PHP admin shipped in the static public folder
- **Files:** `public/admin.php` (29 KB, tracked) and root `admin.php` (identical, tracked).
- **Evidence:** `ls public/` → `admin.php`; content is the old JSON-file PHP admin panel (env-based `ADMIN_PASS`, no hardcoded secret inside the current copy).
- **Impact:** On Cloudflare Pages, `/admin.php` is served as **static text** (PHP never executes → no RCE), i.e., full source disclosure of a legacy panel + 29 KB of dead weight. Confusing attack surface; also referenced in outdated docs. Root copy is unreferenced junk.
- **Fix:** Delete both files. (Optional: add a redirect `/admin.php` → `/admin` in `next.config.ts` redirects for old links.)

### MEDIUM

#### M-1 — "System" tab announcement/maintenance are localStorage-only theater
- **File:** `src/app/admin/page.tsx:463-465, 905-908` (and init at 122-129)
- **Evidence:**
  ```tsx
  onClick={() => { try { localStorage.setItem("aegis_announcement", announcement) } catch {};
    flash("Announcement saved (visible site-wide)") }}
  ```
  `aegis_announcement` / `aegis_maintenance` are written only to the **admin's own browser** localStorage. No other component or page reads them (grep confirms), nothing is persisted to DB, "Maintenance Mode" toggles only a badge.
- **Impact:** Admin believes a site-wide announcement/maintenance banner is published — it is not; it's invisible to everyone else. Functional deception, not a security hole.
- **Fix:** Persist via `/api/admin` (add a `settings` resource/row) and render from a public GET, or remove the controls.

#### M-2 — CSP allows `unsafe-inline` scripts; headers coverage depends on platform
- **Files:** `next.config.ts:14-29`, `middleware.ts:4-29, 72-73`.
- **Evidence:** `script-src 'self' 'unsafe-inline'` (needed for the inline theme script `layout.tsx:183-195` and JSON-LD). Security headers are set globally via `next.config.ts headers()` `source: "/(.*)"`, and middleware **duplicates** them but its matcher is only `["/admin/:path*", "/api/admin/:path*"]` (middleware.ts:73).
- **Impact:** `unsafe-inline` materially weakens XSS protection (any injected inline script runs). Also: on Cloudflare Pages via `@cloudflare/next-on-pages`, `next.config headers()` support has historically been partial — if headers get dropped there, public pages may ship with **no CSP/HSTS** (middleware only covers admin routes).
- **Fix:** Use a hash-based CSP for the two inline scripts (`'sha256-…'`), drop `unsafe-inline` from `script-src`; widen the middleware matcher to `"/(.*)"` (guaranteed edge execution) or add a Cloudflare `_headers` file to guarantee coverage. Keep `X-XSS-Protection: 0` (correct).

#### M-3 — Latent stored-XSS pipeline: admin content stored un-sanitized server-side
- **Files:** `src/lib/admin-api.ts:183-205` (news `content` 20 000 chars, `excerpt`), `videos.description` (2000), `labs.description`.
- **Evidence:** The admin UI escapes via `sanitizeInput` (`escapeHtml`) client-side before POST, but the **server trusts the client** — an admin session calling the API directly (curl) can store raw `<script>`/HTML in `news.content`. Today no public page renders DB content (all public pages are hardcoded — see §2), so it is **not currently exploitable**; it becomes a stored-XSS the moment a news/article page renders `content` as HTML.
- **Fix:** Server-side sanitize/allowlist in `applyRules` or `beforeWrite` (or store markdown and render as text; add DOMPurify if HTML rendering is ever needed). Never render admin-authored HTML without sanitization.

#### M-4 — Server-side rate limiting is in-memory only
- **Files:** `src/lib/rate-limit-server.ts:1-31`; used by `/api/admin/login` (5/15 min per IP, route.ts:9-15), `/api/auth/login`, `/api/auth/signup`, flag route.
- **Evidence:** `const buckets = new Map()` — per-isolate. On Cloudflare Pages each isolate/colo keeps its own map.
- **Impact:** Brute-force protection is best-effort: an attacker distributing requests across isolates (or after worker restarts) faces far weaker limits than "5/15min". The **admin login screen's claim** ("Rate limited: 5 attempts / 15 min per IP", admin/page.tsx:324) is accurate in spirit but not a hard guarantee. The client-side `adminLoginLimiter` (localStorage) is trivially bypassable — acceptable as UX only because the server also limits.
- **Fix:** Move counters to a durable store (Supabase table or Cloudflare KV/Durable Objects) for admin login specifically; keep the in-memory one as a first line.

### LOW

#### L-1 — localStorage `aegis_user` mirror: role/plan are editable client-side
- **File:** `src/components/auth-provider.tsx:60-78` (mirrors id, email, name, plan, **role**, reputation, createdAt, provider; **no password is ever mirrored** — confirmed).
- **Assessment:** A user can set `role: "admin"` or `plan: "plus"` in localStorage. **Grep shows no client code gates anything on `user.role`** (no admin links, no admin features outside `/admin`, which is server-gated). `plan` IS read by `labs/[id]/page.tsx:36-47` for `isPaid` — a cosmetic paywall bypass for a lab "Start" button on a mock page. Cross-tab sync (`storage` event, auth-provider.tsx:139-160) re-normalizes via `normalizeUser` (no XSS — React escapes; JSON.parse failures → logout). **No privilege escalation possible via localStorage.**
- **Fix:** None urgent. When real plan-gating ships, gate server-side (API/cookie), not localStorage.

#### L-2 — Dead security helpers / dead legacy keys
- `src/lib/sanitize.ts:36-46` `sanitizeHtml` — unused (regex-based; comment itself says "use DOMPurify in prod"). `sanitize.ts:55` `isSafeUrl` — unused.
- `aegis_admin_auth` localStorage key is only ever *removed* (auth-provider.tsx:83, admin/page.tsx:230) — no reader/writer remains. Legacy remnant, harmless.
- `csrfFetch` (csrf.ts:47) unused (admin page has its own `adminApi`). Client-side `validateCsrfToken` calls in admin page are UX-only theater — real enforcement is the server double-submit (`admin-api.ts:239-249`, constant-time). Fine, but the client checks create a false sense of "CSRF validated" pre-flight.
- **Fix:** Delete dead helpers or wire them in; keep server-side enforcement as the single source of truth.

#### L-3 — Minor cosmetics
- `admin/page.tsx:310,378,385` — `{escapeHtml(loginError)}` in JSX double-escapes (`&#x27;` may show literally). React already escapes; remove `escapeHtml` in JSX.
- `admin/page.tsx:324` claims IP rate limiting (true server-side, see M-4 caveat).
- Admin username field is sent to server but the server compares it to `ADMIN_USER` (default "admin") — single shared password; fine, just note it.
- `public/videos/` is 88 MB (one mp4) while `learn/[slug]` references ~20 non-existent `/videos/*.mp4` → broken players + repo bloat (Cloudflare Pages 25 MB/file limit will also reject larger videos).

### INFO (verified-good)
- **Admin auth chain:** login `POST /api/admin/login` (server `ADMIN_PASS`, server rate-limit 429, HMAC token, httpOnly `aegis_admin_session` via `buildAdminSetCookie`), middleware guard for `/admin` + `/api/admin` with `?login` redirect-loop escape, route-level re-verification (`isAdminRequestAuthorized`, fails closed on empty/`change-me` secret), edge verify fails closed on empty secret (auth-edge.ts:26). Logout POST clears cookie server-side.
- **CSRF:** double-submit `x-csrf-token` header vs non-httpOnly cookie, constant-time compare; SameSite=Strict on the CSRF cookie. Sound pattern.
- **Lab flags / user passwords in client:** API `listColumns` never include `password_hash`/`flag_hash` (admin-api.ts:56,96,124,153); flags sent only on create/update (HTTPS), hashed server-side; edit-flag field is "leave empty to keep current". AdminLab/AdminUser types carry no secret fields. **No secrets in client state.**
- **XSS sweep:** `dangerouslySetInnerHTML` only in `layout.tsx:171,175,184` — static JSON-LD + static theme script (no user data). No `innerHTML`/`insertAdjacentHTML`/`document.write`/`eval`/`new Function` in app code (tools-page payload strings are inert text). All dynamic hrefs use constants or `encodeURIComponent` (`explore/page.tsx:34`, NVD links `cve/page.tsx:542` fixed https prefix). `VideoPlayer` uses `<video src>` (static local path) — not an executable context. **No exploitable XSS found in the current UI.**
- **Env hygiene:** `.gitignore` covers `.env*` with `!.env.example`; `git ls-files` shows only `.env.example` (+ `src/lib/env.ts` source). `NEXT_PUBLIC_*` inventory: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_APP_VERSION` — all safe-for-browser by design; **no sensitive NEXT_PUBLIC var exists**. `.env.local` exists only on disk (placeholder keys + generated random ADMIN_PASS), never committed.
- **package.json:** 8 runtime deps, all mainstream (`next 16.3.3`, `react 19.2.8`, `@supabase/supabase-js`, `animejs`, `lucide-react`, cva/clsx/tailwind-merge). No risky/unused deps (animejs used in 4 files). No DOMPurify — see M-3 before shipping HTML rendering.
- **middleware.ts matcher:** covers `/admin/:path*` + `/api/admin/:path*` — correct for the admin guard purpose (page + API both protected; login/logout exempted intentionally, auth-edge verifies HMAC with expiry).

---

## 2. Remaining mocks / hardcoded data (not DB-backed)

| Area | File(s) | State |
|---|---|---|
| Labs catalog (6) | `src/lib/data.ts:73-80`, consumed by `labs/page.tsx`, `dashboard/page.tsx` | hardcoded |
| Lab detail (4 entries) | `src/app/labs/[id]/page.tsx:15-20` (`labData`) | hardcoded + client-side flag regex + notes/progress/reports in localStorage (`aegis_lab_notes_*`, `aegis_progress`, `aegis_reports`) |
| Challenges (8) | `src/lib/data.ts:82-91` + `challenges/page.tsx`, `challenges/[id]/page.tsx` | hardcoded; "solved" in localStorage (`aegis_solved_*`, `aegis_bookmarks`) |
| Learning paths (9) | `src/lib/data.ts:61-71`, `learn/page.tsx`, `learn/paths/page.tsx` | hardcoded |
| Lessons & videos | `src/app/learn/[slug]/page.tsx:16-108` (`pathData`, ~20 `/videos/*.mp4` refs; only 1 file exists) | hardcoded |
| Videos API fallback | `src/app/api/videos/route.ts` (imports `videos` from data.ts as fallback) + `data.ts:108-129` | mock fallback |
| Events | `src/app/events/page.tsx:12-16` (`mockEvents`) + **fake `setTimeout(600)` "fetch"** at 23-30 | hardcoded |
| CVE list | `src/app/cve/page.tsx:44+` (`const cves: Cve[]`) | hardcoded (DB-backed admin CRUD writes cves nobody reads) |
| News/research | `src/app/research/page.tsx:12-17` (`articles`), `research/[id]/page.tsx` | hardcoded; no public page renders DB `news` rows |
| Search fallback | `src/app/api/search/route.ts` (mock tables when Supabase unconfigured/error) | intentional fallback (documented) |
| Dashboard | `dashboard/page.tsx:42` (`aegis_progress`), hardcoded labs/challenges/skillProgress, SOC seat reservation in localStorage | mock |
| Teams / Community / Messages / Organizations | `teams/page.tsx`, `community/page.tsx`, `messages/page.tsx`, `organizations/page.tsx` | localStorage-backed fake entities (`aegis_teams`, `aegis_discussions`, `aegis_conversations`, `aegis_org_leads`) |
| Settings / Billing / Profile / Notifications | `settings/page.tsx`, `settings/billing/page.tsx` (fake plan upgrade + `aegis_payment_added`), `profile/page.tsx`, `notifications/page.tsx` | localStorage-only; billing "upgrade" edits `aegis_plan` locally |
| Skills / Achievements / References / Tools | `skills/page.tsx:6` (`const skills`), achievements, references, tools | static demo content |
| Leaderboard | `src/lib/data.ts:102` — emptied (`[]`) | intentionally empty (no fake data, no DB either) |
| **DB-backed (real):** admin panel CRUD, auth (login/signup/session/logout), search (primary), progress, health, flag verify API (unwired UI) | `admin/page.tsx`, `api/auth/*`, `api/admin/*`, `api/search`, `api/progress`, `api/health`, `api/labs/[id]/flag` | ✅ real |

**Net:** only admin + auth + search/progress/health are real. The entire student-facing content surface (labs, challenges, learn, events, cve, research, teams, messages, community, settings, billing, notifications) is still mock/localStorage.

---

## 3. Secrets & git-history verdict

| Check | Result |
|---|---|
| Working tree secret patterns (`sk-`, `sbp_`, `eyJ…`, `ADMIN_PASS=`, `password:`, `api_key`, `token:`) | **CLEAN** — only env var *names*, empty `.env.example`, and the jwt.io demo token (`tools/page.tsx:785`) |
| `.env.local` / `.env` tracked? | **NO** — `git ls-files \| grep env` → `.env.example` only; never committed at any point in history |
| History: Supabase service-role / JWTs ≥40 chars / `github_pat_` | **CLEAN** (full-rev `git grep` across all commits) |
| History: `sk-` / `sbp_` | **CLEAN** |
| History: admin credentials | **LEAKED** — `Aegis2026!` (e5d8379 →) and `control2026$?>luz` (43bc49b → 4c96aea in code; re-leaked in `platform.md` b5cf8a9 → **still at HEAD**); 43bc49b..4c96aea shipped it in the **client bundle** |
| GitHub PAT remnant | **CLEAN** — none in tree or history (PAT was used out-of-band for pushing only) |
| `NEXT_PUBLIC_*` exposure | **SAFE** — URL/anon-key/app-version only |
| Logs (`build*.log`, `tsc*.log`) | No secrets found in contents |

**Action:** rotate `ADMIN_PASS` (assume compromised), redact `platform.md`, then history-scrub with `git filter-repo --replace-text` and force-push. No other credentials need rotation.

---

## 4. Files recommended for deletion / cleanup

| File | Tracked? | Recommendation | Reason |
|---|---|---|---|
| `public/admin.php` | yes | **DELETE** | Legacy PHP shipped statically at `/admin.php` (source disclosure, dead feature). Highest-priority deletion. |
| `admin.php` (root) | yes | **DELETE** | Unreferenced duplicate of the legacy panel. |
| `build.log`, `build_final.log` | yes | **DELETE** | Build artifacts, no secrets, noise in a public repo. |
| `tsc.log`, `tsc_full.log` | yes | **DELETE** | Type-check output artifacts. |
| `tsconfig.tsbuildinfo` | no (untracked) | **DELETE + gitignore** | 130 KB incremental build cache. |
| `platform.md` | yes | **DELETE or REDACT lines 5 & 30** | Contains the live admin password; content is also outdated (describes pre-2a8fa3a architecture). |
| `docs/SECURITY_FIXES.md` | yes | KEEP but redact the `Aegis2026!` mention (lines 62, 125, 130) | Documents the old password; harmless once rotated, still tidy to remove. |
| `public/videos/cybersecurity-101-intro.mp4` (88 MB folder) | yes | **REMOVE from git** (host on YouTube/CDR as the site already embeds YouTube) | Repo/deploy bloat; all other referenced videos are missing anyway. |
| `.next/`, `node_modules/` | no | keep ignored | — |

Suggested `.gitignore` additions: `*.tsbuildinfo`, `*.log`.

---

## 5. Next actions (priority order)
1. **Rotate `ADMIN_PASS`** in `.env.local` + Cloudflare; redact `platform.md`; commit.
2. Delete the junk/legacy files listed in §4 and add `.gitignore` entries.
3. History scrub (`git filter-repo`) for the two passwords; force-push; verify with `git grep $(git rev-list --all)`.
4. Wire `/labs/[id]` + `/challenges/[id]` flag submission to the server API (kills the last fake-security surface).
5. Replace the localStorage announcement/maintenance controls with a DB-backed setting.
6. Harden CSP (hash the inline theme script, drop `unsafe-inline`) and guarantee header coverage on Cloudflare Pages (middleware matcher `/(.*)` or `_headers`).
7. Server-side sanitize admin-authored long-text fields before any public rendering ships (M-3).
8. Continue the mock→DB migration per §2 (labs/challenges/events/cve/research are the student-facing core).
