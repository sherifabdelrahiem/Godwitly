# AGENTS.md

## Project overview

- Project: Godwitly landing page. A static English/Arabic page for Godwitly, a platform
  for learning, engagement and organisational preparedness (products: Learn, Engage,
  Resilience). It includes a "Get notified" contact form. Built during the Vibe Coding
  course at Creativa Hub Port Said.
- Users: organisations and training managers, mostly Arabic and English speakers.
- Current stage: MVP. Live at https://godwitly.pages.dev
- Technology: static HTML, CSS and vanilla JavaScript (no build tools, no package
  manager). Supabase project `godwitly` (Frankfurt, `eu-central-1`) stores form sign-ups
  and, through Supabase Auth with Google sign-in, controls who may read them on the Sign-up
  dashboard (ADR-0005). Hosted on Cloudflare Pages. Fonts are loaded from Google Fonts; the
  dashboard alone also loads supabase-js from jsDelivr at a pinned version with an SRI hash.

## Sources of truth

Before implementing a change, review the relevant existing sources:

- Product requirements: the approved **spec Issue** on GitHub (see Workflow). Review
  reports live in `docs/reviews/`. `docs/plans/` holds approved plans from before the
  spec-Issue workflow (history).
- Architecture: no architecture document exists. See `README.md`, `docs/adr/`, and the
  relevant spec Issue (for older work, its plan in `docs/plans/`).
- Design system: `css/styles.css` (tokens are the variables in `:root`), the existing
  page in `index.html`, and the behaviour in `js/`.
- Task tracking: GitHub Issues, run through the Workflow below. The project owner (PO) is
  the repository owner.

If a source does not exist or instructions conflict, report the gap.
Do not invent project requirements.

## Workflow

New work follows the main flow of the vendored Matt Pocock skills
(`.claude/skills/ask-matt/SKILL.md`) from the moment this Workflow is merged into `main`.
Work approved before that merge finishes under the plan-file process it was approved with
(`git show d090b6b:AGENTS.md`).

### Who starts a skill

A skill whose `SKILL.md` frontmatter has `disable-model-invocation: true` is started **only
by the PO**, with its slash command. At each such step, recommend the command, say what it
will do, then stop and wait. Start the other skills the Workflow uses (`code-review`,
`tdd`, `pr`, `diagnosing-bugs`, and `prototype` on the terms in "One gate for every
route") yourself, within the gates below. A skill the PO started may call them without a new
hand-over. If a skill's `SKILL.md` is missing, stop and report it.

### Steps

| # | Step | Skill file | Started by | Produces | Agent waits |
|---|---|---|---|---|---|
| 1 | Sharpen the idea | `.claude/skills/grill-with-docs/SKILL.md` | PO | `GLOSSARY.md` and ADR updates | for the PO to end the interview |
| 2 | Prototype (only when a question needs runnable code) | `.claude/skills/prototype/SKILL.md` | agent (see "One gate for every route") | throwaway code on a `prototype/<name>` branch | after reporting the answer |
| 3 | Spec | `.claude/skills/to-spec/SKILL.md` | PO | the spec Issue (`Spec version: v1`) | after publishing it |
| 4 | Codex gate (Critical only) | none | agent | a gate report in `docs/reviews/` | until the findings are resolved |
| 5 | PO approval | none | PO | an approval record on the Issue | for it, before any production code change |
| 6 | Tickets (multi-session work only) | `.claude/skills/to-tickets/SKILL.md` | PO | ticket Issues naming the spec version and hash | after publishing them |
| 7 | Build, test-first where it applies | `.claude/skills/implement/SKILL.md` or `.claude/skills/implement-spec/SKILL.md` (they call `tdd` and `code-review`) | PO | commits on a feature branch | before any push |
| 8 | Diff review | `.claude/skills/code-review/SKILL.md` | agent | a report in `docs/reviews/` | until every finding is fixed or accepted |
| 9 | Pull request | `.claude/skills/pr/SKILL.md` | agent | a PR body draft | before publishing it |
| 10 | Retro (once per finished feature) | `.claude/skills/retro/SKILL.md` | PO | proposed work | after proposing it |

Keep steps 1, 3 and 6 in one context window. Start each ticket's step 7 in a fresh
session; a single-session change stays in its context. For other phase boundaries, see
`.claude/skills/ask-matt/PHASE-BOUNDARIES.md`.

### Lanes

- **Critical**: personal data, security, Supabase or other backend changes. Order: draft
  spec → Codex gate → resolve findings → PO approval → tickets or build. Save gate reports
  in `docs/reviews/`.
- **Standard**: everything else. Spec, PO approval, and the diff review saved in
  `docs/reviews/`. There is no lighter lane; even small text or colour fixes are Standard.

### One gate for every route

Every route reaches production code (anything beyond a throwaway prototype) through the same
gate: a versioned spec, its lane, the Codex gate if Critical, then PO approval. That holds
for:

- the main flow;
- a `triage` brief, which becomes the spec or links to it;
- `diagnosing-bugs`, which reproduces and collects evidence, then hands that to a spec;
- a `ready-for-agent` issue (the label is never approval);
- a `retro` suggestion;
- a `prototype`. Once the PO explicitly agrees its question and scope, the agent may start
  it and write throwaway code before the spec. Its answer goes into the spec. Folding its
  decisions into production code is step 7, after the gate. Pushing its branch needs
  approval (see External actions).

### Spec versions

- The spec Issue starts with `Spec version: vN` and ends with a **Changes** list.
- Approval binds one version and its hash. The PO approves in the session, or by
  commenting on the Issue. You record only an approval the PO actually gave.
- Once approved, the body is frozen:
  - a typo edit keeps the version but needs a one-line re-approval with the new hash;
  - a change to scope, data, permissions, acceptance criteria or behaviour bumps the
    version and needs full re-approval. A Critical change goes back through the Codex
    gate, and tickets from the older version are updated or closed, with approval (see
    External actions).
- The hash is the full SHA-256 from `gh issue view <n> --json body --jq .body | shasum -a 256`.
  It is stored outside the body: in the approval record, the Codex gate report and each
  ticket, next to the version.
- Before building, recompute the hash and compare it with the latest approval record, and
  check the tickets still match the spec. On a mismatch, stop.
- The record formats are in `docs/agents/issue-tracker.md`.

### Specs sized to the change

A small Standard change needs only:

- the problem;
- the intended change;
- the acceptance checks;
- the lane.

User stories are optional. Multi-session work uses the full `to-spec` format and
`to-tickets`.

### Tests

- Use `tdd` where a behaviour can be tested at a seam the spec agrees.
- Where it can't (wording, CSS, docs, Supabase permissions, Google sign-in, layout), the
  spec names the manual, SQL or browser checks instead. The review records "TDD: not
  applicable" with the reason.
- There is no typechecker, so typechecking is "not applicable".

### Diff review

1. Commit the work.
2. Run `code-review` against a named base commit and the approved spec version.
3. Save the report in `docs/reviews/`. It names:
   - the base, the reviewed commit, and the spec version and hash;
   - both axes (Standards, Spec);
   - one outcome per finding: fixed (with its commit), or accepted by the PO (with the
     date).
4. **Re-review before merge:** any later change to code, site files, the spec, `AGENTS.md`
   or other workflow files gets its own review.
   - A commit that only adds review evidence (the report and its outcomes) needs none,
     unless it also changes a rule.
   - A commit can't contain its own ID, so give the final evidence commit's ID in the
     completion report and the PR description.

### External actions

Starting a skill, or the PO approving a spec or an implementation, authorises none of these
actions. They add to the Boundaries list. Get the PO's approval, in the session, for each:

- pushing a branch;
- opening a PR, including a draft PR from `implement-spec`;
- merging;
- deploying;
- **closing any issue**, including by a `Closes #n` keyword or by `implement-spec`
  resolving tickets. Until the PO approves closing, a PR or commit says `Refs #n`. The PO
  may approve a named list of issues at once.
- relabelling or editing an issue the PO didn't ask to change;
- pushing a `wayfinder` research branch.

`pr` drafts a PR body; publishing it is one of the actions above. Create issues and
comments when the PO asks, starting with `[Agent]`, because `gh` posts as the PO. A triage
post starts with `[Agent]`, then the triage AI disclaimer on the next line.

### Retro

Run once per finished feature, after the merge; skip it for small wording fixes. Save the
session's evidence in `docs/reviews/` before the context is cleared. Its suggestions become
proposed work that enters this Workflow at step 1 or 3.

## Project structure

- `index.html`: page structure for all sections; English is the default text.
- `css/styles.css`: all styling; colours and fonts are `:root` variables.
- `js/translations.js`: every piece of text in English (`en`) and Arabic (`ar`).
- `js/script.js`: language switcher, mobile menu, product tabs and smooth scrolling.
- `js/form.js`: "Get notified" form validation, submission, error/success states and the
  Message's characters-left counter.
- `js/message-length.js`: the Message length rule, shared by `js/form.js` and the tests.
- `js/config.js`: Supabase URL and publishable key (public by design); used by the form
  and the Sign-up dashboard.
- `dashboard.html`: the private Sign-up dashboard (Google sign-in; not linked, `noindex`).
- `css/dashboard.css`: dashboard-only styling; reuses the `:root` variables.
- `js/dashboard.js`: dashboard sign-in, Launch sign-ups list, search, figures and Access.
- `_headers`: Cloudflare Pages security headers (CSP) for the dashboard only.
- `crash-course/index.html`: the Crash course hub (Claude Crash Course for Beginners), linked
  from the landing page as "Crash Courses". Each released Lesson has its own page in a
  `crash-course/lesson-N/` folder (Lesson 1 so far), built from its approved draft in
  `docs/course/lesson-N/`.
- `css/course.css`: Crash course pages only; reuses the `:root` variables.
- `js/course.js`: language switcher, mobile menu, the phone Lesson list, checklist ticks with the ✓
  marks and the celebration, and footer year for the Crash course pages; they never load `js/script.js`.
- `js/course-language.js`: which language a Crash course page opens in, what it remembers
  and how links carry it; tested in `tests/course-language.test.js`.
- `js/course-progress.js`: the "You're done when" ticks, remembered per Lesson in the browser
  only; tested in `tests/course-progress.test.js`.
- `supabase/functions/`: Edge Functions; `notify-signup` sends the owner an alert-only
  email.
- `supabase/migrations/`: SQL migrations (the `launch_signups` table, its rules, the
  `notify_signup` trigger, and the Sign-up dashboard's viewers list, Auth hook and read
  policy).
- `assets/images/`: logo, favicon, backgrounds, illustrations and the seven course mascots
  (`mascot-*.webp`, web-sized).
- `docs/reviews/`: review reports (Codex gates, diff reviews, test logs).
- `docs/plans/`: approved plans from before the spec-Issue workflow (history).
- `docs/adr/`: architecture decision records; read them before changing the form, the
  alerts or the site setup.
- `docs/agents/`: issue tracker, triage label and domain-doc settings read by agent skills.
- `GLOSSARY.md`: the agreed domain terms in English and Arabic; use them in text, plans
  and issues.
- `tests/`: `node --test` tests (development only, ADR-0006). `tests/checks.js` holds the
  project checks: translation parity, translation keys named in the pages and scripts,
  JavaScript syntax, the Crash course hub's cards, the Lesson pages' rules, that each hub card
  and Lesson page lists its manifest's checklist items and required flags, the manifests' own
  rules, their public part, and that the deploy file list holds no test Crash course material.
- `courses/`: the Crash course manifests (spec #56), the single source of each Crash course's
  Lessons and checklist items; the project checks compare the pages with them.
  `courses/manifest.js` lists them, describes the format and defines the public part;
  `courses/claude-beginners.js` is the Claude Crash Course for Beginners and
  `courses/test-course.js` the test Crash course (dummy text, never deployed to production).
  Development only for now: never in the deploy file list, because a manifest holds more than
  is public.
- `deploy-files.txt`: the production deploy file list, one path per line, read by the deploy
  command and the project checks.
- `tests/samples/components.html`: development-only page showing the Lesson building blocks
  that no released Lesson uses yet (code boxes, tabs, the printable برشامة). Not in the deploy
  file list (`deploy-files.txt`), so never deployed.
- `.github/workflows/checks.yml`: the PR checks (see Development commands, Test). A change
  to it needs a security review and a new gate assessment (spec #31).
- `.agents/skills/`: the vendored Matt Pocock skills (MIT; see its `README.md`).
  `.claude/skills/` links to them. Update them only by re-installing (see that README).

## Development commands

Use the commands verified for this repository:

- Install: none (no dependencies; for tests, see Test).
- Run locally: `open index.html`. Add `?lang=ar` to the URL for the Arabic version.
  The Sign-up dashboard needs a local server: `python3 -m http.server 8000`, then
  http://localhost:8000/dashboard.html (online only; see README "Sign-up dashboard").
- Lint: none configured.
- Test: `node --test` (Node 24 or later; files in `tests/*.test.js`; no packages;
  development only, ADR-0006). CI runs the same command on every pull request into `main`,
  on Node 24 and 26, and reports pass or fail; it is not required before merge. For
  anything Node can't reach, verify manually in a browser (see Verification).
- Build: none. Never push to `main` directly.
- Deploy: manual. The Cloudflare Pages project `godwitly` is not connected to GitHub, so
  merging to `main` does **not** deploy. Ask the PO first, then copy only the site files
  from `main` (the paths in `deploy-files.txt`) into an empty folder and upload them:
  `git archive main $(git show main:deploy-files.txt) | tar -x -C <empty-folder>`, then
  `npx wrangler@4.153.0 pages deploy <empty-folder> --project-name godwitly --branch main
  --commit-hash "$(git rev-parse main)"`. Check https://godwitly.pages.dev afterwards.

If a command is unavailable or fails, report that accurately.

## Development rules

- Follow established patterns in the relevant part of the codebase.
- Keep changes focused on the requested task.
- Do not modify generated files directly unless the project specifies how.
- Update relevant documentation (`README.md`, the spec Issue) when behavior or setup
  changes.
- All user-facing text goes in `js/translations.js`; update both `en` and `ar` together.
- A translation key in JavaScript is one complete string, such as `t("form.messageLeft")`,
  never built from pieces. `tests/checks.js` checks this and lists what it can't detect. A
  dotted string that isn't a key goes in its exception list, with the reason.
- Form rules exist in both `js/form.js` (the Message length in `js/message-length.js`) and
  the Supabase migration; change them together.
- The page must keep working when opened by double-click (`file://`) and on Cloudflare
  Pages. Exception: `dashboard.html` works online only (ADR-0005).

## Web app and design

- Follow the project's design system (`css/styles.css`) and existing UI patterns.
- Support current desktop and mobile browsers, down to a 320px screen width.
- Use semantic HTML and ensure keyboard access to interactive controls.
- Support both English (LTR) and Arabic (RTL); check every UI change in both.
- Avoid adding functionality or product claims that are not in scope.

## Security and data

- Do not commit secrets, tokens or personal data. Never commit the Supabase database
  password (stored in the macOS Keychain as `supabase-godwitly-db-password`) or the
  secret / service_role key. Only the publishable key belongs in `js/config.js`.
- Validate input and enforce access control at the appropriate server boundary. The
  public key may only insert into `launch_signups`, and the database enforces the
  field checks. Signed-in Sign-up viewers (Google sign-in only) may SELECT
  `launch_signups` through RLS; nobody else can read it. Only the Project owner manages
  the Sign-up viewers list, and never in Git.
- Follow project requirements for authentication, privacy and logging (see `README.md`),
  including deleting old sign-ups about 12 months after launch.
- Do not expose sensitive information in logs or error messages.

## Verification

- Run checks relevant to the change.
- Test user-facing behavior affected by the change.
- For UI changes, inspect the relevant layouts and interaction states in English and
  Arabic, on desktop and at 320px width.
- Report tests that were not run and explain why.
- Do not claim a check passed unless it was actually run.
- Save the diff review as described in Workflow, "Diff review".

## Boundaries

- Work within the scope of the current task.
- Preserve unrelated user changes.
- Ask the PO before:
  - adding any dependency, library, CDN script or build tool;
  - creating or applying Supabase migrations, or changing data in the live `godwitly`
    project;
  - pushing branches, opening PRs or merging to `main`;
  - changing the form's personal-data fields, consent text or data retention;
  - deploying or taking any other action that affects production.
- Follow the project's rules for adding dependencies, migrations and Git actions.

## Completion report

When finished, explain:

1. What changed and why.
2. What was tested and the result.
3. Any remaining limitations, failures or decisions.

## Agent skills

The Workflow names skills by path, because other skill collections also use names like
`retro` or `review`. Who starts each one: "Who starts a skill". Besides the step skills in
the table, it uses:

- `.claude/skills/ask-matt/SKILL.md`: the map of the flow;
- `.claude/skills/tdd/SKILL.md`: test-first building, called by step 7;
- `.claude/skills/triage/SKILL.md` and `.claude/skills/diagnosing-bugs/SKILL.md`: the
  on-ramps (see "One gate for every route");
- `.claude/skills/wayfinder/SKILL.md`: for a huge, foggy effort; it ends at step 3;
- `.claude/skills/writing-for-agents/SKILL.md`: for editing this file or a skill;
- `.claude/skills/domain-modeling/SKILL.md` and `.claude/skills/codebase-design/SKILL.md`:
  shared vocabulary.

### Issue tracker

Issues live in GitHub Issues for `sherifabdelrahiem/Godwitly` (via the `gh` CLI). See `docs/agents/issue-tracker.md`.

### Triage labels

Default vocabulary: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `GLOSSARY.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`.
