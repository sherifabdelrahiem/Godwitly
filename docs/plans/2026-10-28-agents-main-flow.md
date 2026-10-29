# Plan — Adopt the Matt Pocock "Skills For Real Engineers" main flow in AGENTS.md

> Status: **DRAFT v2**, waiting for a Codex re-review, then PO approval (A2) · 2026-10-29
> Branch: `docs/agents-main-flow`, rebuilt on `main` at `d090b6b` → PR → merge to `main`
> Decisions: grilling session with the PO on 2026-10-28 (Q1–Q9, R1–R4); PO decisions on
> 2026-10-29 (R5, R6, and the ten Codex findings F1–F10 accepted as requirements).
> The PO's 2026-10-29 message authorises preparing and reviewing this plan only.
> Implementation needs a separate approval of the final version.

```text
LANE: Standard — documentation and process only. No site files, data, Supabase or deploy.
```

## History

- **v1 (2026-10-28):** the first draft after the grilling session.
- **v2 (2026-10-29):** rebuilt on current `main` (it now holds the Sign-up dashboard's
  `AGENTS.md` changes). Adds R5 = (b) and R6 = explicit human transitions. Turns the
  Codex cross-agent review
  (`docs/reviews/2026-10-29-agents-main-flow-codex-review.md`, NEEDS CHANGES, 5×P1, 5×P2)
  into requirements F1–F10. Each one is mapped to a section and an acceptance check under
  "Traceability".

## Goal

Change the workflow in `AGENTS.md` so that new work follows the main flow of the installed
Matt Pocock skills (`.claude/skills/ask-matt/SKILL.md`, "The main flow: idea → ship"):

```text
grill-with-docs → (prototype) → to-spec → [Codex gate if Critical] → PO approval
→ to-tickets (multi-session only) → implement / implement-spec (tdd where it applies)
→ code-review → pr → retro
```

The project's own safeguards stay: the lanes, the Codex gate, PO approvals and the
"ask first" list. Work that is already approved finishes under the current process.

## Decisions

### PO, 2026-10-28 (grilling)

| # | Decision |
|---|---|
| Q1 | **The spec is a GitHub Issue**, created with `/to-spec`. It is the authoritative plan of record for new work. Existing `docs/plans/` files stay as history. The PO's approval is recorded against the spec's **current version**. A `ready-for-agent` label alone **never** counts as approval. |
| Q2 | The **Critical/Standard lanes stay**. Critical work runs in this order: draft spec → Codex gate → resolve findings → PO approval → tickets or implementation. Gate reports stay in `docs/reviews/`. |
| Q3 | **PO approval of the spec comes before any implementation.** The existing "ask first" list is unchanged: migrations, dependencies, Git actions (push, PR, merge), deploys, personal-data fields, consent and retention. |
| Q4 | Tests use **Node's built-in runner (`node --test`), with no package dependencies.** Adopting a runner does not make the existing browser code testable. **The behaviour to test is agreed (in the spec) before any code is restructured.** Node tests cannot prove Supabase permissions, Google sign-in or browser layouts; those stay manual or SQL checks. |
| Q5 | **`code-review` (Standards + Spec) is the required diff review.** Its report is saved in `docs/reviews/` and names the **reviewed commit** and the **spec version**. Every finding must be **resolved or explicitly accepted by the PO** before merge. See F5 for how the project runs it. |
| Q6 | **Every change has a spec, sized to the change.** A wording fix needs only a short problem statement, the intended change and acceptance checks. `/to-tickets` is used only for multi-session work. See F8. |
| Q7 | **`retro` after each build.** It is brief when nothing significant went wrong. Its suggestions become **proposed work**, which goes through the flow, and never trigger tooling or `AGENTS.md` changes automatically. On-ramps: `triage` for issues the PO didn't create, and `diagnosing-bugs` for hard bugs (both rejoin the flow, F3). |
| Q8 | `AGENTS.md` **points to the skill files by path** (`.claude/skills/<name>/SKILL.md`) instead of bare slash names, because other collections also provide `retro`, `review` and similar names. It points rather than copies, so the text doesn't drift. |
| Q9 | Work approved before this change merges **finishes under the current process**. The new flow applies to work that starts after this change merges. |
| R1 | Comments the agent writes on GitHub are posted through the PO's own `gh` login, so they **always start with the label `[Agent]`**. An agent-written approval record names the **exact spec version and the approval date**, and records an approval the PO actually gave in the session. The agent never infers approval. The PO may instead approve by commenting on the Issue themselves. |
| R2 | The spec Issue starts with `Spec version: vN` and ends with a short **Changes** list. Any material change to **scope, data, permissions, acceptance criteria or behaviour** bumps the version and needs new approval. Approval applies **only to the named version**. Typo fixes don't bump it. See F4. |
| R3 | **ADR-0006** records `node --test` as a **development-only** requirement. The site keeps ADR-0001's no-build, double-click setup. Re-checked 2026-10-29: ADR-0006 is unused on `main` and on every remote branch, and there are no open PRs. |
| R4 | This change sits on its own branch from `main`. The dashboard's `AGENTS.md` changes are preserved, and the **combined `AGENTS.md` is reviewed as a whole**. Now a pre-merge check against current `main` (F6). |

### PO, 2026-10-29

| # | Decision |
|---|---|
| R5 | **(b): commit the skill files**, with the upstream MIT licence. **Evidence** (read-only investigation, nothing installed): `skills-lock.json` records only source, path and content hash for each of 38 skills, with **no commit or version**. The documented restore, `npx skills experimental_install`, is **experimental**, fetches from the source, fails with `--frozen-lockfile` when content differs, and **does not create the `.claude/skills` links**. 7 of the 38 installed `SKILL.md` files already differ from upstream `main` (including `code-review` and `implement-spec`), so exact restoration cannot be demonstrated. `mattpocock/skills` is MIT, © 2026 Matt Pocock; the installed copies carry no licence file. |
| R6 | **Explicit human transitions.** Skills marked `disable-model-invocation: true` are started **only by the PO** with their slash command: `ask-matt`, `grill-with-docs`, `to-spec`, `to-tickets`, `implement`, `implement-spec`, `retro`, `triage` and `wayfinder`. The agent recommends the next command, explains what it will do, then **stops and waits**. It never reads such a skill's file to run it on its own. The agent may start `code-review`, `tdd`, `pr` and `diagnosing-bugs` itself, within the gates below. |
| F1–F10 | The ten Codex findings are accepted as requirements (see "Traceability"). |

## Changes

### 1. Skill files in Git (R5)

- `.gitignore`: stop ignoring `.agents/` and `.claude/skills/`. Keep ignoring the rest of
  `.claude/` (local settings). Keep `skills-lock.json` and commit it as a record of where
  each skill came from, not as a restore mechanism.
- Commit `.agents/skills/` (103 files, 544 KB) and the `.claude/skills/<name>` symlinks
  exactly as installed on 2026-10-27, with no edits.
- Add `.agents/skills/LICENSE`, the upstream MIT licence text, and a short
  `.agents/skills/README.md`. It says where the files come from (`mattpocock/skills`, the
  install date, and the lock file). It says they are **vendored and not edited here**, and
  that updating them is a normal Standard change: re-install, review the diff, commit.
- Before committing, check that the files match the local install and `skills-lock.json`.
  Every lock entry has a directory, and every symlink resolves.

### 2. `AGENTS.md`

Written with `.claude/skills/writing-for-agents/SKILL.md`. It is edited on top of current
`main`, and every dashboard addition is kept.

1. **Sources of truth:**
   - Product requirements: spec Issues on GitHub (new work). `docs/plans/` holds approved
     plans from before this change (history).
   - Architecture: `README.md`, `docs/adr/`, and the relevant spec Issue (or, for older
     work, its plan).
   - Task tracking points to the new **Workflow** section.
2. **New "Workflow" section** (replaces the current numbered workflow):
   - **The steps, in order.** For each step:
     - its skill path;
     - **who starts it** (PO slash command, or the agent);
     - what it produces and where that is stored;
     - **where the agent stops** (R6, F1).
   - **The lanes,** and the Critical order (Q2).
   - **One gate for every route (F3).** Every implementation route rejoins the same
     sequence before any code changes: versioned spec → lane → Codex gate if Critical →
     PO approval. This covers:
     - the main flow;
     - `triage`'s agent brief, which either becomes the spec or links to it;
     - `diagnosing-bugs`, which may reproduce and collect evidence but not fix;
     - `ready-for-agent` issues;
     - `retro` suggestions.
   - **Spec versions (R2, F4).**
     - The approval record, the Codex gate report and every ticket name the same
       `Spec version: vN` **and the spec's content hash**: SHA-256 of the Issue body, taken
       with `gh issue view <n> --json body --jq .body | shasum -a 256`.
     - Before implementation starts, the agent checks that the hash still matches the
       approved one, and that the tickets still match the spec.
     - A material change (scope, data, permissions, acceptance criteria or behaviour)
       bumps the version. A Critical change also goes back through the Codex gate. Tickets
       made from an older version are updated or closed.
   - **Short specs (Q6, F8).** The project overrides `to-spec`'s long default. For a
     small Standard change, a spec is:
     - the problem;
     - the intended change;
     - the acceptance checks;
     - the lane.

     User stories are optional. Multi-session work uses the full format and `to-tickets`.
   - **Tests (Q4, F7).**
     - `tdd` runs where a behaviour can be tested at a seam agreed in the spec.
     - Where it can't (wording, CSS, docs, Supabase permissions, Google sign-in, layout),
       the spec names the manual, SQL or browser checks instead, and the review records
       "TDD: not applicable" with the reason.
     - There is no typechecker, so typechecking is "not applicable".
   - **Diff review (Q5, F5).**
     1. Commit the work first.
     2. Run `code-review` against a named base commit and the approved spec version.
     3. Save the report in `docs/reviews/`, naming:
        - the base, the reviewed `HEAD` commit, and the spec version and hash;
        - both review axes;
        - one outcome per finding: fixed (with its commit), or accepted by the PO
          (with the date).
     4. Any change after the review gets a new review of that change before merge.
   - **External actions (F9).** Starting a skill **never authorises its external
     actions**. Each of these needs the PO's approval for that specific action, in the
     session:
     - pushing a branch;
     - opening a PR, including `implement-spec`'s draft PR;
     - merging;
     - deploying;
     - closing, relabelling or editing an issue the PO didn't ask to change;
     - `wayfinder` pushing a research branch.

     `pr` only drafts a PR body; publishing it is a separate approved action. The
     agent may create issues and comments when the PO asks, labelled `[Agent]` (R1).
     Triage posts start with `[Agent]`, then the triage AI disclaimer on the next line.
   - **Retro (Q7, F8).**
     - It runs once per completed feature, after the merge: a short review of the
       session that built it. It doesn't run per ticket or for small wording fixes.
     - Its suggestions become proposed work (Q7).
     - The session's evidence (review reports, test results) is saved in
       `docs/reviews/` before the context is cleared.
   - **Context.** Grilling, spec and tickets happen in one context window. Each ticket's
     `implement` starts in a fresh session. A single-session change stays in its context.
     For anything else, see `ask-matt` and its PHASE-BOUNDARIES.md.
   - **Missing skills (F2).** If `.claude/skills/<name>/SKILL.md` is missing, the agent
     stops and reports it. It doesn't improvise the step.
   - **Transition (Q9).**
3. **Development commands → Test:**
   - `node --test`, once tests exist. Node 20 or later (the PO's machine has v25).
   - Test files go in `tests/*.test.js`.
   - Development only (ADR-0006). No packages.
4. **Development rules:** "Update relevant documentation (`README.md`, plans)" becomes
   "(`README.md`, the spec Issue)".
5. **Project structure:**
   - `docs/plans/` becomes "approved plans from before the spec-Issue workflow
     (history)".
   - Add `.agents/skills/` (the vendored skills) and `.claude/skills/` (links to them).
6. **Verification:** add a pointer to the diff-review rule. The browser, SQL and EN/AR
   checks stay.
7. **Agent skills:** a short list of the skill paths the workflow uses. Note that bare
   slash names may route to other collections.

**Boundaries** stays **word for word**. Project overview, Web app and design, Security and
data, and Completion report stay as on current `main`.

### 3. `docs/adr/0006-node-test-runner-for-development-only.md` (new)

- **Decided:** `node --test` with no packages, development-only, Node 20 or later, tests in
  `tests/`.
- **Why:** `tdd` and `implement` need a test seam.
- **Alternatives considered:**
  - Playwright, which needs a `package.json` dependency;
  - no tests at all.
- **Consequences:**
  - The site still opens by double-click.
  - Tests cover only logic that runs in Node.
  - Supabase, Google sign-in and layout stay manual or SQL checks.
  - Restructuring browser code for testability needs agreement in the spec first.

### 4. `docs/agents/issue-tracker.md` and `docs/agents/triage-labels.md`

- **Issue tracker:**
  - the `[Agent]` label;
  - `Spec version: vN`, the content hash and the Changes list;
  - the approval-record format:
    `[Agent] PO approval recorded: spec vN (sha256 <first 12>), approved in session on YYYY-MM-DD.`
  - tickets name their parent spec version;
  - the external-action rule (F9).
- **Triage labels:** `ready-for-agent` gets the note "fully specified; implementation
  still needs an approved spec version (AGENTS.md, Workflow)".

### 5. `README.md`

There's no workflow change for site users. One line in the files table: `.agents/skills/`
holds the vendored agent skills (MIT, see its README).

## Traceability (Codex findings → change → check)

| Finding | Requirement | Section | Acceptance check |
|---|---|---|---|
| F1 [P1] | Each step names who starts it and where the agent stops; restricted skills are PO-only | 2.2 steps, R6 | AC2 |
| F2 [P1] | Fresh clones get the exact skills | 1, R5 | AC3, AC4 |
| F3 [P1] | Every route passes the same spec and approval gate | 2.2 one gate | AC5 (scenarios a–c, f) |
| F4 [P1] | Approval, gate and tickets bound to version + hash; Critical changes re-gated | 2.2 spec versions, 4 | AC6 |
| F5 [P1] | Project wrapper around `code-review` | 2.2 diff review | AC7 |
| F6 [P2] | Built on current `main`; combined file reviewed | whole plan, R4 | AC8 |
| F7 [P2] | TDD has a "not applicable" route; Node version and test location | 2.2 tests, 2.3, 3 | AC9 |
| F8 [P2] | Short-spec override; retro and context timing | 2.2 short specs, retro, context | AC10 |
| F9 [P2] | Starting a skill never authorises external actions | 2.2 external actions, 4 | AC11 |
| F10 [P2] | Every active pointer updated; scenario checks | 2.1, 2.4, 2.5, 4, 5 | AC5, AC12 |

## Acceptance checks

1. **Main flow.** `AGENTS.md` names every main-flow step in order, each with its
   `.claude/skills/<name>/SKILL.md` path. Every named path exists **in the committed
   files**.
2. **Who starts each step (F1).**
   - Each step states who starts it.
   - Every skill with `disable-model-invocation: true` (checked with
     `grep -l 'disable-model-invocation: true' .agents/skills/*/SKILL.md`) is listed as
     PO-started.
   - The agent's stop-and-wait rule is stated.
3. **Fresh clone (F2).** On a fresh `git clone` of the branch into a temporary folder:
   - every `.claude/skills/<name>` link resolves;
   - every `skills-lock.json` entry has its directory;
   - `.agents/skills/LICENSE` exists;
   - the files are byte-identical to the local install (a recursive `diff` shows
     nothing).
4. **Only skills un-ignored.** `git check-ignore .claude/settings.local.json` still
   reports it as ignored. Only `.agents/` and `.claude/skills/` are newly tracked.
5. **Scenarios (F3, F10).** A walkthrough table in the review shows, for each scenario,
   the route through `AGENTS.md` and where the gate applies:
   - **(a)** a wording fix;
   - **(b)** a Critical Supabase change;
   - **(c)** a `ready-for-agent` issue with no approved spec;
   - **(d)** a spec changed after approval;
   - **(e)** a missing skill;
   - **(f)** a bug found by `diagnosing-bugs`;
   - **(g)** a fix made after `code-review`.

   Each one ends at the correct gate or stop.
6. **Spec versions (F4).** The rules state:
   - version + hash in the approval, the gate report and the tickets;
   - a hash check before implementation;
   - re-approval for material changes;
   - a Codex re-gate for Critical ones;
   - stale tickets reconciled.
7. **Diff review (F5).** The rule requires:
   - commit first;
   - base, `HEAD`, and spec version and hash in the report;
   - both axes;
   - one outcome per finding;
   - re-review of later changes.
8. **Current `main` (F6).** `git diff origin/main -- AGENTS.md` shows:
   - every dashboard addition still present (`dashboard.html` and `_headers` in the
     deploy command, the `python3 -m http.server 8000` line, the `file://` exception, the
     Sign-up viewer SELECT line, the dashboard files in Project structure, and the
     ADR-0005 mention);
   - **no change** in Boundaries, Project overview, Web app and design, Security and
     data, and Completion report.

   The combined file is read as a whole, and that read is recorded in the review.
9. **Tests (F7).**
   - ADR-0006 exists, keeps ADR-0001 for the site, names Node 20+ and `tests/`, and
     states what Node tests can't prove.
   - The "TDD: not applicable" route and "typechecking: not applicable" are in
     `AGENTS.md`.
10. **Proportionality (F8).**
    - The short-spec format is stated.
    - `to-tickets` is used only for multi-session work.
    - Retro runs once per completed feature.
    - The context rule matches `ask-matt`.
11. **External actions (F9).**
    - The authorisation list covers push, PR (including draft), merge, deploy, issue
      changes and research branches.
    - `pr` is drafting only.
    - The `[Agent]` + triage-disclaimer format is stated.
12. **Pointers (F10).** No active text still says new plans go in `docs/plans/`
    (`grep -n "docs/plans" AGENTS.md README.md docs/agents/*.md` → only history wording).
    `triage-labels.md` carries the approval note.
13. **Slash names.** No bare slash-command name appears in `AGENTS.md` without its skill
    path, apart from the pointer list and the PO-started commands.
14. **Transition (Q9).** The rule is stated. No existing plan in `docs/plans/` is changed,
    except this one.
15. **Diff review.** A `code-review` of this branch against `main` is saved in
    `docs/reviews/`, following rule F5, with the findings resolved or accepted.

## Release

1. Codex re-review of v2. Its findings are fixed or answered in v3.
2. PO approval of the final version (A2), recorded with its date.
3. Implementation on `docs/agents-main-flow`, then the diff review.
4. PO approval, then push and PR.
5. The PO merges.

No deploy, because no site files change.
