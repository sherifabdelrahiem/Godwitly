# Diff review — README lists all Supabase files (#22)

> Reviewer: Claude (Opus 5.5), self-review · Builder: Claude (Opus 5.5) · Plan:
> `docs/plans/2026-10-28-readme-supabase-files.md` (approved) · 2026-10-28

Self-review: documentation only, so no second-model review was run.

## Round 1: APPROVED

- **Coverage:** `ls supabase/migrations supabase/functions/*` lists three migrations and one
  function file; all four now appear in the README table (the first was already there).
- **Accuracy:** each description was checked against the file. The trigger migration's header
  says "Best-effort owner alert after a 'Get notified' sign-up"; the comment migration sets
  exactly "Launch sign-ups from the Godwitly landing page."; the Edge Function sends the
  alert-only email described in the README's "Email alerts" section and ADR 0004.
- **Vocabulary:** uses Launch sign-up and Sign-up alert; no avoided words.
- **Style:** same `…_name.sql` shorthand and plain one-line descriptions as the existing row.
- Only `README.md` and the plan/review files change.

Not run: no tests or lint exist in this repo.
