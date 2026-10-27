# Diff review — signup email alert

> Reviewer: Claude (Opus 5.5) · Builder: Codex (GPT-5.6 Sol) via `sonny-delegate` · Plan: v4 (approved) · 2026-10-27

## Round 1: CHANGES REQUIRED

Static review of `supabase/functions/notify-signup/index.ts`, `supabase/migrations/20261027150000_notify_signup_trigger.sql`, `supabase/config.toml`, `README.md` and the test-steps file, against plan v4.

What was checked and found correct:
- **E1:** the URL, headers, body (`id` and `created_at` only), the 5 s timeout, and the `RAISE LOG` with the request id.
- **E2:** the Vault read, the missing-secret check and the enqueue all sit inside one `EXCEPTION WHEN OTHERS` block. The warning includes only the SQLSTATE, and the function always `RETURN NEW`.
- **E4:** POST-only (405), checked before auth. The secret is compared in constant time over SHA-256 digests, and a missing env var gives 401. A bad body or bad UUID/date gives 400. The `Idempotency-Key` is `signup-<id>`. Only `response.ok` counts as success; anything else returns a sanitized 502. Logs hold only the row id and the status.
- **E5:** the subject is fixed, the body is plain text with only the time, id and dashboard link, and there is no `reply_to`.
- **E7:** `security definer` and `search_path = ''`, and EXECUTE is revoked from `public`, `anon` and `authenticated`. Inserts by `anon` are unaffected, because PostgreSQL does not check EXECUTE when a trigger fires.
- **The front-end** is unchanged.

Findings:
1. [P3] The test steps never deleted the committed AC1 and AC4 test rows. **Resolved:** Codex added a "Clean up" section with the delete SQL and a select to confirm.
2. [P3] The `AGENTS.md` project structure lacked `supabase/functions/` and the trigger. **Resolved:** Codex updated both lines.

## Round 2: APPROVED

Both fixes were verified in the diff. `git grep` finds no recipient address and no Resend-style key in the working tree.

## Not yet verified (needs PO-approved deploy)

AC1–AC8 at runtime: the function has not been deployed or run, the migration has not been applied, and no email has been sent. Deno is not installed locally, so the TypeScript has not been type-checked or run. Run `docs/reviews/2026-10-27-signup-email-notify-test-steps.md` after deploy.
