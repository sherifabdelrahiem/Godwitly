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

## Step 6 — Redirects (PO, 2026-10-29)

`supabase config diff` shows the Site URL `https://godwitly.pages.dev` and exactly three
Redirect URLs: `https://godwitly.pages.dev/dashboard`,
`https://godwitly.pages.dev/dashboard.html` and `http://localhost:8000/dashboard.html`
(the last is for testing only, and is removed in step 8). ✅

## Remaining

- Local browser test (AC2–AC10, AC12, AC15), which needs a second Google account.
- The PO merges PR #24, then step 7 deploy ("go deploy").
- Step 8: remove the localhost redirect and re-run the Advisor.
- Record the results here.
