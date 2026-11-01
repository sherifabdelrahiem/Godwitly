Spec: #56 · Spec version: v1 · sha256 2211e8497c0fb3248f7d0433f487602d612600cd3dbe2b5640c03b4d9e6ad205

# Codex spec gate: Godwitly accounts, Enrolment, Course progress and Course report

> Reviewer: Codex (`gpt-6.1-sol`, medium effort, read-only, a fresh session independent of the
> design panel) · Spec: issue #56 v1, the body exactly as `gh` prints it (hash re-checked by
> Codex: matched) · Lane: Critical · 2026-11-01 · Not an approval

## Round 1

Verdict: **FAIL**: 4 P1, 5 P2, 0 P3. Codex reopened no product decision; the findings are
about enforcing D1 to D19 safely.

1. **[P1] Deletion and anonymous totals have no exactly-once contract.** "Before deleting it
   adds the anonymous totals, then hard-deletes the Auth user" does not keep the two effects
   together. A retried failed deletion, or self-service and Cron at once, can count an account
   twice. Activity between counting and deleting can change the frozen result (ADR-0011).
   **Fix:**
   - one shared deletion mechanism for self-service and Cron, serialised against activity and
     other deletions;
   - totals change exactly once, only for a successful deletion, from the account's final state;
   - rollback or recovery after a partial failure;
   - tests for duplicates, concurrent deletion, activity races and failure between the effects.
2. **[P1] Own-row permissions bypass the write contracts.** "An account reads and changes only
   its own Enrolments and ticks" allows direct table writes, which skip revisions, dedupe, the
   live-session check and `last_used_at`. **Fix:** deny direct client INSERT, UPDATE and DELETE
   on these tables; writes only through the specified functions; define reads and their
   live-session rule separately; add direct REST and SQL bypass checks with valid and revoked
   tokens.
3. **[P1] No CSP on the public pages that hold account tokens.** CSP is required only on gate
   responses, but supabase-js runs on the hub, Preview Lessons, recovery and callback pages and
   the Course report, where scripts can read the tokens. `_headers` today covers only the
   dashboard. **Fix:** a restrictive CSP on every hosted page that loads accounts Auth, with
   named script and connect sources, framing and base restrictions, no unsafe script; supabase-js
   pinned with SRI; headers checked on all URL variants. VERIFIED: static and Function responses
   each need their own header mechanism
   (https://developers.cloudflare.com/pages/configuration/headers/).
4. **[P1] The privileged clean-up has no explicit caller boundary.** "Bounded and privileged"
   does not say who may run destructive functions. **Fix:** name the scheduler identity and how
   it calls; revoke execution of bulk deletion, totals changes and scheduling from anonymous and
   signed-in roles; any Edge Function called by Cron uses a server-only credential distinct from
   learner sign-in; negative privilege tests. VERIFIED: functions are executable by default, and
   service-role clients bypass RLS (https://supabase.com/docs/guides/database/functions,
   https://supabase.com/docs/guides/functions/auth).
5. **[P2] Deletion scope misses new personal records.** Operation-id payloads, the privacy-notice
   record and owner-list membership are not named; other open tabs have no defined way to notice
   the deletion. **Fix:** list every account-linked table with deletion or cascade; define the
   owner-list case; remote sessions lose server access at once; open pages clear personal
   content on a named event; test deletion from another device.
6. **[P2] Deployment instructions drop D18 safeguards.** No staging layout or working directory
   for compiling Functions; the route checks cover protected folders but not the cookie,
   logout, whoami and recovery endpoints. **Fix:** state the project root, static folder, root
   middleware, `_routes.json` placement and exact deploy command; route coverage for the
   endpoints too, with no overriding exclusions; prove the compiled Functions on a preview first.
   VERIFIED (https://developers.cloudflare.com/pages/functions/get-started/,
   https://developers.cloudflare.com/pages/functions/routing/).
7. **[P2] Cross-device conflicts contradict story 36.** "The latest change to win" conflicts with
   revision checks, which reject the later attempt and show the server value (panel 4.1).
   **Fix:** state the visible rule (server revision order; what happens to a rejected pending
   change; what the person sees), align story 36, add two-device and delayed-retry cases.
8. **[P2] ADR-0011 facts are deferred without a release gate.** Cron availability, vendor
   retention and hosted sign-in behaviour decide whether the retention promise and privacy text
   are true. "Pause notice" is ambiguous: Supabase sends a warning about a week before and a
   confirmation after. **Fix:** record what is verified now; make the rest release blockers
   with evidence; say which email starts the 30 days; specify and test how a completed sign-in
   advances `last_used_at` without counting a refresh, including the throttle. VERIFIED
   (https://supabase.com/docs/guides/platform/free-project-pausing). UNVERIFIED: free-plan Cron,
   vendor log and backup periods.
9. **[P2] Public versus protected manifest data is undefined.** The spec does not say which
   manifest fields are public, and "My progress", Enrol and set tick don't explicitly refuse
   unreleased, retired or test-only definitions. **Fix:** a defined public projection of the
   manifest; server-side eligibility rules for Enrol and set tick (released, not retired,
   test-course allow-list); direct RPC tests.

Checked and found sound: the separation of projects, Google apps and storage keys (ADR-0005,
ADR-0009); cookie flags, server-side path mapping, fail-closed responses and live-session
checks (VERIFIED, https://supabase.com/docs/guides/auth/sessions); Cloudflare's fail-closed
quota setting and limits (VERIFIED,
https://developers.cloudflare.com/pages/functions/pricing/); Google's basic-scope exception and
Supabase's 50,000 free monthly active users (VERIFIED); bilingual shared UI, `file://` on public
pages, dependency approval, manual deploy, no protected content in public Git, and the counsel
launch condition.

### Facts checked by Claude after round 1 (2026-11-01)

- Supabase sends "a warning email roughly one week before the pause takes effect" and "a
  confirmation email once the project has been paused"; a paused project can be restored "for up
  to 1 year after it was paused"
  (https://supabase.com/docs/guides/platform/free-project-pausing).
- Supabase backs up "all Pro, Team, and Enterprise Plan projects on a daily basis"; Free
  projects get no automatic daily backups (https://supabase.com/docs/guides/platform/backups).
  ADR-0011 and the privacy text must not claim deleted data stays in Supabase backups on the free
  plan.
- The Supabase Cron page states no plan restriction; free-plan availability remains UNVERIFIED
  (https://supabase.com/docs/guides/cron).

### Outcomes (round 1)

The PO approved the proposed fixes on 2026-11-01; they were published as spec v2. Codex's
round-2 status for each finding is in the table below.

## Round 2

Spec: #56 · Spec version: v2 · sha256 77d8c6cbca3e3e6df8259cc7368ae1f54eb5f9d38ff10ea99071c05fe3eb1191
(hash re-checked by Codex: matched)

Verdict: **FAIL**: 1 P1, 1 P2, 0 P3.

| Round-1 finding | Round 2 | Reason |
|---|---|---|
| 1 Exactly-once deletion | PARTLY | The transaction, rollback and duplicate handling are resolved; the lock misses the new sign-in activity path (new finding 10). |
| 2 Direct-write bypass | RESOLVED | No client writes; live-session reads; negative checks. |
| 3 CSP coverage | RESOLVED | Every hosted Auth page, static and Function headers. |
| 4 Clean-up caller boundary | RESOLVED | In-database scheduling; client execution revoked. |
| 5 Deletion scope | RESOLVED | All account records named; remote clearing defined and tested. |
| 6 Deployment safeguards | RESOLVED | Staging layout, endpoint routes, preview proof. |
| 7 Cross-device conflicts | RESOLVED | Story 36 and the protocol agree. |
| 8 Retention verification | PARTLY | Deadline and release blockers fixed; sign-in recording has no server contract (new finding 10). |
| 9 Manifest eligibility | RESOLVED | Public projection, retired items, server checks, direct-call tests. |

10. **[P1] Recording a completed sign-in is outside the deletion lock and the write
    contracts.** v2 says a sign-in is "recorded only by the page's sign-in callback", but names
    no server operation, and the schema allows changes only through Enrol, Set tick or
    deletion. **Fix:** an authenticated "record sign-in" operation under the same per-account
    lock, checking the live session, telling a completed sign-in from a refresh with evidence
    the server can verify, updating `last_used_at` with server time and only forwards; tests
    for a race with clean-up, duplicate callbacks and a refresh being refused.
11. **[P2] How the Edge Function reaches the private deletion function is unspecified.**
    **Fix:** either an exposed invoker wrapper executable only by `service_role` that delegates
    to the private definer function, or a documented server-side SQL connection; keep the
    private schema unexposed; name the function owner and privileges; the Edge Function checks
    the verified caller and live session before delegating; test server success and refusal
    for `anon` and `authenticated`. VERIFIED: schema exposure is separate from privileges
    (https://supabase.com/docs/guides/api/using-custom-schemas).

Platform checks Codex verified in round 2:
- Deleting from `auth.users` in SQL is supported and cascades to sessions and refresh tokens;
  already-issued tokens stay valid until the live-session checks refuse them
  (https://supabase.com/docs/guides/auth/managing-user-data,
  https://github.com/supabase/auth/blob/master/migrations/20220811173540_add_sessions_table.up.sql).
- Wrangler 4.153.0 finds `functions` in its working directory and takes the static folder
  separately, so the staging layout works
  (https://github.com/cloudflare/workers-sdk/blob/wrangler%404.153.0/packages/wrangler/src/api/pages/deploy.ts).
- pg_cron jobs run with the scheduling user's permissions; SQL jobs need no Edge credential
  (https://github.com/citusdata/pg_cron, https://supabase.com/docs/guides/cron/quickstart).
  Free-plan availability stays a release blocker.
- `form-action 'self'` does not block the Google redirect, because supabase-js starts it with
  `window.location.assign`; Google Fonts fits with separate style and font sources. The exact
  supabase-js bundle under the CSP is UNVERIFIED until browser testing
  (https://www.w3.org/TR/CSP3/#directive-form-action).

### Outcomes (round 2)

| # | Outcome |
|---|---|
| 10, 11 | The PO approved the fixes on 2026-11-01; published as spec v3. |

From here the PO authorised the agent (2026-11-01) to run further rounds without asking,
until no P0 or P1 remains, validating each finding and deciding which P2s to fix or skip.

## Round 3

Spec: #56 · Spec version: v3 · sha256 aeea4420cbf65e617b1b157356378ed0c63e746169e25974c4f9b6435cd5895b
(hash re-checked by Codex: matched)

Verdict: **FAIL**: 0 P0, 0 P1, 1 P2, 0 P3.

| Finding | Round 3 | Reason |
|---|---|---|
| 10 Sign-in activity outside the lock | PARTLY | The operation and the shared lock close the race; session age alone does not show a Google sign-in (finding 12). |
| 11 Route to the private deletion function | RESOLVED | `service_role`-only wrapper, private definer owner, caller and live-session check. |

12. **[P2] Session creation time shows freshness, not how the person signed in.** A refresh
    keeps the session's creation time, so "a refreshed session changes nothing" overstates it:
    a recent, unrecorded session still qualifies once after a refresh. VERIFIED
    (https://github.com/supabase/auth/blob/master/internal/models/sessions.go,
    https://supabase.com/docs/guides/auth/jwt-fields). **Fix:** also require server-verified
    Google OAuth evidence; describe it as recording a recent Google sign-in once; take account
    and session ids from the verified caller only, matched to the Auth session; tests for a
    refreshed unrecorded recent session, repeat calls, an old session and a non-Google method.

Codex also verified that a security-definer function can read the Auth sessions with an empty
search path and no client grant, that the once-per-session rule and 10-minute window stop
Record sign-in becoming a keep-alive, and that the deletion route adds no P0 or P1.

### Outcomes (round 3)

| # | Outcome |
|---|---|
| 12 | **Fixed** (agent's decision; the P2 is valid and the fix is small): published as spec v4, sha256 14f2d54f966f056175ab86f8fe659a90a5025cc739d89098a433d224c4599453. A confirmation round 4 was run on v4. |

## Round 4 (confirmation)

Spec: #56 · Spec version: v4 · sha256 14f2d54f966f056175ab86f8fe659a90a5025cc739d89098a433d224c4599453
(computed by Codex from the saved body; the agent's value after publishing and a fresh check of
the live Issue body give the same hash)

Verdict: **PASS**: 0 P0, 0 P1, 0 P2, 0 P3.

- Finding 12: RESOLVED. Record sign-in requires Google OAuth evidence, takes both ids from the
  verified token and matches them to the Auth session, and records a recent session once under
  the shared lock; the tests allow the first recording after a refresh and refuse repeats, old
  sessions and non-Google methods.
- The v3 to v4 diff holds only that contract, its tests, the version and introduction, and the
  Changes line. Nothing new was found; every earlier finding is resolved at spec level.

The gate passes spec #56 v4 at the hash above. It is not the PO's approval and does not verify
the implementation; the spec's release blockers and its security, SQL and browser checks stay
mandatory.

## Round 5 (v5 draft)

Spec: #56 · Spec version: v5 · sha256 dcbd405259fc925ebfdcf8b449a0ee87298843ccde86e3e2ca39b5e3f581de47
(hash re-checked by Codex: matched)

v5 is an **unpublished local draft**; Issue #56 still holds v4. The v4 to v5 change is one
Crash course manifest rule the PO decided in the glossary follow-up (DP-6 in
`docs/reviews/2026-11-01-accounts-enrolment-design-diff-review.md` and
`docs/reviews/2026-11-01-glossary-adr-followup-diff-review.md`): "Every released Required Lesson
has at least one current Required checklist item (not retired)", enforced by the project checks
(a new Seam 3 bullet). The introduction also records the v4 approval and the v5 status, and v5
gets a Changes line. Codex was told the rule itself is the PO's decision and may only test its
wording, completeness, consequences and consistency.

Verdict: **PASS**: 0 P0, 0 P1, 1 P2, 0 P3.

13. **[P2] The stated consequence is too broad.** "a Completed Crash course is always reachable"
    is not what the rule gives: while any Lesson is coming soon (Lessons 2 to 9 today), completion
    stays unavailable under story 43 and GLOSSARY "Completed Crash course". **Fix:** limit the
    consequence to empty checklists and keep the coming-soon restriction.
    - **Claude's verdict: valid.** The draft line contradicted story 43 ("only when every
      Required Lesson of the whole planned Crash course is complete") and GLOSSARY ("It cannot
      happen while any Lesson is coming soon").
    - **Action: fixed** in the draft (wording only, no change in scope). The sentence now reads:
      "so a released Required Lesson can never count as complete with nothing ticked, and an
      empty checklist can never block a Completed Crash course for good. A Completed Crash course
      still waits until no Lesson is coming soon (story 43)." The v5 Changes line still describes
      the change correctly, so it was left as is.

Codex also found that the rule can be enforced by extending manifest check 8 in `tests/checks.js`,
for the test Crash course too, and that both manifests in `courses/` already satisfy it (Lesson 1
has four Required items, the test Crash course's two released Lessons have one each, and Lessons
2 to 9 are unreleased). It found the rule consistent with the public part of the manifest, the
reviewed migration load, story 45, Course progress, Caught up, Completed Crash course,
GLOSSARY.md and ADR-0009 to ADR-0011, and the introduction and Changes text accurate. Claude
checked these statements against the files.

## Round 6 (v5 draft, confirmation)

Spec: #56 · Spec version: v5 · sha256 d09148e749951f45657e85ad8c26e05577ccb9fa2a6cfb2e3574140e96f5595b
(hash re-checked by Codex: matched)

Verdict: **PASS**: 0 P0, 0 P1, 0 P2, 0 P3.

- Finding 13: RESOLVED. The consequence is now limited to empty checklists, and the coming-soon
  restriction is stated.
- Nothing new in the whole v4 to v5 diff.

The gate passes the v5 draft at the hash above. It is not the PO's approval. **v5 is not
published yet:** the PO publishes it to Issue #56, and the hash must then be recomputed from the
live Issue body (`gh issue view 56 --json body --jq .body | shasum -a 256`). It may differ from
the draft's hash, for example by trailing whitespace. The approval record uses the live hash; if
the text differs in more than whitespace, it needs a new gate round.

## Summary

| Round | Spec | Verdict | Findings |
|---|---|---|---|
| 1 | v1 | FAIL | 4 P1, 5 P2: all fixed in v2 (PO-approved fixes) |
| 2 | v2 | FAIL | 1 P1, 1 P2: fixed in v3 (PO-approved fixes) |
| 3 | v3 | FAIL | 1 P2: fixed in v4 (agent's decision under the PO's loop authorisation) |
| 4 | v4 | PASS | none |
| 5 | v5 draft | PASS | 1 P2: fixed in the v5 draft (agent's decision under the PO's loop authorisation) |
| 6 | v5 draft | PASS | none (confirmation on the final draft hash) |

No finding was skipped.

## v5 published

The PO approved publishing on 2026-11-01, and the agent published the v5 draft to #56. Live
hash (`gh issue view 56 --json body --jq .body | shasum -a 256`):
`cf3693461f6199577ac855b16d1994a49cd872888b9cac74ddaf4c9dc0945878`. The live text is the round 6
draft (`d09148e7…5595b`) word for word; only the trailing blank line `gh` adds differs, so no new
gate round is needed. The approval record must use the live hash.
