# Plan — "Get notified" contact form (Supabase)

> Status: **DRAFT v3 — plan gate round 3, then PO approval** · 2026-10-27
> Branch: `feat/notify-me-form` → PR → merge to `main` → deploy to Cloudflare Pages
> Process: QuizRace operating model (`AI_ORCHESTRATION.md` §4b Critical lane, `HARNESS_ENGINEERING.md`)
> v2 addressed round 1 (Edge Function + Turnstile). **v3** addresses round 2: the server step moves
> to a **Cloudflare Pages Function** (trusted client IP, same origin) and all limits run in **one
> atomic SQL function**. See §11.

```text
LANE: Critical — adds a new database schema and a public, unauthenticated write path that stores personal data (name, email, phone).
```

## 1. Goal

Replace the "Back to our solutions" button in the closing section with a form so visitors can
ask to be **notified when Godwitly goes live**. Submissions are stored in a new Supabase project
called **`godwitly`**. The page stays a static site (HTML/CSS/vanilla JS) on Cloudflare Pages.

What changes for the visitor:

- The closing section keeps its heading and line —
  **"Ready to experience Godwitly?"** / **"Discover a smarter way to learn, engage and prepare."** —
  and shows the form underneath instead of the button.
- Fields: **full name, email, phone number, job title, message**, a consent checkbox, and a
  Cloudflare **Turnstile** human check (usually invisible / one click).
- Works in English and Arabic (RTL), on desktop and mobile, with a keyboard.

Out of scope (v1): emails to visitors, an admin dashboard (the PO reads submissions in the
Supabase dashboard), analytics, logins.

## 2. Architecture (v3)

```text
Browser form (godwitly.pages.dev)
   │  POST /api/notify   (same origin — no CORS)
   ▼
Cloudflare Pages Function  functions/api/notify.js
   1. method/content-type/size checks, Origin must equal the site's own origin
   2. client IP = CF-Connecting-IP (set by Cloudflare's edge; not client-controllable)
   3. Turnstile Siteverify (secret = Pages secret), hostname check, idempotency key
   4. validate + normalize fields
   5. call Supabase RPC submit_launch_signup(...) with the Supabase SECRET key (Pages secret)
   6. map result → identical 202 for accepted/duplicate, 429 for limits
   ▼
Supabase Postgres (project `godwitly`)
   submit_launch_signup(): ONE transaction —
     atomic hourly bucket ++ (per hashed IP) → atomic daily reservation (global cap)
     → INSERT … ON CONFLICT (email) DO NOTHING
   Tables have RLS on, no policies, no grants to anon/authenticated. RPC executable by service_role only.
```

Why this shape:
- The public site holds **no database key at all**; the anon key is never used.
- `CF-Connecting-IP` is set by Cloudflare's edge for every request it proxies, so the per-IP limit
  cannot be bypassed by forging `X-Forwarded-For`.
- Same origin removes CORS and the preview-wildcard problem: preview deployments call their own `/api/notify`.
- Every limit and the insert happen inside one SQL call, so parallel requests cannot slip past a limit.

## 3. Roles — two tasks, one writer each (§2a)

| Task | Writer | Cross-vendor reviewer |
|---|---|---|
| **A. Backend** — migration + RPC, Pages Function, backend tests | **Codex Terra** (self-contained backend) | **Claude Opus 5.5** diff review + Challenge (security boundary) |
| **B. Front-end** — form HTML/CSS/JS, i18n, Turnstile widget, nav link | **Claude Opus 5.5** (Figma + browser tools) | **Codex Sol** diff-stage harness |
| Supabase/Cloudflare setup, secrets, deploys | Claude Opus 5.5 (orchestrator) | — |
| Screenshots + Figma parity | Claude Sonnet 5.5 subagent | Opus triages |
| PO / approver | Sherif | Plan, Figma, PR, release |

Notion: separate project from QuizRace → **no card** unless the PO asks.

## 4. Decisions the PO must make (one-way doors)

| # | Decision | Recommendation |
|---|---|---|
| D1 | Supabase **region** (permanent) | Closest region to target users offered by the CLI; default **Frankfurt `eu-central-1`** |
| D2 | **Required fields** | Required: name, email, phone, job title, consent. **Optional: message** |
| D3 | **Duplicate emails** | One row per email; first submission wins; repeats get the identical "thank you" and identical HTTP response |
| D4 | **Abuse protection** | Turnstile + per-IP hourly limit + global daily cap, enforced server-side |
| D5 | **Consent, privacy notice, retention** | Checkbox: "I agree that BCM Hub may contact me about Godwitly's launch." Privacy line with a contact email for data requests (**PO to supply**). Keep data until launch + 12 months; PO owns the deletion date |
| D6 | **"Contact us" nav link** | Yes — "Contact us" / "تواصل معنا", desktop + mobile |
| D7 | Supabase **free plan** (pauses after ~1 week of no API activity) | OK for a waitlist; note the pause |
| D8 | **Limit numbers** | Per IP: 5 / hour. Global: 300 / day (UTC) |
| D9 | **Double-click opening (`file://`)** | Page opens; form shows "The sign-up form works on the live site" and is disabled. Local testing: `npx wrangler pages dev` (serves site + function on `localhost`) |
| D10 | **Server step on Cloudflare Pages Functions** (new in v3) | Yes — same Cloudflare project as the site, free tier (100k requests/day) |

Note: the original course brief said "no backend or databases"; this feature intentionally changes that at the PO's request.

## 5. Design (Figma-first, §2.4 — blocking)

1. Claude adds frames to the Godwitly Landing page in Figma (As-Built file `luw3nBt5qD0v0su7tJIfSZ`,
   page node `2086:2`): **EN desktop, EN mobile, AR desktop, AR mobile**, states **idle, field errors,
   sending, success, verification failed, too many attempts, network error**, plus the `file://` notice.
2. PO approves → `docs/ux/APPROVALS.md` (new) with frame node IDs.
3. No form code before this approval.

Layout: heading + line stay centered on the landscape; below, a white card (max ~640px, 24px
radius, soft shadow): 2 columns on desktop (name | email, phone | job title), message full width,
consent + privacy line, Turnstile, full-width terracotta button "Notify me" / "أبلغني عند الإطلاق".
Mobile: one column. **No placeholders** — visible labels + a hint under phone ("Include country code, e.g. +20 …").

## 6. Backend (Task A)

### 6.1 Setup (orchestrator)

1. PO runs `supabase login` once.
2. `supabase projects create godwitly --org-id <org> --region <D1> --db-password <generated>` (password → macOS Keychain, never committed).
3. Turnstile widget `godwitly` in the PO's Cloudflare account; hostnames `godwitly.pages.dev`, `localhost`.
   Site key → `js/config.js` (public).
4. Pages secrets (never committed): `wrangler pages secret put` → `TURNSTILE_SECRET`,
   `SUPABASE_URL`, `SUPABASE_SECRET_KEY` (Supabase secret/service-role key), `IP_HASH_SALT`.
   Local dev uses `.dev.vars` (git-ignored).

### 6.2 Migration — `supabase/migrations/<ts>_launch_signups.sql`

```sql
create table public.launch_signups (
  id               uuid primary key default gen_random_uuid(),
  created_at       timestamptz not null default now(),
  full_name        text not null,
  email            text not null,
  phone            text not null,
  job_title        text not null,
  message          text,
  language         text not null default 'en',
  consent_version  text not null,
  constraint full_name_ok check (full_name = btrim(full_name) and char_length(full_name) between 2 and 100
                                 and full_name !~ '[[:cntrl:]]'),
  constraint job_title_ok check (job_title = btrim(job_title) and char_length(job_title) between 2 and 100
                                 and job_title !~ '[[:cntrl:]]'),
  constraint email_ok     check (email = lower(btrim(email)) and char_length(email) <= 254
                                 and email ~ '^[^@[:space:][:cntrl:]]+@[^@[:space:][:cntrl:]]+\.[^@[:space:][:cntrl:]]+$'),
  constraint phone_ok     check (phone ~ '^\+?[0-9 ()-]{7,20}$'
                                 and char_length(regexp_replace(phone, '[^0-9]', '', 'g')) between 7 and 15),
  constraint message_ok   check (message is null or (char_length(message) between 1 and 1000
                                 and message !~ '[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]')),
  constraint language_ok  check (language in ('en', 'ar')),
  constraint consent_ok   check (char_length(consent_version) between 1 and 40)
);
create unique index launch_signups_email_key   on public.launch_signups (email);
create index        launch_signups_created_idx on public.launch_signups (created_at);

create table public.signup_rate_limits (
  ip_hash      text        not null,
  window_start timestamptz not null,           -- start of the hour
  attempts     int         not null,
  primary key (ip_hash, window_start)
);
create index signup_rate_limits_window_idx on public.signup_rate_limits (window_start);

create table public.signup_daily_counter (
  day       date primary key,                  -- UTC day
  reserved  int  not null
);

alter table public.launch_signups       enable row level security;
alter table public.signup_rate_limits   enable row level security;
alter table public.signup_daily_counter enable row level security;
revoke all on public.launch_signups, public.signup_rate_limits, public.signup_daily_counter
  from public, anon, authenticated;

-- One atomic step: hourly limit → daily cap → insert. Runs in the caller's single transaction.
create function public.submit_launch_signup(
  p_ip_hash text, p_full_name text, p_email text, p_phone text,
  p_job_title text, p_message text, p_language text, p_consent_version text,
  p_hourly_limit int default 5, p_daily_cap int default 300
) returns text
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_attempts int;
  v_reserved int;
begin
  -- Per-IP hourly bucket: the upsert row lock serialises concurrent requests for the same bucket.
  insert into signup_rate_limits as r (ip_hash, window_start, attempts)
  values (p_ip_hash, date_trunc('hour', now()), 1)
  on conflict (ip_hash, window_start) do update set attempts = r.attempts + 1
  returning attempts into v_attempts;
  if v_attempts > p_hourly_limit then
    return 'rate_limited';
  end if;

  -- Global daily reservation: increments only while below the cap; no row returned = cap reached.
  insert into signup_daily_counter as c (day, reserved)
  values ((now() at time zone 'utc')::date, 1)
  on conflict (day) do update set reserved = c.reserved + 1
    where c.reserved < p_daily_cap
  returning reserved into v_reserved;
  if v_reserved is null then
    return 'capped';
  end if;

  insert into launch_signups (full_name, email, phone, job_title, message, language, consent_version)
  values (p_full_name, p_email, p_phone, p_job_title, p_message, p_language, p_consent_version)
  on conflict (email) do nothing;

  return 'accepted';   -- same result for new and duplicate email
end;
$$;

revoke all on function public.submit_launch_signup(text,text,text,text,text,text,text,text,int,int)
  from public, anon, authenticated;
grant execute on function public.submit_launch_signup(text,text,text,text,text,text,text,text,int,int)
  to service_role;

-- Retention of rate-limit/counter rows: daily pg_cron job, never on the request path.
create extension if not exists pg_cron;
select cron.schedule('godwitly-limits-cleanup', '17 3 * * *', $$
  delete from public.signup_rate_limits   where window_start < now() - interval '2 days';
  delete from public.signup_daily_counter where day < (now() at time zone 'utc')::date - 7;
$$);
```

`security invoker` + service_role-only execute: the RPC runs with the Pages Function's server key
(service_role bypasses RLS); nobody else can call it. A CHECK failure raises → the function maps it to `400`.

### 6.3 Pages Function `functions/api/notify.js`

- Only `POST` (else `405`); `Content-Type: application/json` (else `415`); body ≤ 8 KB (else `413`).
- If an `Origin` header is present it must equal the request URL's own origin (else `403`) — blocks
  other websites posting from visitors' browsers. No CORS headers are ever sent.
- **Client IP:** `CF-Connecting-IP`. If missing or not a valid IP literal → `400` (fail closed).
  `ip_hash = SHA-256(IP_HASH_SALT + ip)` hex; the raw IP is never stored or logged.
- **Turnstile:** Siteverify with `secret`, `response` token, `remoteip`, and a per-invocation UUID
  `idempotency_key` (reused only if this function retries the Siteverify call itself).
  Require `success === true` and `hostname` ∈ {`godwitly.pages.dev`, `*.godwitly.pages.dev` via exact
  suffix match on `.godwitly.pages.dev`, `localhost`}. Failure → `403 {"error":"verification"}`.
- **Validate + normalize** with the same rules as §6.2 (trim; collapse inner whitespace in
  name/title; lower-case email; message empty → null). Invalid → `400 {"error":"validation","fields":[…]}`
  (field names only). Unknown JSON keys are ignored.
- Call RPC (`POST {SUPABASE_URL}/rest/v1/rpc/submit_launch_signup` with the secret key):
  `accepted` → `202 {"ok":true}` · `rate_limited` / `capped` → `429 {"error":"limit"}` ·
  CHECK violation → `400 {"error":"validation"}` · anything else → `500 {"error":"server"}`.
- Logs: status code + result word only. No names, emails, phones, IPs or tokens.

### 6.4 Backend tests (Codex)

- One shared file `tests/validation-vectors.json` drives both the function's unit tests and a browser-side check, so client and server rules cannot drift.
- SQL tests against a local Supabase (`supabase start`) or the project: constraints, RPC results, grants.
- **Concurrency:** 20 parallel RPC calls for one `ip_hash` → exactly 5 `accepted`; parallel calls at the
  daily cap (cap lowered via parameter) → never more than the cap reserved.

## 7. Front-end (Task B)

1. HTML: replace the CTA button with `<form novalidate>` inside `<section id="contact" tabindex="-1">`;
   visible `<label>`s, `autocomplete` (`name`, `email`, `tel`, `organization-title`), `type="email"`/`type="tel"`,
   `dir="ltr"` on email/phone, consent, privacy line, Turnstile container, `role="status" aria-live="polite"`,
   per-field errors linked with `aria-describedby`.
2. Nav: "Contact us" (`#contact`) in **both** desktop and mobile nav; existing scroll/focus/menu-close logic applies.
3. `js/config.js`: Turnstile site key (public). Endpoint is the relative path `/api/notify`.
4. `js/form.js` — state machine `idle → sending → success | fieldErrors | verifyFailed | tooMany | networkError`:
   - In-flight guard set **synchronously** before `fetch`; button disabled; restored in `finally`; Enter/rapid clicks ignored while sending.
   - 15 s timeout (`AbortController`).
   - **Turnstile token is single-use:** the widget is reset after **every** request attempt; **Try again**
     waits for a fresh token, then resubmits the kept input. A lost response after a committed insert is
     safe (duplicate → identical `202`).
   - Mapping: `202` success · `400` field errors · `403` verification failed · `429` too many attempts ·
     anything else (`405/413/415/5xx`, malformed JSON, timeout, offline) → retryable error with **Try again**.
   - `file://` → D9 notice, form disabled.
5. **i18n:** `setLanguage()` dispatches `godwitly:languagechange`; `form.js` re-renders the current
   state's messages. All copy keys in `js/translations.js` (EN + AR). Turnstile widget `language` follows the page.
6. CSS: card, inputs, focus/error/disabled styles, RTL + mobile.
7. README: how the form works, local dev (`wrangler pages dev`), where submissions are, retention + deletion query.

## 8. Security review inputs (for round 3)

| Threat | Control | Enforcement point | Residual risk |
|---|---|---|---|
| Direct DB read/write/probe | Public site has no DB key; RLS on, no policies; revokes from public/anon/authenticated; RPC execute only service_role | §6.2 | Low |
| Email-list enumeration | `on conflict do nothing`; identical `202` for new/duplicate | §6.2 RPC + §6.3 | Low (timing ≈ one index probe) |
| Flooding / quota exhaustion | Turnstile + per-IP hourly bucket + global daily reservation, atomic in one SQL call; 8 KB body | §6.2–6.3 | Low–medium (human-solver farms); global cap bounds damage |
| IP spoofing to evade per-IP limit | `CF-Connecting-IP` only; missing/invalid → fail closed | §6.3 | Low |
| Turnstile replay / token reuse | Single-use tokens at Siteverify; hostname check; front-end resets widget every attempt | §6.3, §7.4 | Low |
| Cross-site form posting | Same-origin `Origin` check; no CORS | §6.3 | Low |
| Malformed / abusive input | Server validation + DB CHECKs; shared vectors | §6.2–6.4 | Low |
| Secrets leaked | Only Turnstile site key in repo; server keys in Pages secrets / `.dev.vars` (git-ignored) | §6.1 | Low |
| PII in logs | Status + result word only | §6.3 | Low |
| Data kept too long / unclear consent | `consent_version`; PO-owned deletion date; documented + dry-run query | D5, §7.7, §9 | Low once D5 set |

Deep performance pass: **NOT TRIGGERED** — per request: one Siteverify call + one RPC doing ≤ 3 single-row indexed writes; cleanup runs off-path via pg_cron.

## 9. Verification (one owner per check)

| Check | Owner | Pass condition |
|---|---|---|
| Effective grants: public/anon/authenticated have no table privileges and no RPC execute | Claude (SQL on `information_schema` / `has_function_privilege`) | Zero privileges |
| Direct REST with the project's anon/publishable key: table `POST/GET/PATCH/DELETE`, `rpc/submit_launch_signup` | Claude (curl) | All denied; owner row count unchanged |
| RPC concurrency: 20 parallel same-IP calls; parallel calls at a lowered daily cap | Codex tests | Exactly 5 accepted; reserved never exceeds cap |
| New vs existing email through `/api/notify` | Codex tests + Claude curl | Identical status/body/headers (`202`); one row |
| Turnstile: missing / invalid / reused token | Codex tests + Claude curl | `403`, no row |
| IP: forged `X-Forwarded-For` / `CF-Connecting-IP` from the client on the deployed site | Claude (curl to `godwitly.pages.dev`) | Bucket unchanged by forged headers (Cloudflare overwrites `CF-Connecting-IP`) |
| Origin: foreign `Origin` → `403`; same origin OK; no CORS headers | Claude (curl) | As stated |
| Validation vectors (whitespace-only, control chars, punctuation-only phone, `+20 10 1234 5678` OK, mixed-case email dedupe) | Codex tests (shared vectors) | Matches expected |
| Oversize body, non-JSON, wrong method, extra keys (`id`, `created_at`) | Codex tests | `413`/`415`/`405`; extra keys ignored |
| UI states incl. lost-response retry with fresh Turnstile token → success, one row | Claude (browser, stubbed + real) | EN + AR, including language switch mid-state |
| Nav "Contact us" (desktop + mobile, keyboard) | Claude (browser) | Scrolls, focuses `#contact`, closes menu, URL `#contact` |
| Accessibility: labels, `aria-describedby`, live announcements, focus first invalid field | Claude (a11y tree) | All present |
| Desktop 1440 / tablet 768 / mobile 375, EN + AR, no horizontal scroll | Sonnet subagent | Matches approved Figma frames (§7b) |
| `file://` notice; `wrangler pages dev` and Pages submit | Claude | Per D9 |
| pg_cron job registered; cleanup `EXPLAIN` uses `window_start` index | Claude (SQL) | Job listed; index scan |
| Retention dry run (`select` by `created_at`) | Claude (SQL) | Correct rows |
| Test rows removed before release | Claude | Table empty |
| Diff gates | A: Claude Opus + Challenge · B: Codex Sol harness | `PASS` / `PASS WITH P2 FOLLOW-UPS` |

## 10. Release

1. Task A + Task B commits on `feat/notify-me-form`; push; PR to `main` (PO reviews on GitHub).
2. Apply the migration to Supabase; set Pages secrets (backend first — two-phase, as in QuizRace).
3. PO approves → merge → deploy `main` to Cloudflare Pages (`godwitly`; static files + `functions/`).
4. Live check EN + AR on `godwitly.pages.dev`; delete the test row.

## 11. Plan-gate resolution log

| Round | Finding | Resolution |
|---|---|---|
| 1 | P1 duplicate `409` enumerates emails | Identical `202` via `on conflict do nothing`; no public table access (§2, §6.2) |
| 1 | P1 bypassable direct-insert flooding | Server step + Turnstile + limits; public site has no DB key (§2, §6) |
| 1 | P2 ×7 (input rules, state machine, i18n, nav anchor, retention, grant checks, CORS/`file://`) | Closed in v2; round 2 confirmed 6 closed, 3 partial → finished below |
| 2 | P1 limits not atomic | `submit_launch_signup()` RPC: hourly upsert-increment + conditional daily reservation + insert in one transaction; concurrency tests (§6.2, §6.4, §9) |
| 2 | P1 untrusted client-IP source | Server step moved to Cloudflare Pages Function; `CF-Connecting-IP` only; fail closed; spoof probe (§2, §6.3, §9) |
| 2 | P2 retry reuses single-use Turnstile token | Widget reset after every attempt; Try again waits for fresh token; Siteverify `idempotency_key` (§6.3, §7.4) |
| 2 | P2 wildcard preview CORS | Same-origin endpoint → no CORS; preview hostnames matched by exact `.godwitly.pages.dev` suffix for Turnstile (§2, §6.3) |
| 2 | P2 per-request cleanup unindexed | `window_start` index + daily pg_cron job, off the request path (§6.2) |

## 12. Gate history

| Gate | Reviewer | Report | Verdict |
|---|---|---|---|
| Plan gate round 1 | Codex Sol (high) | `docs/reviews/2026-10-27-notify-form-plan-gate.md` | FAIL — 2×P1, 7×P2 |
| Plan gate round 2 | Codex Sol (medium) | `docs/reviews/2026-10-27-notify-form-plan-gate-r2.md` | FAIL — 2×P1, 3×P2 |
| Plan gate round 3 | Codex Sol (medium) | `docs/reviews/2026-10-27-notify-form-plan-gate-r3.md` | _pending_ |
| PO approval (§4 + plan) | Sherif | — | _pending_ |
| Figma approval | Sherif | `docs/ux/APPROVALS.md` | _pending_ |
| Diff gate A + Challenge | Claude Opus 5.5 | `docs/reviews/…-diff-gate-a.md` | _pending_ |
| Diff gate B | Codex Sol | `docs/reviews/…-diff-gate-b.md` | _pending_ |
