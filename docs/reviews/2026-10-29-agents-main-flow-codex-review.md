# Codex cross-agent review — AGENTS.md main-flow plan (round 1)

> Reviewer: Codex (`codex exec --sandbox read-only`) · Plan: `docs/plans/2026-10-28-agents-main-flow.md` **draft v1** (`cf216d8`) · Baseline: `origin/main` at `d090b6b` · Requested by the PO on 2026-10-29 · Not an approval

Verdict: NEEDS CHANGES — 10 findings: 5 [P1], 5 [P2].

The draft preserves the right safeguards, but it needs explicit adaptations between the installed skills and this project’s approval, testing and review rules.

1. **[P1] The flow cannot run autonomously as written.**  
   Evidence: plan:17–18, 70–83; `grill-with-docs`, `to-spec`, `to-tickets`, `implement`, `implement-spec`, `retro` and `triage` each have `disable-model-invocation: true` at `SKILL.md:4`. So do `ask-matt` and `wayfinder`. `writing-for-agents/SKILL-MECHANICS.md`, “Invocation,” explicitly says neither agents nor other skills can invoke them.  
   **Fix:** label each step’s invocation owner and stopping point. Distinguish native human invocation from any explicitly approved cross-harness adaptation. Merely pointing at a file does not resolve this.

2. **[P1] R5 leaves a required workflow unavailable in fresh clones.**  
   Evidence: plan:36, 45–57, 126–128; `.gitignore:7–9` excludes both skill directories and the lockfile. The inspected `.claude/skills` entries are symlinks into `.agents/skills`. The lockfile contains source paths and `computedHash` values, but no source commit/revision field.  
   **Fix:** resolve R5 before approval. Require a tested restoration procedure, all transitive references, supported harness instructions and explicit behavior when skills are missing. Do not claim that committing this lockfile alone pins retrievable historical versions.

3. **[P1] The on-ramps can bypass the mandatory spec gate.**  
   Evidence: plan:29–31, 35, 79–80; `ask-matt/SKILL.md:46–50` routes triaged issues toward implementation; `triage/SKILL.md:78–90` can mark them agent-ready; `diagnosing-bugs/SKILL.md:114–128` proceeds directly to a fix.  
   **Fix:** state where each on-ramp rejoins the project flow. Diagnosis may establish evidence, but implementation must wait for a versioned spec, lane classification, Critical gate where applicable, and PO approval. A triage brief either becomes that spec or links to it.

4. **[P1] Approval and Critical gate evidence can drift after ticketing or spec changes.**  
   Evidence: plan:38–39, 114–117; `to-tickets/SKILL.md:23–34` may introduce prefactoring after spec approval. Its ticket template does not name an approved parent version. R2 requires renewed PO approval but does not explicitly require renewed Critical review.  
   **Fix:** bind gate reports, approval records and tickets to the same immutable spec snapshot or content hash plus version. Before implementation, verify that tickets still match it. Material Critical changes must return through the Codex gate and PO approval; stale tickets must be reconciled.

5. **[P1] Q5 describes additional obligations that `code-review` does not implement itself.**  
   Evidence: plan:33, 77–78, 137–146; `code-review/SKILL.md:17–32, 76–80` selects a comparison and spec, then presents two reports. It does not require saving them, recording the reviewed HEAD SHA/spec version, or tracking dispositions. `implement/SKILL.md:15–17` reviews before committing, while `code-review` compares committed `HEAD`.  
   **Fix:** define the project wrapper: commit implementation first; provide the base SHA and exact approved spec explicitly; record reviewed HEAD, base, spec snapshot and both axes in `docs/reviews/`; record each disposition. Re-review subsequent implementation changes before merge. Otherwise uncommitted work or later fixes can escape the recorded review.

6. **[P2] R4 should be a pre-merge prerequisite now, not a future combined-merge check.**  
   Evidence: plan:40–41, 95–96, 147–155. `git rev-list --left-right --count HEAD...origin/main` returned `1 9`; `origin/main` already contains dashboard merge `d090b6b`.  
   **Fix:** rebuild the proposed change against that current baseline and review the combined file before merging. Compare unchanged sections against current `origin/main`, not this branch’s stale `AGENTS.md`. Include the dashboard overview and ADR updates as well as acceptance check 10’s listed additions. Refresh the historical ADR-slot/open-PR assertions when implementation starts.

7. **[P2] Mandatory TDD needs an explicit “not applicable” route.**  
   Evidence: plan:18, 32, 85–110; `implement/SKILL.md:11` says TDD “where possible”; `tdd/SKILL.md:20–24` requires confirmed public seams. It mandates no particular runner. Documentation, wording and CSS changes may have no useful Node-testable behavior.  
   **Fix:** permit documented manual verification where automated TDD is unsuitable. For future Node tests, specify a supported Node version and test location/discovery convention; approve seams before restructuring. Record unavailable typechecking as not applicable. Choosing `node --test` is compatible with ADR-0001, but it creates neither a seam nor meaningful tests by itself.

8. **[P2] Proportionality and context rules conflict with the upstream defaults.**  
   Evidence: plan:34, 81–83; `to-spec/SKILL.md:31–41` demands extensive user stories, whereas Q6 allows a tiny spec. `ask-matt/SKILL.md:25–28, 38` keeps single-session implementation in context and starts ticket implementations fresh.  
   **Fix:** explicitly declare the project’s short-spec override, including acceptance checks, and reserve fresh implementation sessions for ticketed work. Define “after each build” for retro—per ticket or per completed feature—and retain session evidence before clearing. This avoids unnecessary interviews, resets and retros for trivial edits.

9. **[P2] Preserving Boundaries alone does not fully define skill side effects.**  
   Evidence: plan:31, 38, 135–136; `implement-spec/SKILL.md:25, 38` can open a draft PR and close tickets; `wayfinder/SKILL.md:115` pushes research branches; `pr/SKILL.md:12` only supplies a PR-body template. Also, `triage/SKILL.md:13–17` requires a different opening disclaimer from R1’s `[Agent]`.  
   **Fix:** explicitly preserve separate authorization for push, PR creation, merge and deploy; distinguish preparing a PR body from publishing it. Define permitted issue mutations and closure timing. Specify a combined triage attribution format with `[Agent]` first and the AI disclaimer immediately after it.

10. **[P2] The documentation migration and acceptance checks are incomplete.**  
    Evidence: plan:65–68, 95–96, 124–155. Keeping everything else unchanged leaves Architecture pointing only to `docs/plans/`, Development rules requiring plan updates, and Project structure describing that directory as the location of approved plans. Existing `docs/agents/triage-labels.md` describes `ready-for-agent` as ready for AFK execution without the new approval qualification. Acceptance check 1 cannot demonstrate reproducibility under option (c).  
    **Fix:** update all active pointers consistently while retaining historical plans. Add scenario-based checks for a wording edit, Critical change, unapproved ready-labelled issue, changed spec, missing skill installation and post-review code change. Make current-main reconciliation and fresh-clone restoration pre-merge checks.

**Recommendations**

- **R5: choose (a), conditionally.** Commit the lockfile and document a verified restoration procedure, but first establish how exact reviewed contents are retrieved. Add an immutable source revision or equivalent reproducible mechanism if the installer does not provide one. If that cannot be demonstrated, choose **(b)** with complete referenced files and licensing. **(c)** is unsuitable for a mandatory cross-agent workflow.
- **Fact (3): verified for the named installed skills.** Add `ask-matt` and `wayfinder` to the human-invoked list. `code-review`, `tdd`, `pr` and `diagnosing-bugs` omit that restriction. Prefer explicit human transitions for restricted skills; do not silently bypass their invocation contract by reading their files. Any autonomous adaptation needs a separately documented policy and harness verification.
- Q1 is supported: `to-spec` publishes to the configured tracker, and `docs/agents/issue-tracker.md` explicitly maps that action to creating a GitHub Issue. Q2’s lane order and Q7’s proposal-only retro policy are compatible project adaptations.

**Verification**

Read or inspected:

- The complete draft plan with line numbers.
- Current `origin/main:AGENTS.md` using the requested `git show`.
- All 15 named installed `SKILL.md` files, plus invocation mechanics and selected supporting references.
- The installed `skills-lock.json`, `.gitignore` and representative symlinks.
- All three `docs/agents/*.md` and all five `docs/adr/*.md` from `origin/main`; relevant README content.
- Branch status, divergence, nine incoming commits, tracked skill paths, ignore rules, remote URL and Node version (`v25.9.0`).

No files were edited. No GitHub mutations, fetch, installation, fresh-clone restoration, browser checks or tests were run. The nine-commit comparison is against the locally available `origin/main`; ignore rules prove these assets are excluded from Git, not that no copies exist elsewhere.