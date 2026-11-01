# T2a diff review: the gate, locked page, Enrol and Can-open (ticket #59, T2a)

- **Base:** `8221205` (main). **Reviewed commit:** `5b2250e` (feat/t2a-gate, 6 commits).
- **Spec:** #56 **v5**, sha256 `cf3693461f6199577ac855b16d1994a49cd872888b9cac74ddaf4c9dc0945878`
  (recomputed 2026-11-01, equals the approval record of 2026-11-01 11:41 and the ticket's pin).
- **Lane:** Critical (backend and access control). **Scope:** T2a only. T2b (cookie exchange,
  `/account/whoami`, logout, same-origin Web Lock, blanking personal content on `pageshow`) is not in this diff.
- **TDD:** applied at seam 1 (`tests/gate.test.js`, fake request, file store and fetch) and for
  `enrol()` in `tests/accounts.test.js`. The gate tests were written in two batches after the first
  slice, not one test per implementation step. Not applicable: SQL (checks in
  `supabase/accounts/checks/`), the locked page's layout and wording (browser checks).

## Evidence

| Check | Result |
|---|---|
| `node --test` (whole suite) | 217 pass, 0 fail |
| SQL checks `t2_enrol_can_open_checks.sql` (one rolled-back transaction, live `godwitly-accounts`) | "all T2 SQL checks passed"; afterwards no leftover test users or courses |
| Migration `20261101180000_enrol_and_can_open.sql` | applied to `godwitly-accounts` (ref `otjvjshvwwljsdwyqoxk`) with PO approval, 2026-11-01 |
| Local Functions run (`wrangler pages dev`) | found a real bypass: `/Test-Course/Lesson-2/` returned the protected text, because routes match case-sensitively and files were served case-insensitively. Fixed in `a95d324` (everything is routed to the gate except named public paths) |
| Bypass matrix on the preview alias and on the old deployment address (`c37c0c72.godwitly.pages.dev`) | 22 spellings each; every protected spelling gave 403, no response held the test sentinels; `/account/locked/` and unreleased Lessons gave 404; hub, Preview Lesson, home, `crash-course/` and `lesson-1` gave 200 |
| Gate headers on a gate response | CSP, `private, no-store`, `noindex`, `no-referrer`, `nosniff` present |
| Production unaffected | `godwitly.pages.dev/test-course/lesson-2/` returns only the home-page fallback (no sentinel); Functions deployed to the `preview` branch only |
| Locked page, browser | English and Arabic checked from the local build (desktop). The 320px width could not be forced in this browser window, so it is **not** checked; do it before merge |

Not yet done (open ticket criteria, to finish with T2b or before merge): the Pages "fail closed"
setting with a screenshot (PO), "an enrolled account opens the Lesson" and "two tabs switching accounts"
(need the cookie exchange of T2b), and re-running the bypass matrix on the final deployed commit.

## Codex gate loop (read-only)

- Round 1 on `a95d324`: no P0/P1, VERDICT: PASS. Five P2s, all fixed in `67a71b2` (see below).
- Round 2 on the delta since `a95d324`: see "Round 2" at the end of this file.

## Standards axis

| # | Finding | Outcome |
|---|---|---|
| S1 | AGENTS.md still described the old route list ("nothing excluded") | fixed, `5b2250e` |
| S2 | Locked page had two `aria-live` regions | fixed, `5b2250e` |
| S3 | Gate fallback and error bodies are plain text in code, not in `js/translations.js` | pending PO acceptance: they are server error bodies that cannot load `translations.js`; the bilingual locked page itself is in translations |
| S4 | Duplicated header and footer markup in `account/locked/index.html`; accounts URL and key repeated in `gate.mjs`, `csp.mjs`, `_headers`, `accounts-config.js`; CSP text in two places | judgement call, pending PO acceptance. No build step (ADR-0001); the CSP copies are compared by a project check |
| S5 | Smells: bare string states in `gate.mjs`, a repeated header loop, `inCourseFolder` flag, unused `rest` for account paths | judgement call, left as is |
| S6 | ADR-0010 safeguards not in the diff (fail-closed, bypass matrix, old deployments) | matrix done (above); fail-closed pending PO; deleting old deployments applies after a security fix to the gate: the deployments before `a95d324` were never public with a bypass beyond the preview, and are to be listed and deleted after the final deploy |

## Spec axis

| # | Finding | Outcome |
|---|---|---|
| P1 | The locked page shows the Lesson number and the public summary, not the Lesson title (story 19) | accepted for T2a, pending PO: the test Crash course has no title text; titles for real Crash courses come with T10 (manifest title keys) |
| P2 | Signed-out button is "Sign in with Google", not "Sign in with Google and enrol"; no Enrolment intent (stories 12, 19) | deferred to T3 (#60, "Enrol while signed out"); pending PO acceptance |
| P3 | Enrol and Can-open move `last_used_at` at most once a day, spec says "updates `last_used_at`" | pending PO: consistent with Record sign-in; Can-open counts only an Enrolled open, a Preview or refused call never counts (Codex round 1) |
| P4 | No SELECT policy on own Enrolments (spec, "Reads only") | deferred to My progress (T4); tables are in an unexposed schema, so no direct read exists. Record in the ticket |
| P5 | Route list is `include /*` with named public excludes, not an include-only list | deviation from the spec's wording, **pending PO acceptance** (the PO's "go" of 2026-11-01 approved the migration, preview deploy and push, not this deviation); the check forbids excluding any protected path in any letter case |
| P6 | A 401 from Supabase for a wrong key would read as "locked" (story 23) | fixed, `5b2250e`: only PGRST301/PGRST303 mean locked, other 401s read as unavailable |
| P7 | After a successful Enrol the page reloads, which stays locked until T2b sets the cookie | known limit of the T2a/T2b split |
| P8 | An Enrol on the test Crash course needs a test-list row | done by hand in the live project for the PO's account (no email in Git) |

## Round 1 P2s (Codex), all fixed in `67a71b2`

1. Pass-through responses missed the gate headers on a capital-letter course path: headers added when the file store sent no CSP.
2. An Enrolled request for a missing Resource returned the home page with status 200: a non-HTML Resource that comes back as HTML is now 404.
3. A repeat Enrol moved `last_used_at`: now at most once a day.
4. A Preview or refused Can-open moved `last_used_at`: now only an Enrolled open counts.
5. The locked page omitted the Lesson number: shown.

## Round 2

Codex on `a95d324..5b2250e` plus a full read of the gate: no P0/P1, **VERDICT: PASS**. It confirmed
only an exact `"open"` answer serves protected content and that the new 401 handling fails closed.

- P2: an Enrolled request for a missing `.html` Resource under a protected Lesson returns the Pages
  home-page fallback with status 200 (the fallback check exempts `.html`). No protected content leaks
  and only an Enrolled account can see it. **Pending PO acceptance** (or fix with an asset inventory
  in a later ticket).

Not run by Codex: SQL checks and hosted checks (run by me, see Evidence). One Codex-side test failure
was its read-only sandbox refusing a temp folder, not a code defect.

## Open before merge

- The preview was deployed at `29ddd62`; the gate changes of `5b2250e` (401 handling) are not deployed yet.
  Redeploy needs PO approval, then re-run the bypass matrix on the final commit.
- Commit `5b2250e` and this report are local until the PO approves another push.
- PO acceptances pending: S3, S4, P1, P2, P3, P4, P5 and the Round-2 P2 above; Pages "fail closed" screenshot.
