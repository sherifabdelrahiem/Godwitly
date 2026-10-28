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

## Step 5 — Google (PO), in progress

5a–5f (Google Cloud project, branding, scopes check, publish, OAuth client, paste into
Supabase): **not confirmed yet**.

## Remaining

- Step 6: the Site URL and the three Redirect URLs.
- Local browser test (AC2–AC10, AC12, AC15), which needs a second Google account.
- The PO merges PR #24, then step 7 deploy ("go deploy").
- Step 8: remove the localhost redirect and re-run the Advisor.
- Record the results here.
