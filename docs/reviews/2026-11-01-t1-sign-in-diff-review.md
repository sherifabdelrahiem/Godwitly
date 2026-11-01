# Diff review: T1 Sign in with Google (#58)

- **Base:** `fd29aeb` (project check, released Required Lesson).
- **Reviewed commit:** `20b02d9` (commits `a0eaea5`, `063c288`, `20b02d9`).
- **Fixes made after the review:** `391c86a` (wording, live region, address helpers), `359cef2` (production gating, manifest/migration check, Referrer-Policy), `5ad49af` (check scoped to the foundation seed). The Codex loop below re-reviews them.
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
| P5 | CSP `connect-src` has no `'self'` | Deferred to T2 (adds the site's own endpoints). Applied on the agent's recommendation when the PO started the Codex loop; the PO has not answered the five questions one by one, so this is pending PO confirmation at merge. |
| P6 | SQL checks: no revoked-token or REST path for direct writes; "enrols in nothing" check is weak because no Enrolment table exists | Not changed. The tables have no grants for any client role, so a token does not matter; stronger check belongs with the Enrolment ticket. Pending PO. |
| P7 | No project check ties the migration's inserts to `courses/claude-beginners.js` | Fixed, `359cef2`; scoped to the foundation seed in `5ad49af` after Codex round 1 (P2) |
| P8 | Scope: `Referrer-Policy` and `nosniff` added for the course pages; `deploy-files.preview.txt` and explicit `deploy-files.txt` | `Referrer-Policy` dropped, `359cef2`. `nosniff` and the deploy lists kept (needed by the ticket rule); PO to confirm at merge. |
| P9 | Account strings and the draft privacy text are in `js/translations.js`, which production deploys; hub/Lesson 1 production pages carry hidden bar markup | Open, pending PO. Inert in production (the bar stays hidden and no account script loads there, `359cef2`), but the draft privacy wording is readable in the public `translations.js`. |
| P10 | **Verified:** on Cloudflare Pages a missing script returns the home page with status 200 (`curl` on production, 2026-11-01), so production pages would request `js/accounts-boot.js` and get HTML back | Fixed, `359cef2`: `js/course.js` loads the boot script only where `js/accounts-hosts.js` allows it (localhost and `*.godwitly.pages.dev`, never `godwitly.pages.dev`); tested in `tests/accounts-hosts.test.js`. Checked on localhost. Production behaviour still to confirm on the first production deploy. |
| P11 | Record sign-in is called once per page load on the first `SIGNED_IN`; a lost call is not retried; also fires on tab refocus (server rejects) | Not changed. Verified end to end (1 row recorded). Retry on failure is optional; pending PO. |

## Summary

- Standards: 10 findings. 6 fixed, 4 judgement calls pending PO. Worst: Arabic Enrolment wording (fixed).
- Spec: 11 findings. 1 fixed (live region); the rest open, deferred or pending PO. Worst: the privacy wording is unapproved (P1).
- No outcome here is recorded as "accepted by the PO": none has been given yet.

## Codex loop (Claude fixes, Codex reviews)

| Round | Reviewed | Result |
|---|---|---|
| 0 | `a0eaea5` | No P0. P1s (production exposure, missing Record sign-in/migration, failed sign-out reported as success) handled in `063c288` and `20b02d9`. |
| 1 | `359cef2` | `VERDICT: PASS`. No P0/P1. One P2 (manifest check read all migrations): fixed in `5ad49af`. `node --test` 194 passed, 1 sandbox EPERM (not a code failure; 195/195 locally). Codex could not reach GitHub, so spec and ticket were not re-read live. |
| 2 | `5ad49af` | pending |
