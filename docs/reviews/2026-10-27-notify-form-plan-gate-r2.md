Round-1 disposition

- P1 duplicate enumeration — **CLOSED**: direct table access removed; function uses `ON CONFLICT DO NOTHING` and returns the same `202` contract (lines 33–48, 166–167).
- P1 bypassable flooding — **PARTIALLY CLOSED**: Turnstile and two limits are required, but their concurrency and client-IP foundations remain incomplete (lines 156–162).
- P2 weak input constraints — **CLOSED**: trimmed names/titles, normalized email, phone digit count, and control-character checks are specified (lines 117–130, 220).
- P2 incomplete response states — **PARTIALLY CLOSED**: status families and `finally` are covered, but retry can reuse an already-consumed Turnstile token (lines 183–189).
- P2 stale i18n state/placeholders — **CLOSED**: placeholders were removed and language changes re-render active form state (lines 89–90, 190–191).
- P2 missing contact focus target — **CLOSED**: `#contact`, `tabindex="-1"`, both nav links, and keyboard verification are specified (lines 177–181, 224).
- P2 unenforceable retention/consent — **CLOSED**: consent version, PO-owned deletion date, documented query, and dry run are specified (lines 70, 116, 193, 207–208, 228).
- P2 permissive grant verification — **CLOSED**: effective grants, all REST verbs, forbidden fields, and owner-side row checks are covered (lines 215–221).
- P2 undefined CORS/`file://` behavior — **PARTIALLY CLOSED**: D9 is clear, but wildcard-origin matching and complete preflight behavior remain underspecified (lines 74, 152–155, 189, 222, 227).

[P1] (confidence 10/10) docs/plans/2026-10-27-notify-me-form.md:159 — The claimed atomic per-IP increment and global cap have no executable transactional design.

Evidence: The migration defines only tables (lines 104–143), while the function promises an SQL upsert-increment and a separate `count(...) ≥ 300` check (lines 159–161). No SQL function/RPC, transaction, counter row, or lock is defined.  
Impact: A normal read/upsert implementation loses concurrent increments; concurrent requests can all observe the global count below 300 and then insert, defeating both launch abuse bounds.  
Recommendation: Define a narrowly granted SQL RPC that atomically increments the hourly bucket and conditionally reserves a daily global counter before insertion. Revoke its execution from `PUBLIC`, `anon`, and `authenticated`; call it only with the server client.  
Validation: Fire parallel requests at both thresholds and assert exactly five hourly admissions and at most 300 daily reservations, including across multiple function instances.  
Owner/blocking: Backend writer; blocking.

[P1] (confidence 9/10) docs/plans/2026-10-27-notify-me-form.md:156 — The security-sensitive client-IP source and trust rules are unspecified.

Evidence: The function sends “client IP” to Siteverify and hashes `ip`, but names no header, chain element, validation, trusted-proxy boundary, or missing-IP behavior (lines 156–162). Supabase’s current documentation does not establish a clear hosted Edge Function header contract; `X-Forwarded-For` is unsafe unless ingress behavior is known.  
Impact: Choosing a caller-spoofable value makes the five-per-hour limit bypassable; choosing an internal/shared proxy address can throttle unrelated visitors together.  
Recommendation: Obtain and document the hosted Supabase contract for the authoritative header, parse only valid IP literals, and fail closed or use a provider-backed limiter when it is absent. Add deployed spoofing probes before launch.  
Validation: Send forged and multi-valued forwarding headers through the deployed endpoint; verify they cannot change the bucket while two genuine clients receive distinct buckets.  
Owner/blocking: Backend writer + Supabase deployment owner; blocking.

[P2] (confidence 10/10) docs/plans/2026-10-27-notify-me-form.md:185 — Retry behavior conflicts with Turnstile’s single-use-token contract.

Evidence: Only `403` explicitly resets Turnstile (line 186); timeout, offline, malformed response, and lost response use “Try again” with retained input (lines 187–188). A request may redeem the token before its response is lost. Cloudflare confirms tokens are single-use and recommends resetting expired/used tokens; Siteverify also supports an idempotency key for safe verification retries. [Cloudflare Siteverify](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/)  
Impact: “Try again” can deterministically produce a verification failure instead of the promised successful duplicate-safe retry.  
Recommendation: Reset/re-execute Turnstile before every endpoint retry, and use one UUID `idempotency_key` for retries of the same Siteverify call inside a function invocation.  
Validation: Drop the client response after Siteverify and after the insert; each retry must obtain a fresh token and end in success with one row.  
Owner/blocking: Front-end and backend writers; same-branch follow-up.

[P2] (confidence 9/10) docs/plans/2026-10-27-notify-me-form.md:152 — The wildcard preview-origin contract is not precise enough for safe CORS implementation.

Evidence: `https://*.godwitly.pages.dev` is listed as an allowed origin, but `Access-Control-Allow-Origin` does not accept wildcard subdomain syntax; the plan specifies neither exact parsed-host matching, `Vary: Origin`, nor required allowed methods/headers. Supabase requires explicit preflight handling for browser invocation. [Supabase CORS guidance](https://supabase.com/docs/guides/functions/cors)  
Impact: A literal wildcard will fail, while naïve suffix matching can admit lookalike domains; incomplete preflight headers can break legitimate preview submissions.  
Recommendation: Parse `Origin`; require HTTPS and hostname equal to `godwitly.pages.dev` or ending in `.godwitly.pages.dev`, plus exact localhost matching. Echo the validated origin, set `Vary: Origin`, and specify `POST`, `OPTIONS`, and `Content-Type`.  
Validation: Test production, preview, localhost, `evilgodwitly.pages.dev`, `godwitly.pages.dev.evil.test`, non-HTTPS, `null`, absent origin, and preflight headers.  
Owner/blocking: Backend writer; same-branch follow-up.

[P2] (confidence 10/10) docs/plans/2026-10-27-notify-me-form.md:147 — Per-request cleanup is not supported by the stated index.

Evidence: Cleanup filters rows by age, but the primary key is `(ip_hash, window_start)` (lines 133–138); `window_start` is not the leading index column. The plan nevertheless calls cleanup “bounded, indexed” (lines 145–147).  
Impact: Cleanup must scan the rate-limit table and delete old rows during user requests, causing growing latency, write amplification, and contention under distributed traffic.  
Recommendation: Add an index on `window_start` and run bounded batches, or move retention cleanup to scheduled `pg_cron`; do not perform an unbounded delete on every submission.  
Validation: Populate representative stale/current buckets, run `EXPLAIN (ANALYZE, BUFFERS)`, and verify bounded indexed deletion without delaying submission transactions.  
Owner/blocking: Backend writer; same-branch follow-up.

Coverage summary: All nine round-1 findings rechecked. SQL regexes, normalized-email uniqueness, deny-all RLS/revokes, service-role bypass, `verify_jwt=false`, hostname/replay checks, identical response shape, state/i18n integration, and D9 behavior reviewed. The SQL constraints are valid PostgreSQL constructs; the blocking gaps are the concurrency-safe limiter/cap and trustworthy client-IP derivation.

FAIL — P0/P1 GAPS