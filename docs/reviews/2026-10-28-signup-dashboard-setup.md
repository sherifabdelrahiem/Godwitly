# Setup log — Sign-up dashboard (live project `godwitly`)

> Plan: `docs/plans/2026-10-28-signup-dashboard.md` (APPROVED v4 + A1, P-a–P-e, D1),
> "Setup runbook". PR #24 (not merged). This log contains no email addresses, keys or
> secrets.

## Step 0 — Baseline (2026-10-28, read-only)

Read with `supabase db query --linked`, `supabase db advisors --linked`, `supabase config
diff --project-ref ijpvbxglhxktnkabjdif` (URL and hook lines only) and the public
`/auth/v1/settings` endpoint.

| Item | Value |
|---|---|
| `auth.users` | 0 rows, so no existing account can bypass the hook |
| `public.launch_signups` | 4 rows (count only) |
| Migrations applied | `20261027120000` launch_signups, `20261027150000` notify_signup_trigger, `20261028120000` launch_signups_comment |
| `private` schema | absent |
| `pg_graphql` | not installed, so lint 0027 cannot fire |
| Security Advisor | no issues |
| Site URL | `http://localhost:3000` (default placeholder) |
| Redirect URLs | none |
| Providers | Email on, Phone off, Google off, Anonymous off, manual linking off; global sign-ups allowed; email confirmations on |

## Step 1 — Other providers (PO, dashboard)

- The Email provider was turned off.
- The first check found `disable_signup: true`: the global "Allow new users to sign up" had
  been switched off by mistake. The PO turned it back on.
- Re-check: `email: false`, `phone: false`, `google: false`, `anonymous_users: false`,
  `disable_signup: false`. ✅

## Step 2 — Migration (agent, after the PO's "go db push")

- A dry run listed only `20261028160000_signup_dashboard.sql`, which `supabase db push`
  then applied.
- Verified on the live project:
  - 4 migrations are applied.
  - anon has INSERT on `launch_signups` only (column-level); authenticated has SELECT only.
  - authenticated has no rights on `private.signup_viewers`.
  - All 12 functions have `search_path=""`, and SECURITY DEFINER exists only in `private`.
  - anon can execute none of the new functions; only `supabase_auth_admin` can execute the
    hook.
  - The policies "Auth hook can read the list", "Sign-up viewers can read sign-ups" and
    "Visitors can sign up" are present.
  - The viewer list has 0 rows, `launch_signups` still has 4, and the `notify_signup`
    trigger is enabled.
  - The Security Advisor shows no issues. ✅
- AC1 with the publishable key (REST): reading `launch_signups` and calling
  `dashboard_role`, `list_signup_viewers`, `add_signup_viewer` and
  `hook_before_user_created` all return `42501 permission denied`. ✅

## Step 3 — Owner row (PO, SQL editor)

Verified without reading the address: 1 owner, 0 viewers, stored lower-case and trimmed. ✅

## Step 4 — Hook (PO, dashboard)

`supabase config diff` shows `auth.hook.before_user_created.enabled = true`, with uri
`pg-functions://postgres/public/hook_before_user_created`. ✅

## Step 5 — Google (PO, 2026-10-29)

- 5a: the Google Cloud project `godwitly` is in use.
- 5b: Google Auth Platform is set up as **External**, with no logo and no app domain links.
- 5c: Data Access lists no scopes (non-sensitive, sensitive and restricted are all empty),
  so sign-in asks only for the default `openid`, `email` and `profile`. ✅
- 5d: **deviation from P-d, accepted by the PO.** Google will not switch an External app to
  "In production" without a homepage URL and a privacy policy URL, and the site has no
  privacy policy page. The app stays in **Testing**. The PO added the Google accounts of the
  owner and the second test account as Test users. Effects: each new Sign-up viewer must
  also be added as a Google Test user (lifetime cap 100), and Google shows an "unverified
  app" notice at sign-in. Follow-up: a separate plan for a privacy policy page (EN/AR), then
  set the homepage, privacy URL and authorised domain, and publish.
- 5e: an OAuth client of type "Web application" (`Godwitly Supabase`) was created. It has no
  JavaScript origins and one redirect URI,
  `https://ijpvbxglhxktnkabjdif.supabase.co/auth/v1/callback`.
- 5f: the client ID and secret were pasted into Supabase by the PO, not through the agent.
  Re-check: `/auth/v1/settings` shows `google: true`, with `email`, `phone` and
  `anonymous_users` still `false` and `disable_signup: false`. `supabase config diff` shows
  `auth.external.google.enabled` and `client_id` set on the remote (values not printed). ✅
  - **Correction (2026-10-29):** only the client ID had been saved. The first sign-in
    attempt returned `400 validation_failed: Unsupported provider: missing OAuth secret`.
    `config diff` cannot show the secret, so the re-check above missed it. The PO pasted the
    secret, and `/auth/v1/authorize?provider=google` now returns `302` to
    `accounts.google.com` with scopes `email profile`. ✅ Lesson: verify a provider by
    starting the authorize flow, not only from `config diff`.

## Step 6 — Redirects (PO, 2026-10-29)

`supabase config diff` shows the Site URL `https://godwitly.pages.dev` and exactly three
Redirect URLs: `https://godwitly.pages.dev/dashboard`,
`https://godwitly.pages.dev/dashboard.html` and `http://localhost:8000/dashboard.html`
(the last is for testing only, and is removed in step 8). ✅

## Local browser test (agent + PO, 2026-10-29)

`python3 -m http.server 8000`, Chrome at `http://localhost:8000/dashboard.html`. The PO does
every Google sign-in. PO approval for live test data: checks 1–3 (AC6, AC7, AC3) "provided
you record the test rows, remove them afterward, and verify cleanup"; check 4 (AC15)
deferred; AC10 skipped.

**Test rows (live `godwitly` project):**

| AC | Table | id | Created (UTC) | Removed | Cleanup check |
|---|---|---|---|---|---|
| AC7 | `public.launch_signups` | `c9b5c05b-daeb-4d09-b3d3-ea68a678df82` | 2026-10-29 12:03:57 | deleted by id | id count 0; total back to 4 ✅ |

**Results:**

- AC1: reading `launch_signups` and calling all 4 RPCs with the publishable key return
  `42501`. ✅ (The form-submit part is checked on production after deploy.)
- AC8: all six `dayKey` / `weekKey` values match. ✅
- AC9 (owner signed in): the five totals, the 12 weeks and the 30 days equal the SQL;
  search `@` → 4 = `ilike` 4, `+20` → 3 = `ilike` 3, a nonsense term → "No Launch sign-ups
  match your search". ✅
- AC12 (partial): signed-out and owner views in EN and AR at full width, 320px and 800px.
  Cards below 768px, table at 800px, no sideways scroll, no console errors. The owner row
  has no Remove. ✅ `file://` not run: the Chrome extension cannot open local files.
- AC13: Git hits are only placeholders, `example.com`/`example.invalid` test values,
  `onboarding@resend.dev`, and the commit author / co-author lines. ✅
- AC14: anon can only INSERT `launch_signups`; authenticated has SELECT only and no
  privilege on `private.signup_viewers`; anon has no EXECUTE on any new function; the hook
  is executable only by `supabase_auth_admin`; definer = true only in `private`;
  `search_path=""` everywhere. ✅
- AC7 (sign-up row part): the payloads show as text in the list and in a search hit;
  `img[src="x"], b` count 0; no alert; no console errors. ✅ The Access-entry part is
  pending.
- AC6, owner-row removal: **verified from the code, not run** (the PO asked that the owner
  account is never changed). The live `private.remove_signup_viewer` deletes only
  `where … and not v.is_owner` and returns `not_found` otherwise; no function takes an
  `is_owner` argument.
- AC6, add with spaces and capitals: `  Viewer@Example.com ` was saved as `viewer@example.com`,
  and a repeat showed "This address is already a Sign-up viewer." ✅ **Found a bug:** a
  typed comma was accepted and saved as `viewer@example.com,` (added 12:08:11 UTC). It gave
  no access, but a typo showed as "added". Fixed by plan D2 (below).
- AC6 test entries `viewer@example.com,` and `viewer@example.com` were removed in Access by
  the PO. Check: `private.signup_viewers` has 1 row, the owner, and 0 `example.com`
  entries. ✅
- **D2 migration (PO approval 2026-10-29, this migration only):** before the push, the
  linked project was `godwitly` (`ijpvbxglhxktnkabjdif`, `eu-central-1`); `migration list`
  showed the four earlier migrations identical locally and remotely, and the dry run listed
  only `20261029120000_signup_viewers_email_check.sql` (no seeds, no roles). `supabase db
  push` applied it.
  - Database: the live `signup_viewers_email_check` is the new rule. A `DO` block that
    tried to insert `viewer@example.com,`, `viewer@example.com;`, `viewer@example.com.`,
    `a b@example.com`, `not-an-email` and `viewer@example.com>` got `23514` for all six,
    then raised on purpose so nothing was kept. The list still has only the owner row. ✅
  - Page: the served `js/dashboard.js` has the new `EMAIL_PATTERN`; it refuses those
    addresses and accepts `viewer@example.com` and `"<b>x</b>"@example.com`. ✅
  - Owner access after the push: the dashboard loads the figures, the list and Access;
    no console errors. ✅
- AC10: **untested** (skipped by the PO), not passed.
- AC15: **deferred** by the PO, to be tested first in an isolated environment.

## Remaining

- Local browser test: AC2–AC5, AC6 (Access add/duplicate/invalid), AC7 (Access entry),
  AC11 (session part), AC12 (no access and viewer states). AC10 untested; AC15 deferred.
- The PO merges PR #24, then step 7 deploy ("go deploy").
- Step 8: remove the localhost redirect and re-run the Advisor.
- Record the results here.
