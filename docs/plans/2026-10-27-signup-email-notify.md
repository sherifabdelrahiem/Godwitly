# Plan — Email the PO when someone submits "Get notified"

> Status: **APPROVED v4** by PO · 2026-10-27 (Codex gate r3: no P1; r3 P2s fixed in v4)
> Branch: `feat/signup-email-notify` (stacked on `docs/agents-md`, PR #2) → PR → merge to `main`
> Built with `sonny-delegate`: Claude plans/reviews, Codex (GPT-5.6 Sol) builds.

```text
LANE: Critical — new server-side component with secrets, triggered by inserts of personal data.
```

## History

- **v1:** the email carried all the sign-up fields. **Gate r1: FAIL** (3×P1, 5×P2, 2×P3). The report is in `docs/reviews/2026-10-27-signup-email-notify-plan-gate.md`.
- **v2:** on 2026-10-27 the PO chose an **alert-only** email that carries no personal data. This removes the privacy findings (r1 #3, the personal-data part of #4, and #9). The other findings are addressed below.
- **v3:** fixes the gate r2 findings. It specifies the exact request, sets secrets through the dashboard only, defines Resend failure handling, gives the 24 h idempotency window, makes AC1 conditional, and adds transaction-scoped fault-injection probes (r1 #1, #8).
- **v4:** fixes the gate r3 P2 findings (r3 had no P1). AC3(b) now overrides the trigger function inside a transaction. The Vault probe is the same everywhere. Warnings are read in the Postgres logs. The secret probe uses the dashboard tester. Monitoring is two correlated checks, not a join.

## Goal

When a row is added to `public.launch_signups`, send the PO a **best-effort** alert email:
"New Godwitly sign-up", the time, and a link to the Supabase Table Editor. No visitor data
leaves Supabase. The PO reads the details in the dashboard, as today. A lost alert is
acceptable, because the row is always in the table, which remains the source of truth (r1 #2).
The visitor-facing form, its validation and its responses do not change.

## Decisions

| # | Decision |
|---|---|
| E1 | An `AFTER INSERT FOR EACH ROW` trigger `notify_signup` on `launch_signups` calls `net.http_post`, which pg_net sends after commit. The call is `url := 'https://ijpvbxglhxktnkabjdif.supabase.co/functions/v1/notify-signup'`, `headers := jsonb_build_object('Content-Type', 'application/json', 'x-webhook-secret', <vault secret>)`, `body := jsonb_build_object('id', NEW.id, 'created_at', NEW.created_at)`, `timeout_milliseconds := 5000`. The returned request id goes into `RAISE LOG 'notify-signup queued: request %, row %'`, so it can be correlated with `net._http_response` (r2 #1). The secret is read with `select decrypted_secret from vault.decrypted_secrets where name = 'notify_signup_webhook_secret' limit 1`. |
| E2 | **The insert can never fail because of the alert (r1 #1).** The trigger function body is one `BEGIN … EXCEPTION WHEN OTHERS THEN RAISE WARNING 'notify-signup skipped: %', SQLSTATE; END;` block. It covers the Vault lookup, the JSON build and the enqueue. A missing or empty secret is turned into an explicit `RAISE EXCEPTION` inside the block, so a bad configuration can't quietly send an unauthenticated call. The function always `RETURN NEW`. The warning includes only the SQLSTATE, never row data or secrets. |
| E3 | **The payload holds no personal data:** `{ "id": <uuid>, "created_at": <timestamptz> }` only. So the pg_net queue, the Edge logs and Resend never see visitor fields (r1 #3, #4). |
| E4 | Edge Function (Deno, no npm packages). It accepts POST only (405 otherwise) and requires header `x-webhook-secret` equal to the `WEBHOOK_SECRET` env (constant-time compare, 401 otherwise). It checks that `id` is a UUID and `created_at` is a parseable date (400 otherwise). It then calls the Resend API with header `Idempotency-Key: signup-<id>`. Resend suppresses identical replays for 24 hours. A replay after that window may send a second alert, which is an accepted best-effort limit (r1 #2, r2 #4). Only a Resend 2xx counts as success, which returns 200. Any other Resend status, or a network error, returns a sanitized `502 {"error":"send_failed"}` (r2 #3). Its logs hold only the row id, the outcome and the HTTP status, never request bodies or response bodies. |
| E5 | Email: from `Godwitly <onboarding@resend.dev>`, to the `NOTIFY_TO` env (not committed). Subject is the fixed text `New Godwitly sign-up`, with no visitor data (r1 #9). Plain-text body: the time (UTC), the row id and the dashboard link `https://supabase.com/dashboard/project/ijpvbxglhxktnkabjdif/editor`. No `reply_to`. |
| E6 | The function runs with `verify_jwt = false`, because the shared secret is its only authentication. The secret is generated with `openssl rand -hex 32 | pbcopy` (256 bits, straight to the clipboard, never printed). It is set **only through the Supabase dashboard**, never as a CLI argument, so it stays out of shell history (r2 #2). It is never pasted into chat, briefs, commits or review files. It is stored as the Edge secret `WEBHOOK_SECRET` and as the Vault secret `notify_signup_webhook_secret`. Accepted: the secret also sits in `net.http_request_queue` until it is delivered, and only database login roles (the PO) can read it (r1 #4). |
| E7 | The trigger function is `security definer`, `set search_path = ''`, uses fully qualified names, and has `revoke execute … from public, anon, authenticated`. |
| E8 | **Monitoring is best-effort (r1 #5).** The README gives two correlated checks. (1) Query recent `net._http_response` rows where `status_code` is not 200 or `error_msg` is set. These are kept for about 6 hours and have a numeric request id. (2) Search the Postgres logs for `notify-signup queued: request <id>` to find the row uuid. A request id is a bigint and a row id is a uuid, so they can't be joined in SQL (r3 #4). The README also gives the reconciliation rule: "the table is the truth; check the dashboard weekly". There are no alerts. |
| E9 | **Spam response (r1 #7):** junk rows produce junk alerts, up to the Resend cap of 100 a day. Response: `alter table public.launch_signups disable trigger notify_signup;`, delete the junk rows, and consider Turnstile as a separate change. Rotating the secret is *not* a spam fix. |
| E10 | **Release gate (r1 #10):** the Resend account must be owned by the `NOTIFY_TO` address, because the test sender only delivers there. Moving to a custom domain is a separate, approved change. |

## Files

- `supabase/functions/notify-signup/index.ts`: the function described in E4 and E5.
- `supabase/config.toml`: add `[functions.notify-signup]` with `verify_jwt = false`.
- `supabase/migrations/<ts>_notify_signup_trigger.sql`:
  - `create extension if not exists pg_net with schema extensions;`
  - the trigger function described in E2, E3 and E7, and the trigger `notify_signup`;
  - no secret values.
- `README.md`: a new "Email alerts" section covering:
  - what is sent (no personal data) and where the secrets live;
  - the setup and rotation runbook (below);
  - the monitoring query (E8) and the spam response (E9);
  - how to turn alerts off and back on.
- Front-end: **no changes**.

## Setup runbook (PO only, with approval — never Codex)

1. Create a Resend account using the `NOTIFY_TO` address, then create an API key.
2. `supabase functions deploy notify-signup`. This command contains no secrets.
3. Dashboard → Edge Functions → Secrets: add `RESEND_API_KEY`, `NOTIFY_TO`, and `WEBHOOK_SECRET`. Generate `WEBHOOK_SECRET` with `openssl rand -hex 32 | pbcopy` and paste it.
4. Dashboard → Integrations → Vault: add the secret `notify_signup_webhook_secret` with the same value.
5. While the secret is still on the clipboard, probe the function with the dashboard's Edge Function tester: Edge Functions → notify-signup → Test. Send a POST with header `x-webhook-secret` and body `{"id":"<any uuid>","created_at":"<now>"}`. Expect 200 and one email. Then clear the clipboard (`pbcopy < /dev/null`). The secret never goes into a terminal command (r3 #3). If the probe fails, stop here: the trigger doesn't exist yet, so nothing is affected.
6. `supabase db push` (creates the trigger).

**Rotation:** first disable the trigger. Generate a new value. Update it in both the Edge Functions secrets and Vault, using the dashboard. Repeat the probe from step 5, then re-enable the trigger. **Rollback:** keep the trigger disabled until the two values match.

## Acceptance criteria

1. While Vault, pg_net, the function and Resend are all healthy: a real form submission in EN and in AR shows the same success state as before, and exactly one alert arrives with a fixed subject and no visitor data (r2 #5).
2. Calling the function without the secret or with a wrong secret → 401. A GET → 405. A bad body → 400. None of these sends an email.
3. When anything in the alert path fails at trigger time, the insert still commits and the visitor still sees success. This is proven by two fault-injection probes, each run inside `begin; … rollback;` (as `postgres`, in the SQL editor), so that nothing persists:
   (a) delete the Vault secret row inside the transaction, insert a row, and confirm the row is visible and a WARNING was raised;
   (b) inside the transaction, `create or replace` the project's trigger function with the production body copied word for word, except that a `raise exception 'probe'` replaces the `net.http_post` call. `postgres` cannot alter `net.http_post`, because it doesn't own it (r3 #1). Insert a row, confirm it is visible, then roll back.
   For both probes: (a) uses `delete from vault.secrets where name = 'notify_signup_webhook_secret' returning id`, after first checking that `postgres` has that privilege. Look for the `notify-signup skipped` WARNING in Dashboard → Logs → Postgres, not in the SQL editor output (r3 #2). The exact SQL goes into the diff review file (r1 #1, #8).
4. When Resend rejects the send (the `RESEND_API_KEY` is wrong), the insert still commits and the logged request id has a `net._http_response` row with `status_code = 502`. Restore order: put the correct key back, then repeat the AC1 check (r1 #8, r2 #3).
5. Sending two identical requests with the same id within 24 h produces one email (idempotency key).
6. `anon` and `authenticated` lack EXECUTE on the trigger function. Check with `has_function_privilege`.
7. The repo (`git grep` over the working tree and the branch history) contains no secret and no recipient address.
8. The Edge Function logs, viewed in the Supabase dashboard (Edge Functions → notify-signup → Logs), contain no request bodies.

## Test plan

- No local Deno or test framework exists, and adding one needs PO approval, so there are no automated tests. Codex writes exact manual probes into the diff review file:
  - `curl` commands for AC2, using only missing or wrong secrets; for AC5, use the dashboard tester, so the real secret never goes into a command;
  - SQL for AC3 (the two `begin … rollback` probes above), AC4 and AC6 (`has_function_privilege` queries);
  - the `git grep` commands for AC7.
- Claude reviews the code statically before deploy: the exception block, the payload fields and the log statements.
- After the PO-approved deploy, the PO and Claude run the probes, submit the form in EN and AR, check the inbox and the logs, and delete the test rows. The AC3 and AC4 breakage tests happen in a short window approved by the PO, and each is undone straight away.

## Release

Commit on the branch → push → PR → the PO merges. The setup runbook and deploys run only with PO approval.
