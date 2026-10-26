# Plan — "Get notified" contact form (Supabase)

> Status: **DRAFT — awaiting plan gate + PO approval** · 2026-10-27
> Branch: `feat/notify-me-form` → PR → merge to `main` → deploy to Cloudflare Pages
> Process: QuizRace operating model (`AI_ORCHESTRATION.md` §4b Critical lane, `HARNESS_ENGINEERING.md`)

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
- Fields: **full name, email, phone number, job title, message**, plus a consent checkbox.
- Everything works in English and Arabic (RTL), on desktop and mobile, with a keyboard.

Out of scope (v1): sending emails to visitors, an admin dashboard (submissions are viewed in the
Supabase dashboard), analytics, login of any kind.

## 2. Roles (who does what)

| Role | Who | Notes |
|---|---|---|
| PO / approver | Sherif | Approves this plan, the Figma frame, and the release |
| Orchestrator + **single writer** | Claude Opus 5.5 | Writes the SQL migration and the UI; owns Supabase CLI, Figma, browser checks — all tool-dependent, so one Claude writer (§2a) |
| Screenshots + Figma parity | Claude Sonnet 5.5 subagent | Captures EN/AR desktop/mobile and compares with the frame |
| Plan gate + diff gate + Challenge | **Codex Sol** (other vendor, fresh context, read-only) | Plan-stage and diff-stage harness reports; Challenge because this is a security boundary |

Notion: this is a separate project from QuizRace, so **no card** on the QuizRace board unless the PO asks.

## 3. Decisions the PO must make (one-way doors)

| # | Decision | Recommendation |
|---|---|---|
| D1 | Supabase **region** (cannot be changed later without migrating) | The closest region to the target users that the Supabase CLI offers; default **Frankfurt `eu-central-1`** |
| D2 | **Required fields** | Required: name, email, phone, job title, consent. **Optional: message** |
| D3 | **Duplicate emails** | One row per email (unique). A repeat submission shows the same "thank you" message, so the form never reveals whether an email is already on the list |
| D4 | **Spam protection** level | **A (v1):** direct insert with Row Level Security + database limits + hidden honeypot field. **B (stronger):** a Supabase Edge Function that verifies Cloudflare Turnstile and rate-limits before inserting. Recommend A now, B as a follow-up if spam appears — see §6 residual risk |
| D5 | **Consent + privacy text** and how long data is kept | Checkbox: "I agree to be contacted about Godwitly's launch." Keep data until launch + 12 months, then delete |
| D6 | Add a **"Contact us" nav link** pointing to the form? | Yes — "Contact us" / "تواصل معنا" in header and mobile menu |
| D7 | Free Supabase plan (projects pause after a period of inactivity) | Free plan is fine for a waitlist; note the pause behaviour |

Note: the original course brief said "no backend or databases". This feature intentionally changes
that, at the PO's request.

## 4. Design (Figma-first, §2.4 — blocking)

1. Claude adds frames for the new closing section to the Godwitly Landing page in Figma
   (As-Built file `luw3nBt5qD0v0su7tJIfSZ`, page node `2086:2`): **EN desktop, EN mobile, AR desktop, AR mobile**,
   each with states **idle, field errors, sending, success, network error**.
2. PO approves → record in `docs/ux/APPROVALS.md` (new file in this repo) with frame node IDs.
3. No form code is written before this approval.

Layout proposal: the heading + line stay centered on the landscape background; below them a white
card (max ~640px wide, 24px radius, soft shadow) with a 2-column grid on desktop (name | email,
phone | job title), message full-width, consent, and a full-width terracotta submit button
"Notify me" / "أبلغني عند الإطلاق". Mobile: one column.

## 5. Database (Supabase project `godwitly`)

### 5.1 Setup

1. PO runs `supabase login` once (browser approval) — the CLI then works for Claude.
2. Claude: `supabase projects create godwitly --org-id <org> --region <D1> --db-password <generated>`.
   The DB password is generated, stored in the macOS Keychain, **never committed**.
3. `supabase link`, then apply the migration with `supabase db push`.

### 5.2 Migration — `supabase/migrations/<timestamp>_create_launch_signups.sql`

```sql
create table public.launch_signups (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  full_name   text not null check (char_length(full_name) between 2 and 100),
  email       text not null check (char_length(email) <= 254
                                   and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  phone       text not null check (phone ~ '^\+?[0-9 ()-]{7,20}$'),
  job_title   text not null check (char_length(job_title) between 2 and 100),
  message     text check (message is null or char_length(message) <= 1000),
  language    text not null default 'en' check (language in ('en', 'ar')),
  consent     boolean not null check (consent = true)
);

create unique index launch_signups_email_key on public.launch_signups (lower(email));

alter table public.launch_signups enable row level security;

-- Visitors may only ADD a row. They can never read, change or delete rows.
revoke all on public.launch_signups from anon, authenticated;
grant insert (full_name, email, phone, job_title, message, language, consent)
  on public.launch_signups to anon;

create policy "Visitors can sign up"
  on public.launch_signups for insert to anon
  with check (true);  -- the column CHECKs above do the validation
```

Only the column list above is insertable, so a visitor cannot set `id` or `created_at`.
Reading submissions: Supabase dashboard (Table Editor) by the PO, as the project owner.

### 5.3 Front-end connection

- New `js/config.js`: `SUPABASE_URL` and the project's **publishable (anon) key**. This key is
  public by design; safety comes from the RLS + grants above. The DB password and
  service-role/secret key are never put in the site or the repo.
- Submit uses plain `fetch` (no library, no build tools):
  `POST {SUPABASE_URL}/rest/v1/launch_signups` with headers `apikey`, `Content-Type: application/json`,
  `Prefer: return=minimal` (so no read permission is needed).
- Responses: `201` → success · `409` (duplicate email) → **same success** (D3) ·
  `400/422` → field error message · network failure/`5xx` → error message + **Try again** that resubmits the kept input.

## 6. Security review inputs (for the Codex plan gate)

| Threat | Control | Residual risk |
|---|---|---|
| Visitor reads others' data (emails/phones) | No SELECT grant; RLS on; `return=minimal` | Low |
| Visitor edits/deletes rows | No UPDATE/DELETE grant | Low |
| Visitor sets `id`/`created_at` or extra columns | Column-level INSERT grant | Low |
| Oversized or malformed input | DB CHECK constraints (lengths, formats) + matching client checks | Low |
| Email enumeration via duplicate error | 409 shown as success | Low |
| Bots / spam flooding the table | Honeypot (client only) + DB limits | **Medium in v1 (D4-A)**: a script can call the REST API directly. Upgrade path = D4-B (Edge Function + Turnstile + rate limit). Owner: PO decides at D4 |
| Secrets leaked in repo | Only the publishable key + URL committed; `.gitignore` excludes `supabase/.temp`, `.env*` | Low |
| Personal data kept forever | Retention rule D5; manual delete documented in README | Medium until automated |

Deep performance pass: **NOT TRIGGERED** — one bounded insert per submit, no reads, no lists.

## 7. Implementation steps (after plan gate PASS + PO approval of §3 and Figma)

1. Supabase project + migration (§5). Commit `supabase/` folder (migration + `config.toml`, no secrets).
2. HTML: replace the CTA button with `<form>` (labels, `autocomplete`, `type="email"`/`type="tel"`,
   `dir="ltr"` on email/phone inputs so numbers read correctly in Arabic, honeypot field,
   `aria-live` status area). Add nav link if D6 = yes.
3. CSS: form card, inputs, focus/error/disabled styles, RTL and mobile rules.
4. JS (`js/form.js`, separate file for clarity): validation, submit, all states, language-aware messages.
5. `js/translations.js`: every new label, placeholder, hint, error, success and button text in EN + AR.
6. README: how the form works, where submissions are, how to change fields, how to delete data.

## 8. Verification (each check has one owner)

| Check | Owner | Pass condition |
|---|---|---|
| RLS: anon **insert** works | Claude (curl with publishable key) | `201` |
| RLS: anon **select / update / delete** blocked | Claude (curl) | Empty/denied for all three |
| DB rejects bad input (long text, bad email/phone, consent false) | Claude (curl) | `400`-class errors, no row created |
| Duplicate email shows success, creates no new row | Claude (curl + UI) | One row only |
| UI states: idle, field errors, sending (button disabled, no double submit), success, network error + Try again | Claude (browser) | All work in EN and AR |
| Keyboard + screen-reader labels, error announcements | Claude (browser, a11y tree) | Every field labelled; errors announced |
| Desktop 1440 / tablet 768 / mobile 375, EN + AR, no horizontal scroll | Sonnet subagent | Screenshots match the approved Figma frames (§7b parity) |
| Works when opened locally (`file://`) and on Pages | Claude | Both submit successfully |
| Test rows cleaned up after testing | Claude | Table empty before release |
| Diff-stage harness + Challenge | Codex Sol | `PASS` or `PASS WITH P2 FOLLOW-UPS` |

## 9. Release

1. Commit on `feat/notify-me-form`, push, open a PR to `main` (PO reviews on GitHub).
2. PO approves → merge PR.
3. Deploy `main` to Cloudflare Pages (`godwitly`), then check the live form once in EN and AR and delete the test row.

## 10. Gate history

| Gate | Reviewer | Report | Verdict |
|---|---|---|---|
| Plan gate (harness, §2) | Codex Sol | `docs/reviews/2026-10-27-notify-form-plan-gate.md` | _pending_ |
| PO approval (§3 decisions + plan) | Sherif | — | _pending_ |
| Figma approval | Sherif | `docs/ux/APPROVALS.md` | _pending_ |
| Diff gate + Challenge | Codex Sol | `docs/reviews/…-diff-gate.md` | _pending_ |
