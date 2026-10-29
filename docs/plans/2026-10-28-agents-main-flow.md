# Plan — Adopt the Matt Pocock "Skills For Real Engineers" main flow in AGENTS.md

> Status: **DRAFT v3**, waiting for a Codex re-review, then PO approval (A2) · 2026-10-29
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
- **v3 (2026-10-29):** fixes Codex round 2
  (`docs/reviews/2026-10-29-agents-main-flow-codex-review-r2.md`, NEEDS CHANGES, 1×P1,
  4×P2; round 1: 5 closed, 5 partial) as F11–F15:
  - **F11:** closing any issue always needs explicit approval, including closure by a PR's
    closing keyword;
  - **F12:** the PO-only rule covers every skill marked `disable-model-invocation: true`,
    not only the nine in the workflow;
  - **F13:** one exact hash lifecycle;
  - **F14:** acceptance checks that can actually pass, and a correct `.gitignore`
    pattern;
  - **F15:** review evidence commits are separate from reviewed content.

  The R5 evidence is now kept in `docs/reviews/2026-10-29-agents-main-flow-r5-evidence.md`,
  pinned to an upstream commit.

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
| R3 | **ADR-0006** records `node --test` as a **development-only** requirement. The site keeps ADR-0001's no-build, double-click setup. Re-checked online on 2026-10-29 (`ls docs/adr` on `main`, `git ls-remote --heads origin`, `gh pr list --state open`): ADR-0006 is unused and there are no open PRs. Re-check when implementation starts. |
| R4 | This change sits on its own branch from `main`. The dashboard's `AGENTS.md` changes are preserved, and the **combined `AGENTS.md` is reviewed as a whole**. Now a pre-merge check against current `main` (F6). |

### PO, 2026-10-29

| # | Decision |
|---|---|
| R5 | **(b): commit the skill files**, with the upstream MIT licence. **Evidence** (read-only investigation, nothing installed): `skills-lock.json` records only source, path and content hash for each of 38 skills, with **no commit or version**. The documented restore, `npx skills experimental_install`, is **experimental**, fetches from the source, fails with `--frozen-lockfile` when content differs, and **does not create the `.claude/skills` links**. 7 of the 38 installed `SKILL.md` files already differ from upstream `main` (including `code-review` and `implement-spec`), so exact restoration cannot be demonstrated. `mattpocock/skills` is MIT, © 2026 Matt Pocock; the installed copies carry no licence file. The evidence, pinned to upstream commit `a496f55`, is in `docs/reviews/2026-10-29-agents-main-flow-r5-evidence.md`. |
| R6 | **Explicit human transitions.** The rule is the frontmatter: **every** skill marked `disable-model-invocation: true` (23 of the 38 installed) is started **only by the PO** with its slash command (F12). The workflow uses nine of them: `ask-matt`, `grill-with-docs`, `to-spec`, `to-tickets`, `implement`, `implement-spec`, `retro`, `triage` and `wayfinder`. The agent recommends the next command, explains what it will do, then **stops and waits**. It never reads such a skill's file to run it on its own. The agent may start `code-review`, `tdd`, `pr` and `diagnosing-bugs` itself, within the gates below. When a PO-started skill calls one of these (for example `implement` calls `tdd` and `code-review`), that call continues without a new transition. The project's commit-before-review rule (F5) still applies. |
| F1–F15 | The fifteen Codex findings (rounds 1 and 2) are accepted as requirements (see "Traceability"). |

## Changes

### 1. Skill files in Git (R5)

- **`.gitignore` (F14).**
  - Remove the lines `.agents/`, `.claude/` and `skills-lock.json`.
  - Add `/.claude/*` and `!/.claude/skills/`. Git cannot re-include a child of an ignored
    directory, so the directory's *contents* are ignored instead. Everything else in
    `.claude/` (local settings) stays ignored.
  - `skills-lock.json` is committed as a record of where each skill came from, not as a
    restore mechanism.
- Commit `.agents/skills/` (103 files; 266,243 bytes of content) and the 38
  `.claude/skills/<name>` relative symlinks exactly as installed on 2026-10-27, with no
  edits. Existing attribution files, such as `pr/CREDITS.md`, are kept.
- **Add two files:**
  - `.agents/skills/LICENSE`: the complete upstream MIT licence text;
  - a short `.agents/skills/README.md`. It says:
    - where the files come from (`mattpocock/skills`, installed 2026-10-27, recorded in
      `skills-lock.json`, compared with upstream commit `a496f55` in the R5 evidence);
    - that they are **vendored and not edited here**;
    - that updating them is a normal Standard change: re-install, review the diff,
      commit.

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
   - **Spec versions (R2, F4, F13).**
     - **The hash.** The spec hash is the full SHA-256 printed by exactly this command:
       `gh issue view <n> --json body --jq .body | shasum -a 256`. That covers the Issue
       body as `gh` prints it, including its final newline. Abbreviations are for display
       only.
     - **Where it's stored.** The hash is recorded **outside** the body: in the approval
       comment, the Codex gate report and each ticket, next to `Spec version: vN`. The
       body never contains its own hash.
     - **Frozen once approved.** After approval, the spec body is frozen. Any edit changes
       the hash:
       - A **non-material** edit (a typo) keeps the version number but needs a new approval
         record with the new hash. The PO may give it in one line, for example
         "re-approve v2, typo only".
       - A **material** change (scope, data, permissions, acceptance criteria or
         behaviour) bumps the version and needs full re-approval. A Critical change also
         goes back through the Codex gate. Tickets made from an older version are updated
         or closed, with the PO's approval (F11).
     - **Checked before implementation.** The agent re-runs the command and checks the
       hash against the latest approval record, and checks the tickets still match the
       spec. If they differ, it stops.
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
     4. **Reviewed content vs evidence (F15).**
        - Any later change to **code, site files, the spec, `AGENTS.md` or other workflow
          files** gets a new review of that change before merge.
        - A commit that only adds or updates **review evidence** (the report and its
          finding outcomes in `docs/reviews/`) needs no further review.
        - The report records both the reviewed commit and the final evidence commit.
        - A report that also changes a rule or policy is not evidence-only.
   - **External actions (F9).** Starting a skill **never authorises its external
     actions**. Each of these needs the PO's approval for that specific action, in the
     session:
     - pushing a branch;
     - opening a PR, including `implement-spec`'s draft PR;
     - merging;
     - deploying;
     - **closing any issue (F11)**, including closure caused by a PR's closing keyword
       (`Closes #n`) or by `implement-spec` resolving tickets. Approval of the spec or of
       the implementation, or starting a skill, never implies it. The PO may approve a
       named list of issues in one message. Without that approval, a PR says
       `Refs #n`, not `Closes #n`;
     - relabelling or editing an issue the PO didn't ask to change;
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
  - the approval-record format, with the **full** hash (F13):
    `[Agent] PO approval recorded: spec vN, sha256 <64 hex>, approved in session on YYYY-MM-DD.`
  - tickets name their parent spec version and hash;
  - the external-action rule (F9), including the closure rule and `Refs #n` vs
    `Closes #n` (F11).
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
| F11 [P1] | Closing any issue, including by `Closes #n`, needs explicit approval | 2.2 external actions, 4 | AC5 (h), AC11 |
| F12 [P2] | PO-only rule is the frontmatter itself (23 skills); workflow subset named | R6, 2.2 steps | AC2 |
| F13 [P2] | One hash command, stored outside the body, full digest, frozen body | 2.2 spec versions, 4 | AC6 |
| F14 [P2] | Checks that can pass; `.gitignore` pattern; symlinks verified | 1, AC3, AC4, AC8, AC12 | AC3, AC4, AC8, AC12 |
| F15 [P2] | Evidence-only commits separate from reviewed content | 2.2 diff review | AC7, AC15 |

## Acceptance checks

1. **Main flow.** `AGENTS.md` names every main-flow step in order, each with its
   `.claude/skills/<name>/SKILL.md` path. Every named path exists **in the committed
   files**.
2. **Who starts each step (F1, F12).**
   - Each step states who starts it.
   - `AGENTS.md` states the frontmatter rule: every skill with
     `disable-model-invocation: true` is PO-started. `grep -l 'disable-model-invocation: true'
     .agents/skills/*/SKILL.md` lists 23 skills, and each of the nine workflow skills in R6
     is among them.
   - The agent's stop-and-wait rule is stated, and so is the rule that model-invocable
     skills called from inside a PO-started skill continue.
3. **Fresh clone (F2, F14).** On a fresh `git clone` of the branch into a temporary folder:
   - **The 103 installed files are byte-identical to the local install.** A manifest of
     `shasum -a 256` for every file under `.agents/skills/`, taken before the commit, is
     compared with the clone's. `LICENSE` and `README.md` are left out, because they are
     new.
   - `LICENSE` matches the upstream text in the R5 evidence file, and `README.md` exists.
   - Each of the 38 `.claude/skills/<name>` entries is a symlink with mode `120000`
     (`git ls-files -s`), has a relative target, and resolves in the clone.
   - **The lock file is consistent in structure.** Every entry has a directory, its source
     is `mattpocock/skills`, and its `skillPath` ends in `<name>/SKILL.md`. The lock's
     `computedHash` is not used: its algorithm isn't documented, and a plain SHA-256 of
     `SKILL.md` matches 0 of 38.
4. **Only the skills un-ignored (F14).**
   - `git check-ignore -v .claude/settings.local.json` reports it as ignored by
     `/.claude/*`.
   - `git check-ignore .claude/skills/tdd` reports nothing.
   - `git ls-files .claude | grep -v '^.claude/skills/'` prints nothing.
5. **Scenarios (F3, F10).** A walkthrough table in the review shows, for each scenario,
   the route through `AGENTS.md` and where the gate applies:
   - **(a)** a wording fix;
   - **(b)** a Critical Supabase change;
   - **(c)** a `ready-for-agent` issue with no approved spec;
   - **(d)** a spec changed after approval;
   - **(e)** a missing skill;
   - **(f)** a bug found by `diagnosing-bugs`;
   - **(g)** a fix made after `code-review`;
   - **(h)** an agent-created ticket whose PR would close it on merge.

   Each one ends at the correct gate or stop.
6. **Spec versions (F4, F13).** The rules state:
   - the exact hash command, the full digest, and storage outside the body;
   - version + hash in the approval, the gate report and the tickets;
   - a frozen body after approval, a one-line re-approval for a typo, and full
     re-approval with a new version for a material change;
   - a Codex re-gate for Critical changes;
   - a hash check before implementation;
   - stale tickets reconciled with the PO's approval.

   **Local fixture:** the hash command, run twice on one unchanged existing issue, gives
   the same digest. Run on three local text samples (unchanged, typo, material change),
   `shasum -a 256` gives three different digests for the edited ones. Both are recorded
   in the review.
7. **Diff review (F5, F15).** The rule requires:
   - commit first;
   - base, the reviewed commit, the final evidence commit, and the spec version and hash
     in the report;
   - both axes;
   - one outcome per finding;
   - re-review of later content changes;
   - evidence-only commits exempt from re-review.
8. **Current `main` (F6, F14).** Each protected section of `AGENTS.md` is extracted from
   both `origin/main` and the branch, from its `## ` heading to the next one, and compared
   with `diff`. These sections must be **identical**: Project overview, Web app and design,
   Security and data, Boundaries, Completion report.

   In the changed sections, every dashboard addition is still present:
   - `dashboard.html` and `_headers` in the deploy command;
   - the `python3 -m http.server 8000` line;
   - the `file://` exception;
   - the Sign-up viewer SELECT line;
   - the dashboard files in Project structure;
   - the ADR-0005 mention.

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
11. **External actions (F9, F11).**
    - The authorisation list covers:
      - push;
      - PR, including a draft PR;
      - merge;
      - deploy;
      - closing any issue, including by a closing keyword;
      - other issue changes;
      - research branches.
    - `pr` is drafting only.
    - `Refs #n` is used until closure is approved.
    - The `[Agent]` + triage-disclaimer format is stated.
12. **Pointers (F10, F14).** No active text tells new work to put plans in `docs/plans/`.
    `grep -n "docs/plans" AGENTS.md README.md docs/agents/*.md` shows only two kinds of
    hit:
    - history wording;
    - citations of a specific older plan, such as the README's link to the dashboard
      plan.

    `triage-labels.md` carries the approval note.
13. **Slash names.** No bare slash-command name appears in `AGENTS.md` without its skill
    path, apart from the pointer list and the PO-started commands.
14. **Transition (Q9).** The rule is stated. No existing plan in `docs/plans/` is changed,
    except this one.
15. **Diff review.** A `code-review` of this branch against `main` is saved in
    `docs/reviews/`, following rules F5 and F15. It names the reviewed commit and the final
    evidence commit, and every finding is resolved or accepted.

## Release

1. Codex re-review of v3. Any findings are fixed or answered before approval.
2. PO approval of the final version (A2), recorded with its date.
3. Implementation on `docs/agents-main-flow`, then the diff review.
4. PO approval, then push and PR.
5. The PO merges.

No deploy, because no site files change.
