# Technology panel: Godwitly sign-in, Enrolment, Course progress and Course report

- Date: 2026-10-31
- Context: `/grill-with-docs` session for the Critical-lane work on Google sign-in, per-Crash
  course Enrolment, account-based Course progress and owner figures. No spec Issue exists yet;
  this record feeds `/to-spec` and the Codex gate. It is not the Codex gate.
- Panel: Claude (proposing architect) and Codex `gpt-6.1-sol`, medium effort, read-only (vendor
  reviewer). Codex made no edits, deploys or git writes.
- Rounds: 3 of a maximum of 4. Stopped when no technical blocker remained and the open items
  were product decisions for the PO.
- Related: `GLOSSARY.md` (Accounts and Enrolment), ADR-0009, ADR-0010.

This record keeps two things apart:

1. **Decisions the PO has approved** in this session (section 1).
2. **Proposals** from the panel that the PO has **not** approved (sections 2 and 3). They are
   inputs to the spec, not requirements, until the PO approves them.

## 1. Decisions approved by the PO

Fixed before the session (the PO's brief, not reopened): one account per person as the
intention; sign-in enrols in nothing; explicit, free, open, idempotent Enrolment per Crash
course; accounts never grant Sign-up dashboard or owner access; Lesson 1 is a public preview
and Lessons 2 onward need Enrolment, enforced where served; progress per account, Crash course
and Lesson across devices; the completion definitions; self-reported completion stated where
shown; owner figures only; no migration of #41 browser ticks; the out-of-scope list.

Approved during the session:

| # | Decision | Recorded in |
|---|---|---|
| D1 | "Crash course" is the general category; the Claude Crash Course for Beginners is the first. "Course" alone stays avoided. | GLOSSARY.md |
| D2 | **Godwitly account** (حساب Godwitly). One per person is the intention; a person can use several Google accounts, so figures count accounts. | GLOSSARY.md |
| D3 | **Enrolment** (الالتحاق); Learn's "enrols" stays Learn's; Course taker covers enrolled and not enrolled; the Crash course entry no longer says "no enrolment". | GLOSSARY.md |
| D4 | Course progress, Completed Lesson, Completed Crash course, Completion rate, all defined through **Required checklist items**. | GLOSSARY.md |
| D5 | **Preview Lesson** (درس مفتوح). | GLOSSARY.md |
| D6 | Resources share their Lesson's access; the Lesson 1 Sample business facts file stays public. | GLOSSARY.md |
| D7 | A Preview Lesson can be a Required Lesson; its ticks count only for an Enrolled account. | GLOSSARY.md |
| D8 | The repository becomes private, **later, not now**. Until then no protected Lesson page, draft or Resource is committed or pushed. | ADR-0010 |
| D9 | Lessons that need Enrolment and their Resources are served through Cloudflare Pages Functions middleware with Supabase. Storage-bucket delivery, Vercel, Next.js and a hosted LMS are rejected for the first release. | ADR-0010 |
| D10 | Godwitly accounts, Enrolments and Course progress live in a separate Supabase project; `godwitly`, its Auth hook and ADR-0005 stay unchanged. | ADR-0009 |
| D11 | Free plan for both projects; pausing accepted. Supabase Pro only when preparing the first paid Crash course. | ADR-0009 |
| D12 | Vercel, Next.js and a hosted LMS are reopened only if Godwitly adopts a framework for its own reasons, or keeping the gate becomes a measurable burden. | ADR-0010 |
| D13 | Inactivity is measured by a server-kept **last used** date that only moves forward, set when the account is created and updated with server time, not by background session refresh. Counting actions (approved in Round 5 Q1): completing a Google sign-in, enrolling, ticking or unticking, opening a Lesson that needs Enrolment. Reading a Preview Lesson and background refresh do not count. | this record |
| D14 | Coming-soon Lessons do not count toward current Course progress. The difference between completing the released Lessons and the whole planned Crash course is settled by D17. | this record |
| D15 | Retention: accounts unused for 24 months are deleted under B2 (section 2.7), with both deadlines, the hand-run clean-up after a restore, the deletion scope and the run records. Approved in Round 5 Q2a. | ADR-0011 |
| D16 | Every deletion adds to anonymous per-Crash course totals (Enrolments removed; Completed Crash courses removed); the Course report shows all-time figures with the stated limits. Approved in Round 5 Q2b. | ADR-0011 |
| D17 | Course progress counts released Required Lessons; **Caught up** is new; Completed Crash course means the whole planned Crash course; the Completion rate shows "not yet" while Lessons are coming soon (section 2.6). Approved in Round 5 Q3. | GLOSSARY.md |
| D18 | Sections 2.1, 2.2, 2.3, 2.5, 2.7 (self-service deletion) and 2.8 are approved as spec inputs, including the **Course report** term. The pinned supabase-js dependency on course pages still needs its own approval at spec time. Approved in Round 5 Q4. | ADR-0010, GLOSSARY.md |

Since D15 to D18, every proposal in section 2 is approved as a spec input, except the
pinned supabase-js dependency (needs its own approval) and the items marked "to verify in the
spec". Section 2 keeps the wording the PO approved.

## 2. Proposals (approved as spec inputs in Round 5; see D15 to D18)

### 2.1 Session and gate (Round 4 Q1, Q2, amended)

- The gate does not verify tokens itself. It sends the session token from an HttpOnly
  `__Host-` cookie (`Secure; Path=/; SameSite=Lax`, expiring no later than the token) to the
  accounts project as `Authorization: Bearer`, with the publishable key, calling one RPC.
  PostgREST verifies the token.
- The RPC returns true only when the Lesson is released and belongs to the Crash course taken
  from the server's path mapping (never from query parameters), and the account is Enrolled,
  and the token's session still exists for that user (immediate revocation after sign-out).
- Preview Lessons are served without calling Supabase.
- Anything else fails closed with `Cache-Control: private, no-store`.
- Cookie exchange and logout are same-origin JSON POSTs (Origin check plus a custom header).
  Logout uses `scope: 'local'`, stops refresh and exchange first so an in-flight exchange
  cannot restore the cookie, clears the cookie, revokes the session, and blanks other tabs.
- A deep link with an expired cookie goes to a public recovery page; return URLs are validated
  same-origin paths with loop prevention.
- The live-session check also applies to owner RPCs and to writes.
- Accepted risk: supabase-js tokens stay readable by page scripts, so script injection remains
  the main threat; course pages get a strict CSP and no third-party script except pinned
  supabase-js with SRI (a dependency that needs PO approval).

### 2.2 Deployment safeguards (Codex round-1 blocker, resolved once demonstrated)

- Acceptance evidence: the Pages setting "fail closed" when the daily Functions limit is
  reached; `functions/_middleware.js` at the root and an explicit `_routes.json` whose include
  list covers each protected folder and everything under it, checked by a node test; no cache
  rule ahead of the gate; security and cache headers set in code on Function responses
  (`_headers` does not apply to them); the staging folder layout and Wrangler run so that
  `functions/` compiles.
- Bypass test matrix on the production alias, the preview alias and one deployment-hash URL:
  `/x/lesson-2`, `/x/lesson-2/`, `/x/lesson-2/index.html`, encoded and double-slash variants,
  a direct Resource URL, HEAD, conditional requests; signed out, signed in but not Enrolled,
  Enrolled, Enrolled in another Crash course, revoked session, missing, invalid and expired
  cookie, Supabase outage, unknown and unreleased Lessons, malformed RPC response, logout and
  exchange races.
- Deployment hashes stay reachable, so after any security fix to the gate, older deployments
  are listed and deleted.
- Protected text never goes in `js/translations.js`.

### 2.3 Data, definitions and access (Round 4 Q3, Q4)

- No profile table; nothing copied out of Supabase Auth. Supabase's Google provider stores the
  name and picture in user metadata and the scope cannot be narrowed through normal options.
- One Crash course manifest in Git per Crash course (Lessons with number, preview, required,
  released; checklist item identifiers with a required flag) is the single source. The project
  checks compare the pages and `tests/course-lessons.js` with it; a reviewed migration loads
  it into the accounts project. Identifiers are never reused with a new meaning. Migrations
  land before content becomes reachable, and old deployments stay compatible.
- Composite keys stop items, Lessons, Enrolments and ticks from crossing Crash courses. One
  Enrolment per account and Crash course; server-set timestamps.
- An account reads and changes only its own rows, with a separate rule for each operation and
  only the operations the spec names. The owner gets no broader row access.

### 2.4 Last used (detail of D13; counting actions approved, see D13)

- One private, server-kept `last_used_at` per account, set at creation, updated with server
  time on named actions, throttled, never moved backwards and never touched by maintenance
  jobs. Clean-up is serialised against these updates.
- Proposed counting actions: completing a Google sign-in, enrolling, ticking or unticking,
  and opening a Lesson that needs Enrolment.
- Proposed **not** counting: reading a Preview Lesson while signed in, and background session
  refresh. Preview Lessons are served without calling Supabase (2.1); counting them would make
  every public page view call the accounts project. An Enrolled person ticking on a Preview
  Lesson still counts.

### 2.5 Course report (Round 4 Q5)

- Separate, online-only, `noindex` page signing in to the accounts project.
- Owner list in a private table keyed by account id, managed by hand, never in Git, with no
  client write access; first and only member the Project owner.
- One figures-only RPC (invoker wrapper over a private security-definer function with an empty
  search path) checks membership and a live session on every call, and returns per Crash
  course only: Enrolments, Completed Crash courses, Completion rate ("—" with no Enrolments).
  Since D16 and D17 it also shows Caught up, uses all-time totals including the anonymous
  removed counts, and shows the last successful clean-up run.
- No minimum-count threshold (owner only). No account filters.
- Proposed glossary term: **Course report** (تقرير الدورات); avoid dashboard, analytics.

### 2.6 Completion while Lessons are still coming soon (detail of D14)

Proposal for the PO to decide:

- **Course progress** counts released Required Lessons only, shown with the number still to
  come, for example "3 of 5 Lessons; 4 more coming soon".
- New term **Caught up** (أنهى المتاح): every released Required Lesson is a Completed Lesson
  while the Crash course still has coming-soon Lessons.
- **Completed Crash course** keeps its meaning: every Required Lesson of the planned Crash
  course is complete. It cannot happen while any Lesson is coming soon.
- The Course report shows, per Crash course: Enrolments, Caught up, Completed Crash courses,
  and the Completion rate. While Lessons are still coming soon, the rate is shown as "not yet:
  Lessons still being released", not 0%.
- When a Lesson is released, or a Lesson is added after the Crash course was complete, people
  who were Caught up or Completed become not caught up until they finish it.

### 2.7 Deletion and retention (Round 4 Q6, decision 2)

Self-service: "Delete my Godwitly account" (English and Arabic) deletes the caller's own
account only, through an authenticated Supabase Edge Function that calls the admin delete with
the server key kept in Supabase. Enrolments, ticks and the last-used record are deleted with it.
The site's cookie is then cleared through a same-origin Pages endpoint, then supabase-js state.

Retention options for automatic deletion. **Neither removes the Project owner's duty:**

- **B1:** a separate Cloudflare Worker on a daily Cron Trigger calls a clean-up Edge Function
  and alerts the owner on failure. It still cannot delete while the project is paused, so the
  owner must still restore a paused project and act on failure alerts. It adds a service to
  deploy and watch. (An earlier message in the session wrongly said B1 removes the owner's
  duty; it does not.)
- **B2 (approved, D15):** clean-up runs inside the accounts project.
  - Eligible: 24 months after `last_used_at`.
  - Deadline 1 (normal): a daily Supabase Cron job deletes eligible accounts within 30 days of
    eligibility.
  - Deadline 2 (paused): the Project owner restores a paused accounts project within 30 days
    of Supabase's pause notice. Straight after restoring, the owner runs the same clean-up
    function by hand, before announcing the Crash course is available again. An account that
    became eligible during the pause is then deleted within 30 days of the pause notice at the
    latest.
  - Deleting the whole project is never routine account clean-up. If a restore fails, it is an
    incident: the PO decides what happens next, and the failure is recorded.
  - Deleted: the Auth account (email, Google name and picture, identities, sessions and
    refresh tokens), Enrolments, ticks and the last-used record. The Course report's figures
    drop, because they are computed when asked, not stored.
  - Not deleted: Supabase's Auth audit logs and backups, and Cloudflare request logs, kept by
    those vendors for their own periods (to be checked in the spec). The privacy text says
    this is account deletion, not complete erasure.
  - Confirmation: each run writes a record with no personal data (time, number deleted,
    failures). The Course report shows the last successful run. After a restore, the owner
    confirms a new run record and that no account is past its deadline.
- **Anonymous totals (D16):** before an account is deleted, automatically or on request, each
  Crash course it was enrolled in gets Enrolments removed +1, and Completed Crash courses
  removed +1 if it had one. No email, account id, dates or ticks are kept with them.
- **B3:** GitHub Actions schedule, deferred.

To verify in the spec: Supabase Cron on the free plan; Supabase's pause notice email and its
timing; audit-log and backup retention periods; hosted behaviour of `last_sign_in_at` and
`refreshed_at` (upstream source checked).

### 2.8 `file://` and testing (Round 4 Q7, Q8)

- `file://`: the landing page, the hub and Preview Lessons keep working, with sign-in and
  Enrol controls explaining they need the website; Auth is not started under `file://`.
  Protected Lessons and the Course report are online only; ADR-0001 and `AGENTS.md` list the
  exceptions. Protection guarantees apply to the hosted site only.
- Testing: a dummy test Crash course (one Preview Lesson, one protected Lesson) deployed only
  to a Pages preview branch, with exact Supabase redirect URLs for that alias and no fallback to
  production. Test data lives in the real accounts project, marked as test data. That marks it
  but does not isolate it, which is an accepted limitation. Only designated test accounts may
  use the test Crash course; it is left out of discovery and the Course report. Before upload,
  the assembled production files are checked for any test material. Bypass tests also run on a
  deployment-hash URL.

## 3. Panel log

- **Round 1:** Codex agreed with the direction and raised one blocker (deployment safeguards:
  fail-open quota setting, `_routes.json` exclusions, header inheritance, old deployment
  hashes) and majors on bypass testing, retention under pausing, and Function headers and
  layout. Q1 modify (do not hand-write token checks just to avoid npm), Q2 agree, Q3 modify
  (server-readable definitions), Q4 to Q6 and Q8 modify, Q7 agree.
- **Round 2:** Claude moved token checking to PostgREST and added the safeguards and test
  matrix. Codex: the blocker is resolved once demonstrated; retention under pausing is still
  major; "unreleased means not Required" needs the PO.
- **Round 3:** Codex confirmed from the upstream source that refreshing a session does not
  update `last_sign_in_at`, and recommended a monotonic `last_used_at`. B1 is preferred
  technically, but no option guarantees deletion while the project is paused, and B2 needs PO
  wording. Codex found no explicit Supabase terms against scheduled clean-up, which is an
  inference and not vendor clearance. A paused free project is restorable for one year in the
  current documentation. No technical blocker remained.

## 4. Panel 2: progress behaviour, locked Lessons, sign-in and privacy (approved by the PO as spec inputs, Round 6 Q1 to Q7, 2026-10-31)

D19: the PO approved sections 4.1 to 4.8 as written, as spec inputs. Same panel and settings, 4 rounds, on Round 6 Q1 to Q7. Codex: **converged** on the design in
round 4; no blocker or major remains. Implementation, race tests, browser checks, OAuth
readiness and the mandatory legal requirements remain spec acceptance work. The panel does not
establish legal compliance.

### 4.1 Saving ticks (Q1)

- One RPC per tick or untick: Crash course, Lesson, item, `ticked` true or false, an operation
  id and the expected revision. In one transaction the server checks the revision, bumps it,
  records the operation id (bound to its whole payload, kept 24 hours), and updates
  `last_used_at`. A repeated operation id returns the original result with no second effect,
  so retries never extend retention. Unticked items keep a `false` row whose revision keeps
  rising. On a revision mismatch the server returns the current value and the page shows it.
- The page sends one write per item at a time; a newer change waits, then sends the latest
  wish with the new revision. Retries stop well inside 24 hours. A displayed revision is never
  replaced by an older one.
- Each item is confirmed, not sent yet, sending, or unknown. Only confirmed ticks count toward
  completion and the celebration. Unknown is resolved by re-reading after the request settles
  and re-sending the same operation id; otherwise it stays "Couldn't confirm this change: check
  again" with a retry button.
- Loading: the checklist is disabled with a loading state until ticks load. Status messages use
  one persistent polite live region in both languages; focus never moves.

### 4.2 Re-authentication, sign-out and shared devices (Q1, Q2)

- An expired token is first refreshed silently. If a full Google sign-in is needed, nothing is
  resent: unsent changes are discarded and the page says "Changes not yet sent were discarded;
  some recent changes may have saved: check your progress after signing in", then reloads
  progress from the server. Queued changes carry the account id and a sign-in generation;
  replies from an older generation are ignored.
- Sign-out warns first, counting unsent, sending and unknown changes separately, in an
  accessible dialog with Cancel. It stops writes, refresh and cookie exchange, clears the
  cookie and revokes the session, removes the accounts project's Auth keys (including the
  PKCE verifier), and blanks personal and protected content in every tab, also when a page is
  restored from history (`pageshow`, visibility). It never touches the Sign-up dashboard's
  session, the language preference or other storage.

### 4.3 Cookie and page sign-in agree (Q4)

- One same-origin Web Lock covers the cookie exchange, a cookie-only, no-store
  `/account/whoami` check (the same live-session check as the gate), and sign-out's cookie
  clearing and revocation. After taking the lock the tab re-reads the sign-in state and
  re-checks its generation after every wait.
- Personal controls and protected content stay on only while the cookie's account id and
  session id match the page's own session. The page waits for supabase-js to report its initial
  session first. On a mismatch after one retry, the gate or recovery page replaces protected
  content.
- Without Web Locks, signed-in features are switched off with a bilingual explanation; public
  pages stay usable. The gate's server checks stay authoritative. A stolen live cookie is an
  accepted bearer risk, limited by HttpOnly, a short lifetime, the live-session check and
  sign-out revocation.

### 4.4 Browser ticks from #41 (Q3)

- On each site address where the new code runs, remove only keys starting
  `godwitly-course-progress-`, never all storage, and switch the old writer off. Copies on
  `file://` or other addresses are cleaned only when the new code runs there.
- A one-time bilingual notice, remembered with a marker holding no personal data, explains that
  earlier ticks were only in that browser and are not carried over.
- Signed-out visitors may tick a Preview Lesson for the current visit only; nothing is stored
  and it never shows as account completion.

### 4.5 Locked Lesson page and Enrolment (Q4)

- The gate's page is bilingual for all shared, account and error text; only Lesson text stays
  Arabic-only (ADR-0008). It shows public manifest fields only, inserted as text, plus what
  Enrolment gives, one main action, public navigation and the privacy link; no Lesson content.
  Headers: CSP, `private, no-store`, `X-Robots-Tag: noindex`. A service outage is shown
  differently from "not enrolled".
- "Sign in with Google and enrol" carries a single-use, expiring Enrolment intent tied to the
  browser, with an allow-listed Crash course and return path, used once after sign-in
  completes. Plain sign-in creates no intent. Enrolling is an authenticated POST with request
  forgery protection, and the database allows one Enrolment per account and Crash course.

### 4.6 Hub cards (Q5)

- Coming-soon cards stay non-clickable "قريبًا" (spec #36 stories 12 and 41 hold). Released
  Lessons that need Enrolment are links marked "Needs Enrolment", or show progress when
  Enrolled. The hub has the main Enrol button and a Course progress line.
- The hub renders fully without Supabase (also from `file://`); account marks are added on top,
  show "loading" rather than a false zero, and refresh after changes and restored navigation.
  Caught up, Completed Crash course and self-reported progress stay distinct.
- Spec #36 gets a new version for the card states and for retiring browser ticks.

### 4.7 Sign-in placement and Google setup (Q6)

- Sign-in appears only on Crash course pages; the landing page and its header do not change.
  Google names are shown as text with bidirectional isolation and a fallback.
- A separate Google OAuth app for the accounts project; the dashboard's app is untouched. For
  production branding, the hub is the app's homepage, with the privacy page link. Google's
  100-user Testing limit does not apply to basic sign-in scopes. The actual Google set-up is
  checked in the spec.

### 4.8 Privacy notice and launch condition (Q7)

- A bilingual privacy page names: the controller; purposes and legal bases; what is stored;
  rights and how to use them; that the Project owner can see records as project administrator
  (not "only you"); processors and transfers (Supabase, Cloudflare, Google); retention and
  ADR-0011's pause contract; the anonymous totals; contact. A short line under every sign-in
  button links to it.
- The account stores the notice version and server time at creation, plus any evidence counsel
  requires. That records the notice, not automatically valid consent.
- **Launch condition:** public release of accounts waits until counsel has named the mandatory
  requirements (legal basis per jurisdiction, any Egyptian PDPL licence or registration,
  transfer permissions, minimum age, consent evidence, whether the totals are anonymous) and
  each is resolved. The PO's written risk acceptance covers only uncertainty that is not
  mandatory.

Panel 2 sources: https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html,
https://supabase.com/docs/reference/javascript/auth,
https://developer.mozilla.org/en-US/docs/Web/API/Broadcast_Channel_API,
https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage,
https://developer.mozilla.org/en-US/docs/Web/API/Web_Locks_API,
https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Set-Cookie,
https://support.google.com/cloud/answer/15549945?hl=en,
https://developers.google.com/identity/verification/authentication-verification,
https://www.edpb.europa.eu/sme/be-compliant/process-personal-data-lawfully_en,
https://pdpc.gov.eg/assets/pdf-data/Guidelines/DSConsent.pdf

## Sources

- https://developers.cloudflare.com/pages/functions/middleware/
- https://developers.cloudflare.com/pages/functions/routing/
- https://developers.cloudflare.com/pages/functions/pricing/
- https://developers.cloudflare.com/pages/configuration/serving-pages/
- https://developers.cloudflare.com/pages/configuration/preview-deployments/
- https://developers.cloudflare.com/pages/configuration/headers/
- https://developers.cloudflare.com/workers/configuration/cron-triggers/
- https://supabase.com/pricing
- https://supabase.com/docs/guides/auth/sessions
- https://supabase.com/docs/guides/auth/signing-keys
- https://supabase.com/docs/guides/auth/managing-user-data
- https://supabase.com/docs/guides/platform/free-project-pausing
- https://supabase.com/docs/guides/cron
- https://supabase.com/docs/guides/database/postgres/row-level-security
- https://github.com/supabase/auth/blob/master/internal/tokens/service.go
- https://docs.postgrest.org/en/stable/references/auth.html
- https://vercel.com/docs/routing-middleware
- https://vercel.com/docs/limits/fair-use-guidelines
- https://www.thinkific.com/pricing/
- https://www.teachable.com/pricing
