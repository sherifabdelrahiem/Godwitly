# Plan — "Get notified" contact form (Supabase)

> Status: **DRAFT v2 — plan gate re-check, then PO approval** · 2026-10-27
> Branch: `feat/notify-me-form` → PR → merge to `main` → deploy to Cloudflare Pages
> Process: QuizRace operating model (`AI_ORCHESTRATION.md` §4b Critical lane, `HARNESS_ENGINEERING.md`)
> v2 changes: addresses plan-gate round 1 (`docs/reviews/2026-10-27-notify-form-plan-gate.md`, FAIL — 2×P1, 7×P2). See §11.

```text
LANE: Critical — adds a new database schema and a public, unauthenticated write path that stores personal data (name, email, phone).
```

## 1. Goal

Replace the "Back to our solutions" button in the closing section with a form so visitors can
ask to be **notified when Godwitly goes live**. Submissions are stored in a new Supabase project
called **`godwitly`**. The page stays a static site (HTML/CSS/vanilla JS on Cloudflare Pages).

What changes for the visitor:

- The closing section keeps its heading and line —
  **"Ready to experience Godwitly?"** / **"Discover a smarter way to learn, engage and prepare."** —
  and shows the form underneath instead of the button.
- Fields: **full name, email, phone number, job title, message**, a consent checkbox, and an
  invisible-by-default Cloudflare **Turnstile** human check.
- Everything works in English and Arabic (RTL), on desktop and mobile, with a keyboard.

Out of scope (v1): emails to visitors, an admin dashboard (the PO reads submissions in the
Supabase dashboard), analytics, logins.

## 2. Architecture (v2)

```text
Browser form ──POST JSON + Turnstile token──▶ Supabase Edge Function `notify-signup`
                                                 1. CORS origin allow-list
                                                 2. body ≤ 8 KB, JSON only
                                                 3. Turnstile Siteverify (secret in function secrets)
                                                 4. rate limits (per hashed IP + global daily cap)
                                                 5. validate + normalize fields
                                                 6. INSERT … ON CONFLICT (email) DO NOTHING
                                                 7. same 202 response for new AND duplicate email
                                                          │ (service role, server-side only)
                                                          ▼
                                              Postgres table `launch_signups` (no anon/authenticated privileges)
```

Why: the anon/publishable key gets **no table privileges at all**, so nobody can write to, read
from, or probe the table directly. All public traffic goes through one function that proves
"human" (Turnstile), limits volume, and returns an identical answer for new and existing emails.

## 3. Roles (who does what) — two tasks, one writer each (§2a)

| Task | Writer | Cross-vendor reviewer |
|---|---|---|
| **A. Backend** — migration, Edge Function, backend tests | **Codex Terra** (self-contained backend, §2a) | **Claude Opus 5.5** diff review + Challenge (security boundary) |
| **B. Front-end** — form HTML/CSS/JS, i18n, Turnstile widget, nav link | **Claude Opus 5.5** (needs Figma + browser) | **Codex Sol** diff-stage harness |
| Supabase/Cloudflare setup + deploys (tool-dependent) | Claude Opus 5.5 (orchestrator) | — |
| Screenshots + Figma parity | Claude Sonnet 5.5 subagent | Opus triages |
| PO / approver | Sherif | Approves plan, Figma, PR, release |

Notion: separate project from QuizRace → **no card** unless the PO asks.

## 4. Decisions the PO must make (one-way doors)

| # | Decision | Recommendation |
|---|---|---|
| D1 | Supabase **region** (permanent) | Closest region to target users that the CLI offers; default **Frankfurt `eu-central-1`** |
| D2 | **Required fields** | Required: name, email, phone, job title, consent. **Optional: message** |
| D3 | **Duplicate emails** | One row per email; first submission wins; repeats get the identical "thank you" (and identical HTTP response) |
| D4 | **Abuse protection** | **Edge Function + Turnstile + rate limits at launch** (v1 "honeypot only" option withdrawn — round-1 P1) |
| D5 | **Consent text, privacy notice, retention** | Checkbox: "I agree that BCM Hub may contact me about Godwitly's launch." Notice line with a contact email for data requests (**PO to supply the email**). Keep data until launch + 12 months; PO owns the deletion date (calendar reminder) |
| D6 | **"Contact us" nav link** | Yes — "Contact us" / "تواصل معنا", desktop + mobile menu |
| D7 | Supabase **free plan** (pauses after ~1 week of no activity) | OK for a waitlist; PO checks the dashboard weekly or upgrades later |
| D8 | **Rate-limit numbers** | Per IP: 5 submissions / hour. Global: 300 / day. Over the limit → "Too many attempts, please try later" |
| D9 | **Opening the page by double-click (`file://`)** | The page still opens; the form shows "The sign-up form works on the live site" because Turnstile and CORS need a real web address. Local testing uses `http://localhost:8000` |

Note: the original course brief said "no backend or databases"; this feature intentionally changes that at the PO's request.

## 5. Design (Figma-first, §2.4 — blocking)

1. Claude adds frames for the new closing section to the Godwitly Landing page in Figma
   (As-Built file `luw3nBt5qD0v0su7tJIfSZ`, page node `2086:2`): **EN desktop, EN mobile, AR desktop, AR mobile**,
   each with states **idle, field errors, sending, success, verification failed, too many attempts, network error**, plus the `file://` notice.
2. PO approves → record in `docs/ux/APPROVALS.md` (new file in this repo) with frame node IDs.
3. No form code before this approval.

Layout proposal: heading + line stay centered on the landscape; below them a white card
(max ~640px, 24px radius, soft shadow): 2-column grid on desktop (name | email, phone | job title),
message full-width, consent + privacy line, Turnstile widget, full-width terracotta button
"Notify me" / "أبلغني عند الإطلاق". Mobile: one column. **No placeholders** — visible labels plus a
short hint under phone ("Include country code, e.g. +20 …") — so all copy stays in `textContent`.

## 6. Backend (Task A)

### 6.1 Setup (orchestrator)

1. PO runs `supabase login` once (browser approval).
2. `supabase projects create godwitly --org-id <org> --region <D1> --db-password <generated>`.
   DB password → macOS Keychain, **never committed**.
3. Turnstile widget `godwitly` created in the PO's Cloudflare account (API via the existing Wrangler
   login, which has `challenge-widgets.write`, or the dashboard), hostnames: `godwitly.pages.dev`, `localhost`.
   **Site key** → `js/config.js` (public). **Secret key** → `supabase secrets set TURNSTILE_SECRET=…` (never committed).
4. `supabase secrets set IP_HASH_SALT=<random>`.

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
  consent_version  text not null,            -- which consent/privacy wording was accepted
  constraint full_name_ok  check (full_name = btrim(full_name) and char_length(full_name) between 2 and 100
                                  and full_name !~ '[[:cntrl:]]'),
  constraint job_title_ok  check (job_title = btrim(job_title) and char_length(job_title) between 2 and 100
                                  and job_title !~ '[[:cntrl:]]'),
  constraint email_ok      check (email = lower(btrim(email)) and char_length(email) <= 254
                                  and email ~ '^[^@[:space:][:cntrl:]]+@[^@[:space:][:cntrl:]]+\.[^@[:space:][:cntrl:]]+$'),
  constraint phone_ok      check (phone ~ '^\+?[0-9 ()-]{7,20}$'
                                  and char_length(regexp_replace(phone, '[^0-9]', '', 'g')) between 7 and 15),
  constraint message_ok    check (message is null or (char_length(message) between 1 and 1000
                                  and message !~ '[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]')),
  constraint language_ok   check (language in ('en', 'ar')),
  constraint consent_ok    check (char_length(consent_version) between 1 and 40)
);
create unique index launch_signups_email_key on public.launch_signups (email);  -- email already normalized
create index launch_signups_created_at_idx on public.launch_signups (created_at);

create table public.signup_rate_limits (           -- one row per (hashed IP, hour window)
  ip_hash      text not null,
  window_start timestamptz not null,
  attempts     int  not null default 0,
  primary key (ip_hash, window_start)
);

alter table public.launch_signups     enable row level security;  -- no policies: deny all
alter table public.signup_rate_limits enable row level security;  -- no policies: deny all
revoke all on public.launch_signups, public.signup_rate_limits from anon, authenticated;
```

The function uses the built-in service role (server-side only), so RLS has **no permissive
policies** and the public key has **no grants**. Rate-limit rows older than 2 days are deleted by the
function on each call (bounded, indexed by primary key).

### 6.3 Edge Function `supabase/functions/notify-signup/index.ts` (Deno)

- `verify_jwt = false` in `supabase/config.toml` for this function (public endpoint; protection = Turnstile + limits).
- **CORS:** allow `https://godwitly.pages.dev`, `https://*.godwitly.pages.dev` (preview deploys),
  `http://localhost:8000`; answer `OPTIONS`; unknown origins get no CORS headers (browser blocks).
  CORS headers are added to **every** response, including errors.
- Reject non-POST (405), non-JSON (415), body > 8 KB (413).
- **Turnstile:** `POST https://challenges.cloudflare.com/turnstile/v0/siteverify` with secret, token,
  client IP; require `success` and `hostname` in the allow-list. Failure → `403 {"error":"verification"}`.
  Tokens are single-use, so replays fail at Siteverify.
- **Rate limit:** `ip_hash = sha256(IP_HASH_SALT + ip)`; upsert-increment the current hour row
  atomically (`insert … on conflict do update set attempts = attempts + 1 returning attempts`);
  > 5 → `429`. Global: count `launch_signups` created today (indexed) ≥ 300 → `429`.
  Raw IPs are never stored.
- **Validate + normalize** with the same rules as §6.2 (trim; lower-case email; collapse inner
  whitespace in name/title). Invalid → `400 {"error":"validation","fields":["email",…]}`
  (field names only, never echoing values). Validation errors reveal nothing about other people.
- **Insert:** `insert … on conflict (email) do nothing`. New and duplicate both → `202 {"ok":true}`
  with the same body and headers.
- Any unexpected error → `500 {"error":"server"}`; nothing sensitive in responses or logs (no PII in logs).

### 6.4 Backend tests (Codex writes, run with `deno test` + curl against the deployed function)

Contract test vectors live in one file `tests/validation-vectors.json`, used by **both** the
Deno tests and a browser-side check, so client and server rules cannot drift.

## 7. Front-end (Task B)

1. HTML: replace the CTA button with `<form novalidate>` inside `<section id="contact" tabindex="-1">`;
   visible `<label>`s, `autocomplete` (`name`, `email`, `tel`, `organization-title`), `type="email"`/`type="tel"`,
   `dir="ltr"` on email/phone, consent checkbox, privacy line, Turnstile container, `role="status"`
   `aria-live="polite"` message area, per-field error text linked with `aria-describedby`.
2. Nav: "Contact us" link (`#contact`) in **both** desktop and mobile nav; existing scroll/focus/menu-close logic applies.
3. `js/config.js`: Supabase function URL + Turnstile site key (both public).
4. `js/form.js` — a small state machine: `idle → sending → success | fieldErrors | verifyFailed | tooMany | networkError`.
   - In-flight guard set **synchronously** before `fetch`; button disabled; restored in `finally`; Enter and rapid clicks ignored while sending.
   - 15 s timeout (`AbortController`).
   - Response mapping: `202` → success; `400` → field errors (generic per-field messages); `403` → "verification failed", reset Turnstile;
     `429` → "too many attempts"; **anything else** (`401/404/405/413/415/5xx`, malformed JSON, timeout, offline) → retryable error with a working **Try again** that resubmits the kept input.
   - Lost response after a committed insert is safe: retry hits `on conflict do nothing` → `202`.
   - `file://` → show the D9 notice, form disabled.
5. **i18n:** `setLanguage()` dispatches a `godwitly:languagechange` event; `form.js` listens and
   re-renders the current state's messages (errors, status) in the new language. All copy keys in `js/translations.js` (EN + AR).
6. CSS: card, inputs, focus/error/disabled styles, RTL + mobile rules.
7. README: how the form works, where submissions are, how to change fields, retention + deletion query.

## 8. Security review inputs (for the plan gate re-check)

| Threat | Control | Enforcement point | Residual risk |
|---|---|---|---|
| Direct table read/write/probe with the public key | No grants for anon/authenticated; RLS on with no policies | Migration §6.2 | Low |
| Email-list enumeration | `on conflict do nothing`; identical `202` + body for new/duplicate | Function §6.3 | Low (timing difference ≈ one index lookup; noted) |
| Bot flooding / quota exhaustion | Turnstile Siteverify + per-IP hourly limit + global daily cap + 8 KB body limit | Function §6.3 | Low–medium (distributed human-solver farms); global cap bounds damage |
| Turnstile token replay | Single-use tokens checked at Siteverify; hostname check | Function §6.3 | Low |
| Malformed / abusive input | Server validation + DB CHECKs (trim, control chars, phone digit count, normalized email) | Function + migration | Low |
| Cross-origin abuse from other sites | CORS allow-list (browsers only; not a server control — Turnstile hostname is the real check) | Function §6.3 | Low |
| Secrets leaked | Only Supabase URL + Turnstile site key in repo; secrets via `supabase secrets`; `.gitignore` covers `supabase/.temp`, `.env*` | Repo | Low |
| PII in logs | Function logs status codes only | Function §6.3 | Low |
| Data kept too long / unclear consent | `consent_version` stored; retention date owned by PO; deletion query in README tested by dry run | D5 + README | Low once D5 is set |

Deep performance pass: **NOT TRIGGERED** — one bounded insert + two indexed single-row ops per request; flooding is covered above.

## 9. Verification (one owner per check)

| Check | Owner | Pass condition |
|---|---|---|
| Effective grants: anon/authenticated have **no** privileges on both tables | Claude (SQL `information_schema.role_table_grants` / `column_privileges`) | Zero rows |
| Direct REST `POST/GET/PATCH/DELETE /rest/v1/launch_signups` with publishable key | Claude (curl) | Each returns `401`/`403`/`404`-class denial; owner row count unchanged |
| Function: new email vs existing email | Codex tests + Claude curl | Identical status (`202`), body and headers; one row |
| Function: missing / invalid / replayed Turnstile token | Codex tests | `403`, no row |
| Function: 6th request in an hour from one IP; global cap | Codex tests (cap lowered via env in test) | `429`, no row |
| Function: validation vectors (whitespace-only, control chars, punctuation-only phone, `+20 10 1234 5678` OK, mixed-case email dedupe) | Codex tests (shared `validation-vectors.json`) | Matches expected for every vector |
| Function: oversize body, non-JSON, wrong method, extra fields (`id`, `created_at`) | Codex tests | `413`/`415`/`405`; extra fields ignored, server values used |
| CORS: allowed origins vs unrelated origin; `OPTIONS` | Claude (curl with `Origin`) | Headers only for allowed origins |
| UI states: idle, field errors, sending (no double submit — rapid clicks + Enter), success, verify failed, too many, network error + Try again → success | Claude (browser, stubbed + real) | All correct in EN and AR, including switching language mid-state |
| Nav "Contact us" (desktop + mobile, keyboard) | Claude (browser) | Scrolls, focuses `#contact`, closes mobile menu, URL `#contact` |
| Accessibility: labels, `aria-describedby` errors, live announcements, focus to first invalid field | Claude (a11y tree) | All present |
| Desktop 1440 / tablet 768 / mobile 375, EN + AR, no horizontal scroll | Sonnet subagent | Screenshots match approved Figma frames (§7b parity) |
| `file://` notice; `localhost:8000` and Pages submit | Claude | As specified in D9 |
| Retention dry run: deletion query selects rows by `created_at` | Claude (SQL, `select` form) | Correct rows selected |
| Test rows removed before release | Claude | Table empty |
| Diff gates | Task A: Claude Opus review + Challenge · Task B: Codex Sol harness | `PASS` or `PASS WITH P2 FOLLOW-UPS` |

## 10. Release

1. Task A and Task B commits on `feat/notify-me-form`; push; open a PR to `main` (PO reviews on GitHub).
2. Deploy the Edge Function + migration to Supabase (backend first — two-phase, like QuizRace).
3. PO approves → merge PR → deploy `main` to Cloudflare Pages (`godwitly`).
4. Live check in EN and AR on `godwitly.pages.dev`; delete the test row.

## 11. Plan-gate round 1 → v2 resolution

| Finding | Resolution |
|---|---|
| P1 duplicate `409` enumerates emails | Function returns identical `202` for new/duplicate (`on conflict do nothing`); anon has no table access (§2, §6.3) |
| P1 D4-A bypassable flooding | D4 now Edge Function + Turnstile + per-IP and global limits; direct anon insert removed (§6) |
| P2 whitespace / punctuation-only input | Trimmed, control-char, digit-count, normalized-email CHECKs + server validation; shared vectors (§6.2–6.4) |
| P2 incomplete response state machine | Full mapping incl. catch-all retryable, timeout, malformed JSON, `finally` (§7.4) |
| P2 language switch can't refresh form state / placeholders | `godwitly:languagechange` event + re-render; no placeholders (§5, §7.5) |
| P2 contact nav has no anchor/focus target | `<section id="contact" tabindex="-1">`, both navs, keyboard test (§7.1–7.2, §9) |
| P2 retention/consent not enforceable | `consent_version` column, PO-owned deletion date, privacy contact, dry-run check (§4 D5, §6.2, §9) |
| P2 verification too permissive on grants | Explicit grant inspection + every REST verb + extra-field tests (§9) |
| P2 CORS / `file://` undefined | Origin allow-list, `OPTIONS`, localhost testing, `file://` notice (§4 D9, §6.3) |

## 12. Gate history

| Gate | Reviewer | Report | Verdict |
|---|---|---|---|
| Plan gate round 1 | Codex Sol (high) | `docs/reviews/2026-10-27-notify-form-plan-gate.md` | FAIL — P0/P1 GAPS (2×P1, 7×P2) |
| Plan gate round 2 (re-check) | Codex Sol (medium) | `docs/reviews/2026-10-27-notify-form-plan-gate-r2.md` | _pending_ |
| PO approval (§4 decisions + plan) | Sherif | — | _pending_ |
| Figma approval | Sherif | `docs/ux/APPROVALS.md` | _pending_ |
| Diff gate A + Challenge | Claude Opus 5.5 | `docs/reviews/…-diff-gate-a.md` | _pending_ |
| Diff gate B | Codex Sol | `docs/reviews/…-diff-gate-b.md` | _pending_ |
