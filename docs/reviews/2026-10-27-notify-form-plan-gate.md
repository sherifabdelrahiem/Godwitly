## Claim-to-evidence ledger

| Claim | Result | Evidence |
|---|---|---|
| CTA button is the replacement point | Verified | `index.html:326-336` contains the heading, line, and existing button. |
| Existing i18n automatically covers form copy and states | Partial | `js/script.js:25-47` updates text, alt, aria-label, and meta content only. It has no placeholder or dynamic-state refresh mechanism. |
| Contact navigation integrates with existing scrolling | Partial | Desktop and mobile links are separate at `index.html:64-98`; scrolling requires an element ID and moves focus at `js/script.js:161-171`. The CTA currently has neither an ID nor `tabindex`. |
| RLS and grants permit insert but prohibit reads/updates/deletes | Supported | The revoke, column-level grant, and insert policy at plan lines 94-103 are correct PostgreSQL controls. |
| Column-only INSERT works with `Prefer: return=minimal` | Supported | PostgREST can insert using column privileges without SELECT when no representation is returned. This must still be integration-tested against the deployed project. |
| Duplicate `409` reveals nothing | Contradicted | The UI can hide it, but direct callers can distinguish `201` from `409`. |
| `400/422` reliably identifies field errors | Uncertain | PostgreSQL constraint failures normally map to `400`; `422` and exact error shape should not be assumed without deployed API tests. |
| `file://` and Pages both submit | Unverified | Hosted Supabase REST normally supports browser CORS, but `file://` sends `Origin: null`. D4-B would also require explicit function preflight handling, and Turnstile compatibility with `file://` is doubtful. |
| Inputs are bounded | Partial | Text length is bounded, but row count is not, and several constraints admit meaningless input. |

## Cross-system integration matrix

| Integration | Status | Required closure |
|---|---|---|
| Form entry point | Partial | Give the CTA/form section a stable ID and keyboard-focus target. |
| Desktop + mobile nav | Partial | Add the contact link to both existing nav blocks and test menu close/focus transfer. |
| Language switching | Gap | Re-render visible form errors/status after a language change; support translated placeholders or omit them. |
| `file://` origin | Risk | Test the real preflight with `Origin: null`; prefer a local HTTP server if Turnstile is selected. |
| Cloudflare Pages origin | Partial | Test OPTIONS and POST from the production/custom domain. D4-B must return correct CORS headers on success and error responses. |

## Recoverability matrix

| Failure | Planned behavior | Gap |
|---|---|---|
| Client validation | Preserve form and show field errors | Client/DB parity and language-switch behavior are unspecified. |
| Network failure or lost response | Preserve input and retry | Unique email makes an ambiguous committed insert retry-safe, but only while `409` is treated as success. |
| Duplicate | One row; UI shows success | Raw endpoint exposes `201` versus `409`. |
| Double submit | Disable button while sending | Verify the in-flight guard is set synchronously before `fetch` and always cleared in `finally`; test Enter and rapid clicks. |
| Unexpected `4xx`/`429` | Unspecified | Every non-success status needs a recoverable localized state. |

## Derived-value ownership

- Database constraints must remain authoritative; browser validation is only an early UX mirror. The plan needs shared test vectors to detect drift.
- Normalized email identity belongs in the database, including trimming and case normalization.
- `js/translations.js` should remain the sole copy source. `setLanguage()` must notify or invoke the form renderer so dynamic messages cannot retain the previous language.
- Consent wording/version is currently not recorded, so the stored boolean cannot establish which notice the visitor accepted.

## Findings

[P1] (confidence 10/10) docs/plans/2026-10-27-notify-me-form.md:45 — Mapping duplicate `409` responses to success does not prevent email-list enumeration through the public REST endpoint.  
Evidence: “A repeat submission shows the same ‘thank you’ message, so the form never reveals whether an email is already on the list”; “`409` (duplicate email) → same success”; “Email enumeration via duplicate error | 409 shown as success | Low”.  
Impact: An attacker can submit candidate addresses directly and distinguish existing entries by `409` versus `201`, revealing list membership regardless of the UI.  
Recommendation: Put insertion behind an Edge Function or narrowly scoped RPC that always returns the same external result for new and duplicate addresses. Do not expose the raw unique constraint through an anon table insert.  
Validation: Send raw requests for a new and existing email and confirm externally observable status, body, headers, and timing are equivalent.  
Owner/blocking: PO + database writer; blocking.

[P1] (confidence 10/10) docs/plans/2026-10-27-notify-me-form.md:46 — D4-A is not adequate for launch because its controls are entirely bypassable and allow unbounded public writes.  
Evidence: “Recommend A now, B as a follow-up if spam appears”; “Honeypot (client only) + DB limits”; “a script can call the REST API directly.”  
Impact: A script can fill the database with unique junk addresses, exhaust free-tier storage or quotas, and deny legitimate submissions. Field-size constraints do not limit request or row volume.  
Recommendation: Make D4-B the launch posture. Verify Turnstile server-side, enforce request limits and a global safety cap, then revoke direct `anon` INSERT so attackers cannot bypass the function. Keep server credentials only in function secrets.  
Validation: Raw REST insertion with the public key is denied; invalid/replayed Turnstile tokens fail; burst traffic is throttled; legitimate EN/AR submissions succeed.  
Owner/blocking: PO + backend writer; blocking.

[P2] (confidence 10/10) docs/plans/2026-10-27-notify-me-form.md:82 — Database constraints accept whitespace-only names/job titles and punctuation-only phone numbers.  
Evidence: `char_length(full_name) between 2 and 100`; `phone ~ '^\+?[0-9 ()-]{7,20}$'`; `char_length(job_title) between 2 and 100`.  
Impact: Inputs such as two spaces for a name or seven spaces for a phone pass the database boundary, weakening data quality and making automated spam cheaper.  
Recommendation: Validate trimmed non-empty name/title values, reject control characters, normalize email with trimming before uniqueness, and require a sensible count of phone digits after removing permitted formatting.  
Validation: Database tests must reject whitespace-only values, punctuation-only phones, Unicode/control-character abuse, and normalization-equivalent duplicate emails.  
Owner/blocking: Database writer; same-branch follow-up.

[P2] (confidence 9/10) docs/plans/2026-10-27-notify-me-form.md:117 — The response state machine omits several browser-visible HTTP failures and assumes unstable validation statuses.  
Evidence: “`400/422` → field error message · network failure/`5xx` → error message + Try again”.  
Impact: `401`, `403`, `404`, `429`, malformed responses, or unexpected `4xx` results may leave the form stuck, mislabel the problem, or silently discard recovery options.  
Recommendation: Define handling for every response: uniform accepted/duplicate result, client-validation errors, throttling, and a catch-all retryable failure; restore controls in `finally`. Treat server validation failures generically unless deployed error mapping is explicitly tested.  
Validation: Stub every status family, malformed JSON, timeout, offline mode, and a lost response after a committed insert.  
Owner/blocking: Front-end writer; same-branch follow-up.

[P2] (confidence 10/10) js/script.js:25 — Existing language switching cannot translate placeholders or refresh already-visible form state.  
Evidence: `document.querySelectorAll("[data-i18n]")…element.textContent = value`; the other supported attributes are only alt, aria-label, and content. The plan requires “every new label, placeholder, hint, error, success and button text in EN + AR.”  
Impact: Placeholders and sending/error/success messages can remain in English after switching to Arabic, or vice versa.  
Recommendation: Add an explicit form-render hook invoked by `setLanguage()`, or dispatch a language-change event. Extend attribute translation deliberately, and keep all copy keys in `translations.js`.  
Validation: Switch languages during idle, validation error, sending, network error, and success states; assert text, direction, focus, and announcements.  
Owner/blocking: Front-end writer; same-branch follow-up.

[P2] (confidence 9/10) index.html:327 — The recommended contact navigation has no specified anchor or focus target.  
Evidence: The CTA is currently `<section class="cta" aria-labelledby="cta-heading">`; the plan only says “Add nav link if D6 = yes.” Existing navigation logic requires `getElementById(id)` and calls `target.focus()`.  
Impact: The new link may do nothing, fail to close the mobile menu, or scroll without moving keyboard focus.  
Recommendation: Specify a stable section ID such as `contact`, add `tabindex="-1"`, and add the translated link to both desktop and mobile nav blocks.  
Validation: Activate both links by keyboard in EN/AR; confirm scroll position, focus destination, URL fragment, and mobile-menu closure.  
Owner/blocking: Front-end writer; same-branch follow-up.

[P2] (confidence 9/10) docs/plans/2026-10-27-notify-me-form.md:47 — The retention and consent plan is a policy statement without an enforceable operating mechanism.  
Evidence: “Keep data until launch + 12 months, then delete”; “manual delete documented in README”; the schema stores only `consent boolean`.  
Impact: Deletion can be forgotten, and the database cannot show which version of the consent/privacy wording a visitor accepted.  
Recommendation: Before release, approve the privacy notice and data-subject contact path; store a consent-notice version; assign the deletion owner and calendar date; document and test the deletion query. Automation may remain a P2 follow-up if the manual control is owned and scheduled.  
Validation: Verify a dated retention runbook, deletion dry run by `created_at`, and a row that records the approved notice version.  
Owner/blocking: PO for copy/policy; database writer for evidence. Must close before collecting PII, though automation may follow.

[P2] (confidence 9/10) docs/plans/2026-10-27-notify-me-form.md:150 — Verification does not prove the advertised column-grant boundary, and “empty/denied” is too permissive.  
Evidence: “anon select / update / delete blocked | Empty/denied”; there is no check for attempts to insert `id`, `created_at`, or unknown columns.  
Impact: A mistaken privilege grant could pass the checklist, and the security claim that visitors cannot set server-owned fields would remain untested.  
Recommendation: Require denial for forbidden operations, inspect effective table/column grants, and test inserts containing `id`, `created_at`, extra columns, and `Prefer: return=representation`. Verify row counts separately with an owner connection.  
Validation: Automated curl/SQL assertions against the deployed schema, including explicit response codes and post-request row state.  
Owner/blocking: Database writer; same-branch follow-up.

[P2] (confidence 8/10) docs/plans/2026-10-27-notify-me-form.md:157 — Cross-origin behavior is asserted without defining the required preflight or the D4-B local-development path.  
Evidence: “Works when opened locally (`file://`) and on Pages | Both submit successfully.”  
Impact: `file://` uses a null origin; an Edge Function must implement OPTIONS/CORS itself, and Turnstile hostname validation may make direct file execution unusable.  
Recommendation: Define allowed origins and OPTIONS behavior. Prefer `localhost` for local testing if D4-B is selected; do not weaken production CORS merely to accommodate `Origin: null`.  
Validation: Browser-level POSTs from localhost, the Pages preview URL, and the production domain; reject an unrelated origin.  
Owner/blocking: Backend/front-end writer; same-branch integration follow-up.

## Performance

NOT TRIGGERED. The intended user flow performs one bounded insert and no reads. Flood-driven quota exhaustion is covered as a security/availability issue, not a normal performance path.

## Coverage summary

- Reviewed: form entry, both navigation surfaces, language switching, RTL conventions, local/Pages origins, browser preflight, validation recovery, network retry, duplicate handling, double submission, SQL RLS, grants, `return=minimal`, constraint bypasses, abuse controls, key handling, consent, and retention.
- SQL verdict: the proposed revoke, column-level INSERT grant, insert policy, and `return=minimal` combination is structurally correct.
- Secret handling: committing only a Supabase publishable key and URL is acceptable; DB passwords and service-role/secret keys must remain outside the site and repository.
- Open D1-D7 decisions were not treated as failures merely because they remain open.
- Evidence limitation: no live Supabase project or browser runtime was inspected, so exact PostgREST status bodies and CORS behavior remain deployment validations.

FAIL — P0/P1 GAPS