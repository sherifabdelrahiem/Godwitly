# Codex plan gate — signup email notify (round 1)

> Reviewer: Codex (GPT-5.6 Sol), read-only · Plan: `docs/plans/2026-10-27-signup-email-notify.md` v1 · 2026-10-27

**Verdict: FAIL** (3×P1, 5×P2, 2×P3)

1. [P1] Trigger can still abort the insert: Vault read, JSON build and `net.http_post` enqueue run synchronously; only a missing secret is handled. Fix: catch-all exception block, always `return NEW`; tests that break Vault lookup and enqueue.
2. [P1] Goal says "every row → one email" but design is lossy (pg_net unlogged queue, ~6 h response retention, no retry) and replays can duplicate. Fix: call it best-effort, or build durable delivery; use a Resend `Idempotency-Key` from the row id.
3. [P1] Privacy/retention: consent covers "contacted about launch" only; plan copies all personal fields to Resend (30-day retention on free plan) and the mailbox; README deletion covers only the table. Fix: minimise the email payload (ideally row id / dashboard link), document processors, retention and deletion, PO approval.
4. [P2] Secret sits in `net.http_request_queue` headers until delivered; Resend keeps its own logs, so "no personal data in logs" is not system-wide. Fix: threat-model every copy; name exact log stores in AC6.
5. [P2] Observability is transient; no alert or reconciliation. Fix: capture request id, document monitoring query, or state best-effort explicitly.
6. [P2] Same secret in Edge secrets and Vault with no safe rotation/rollback order. Fix: setup + rotation runbook (`vault.update_secret`), entropy/generation guidance, post-change probe.
7. [P2] E9 is wrong: rotating `WEBHOOK_SECRET` does not stop junk sign-ups (trigger reads the new secret). Fix: disable trigger / CAPTCHA / quota monitoring as the response.
8. [P2] Verification can't prove ACs: breaking the Resend key only tests post-enqueue failure; 201 doesn't prove the request was attempted; AC7 untested; `git grep` limited. Fix: exact SQL/API probes with expected results; disruptive tests in staging/local or an approved window.
9. [P3] Plain text still auto-links URLs/phones; attacker-controlled subject and `reply_to`. Fix: keep visitor data out of the subject, label fields untrusted, drop or flag `reply_to`.
10. [P3] Resend test sender only delivers to the account owner's address — make recipient eligibility a pre-deploy gate; custom domain is a separate change.

---

# Round 2 (plan v2)

**Verdict: FAIL.** Round-1 items #2, #3, #5, #6, #7, #9 and #10 are resolved. #4 is accepted with a rationale. #1 and #8 are still open, because the tests don't prove that enqueue exceptions are contained and the AC4 correlation is unspecified.

New findings:
1. [P1] The trigger → function request is underspecified: it doesn't give the URL, Content-Type, the `x-webhook-secret` header, the timeout, or what happens to the request id.
2. [P1] The runbook passes secrets as CLI arguments (`supabase secrets set KEY=…`), which leaves them in shell history and process listings. Fix: set them in the dashboard, or with a git-ignored `--env-file`.
3. [P2] The plan doesn't say how a Resend failure is handled. Fix: count only a 2xx as success; otherwise log the id and status and return a sanitized 502; check AC4 through `net._http_response`.
4. [P2] Idempotency only holds for 24 h at Resend. Fix: say so in the wording and in AC5.
5. [P2] AC1 ("exactly one alert") contradicts the best-effort goal. Fix: require it only when every service is healthy, and add a separate failure assertion.

---

# Round 3 (plan v3)

**Verdict: FAIL, with no P1 left.** The design is sound: the `net.http_post` call, the Vault lookup and the exception isolation are all correct. Round-2 #1 to #5 are resolved. Round-1 #1 and #8 are only partly closed, because AC3(b) can't run on hosted Supabase.

New findings, all P2:
1. AC3(b) can't run: `postgres` doesn't own `net.http_post`, so it can't rename it. Fix: inside `begin … rollback`, `create or replace` the project's trigger function with a forced `raise exception` at the enqueue point, insert a row, check it, then roll back.
2. The test plan says "rename the Vault secret" while AC3(a) says "delete" it. The plan also doesn't say where to see the WARNING. Fix: use one `DELETE … RETURNING` probe and read the warning in the Postgres logs.
3. The runbook clears the clipboard before the probe needs the secret, and `curl -H` puts the secret in curl's process arguments. Fix: probe with the dashboard's Edge Function tester while the secret is still on the clipboard.
4. E8's "join" can't work, because the row is a uuid and the request id is a bigint. Fix: two correlated checks, failed `_http_response` rows first, then the `RAISE LOG` line.
