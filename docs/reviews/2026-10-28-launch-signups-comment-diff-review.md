# Diff review — `launch_signups` table comment (#7)

> Reviewer: Claude (Opus 5.5), two parallel review agents (Standards, Spec) via `code-review`
> · Builder: Claude (Opus 5.5) · Plan: `docs/plans/2026-10-28-launch-signups-comment.md` v3
> (approved; Codex gate r1, r2 PASS) · Issue: #7 · 2026-10-28

## Round 1: APPROVED (one small fix applied)

### Standards

- No hard violations against `AGENTS.md`, `README.md`, `GLOSSARY.md` or the existing
  migrations.
- Filename and timestamp follow the existing pattern and sort after
  `20261027150000_notify_signup_trigger.sql`. The applied migration
  `20261027120000_launch_signups.sql` is untouched.
- No secrets and no personal data. The comment text uses the glossary term and no avoided
  words.
- Judgement calls, accepted: the header cites the issue number (no earlier migration does);
  the two `set` timeouts are new in this repo but are justified in plan C2/C5 and accepted by
  the Codex gate; round 2 of the gate is appended to the round-1 file rather than a separate
  `-r2` file.
- **Fixed:** the gate report title said "(round 1)" though it holds both rounds.
- v3 only changed AC4 after the r2 PASS and was not gated again; `AGENTS.md` does not require
  a new round for that, and the change removes a step rather than adding one.

### Spec

- C1–C4 met exactly: filename, statement order, header comment, no `begin`/`commit`, applied
  migration untouched.
- SQL compared byte by byte with C2: straight ASCII quotes, schema-qualified table, exact text
  `Launch sign-ups from the Godwitly landing page.`, trailing newline.
- The file holds only two session `set` statements and one `comment on table`: no data
  change, grant, RLS, policy, trigger or function statement (C6; primary evidence for AC4).
- No scope creep.

### Not run yet

- No local database test: Docker is installed but not running and no Postgres image is
  present; downloading one needs PO approval. Codex confirmed the SQL is valid PostgreSQL, and
  the dry run (step 5) is a further check before anything applies.
- Steps 3–7 and AC1–AC6 ran against the live database after merge; see below.

### Follow-up noted (out of scope)

- `README.md`'s Supabase file table lists only the first migration; it doesn't list the
  trigger migration or this one.

## Live application (2026-10-28, each step PO-approved)

Run by Claude with the Supabase CLI (v2.121.0) against the linked project
`ijpvbxglhxktnkabjdif`. Probes used `supabase db query --linked` (Management API), the same
way before and after, so the outputs compare directly. All probes were `select`s.

1. **Before probes** (AC1–AC4): recorded; AC1 read
   `Waitlist sign-ups from the Godwitly landing page contact form.` (kept for C8 rollback).
2. **`supabase migration list`:** `20261027120000` and `20261027150000` on both sides;
   only `20261028120000` local-only. As expected.
3. **`supabase db push --dry-run`:** would push only
   `20261028120000_launch_signups_comment.sql`; no seeds, no roles. As expected.
4. **`supabase db push`:** applied `20261028120000_launch_signups_comment.sql`; finished
   without errors (no lock timeout).
5. **After probes:**

| Check | Result |
|---|---|
| AC1 comment | **Changed** to `Launch sign-ups from the Godwitly landing page.` |
| AC2 table ACL, RLS flags | Identical (`postgres`, `service_role` full; RLS on; forced RLS off) |
| AC2 column ACLs | Identical (`anon` insert-only on the 7 form columns) |
| AC2 policies | Identical ("Visitors can sign up", PERMISSIVE, INSERT, `anon`) |
| AC3 trigger + function | Identical (`notify_signup`, enabled, AFTER INSERT; function md5 `7b629f1d2ce07f0579ef49712d84bd02`) |
| AC4 row count | Identical (3) |
| AC5 history | `20261028120000` now on local and remote |

AC6 (live test sign-up) was not run: optional, and the migration touches no path the form
uses, as AC2 and AC3 confirm.

The CLI printed "Initialising login role..." before each connection; that is its own
temporary login, not a change to the table.

Issue #7 closed.
