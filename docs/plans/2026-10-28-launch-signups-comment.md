# Plan — `launch_signups` table comment matches the glossary (#7)

> Status: **DRAFT v1**, awaiting Codex plan gate and PO approval
> Issue: #7 · Branch: `fix/launch-signups-comment` → PR → merge → apply migration
> (applying needs separate PO approval)

```text
LANE: Critical — Supabase migration on the live `godwitly` project (eu-central-1).
Metadata only: no data, column, check, RLS, grant, policy, trigger or function change.
```

## Goal

The table description in the database uses the agreed vocabulary. Today it reads
"Waitlist sign-ups from the Godwitly landing page contact form." `GLOSSARY.md` calls a row a
**Launch sign-up** and lists "waitlist" and "contact form" as words to avoid. Anyone reading
the schema (Table Editor, SQL Editor, generated API docs) should see the glossary term.

## Decisions

| # | Decision |
|---|---|
| C1 | Add one new migration, `supabase/migrations/20261028120000_launch_signups_comment.sql`, timestamped after the latest applied one (`20261027150000_notify_signup_trigger.sql`). |
| C2 | Its only statement: `comment on table public.launch_signups is 'Launch sign-ups from the Godwitly landing page.';` plus a two-line header comment in the style of the existing migrations. |
| C3 | Do **not** edit `20261027120000_launch_signups.sql`. It is already applied; changing it would make the repo disagree with the remote migration history. Its old comment text stays in history and is superseded by C2. |
| C4 | No `begin`/`commit` in the file: `supabase db push` already runs each migration in a transaction. |
| C5 | Locking: `COMMENT ON TABLE` takes a `SHARE UPDATE EXCLUSIVE` lock, which does not conflict with the `ROW EXCLUSIVE` lock that inserts take, so live form sign-ups are not blocked. The statement is instant. |
| C6 | The `notify_signup` trigger, RLS policy "Visitors can sign up", and the `anon` insert grant are untouched; the change cannot alter who can do what. |
| C7 | No personal data is read, written, copied or logged. No secrets are needed: `supabase db push` uses the existing CLI link and login. |
| C8 | Rollback: a follow-up migration setting the previous text (or `null`). No data is at risk either way. |

## Steps (each Supabase step needs PO approval at the time)

1. Branch `fix/launch-signups-comment`; add the migration (C1, C2); update nothing else except
   README if it quotes the old comment (it does not today).
2. PR with this plan, the gate report(s) and a diff review; PO merges.
3. **With PO approval:** `supabase migration list` — local and remote must agree for every
   migration up to `20261027150000`, and only `20261028120000` is local-only.
4. **With PO approval:** `supabase db push --dry-run` — must list only
   `20261028120000_launch_signups_comment.sql`. If it lists anything else, stop.
5. **With PO approval:** `supabase db push`.
6. Verification below. No site deploy is needed (no site files change).

## Acceptance criteria and probes (PO runs in Dashboard → SQL Editor, read-only)

- **AC1 — comment changed.**
  `select obj_description('public.launch_signups'::regclass, 'pg_class');`
  Before: `Waitlist sign-ups from the Godwitly landing page contact form.`
  After: `Launch sign-ups from the Godwitly landing page.`
- **AC2 — permissions unchanged.** Run before and after; results must be identical:
  `select grantee, privilege_type, column_name from information_schema.column_privileges where table_schema = 'public' and table_name = 'launch_signups' order by 1, 2, 3;`
  `select policyname, roles, cmd, qual, with_check from pg_policies where schemaname = 'public' and tablename = 'launch_signups';`
  `select relrowsecurity from pg_class where oid = 'public.launch_signups'::regclass;` → `true`
- **AC3 — trigger unchanged.**
  `select tgname, tgenabled from pg_trigger where tgrelid = 'public.launch_signups'::regclass and not tgisinternal;`
  → `notify_signup`, `O` (enabled), before and after.
- **AC4 — row count unchanged.** `select count(*) from public.launch_signups;` before and after
  (no sign-up arriving in between, or the difference matches new sign-ups).
- **AC5 — history consistent.** After push, `supabase migration list` shows
  `20261028120000` on both local and remote.
- **AC6 — form still works (optional, PO decides).** A live test submission would also send a
  Sign-up alert email and create a row with test personal data, so it is **not** part of this
  change by default: the migration touches no path the form uses (C5, C6). If the PO wants it,
  submit once with clearly fake data, confirm the row in the Table Editor, then delete it:
  `delete from public.launch_signups where id = '<row id>';`

## Out of scope

- Renaming the table or the `notify-signup` Edge Function.
- Any change to columns, checks, RLS, grants, the trigger, the Edge Function or the form.
- Site files (no Cloudflare deploy).
