# Diff review: T1 Sign in with Google (#58)

- **Base:** `fd29aeb` (project check, released Required Lesson).
- **Reviewed commit:** `20b02d9` (commits `a0eaea5`, `063c288`, `20b02d9`).
- **Fixes made after the review:** `391c86a`. These need their own review before merge (AGENTS.md, Workflow, Diff review, step 4).
- **Spec:** #56, version v5, sha256 `cf3693461f6199577ac855b16d1994a49cd872888b9cac74ddaf4c9dc0945878` (recomputed from the live Issue before building; matched the approval record).
- **Reviewers:** two `code-review` sub-agents (Standards, Spec), read-only; plus an earlier Codex review of `a0eaea5` (findings handled in `063c288`).
- **TDD:** applicable to `js/accounts.js` (15+ tests, `tests/accounts.test.js`) and the project checks. Not applicable to CSS, the privacy wording, `_headers` and the migration (SQL checks and browser checks instead).
- **Checks run:** `node --test` 191/191 at `391c86a`. SQL checks C1-C9 (`supabase/accounts/checks/`) passed against `godwitly-accounts` and rolled back. Browser (Chrome, localhost:8000): sign-in, name in `<bdi>` (EN, AR), Lesson 1 shares the session, Record sign-in recorded 1 row, sign-out removed the session, refresh tokens and the accounts keys only, error return from Google, privacy page, mobile menu, 320px no overflow.
- **Not verified:** the CSP as served by Cloudflare (the local server ignores `_headers`); production behaviour of the new pages; `file://` in a browser (unit test only); a revoked-token REST call.

## Standards

| # | Finding | Outcome |
|---|---|---|
| S1 | Hard: Arabic uses التسجيل/تسجّل for Enrolment (GLOSSARY says الالتحاق; avoid التسجيل) in `account.notice` and four privacy keys | Fixed, `391c86a` |
| S2 | Hard: hub/Lesson 1 English fallback for `account.notice` differed from the key | Fixed, `391c86a` |
| S3 | Privacy page fallbacks were placeholders ("intro", "who") | Fixed, `391c86a` (real English text; title key text; spacing) |
| S4 | `privacy.draft` fallback had `<strong>` that translation removed | Fixed, `391c86a` |
| S5 | Duplicated sign-in code vs `js/dashboard.js`; `OAUTH_PARAMS` differ | Accepted as documented (spec #56: dashboard unchanged), pending PO. Now covered by tests of the new helpers. |
| S6 | Address helpers untestable inside the DOM-bound IIFE | Fixed, `391c86a` (`readOAuthError`, `cleanOAuthAddress` in `js/accounts.js`, tested) |
| S7 | `message` holds a translation key name; NOTES map in `account-bar.js` | Not changed; judgement call, pending PO |
| S8 | Section-number comment reused from `course.js` | Fixed, `391c86a` |
| S9 | Same file list in four places (ACCOUNT_MATERIAL, preview list, AGENTS.md prose, boot loader) | Not changed; a test cross-checks the first two. Pending PO. |
| S10 | Language-switch listener order depends on `course.js` | Not changed; judgement call, pending PO |

## Spec

| # | Finding | Outcome |
|---|---|---|
| P1 | Privacy page wording not approved; placeholders (operator, legal basis, rights, vendor log periods); notice version `draft-1` | **Open, blocks the last acceptance criterion.** Needs the PO and counsel. |
| P2 | Sign-out does not blank other tabs on `pageshow`/visibility | Deferred to the ticket that adds protected content and the gate (spec "Browser behaviour"); pending PO. supabase-js already signs other tabs out. |
| P3 | Sign-out takes no Web Lock; no sign-in generation | Deferred to the cookie-exchange/gate ticket (T2); pending PO |
| P4 | Live region sat inside the hidden bar; errors not announced; "signed in" announced on every load | Fixed, `391c86a`. A regression I introduced while fixing it (script looked for the region inside the bar) was caught in the browser and fixed in the same commit. |
| P5 | CSP `connect-src` has no `'self'` | Not changed; T2 adds the site's own endpoints. Pending PO. |
| P6 | SQL checks: no revoked-token or REST path for direct writes; "enrols in nothing" check is weak because no Enrolment table exists | Not changed. The tables have no grants for any client role, so a token does not matter; stronger check belongs with the Enrolment ticket. Pending PO. |
| P7 | No project check ties the migration's inserts to `courses/claude-beginners.js` | Open; proposed follow-up check. Pending PO. |
| P8 | Scope: `Referrer-Policy` and `nosniff` added for the course pages; `deploy-files.preview.txt` and explicit `deploy-files.txt` | Pending PO (recommend dropping `Referrer-Policy`, keeping the deploy lists as the ticket rule needs them) |
| P9 | Account strings and the draft privacy text are in `js/translations.js`, which production deploys; hub/Lesson 1 production pages carry hidden bar markup | Open. Pending PO. |
| P10 | **Verified:** on Cloudflare Pages a missing script returns the home page with status 200 (`curl` on production, 2026-11-01), so production pages would request `js/accounts-boot.js` and get HTML back (a console error; `nosniff` makes the browser refuse it) | **Open, needs a PO decision** (options in the report to the PO). |
| P11 | Record sign-in is called once per page load on the first `SIGNED_IN`; a lost call is not retried; also fires on tab refocus (server rejects) | Not changed. Verified end to end (1 row recorded). Retry on failure is optional; pending PO. |

## Summary

- Standards: 10 findings. 6 fixed, 4 judgement calls pending PO. Worst: Arabic Enrolment wording (fixed).
- Spec: 11 findings. 1 fixed (live region); the rest open, deferred or pending PO. Worst: the privacy wording is unapproved (P1).
- No outcome here is recorded as "accepted by the PO": none has been given yet.
