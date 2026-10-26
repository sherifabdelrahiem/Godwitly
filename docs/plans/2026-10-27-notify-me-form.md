# Plan — "Get notified" contact form (Supabase)

> Status: **APPROVED v4 (simple version)** · 2026-10-27
> Branch: `feat/notify-me-form` → PR → merge to `main` → deploy to Cloudflare Pages

```text
LANE: Standard (PO decision) — public insert-only form storing personal data on a low-traffic training-course site; the PO accepted the residual spam risk instead of a server-side step.
```

## History

Plan v1–v3 followed the full Critical lane. Codex Sol plan gate: round 1 FAIL (2×P1, 7×P2),
round 2 FAIL (2×P1, 3×P2); reports in `docs/reviews/`. v2/v3 added a server function, Turnstile and
atomic rate limits. On 2026-10-27 the PO decided this is out of proportion for a training-course site
with very few visitors, stopped round 3, and approved the simple version below. Round-1's
enumeration finding is still closed cheaply (no unique email → no duplicate error to probe).

## Goal

In the closing section, keep **"Ready to experience Godwitly?"** / **"Discover a smarter way to
learn, engage and prepare."**, remove the **"Back to our solutions"** button, and show a form so
visitors can ask to be notified when Godwitly goes live. Entries are stored in a new Supabase
project **`godwitly`**. English + Arabic (RTL), desktop + mobile, keyboard accessible.

## Decisions (PO, 2026-10-27)

| # | Decision |
|---|---|
| D1 | Supabase region **Frankfurt `eu-central-1`**, free plan |
| D2 | Required: **full name, email, phone, job title, consent**. Optional: **message** |
| D3 | Duplicate emails are simply stored again (no unique rule) so the form never reveals who signed up |
| D4 | Protection: insert-only access + database checks + hidden honeypot field. **No** server function, Turnstile or rate limits. **Accepted risk:** a determined spammer could add junk rows → delete them in Supabase; add Turnstile later if needed |
| D5 | Consent checkbox: "I agree to be contacted about Godwitly's launch." |
| D6 | "Contact us" link in the header and mobile menu → `#contact` |
| D7 | Works when the page is opened by double-click (`file://`) and on Cloudflare Pages |

## How it works

```text
Browser form ── fetch POST /rest/v1/launch_signups (publishable key, Prefer: return=minimal) ──▶ Supabase
                                                    RLS: anon may INSERT listed columns only; no SELECT/UPDATE/DELETE
```

## Database — `supabase/migrations/<ts>_launch_signups.sql`

```sql
create table public.launch_signups (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  full_name   text not null check (full_name = btrim(full_name) and char_length(full_name) between 2 and 100),
  email       text not null check (char_length(email) <= 254 and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  phone       text not null check (phone ~ '^\+?[0-9 ()-]{7,20}$'
                                   and char_length(regexp_replace(phone, '[^0-9]', '', 'g')) between 7 and 15),
  job_title   text not null check (job_title = btrim(job_title) and char_length(job_title) between 2 and 100),
  message     text check (message is null or char_length(message) between 1 and 1000),
  language    text not null default 'en' check (language in ('en', 'ar')),
  consent     boolean not null check (consent)
);

alter table public.launch_signups enable row level security;
revoke all on public.launch_signups from anon, authenticated;
grant insert (full_name, email, phone, job_title, message, language, consent)
  on public.launch_signups to anon;
create policy "Visitors can sign up" on public.launch_signups
  for insert to anon with check (true);
```

Submissions are read in the Supabase dashboard (Table Editor) by the project owner.

## Front-end

- `index.html`: closing section becomes `<section id="contact" tabindex="-1">` with the heading, line,
  and a white form card (2 columns on desktop, 1 on mobile). Visible labels, `autocomplete`,
  `type="email"`/`type="tel"`, `dir="ltr"` on email/phone, consent checkbox, hidden honeypot,
  `aria-live` status area, per-field error text. "Contact us" link in both navs.
- `js/config.js`: Supabase URL + publishable key (public by design; RLS protects the data).
- `js/form.js`: client checks matching the database rules; sending state (button disabled, no double
  submit); success message; error message with a working Try again; messages follow the language switch.
- `js/translations.js`: all new text in English and Arabic. `css/styles.css`: form styles incl. RTL + mobile.
- README: where submissions are and how to change the form.

## Verification

1. curl with the publishable key: insert works (`201`); read/update/delete denied; bad data rejected.
2. Browser: EN + AR, desktop + mobile, all states (errors, sending, success, network error + Try again), keyboard, nav link.
3. Works from `file://` and from Pages; test rows deleted afterwards.
4. One compact Codex review of the diff (Standard lane).

## Release

Commit on the branch → push → PR → PO merges → deploy `main` to Cloudflare Pages.
