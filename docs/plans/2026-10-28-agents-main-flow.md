# Plan — Adopt the Matt Pocock "Skills For Real Engineers" main flow in AGENTS.md

> Status: **DRAFT v1**, waiting for PO approval · 2026-10-28
> Branch: `docs/agents-main-flow` (from `main`) → PR → merge to `main`
> Decisions come from a grilling session with the PO on 2026-10-28 (Q1–Q9, R1–R4 below).

```text
LANE: Standard — documentation and process only. No site files, data, Supabase or deploy.
```

## Goal

Change the workflow in `AGENTS.md` so that new work follows the main flow of the installed
Matt Pocock skills (`.claude/skills/ask-matt/SKILL.md`, "The main flow: idea → ship"):

```text
grill-with-docs → (prototype) → to-spec → [Codex gate if Critical] → PO approval
→ to-tickets (multi-session only) → implement / implement-spec (tdd) → code-review → pr → retro
```

The project's own safeguards stay in place: the lanes, the Codex gate, PO approvals and the
"ask first" list. Work that is already approved, such as the Sign-up dashboard, finishes
under the current process.

## Decisions (PO, 2026-10-28)

| # | Decision |
|---|---|
| Q1 | **The spec is a GitHub Issue**, created with `/to-spec`. It is the authoritative plan of record for new work. Existing `docs/plans/` files stay as history. The PO's approval is recorded against the spec's **current version**. A `ready-for-agent` label alone **never** counts as approval. |
| Q2 | The **Critical/Standard lanes stay**. Critical work runs in this order: draft spec → Codex gate → resolve findings → PO approval → tickets or implementation. Gate reports stay in `docs/reviews/`. |
| Q3 | **PO approval of the spec comes before any implementation.** The existing "ask first" list is unchanged: migrations, dependencies, Git actions (push, PR, merge), deploys, personal-data fields, consent and retention. |
| Q4 | Tests use **Node's built-in runner (`node --test`), with no package dependencies.** Adopting a runner does not make the existing browser code testable. **The behaviour to test is agreed (in the spec) before any code is restructured.** Node tests cannot prove Supabase permissions, Google sign-in or browser layouts. Those stay manual or SQL checks. |
| Q5 | **`code-review` (Standards + Spec) is the required diff review.** Its report is saved in `docs/reviews/` and names the **reviewed commit** and the **spec version**. Every finding must be **resolved or explicitly accepted by the PO** before merge. |
| Q6 | **Every change has a spec, sized to the change.** A wording fix needs only a short problem statement, the intended change and acceptance checks, not a long interview. `/to-tickets` is used only for multi-session work. |
| Q7 | **`retro` after each build.** It is brief when nothing significant went wrong. Its suggestions become **proposed work**, which goes through the flow, and never trigger tooling or `AGENTS.md` changes automatically. On-ramps: `triage` for issues the PO didn't create, and `diagnosing-bugs` for hard bugs. |
| Q8 | `AGENTS.md` **points to the installed skill files by path** (`.claude/skills/<name>/SKILL.md`, source `mattpocock/skills` in `skills-lock.json`) instead of bare slash names, because other skill collections also provide `retro`, `review` and similar names. It points rather than copies, so the text doesn't drift. |
| Q9 | Work approved before this change merges (the Sign-up dashboard) **finishes under the current process**. The new flow applies to work that starts after this change merges. |
| R1 | Comments the agent writes on GitHub are posted through the PO's own `gh` login, so they **always start with the label `[Agent]`**. An agent-written approval record names the **exact spec version and the approval date**, and records an approval the PO actually gave in the session. The agent never infers approval. The PO may instead approve by commenting on the Issue themselves. |
| R2 | The spec Issue starts with `Spec version: vN` and ends with a short **Changes** list. Any material change to **scope, data, permissions, acceptance criteria or behaviour** bumps the version and needs new approval. Approval applies **only to the named version**. Typo fixes don't bump it. |
| R3 | **ADR-0006** records `node --test` as a **development-only** requirement. The site itself keeps ADR-0001's no-build, double-click setup. Checked on 2026-10-28: ADR-0006 is unused on every local and remote branch, and there are no open PRs. |
| R4 | This change is on its own branch from `main`. When it merges after (or before) the dashboard branch, **the dashboard's `AGENTS.md` changes are preserved**, and the **combined `AGENTS.md` is reviewed as a whole**, not assumed to be a small conflict. |

## Open question for the PO

- **R5. The skills aren't in Git.** `.gitignore` excludes `.claude/`, `.agents/` and
  `skills-lock.json` (checked 2026-10-28). The installed skills are symlinks from
  `.claude/skills/<name>` to `.agents/skills/<name>`, and they exist only on the PO's
  machine. If `AGENTS.md` points to those paths, they won't resolve in a fresh clone.
  The options:
  - **(a)** Stop ignoring `skills-lock.json` and commit it, so the exact skill versions and
    hashes are pinned. Document the install command in `AGENTS.md`, and keep the skill
    files themselves ignored.
  - **(b)** Commit the skill files too.
  - **(c)** Leave everything ignored, and state in `AGENTS.md` that the skills are a local
    install on the PO's machine.

  The exact install or restore command for (a) is checked before it goes into `AGENTS.md`.

## Changes

### `AGENTS.md`

Written with `.claude/skills/writing-for-agents/SKILL.md`. Only these parts change:

1. **"Sources of truth"**:
   - Product requirements are spec Issues on GitHub; `docs/plans/` is history for work
     approved before this change.
   - Task tracking points to the new "Workflow" section.
2. **"Task tracking" is replaced by a "Workflow" section:**
   - The ordered main flow above. Each step names its skill file path, says what it
     produces and where that is stored (glossary or ADR, spec Issue, tickets, branch,
     `docs/reviews/`).
   - The two lanes, and the Critical order (Q2).
   - The approval rules (Q1, Q3, R1, R2), including the `[Agent]` label and "a label is
     never approval".
   - Proportional specs (Q6), and tickets only for multi-session work.
   - The code-review rule (Q5): commit and spec version in the report, findings resolved or
     accepted before merge.
   - Retro (Q7) and the on-ramps (`triage`, `diagnosing-bugs`), and `wayfinder` for huge,
     foggy efforts.
   - Context hygiene in one line: keep grilling, spec and tickets in one context window,
     and start each `implement` fresh. A pointer to `ask-matt` and its PHASE-BOUNDARIES.md
     covers the rest.
   - Transition (Q9).
3. **"Development commands" → Test:**
   - `node --test` once tests exist, with no packages and a development-only requirement
     (ADR-0006).
   - The behaviour to test is agreed in the spec first.
   - What Node tests can't prove (Q4).
4. **"Verification":** a reference to the code-review report requirement. The browser, SQL
   and EN/AR checks stay as they are.
5. **"Agent skills":** a short pointer list naming the installed Matt Pocock skill files the
   workflow uses, and a note that bare slash names may route to other collections.

Everything else stays word for word: the project overview, structure, development rules,
web and design, security and data, boundaries and completion report.

### `docs/adr/0006-node-test-runner-for-development-only.md` (new)

What's decided, why, and the alternatives considered:

- **Decided:** `node --test`, with no npm packages, as a development-only requirement.
- **Why:** the skills' `tdd` / `implement` need a test seam.
- **Alternatives considered:** Playwright needs a `package.json` dependency, and having no
  tests would leave `tdd` with nothing to drive.
- **Consequences:**
  - The site still opens by double-click.
  - Tests cover only logic that can run in Node.
  - Supabase, Google sign-in and layout stay manual or SQL checks.
  - Restructuring browser code for testability needs agreement in the spec first.

### `docs/agents/issue-tracker.md`

Add the R1 and R2 conventions: the `[Agent]` comment label, the `Spec version: vN` line,
the Changes list, and the approval-record format:

`[Agent] PO approval recorded: spec vN, approved in session on YYYY-MM-DD.`

### `README.md`

None, unless a contributor-facing workflow note is needed. The README describes the site,
not the agent process. This will be checked in review.

## Acceptance checks

1. `AGENTS.md` names every main-flow step in order, with its `.claude/skills/<name>/SKILL.md`
   path. Every named path exists in the local install, and a fresh clone can get the skills
   in the way R5 decides.
2. The Critical order reads exactly: draft spec → Codex gate → resolve findings → PO
   approval → tickets or implementation.
3. The approval rules state: approval is tied to the named spec version; material changes to
   scope, data, permissions, acceptance criteria or behaviour need new approval; a label is
   never approval; agent-written comments start with `[Agent]`, and an agent-written approval
   record names the version and date and records an approval the PO actually gave.
4. The "ask first" list in **Boundaries** is unchanged, word for word (`git diff` shows no
   change in that section).
5. The code-review rule requires the reviewed commit and spec version in the report, and
   findings resolved or accepted before merge.
6. ADR-0006 exists, keeps ADR-0001's no-build rule for the site, and states what Node tests
   can't prove.
7. No bare slash-command name appears in `AGENTS.md` without its skill file path, apart
   from inside the pointer list.
8. The transition rule (Q9) is stated, and the dashboard plan in `docs/plans/` is not
   changed by this branch.
9. A `code-review` of this branch against `main`, naming the commit and this plan's version,
   is saved in `docs/reviews/`, with findings resolved or accepted.
10. **Merge check (R4):** after both this branch and `feat/signup-dashboard` are on `main`,
    `AGENTS.md` still contains the dashboard's additions:
    - `dashboard.html` and `_headers` in the deploy archive command;
    - the `python3 -m http.server 8000` run-locally line;
    - the `file://` exception for ADR-0005;
    - the Sign-up viewer SELECT line in Security and data;
    - the new files in Project structure.

    The combined file is read as a whole, and its review is recorded.

## Release

Commit on `docs/agents-main-flow` → `code-review` → (PO approval) push → PR → the PO merges.
No deploy, because no site files change.
