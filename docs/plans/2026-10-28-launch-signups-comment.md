# Plan — `launch_signups` table comment matches the glossary (#7)

> Status: **DRAFT v3**, Codex gate passed (r1, r2); awaiting PO approval
> Issue: #7 · Branch: `fix/launch-signups-comment` → PR → merge → apply migration
> (applying needs separate PO approval)

```text
LANE: Critical — Supabase migration on the live `godwitly` project (eu-central-1).
Metadata only: no data, column, check, RLS, grant, policy, trigger or function change.
```

## History

- **v1:** Codex gate r1 **PASS** (0×P1, 4×P2, 1×P3). Report:
  `docs/reviews/2026-10-28-launch-signups-comment-plan-gate.md`.
- **v2:** fixes all r1 findings: lock wording and timeouts (r1 #1), full permission
  comparison (r1 #2), full trigger and function comparison (r1 #3), row count as supporting
  evidence only (r1 #4), verbatim rollback (r1 #5).
- **v2:** Codex gate r2 **PASS** (0×P1, 1×P2): r1 #4 partly open, because AC4 still asked to
  inspect rows. Report appended to the same file.
- **v3:** fixes r2: AC4 no longer inspects rows; a count change under live traffic is recorded
  as inconclusive (r2 / r1 #4).

## Goal

The table description in the database uses the agreed vocabulary. Today it reads
"Waitlist sign-ups from the Godwitly landing page contact form." `GLOSSARY.md` calls a row a
**Launch sign-up** and lists "waitlist" and "contact form" as words to avoid. Anyone reading
the schema (Table Editor, SQL Editor, generated API docs) should see the glossary term.

## Decisions

| # | Decision |
|---|---|
| C1 | Add one new migration, `supabase/migrations/20261028120000_launch_signups_comment.sql`, timestamped after the latest applied one (`20261027150000_notify_signup_trigger.sql`). |
| C2 | Its statements, in order: `set lock_timeout = '5s';`, `set statement_timeout = '15s';`, then `comment on table public.launch_signups is 'Launch sign-ups from the Godwitly landing page.';`. A two-line header comment in the style of the existing migrations. Nothing else. |
| C3 | Do **not** edit `20261027120000_launch_signups.sql`. It is already applied; changing it would make the repo disagree with the remote migration history. Its old comment text stays in history and is superseded by C2. |
| C4 | No `begin`/`commit` in the file; `supabase db push` applies the file itself. The two `set` statements only affect the CLI's own connection. |
| C5 | Locking (r1 #1): `COMMENT ON TABLE` takes a `SHARE UPDATE EXCLUSIVE` lock. That mode is compatible with the `ROW EXCLUSIVE` lock ordinary inserts take, so normal form sign-ups can proceed while it runs. It can still wait behind conflicting locks (for example a running `VACUUM`, `ANALYZE` or DDL), and queued requests can wait behind it. The 5 s lock timeout and 15 s statement timeout bound that: if the lock isn't granted in time, the push fails cleanly with nothing changed, and is retried later. |
| C6 | The `notify_signup` trigger, RLS policy "Visitors can sign up", and the `anon` insert grant are untouched; the change cannot alter who can do what. AC2 and AC3 prove it. |
| C7 | No personal data is read, written, copied or logged. The probes read only metadata and one aggregate count (AC4); no personal field values are selected. No secrets are needed: `supabase db push` uses the existing CLI link and login. |
| C8 | Rollback (r1 #5): AC1 records the exact pre-change comment. If needed, a separately approved, later-timestamped migration sets that exact text back. Setting `null` is only for a deliberate removal, not a rollback. No data is at risk either way. |

## Steps (each Supabase step needs PO approval at the time)

1. Branch `fix/launch-signups-comment`; add the migration (C1, C2). Nothing else changes; the
   README does not quote the old comment.
2. PR with this plan, the gate reports and a diff review; PO merges.
3. **PO runs the "before" probes** (AC1–AC4) and saves the output.
4. **With PO approval:** `supabase migration list` — local and remote must agree for every
   migration up to `20261027150000`, and only `20261028120000` is local-only.
5. **With PO approval:** `supabase db push --dry-run` — must list only
   `20261028120000_launch_signups_comment.sql`. If it lists anything else, stop.
6. **With PO approval:** `supabase db push`. If it fails on the lock timeout, nothing changed;
   retry later.
7. **PO runs the "after" probes** and compares. No site deploy is needed.

## Acceptance criteria and probes

All probes are read-only. AC1–AC3 read only metadata; AC4 reads one aggregate count and no
personal fields. Run them as the same role (`postgres`, Dashboard →
SQL Editor) before and after, with fixed ordering so outputs can be compared line by line.

- **AC1 — comment changed.**
  `select obj_description('public.launch_signups'::regclass, 'pg_class');`
  Before (record verbatim for C8): `Waitlist sign-ups from the Godwitly landing page contact form.`
  After: `Launch sign-ups from the Godwitly landing page.`
- **AC2 — permissions unchanged (r1 #2).** Identical before and after:
  - Table ACL and RLS flags:
    `select relacl, relrowsecurity, relforcerowsecurity from pg_class where oid = 'public.launch_signups'::regclass;`
  - Column ACLs:
    `select attname, attacl from pg_attribute where attrelid = 'public.launch_signups'::regclass and attnum > 0 and not attisdropped order by attnum;`
  - Policies, complete:
    `select policyname, permissive, roles, cmd, qual, with_check from pg_policies where schemaname = 'public' and tablename = 'launch_signups' order by policyname;`
- **AC3 — trigger and alert path unchanged (r1 #3).** Identical before and after:
  `select t.tgname, t.tgenabled, pg_get_triggerdef(t.oid), md5(pg_get_functiondef(t.tgfoid)) from pg_trigger t where t.tgrelid = 'public.launch_signups'::regclass and not t.tgisinternal order by t.tgname;`
  (The function body holds no secret; the hash just keeps the output short.)
- **AC4 — no data change (r1 #4).** Primary evidence: the reviewed migration file contains
  only the two `set` statements and the one `comment on table` statement, so it cannot change
  rows. Supporting evidence only: `select count(*) from public.launch_signups;` before and
  after. Equal counts support the claim; if the count changed (live sign-ups can arrive at
  any time), record the result as inconclusive. Do not open or inspect rows to explain it.
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
