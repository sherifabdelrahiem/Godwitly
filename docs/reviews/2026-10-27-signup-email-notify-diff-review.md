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

## Deploy and live verification (2026-10-27, PO-approved)

Setup: the PO created the Resend account and entered `RESEND_API_KEY`, `NOTIFY_TO` and `WEBHOOK_SECRET` in the dashboard. Claude then:
- deployed the function with `supabase functions deploy notify-signup`;
- applied `20261027150000_notify_signup_trigger.sql` with `supabase db push`. The dry run beforehand listed only this migration.

Secret values never entered chat or any command line. All checks compared SHA-256 digests only.

| Check | Result |
|---|---|
| AC2 — GET / POST without secret / POST with wrong secret / malformed body | 405 / 401 / 401 / 400. No email sent. A GET reaching the function (405, not a gateway 401) confirms `verify_jwt = false` is in effect. |
| Function probe with the correct secret (runbook step 5) | 200 `{"status":"sent"}`. The PO received the email. |
| AC5 — same id sent twice | 200 both times. The PO received **one** email. |
| Secrets | The `NOTIFY_TO` digest matches the intended address. The Vault `notify_signup_webhook_secret` digest equals the `WEBHOOK_SECRET` digest. |
| AC6 — `has_function_privilege(…, 'EXECUTE')` | `anon` false, `authenticated` false |
| Trigger | `notify_signup` exists and is enabled (`tgenabled = 'O'`). |
| AC1 (database path) — insert via the public REST API with the publishable key, as the form does | Insert 201. pg_net request 1 returned `status_code` 200 with no error. The PO received the alert. The test row `345ab52d-…` was deleted; 0 `@example.invalid` rows remain. |

## Still not verified

- **AC1 from the browser:** a real form submission on godwitly.pages.dev in EN and AR. The database path above is already proven.
- **AC3 (a)/(b):** the transaction-scoped fault-injection probes. Their design was reviewed statically and the exception block is in place, but they were not run.
- **AC4:** a deliberately wrong Resend key producing a 502 in `net._http_response`.
- **AC7:** the full history `git grep` with secret fragments (a working-tree grep was clean at review time).
- **AC8:** a visual check of the Edge Function logs.
- **TypeScript:** not type-checked locally, because Deno is not installed. The deployed function bundled and ran correctly.
