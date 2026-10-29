# Codex cross-agent review — AGENTS.md main-flow plan (round 2)

> Reviewer: Codex (`codex exec --sandbox read-only`, offline) · Plan: **draft v2** (`c9a775d`) · Baseline: `origin/main` at `d090b6b` · 2026-10-29 · About 6 minutes, 373,242 tokens (311,424 cached) · Not an approval. An earlier round-2 run stalled after 29 minutes (it was pointed at a web page) and was stopped.

Verdict: NEEDS CHANGES — **5 findings: 1 [P1], 4 [P2].** Round 1: **5 CLOSED, 5 PARTIAL, 0 OPEN.**

References below use line numbers from `docs/plans/2026-10-28-agents-main-flow.md`. Statuses assess the proposed design; implementation is still awaiting approval.

### Round-1 status

| # | Status | Assessment and v2 evidence |
|---|---|---|
| 1 | PARTIAL | Invocation ownership and stopping points are explicit (63, 94–98), but R6’s restricted-skill list is incomplete; AC2 expects the complete set (234–239). |
| 2 | PARTIAL | Vendoring resolves historical restoration, includes licensing, and defines missing-skill behavior (68–80, 162–163). However, the fresh-clone comparison cannot pass as specified (240–245). |
| 3 | CLOSED | All implementation routes explicitly rejoin the versioned spec, lane, Critical gate and approval sequence. Diagnosis is evidence-only; ready labels confer no approval (100–107). |
| 4 | PARTIAL | Version/hash binding, ticket reconciliation and Critical re-gating are present (108–116). Hash storage and handling of permitted typo edits remain ambiguous. |
| 5 | CLOSED | The wrapper commits first, records base/HEAD/spec, saves both axes and dispositions, and requires subsequent review (131–139). See new finding 15 concerning review artifacts. |
| 6 | CLOSED | The branch contains `origin/main` at `d090b6b`; preservation and whole-file review are required (4, 55–56, 180–181, 271–279). |
| 7 | CLOSED | Explicit TDD/typechecking exceptions, agreed seams, Node version and test location are defined (125–130, 165–168, 183–195). |
| 8 | CLOSED | Short specs, multi-session-only tickets, feature-level retros and context handling are explicit (117–124, 153–161). |
| 9 | PARTIAL | Separate external-action approval and combined triage attribution are defined (140–152), but issue closure has a conditional exemption. |
| 10 | PARTIAL | Active pointers and scenario checks are addressed (87–92, 169–178, 248–264, 295–297). Some acceptance checks need correction. |

### New findings

**11. [P1] Issue closure does not unambiguously require explicit authorisation.**

**Evidence:** Lines 140–148 require specific approval, but qualify the issue rule as “closing, relabelling or editing an issue **the PO didn't ask to change**.” Asking to implement a ticket could therefore be interpreted as permission to close it. Installed `implement-spec/SKILL.md:25,38` also creates closing references or resolves tickets automatically.

This leaves PO requirement **(b) only partially met**. Push, PR creation, merge and deployment are covered; closure is ambiguous.

**Fix:** Require explicit authorisation for closing any issue, including closure caused by PR closing keywords. Approval may name a concrete batch of tickets, but implementation approval or skill invocation must not supply it implicitly. Add a scenario covering an agent-created implementation ticket and automatic closure on merge.

**12. [P2] R6 lists nine restricted skills, but the installed collection contains 23.**

**Evidence:** Plan line 63 lists nine. The local frontmatter scan specified by AC2 finds another 14:

`chief-of-staff`, `claude-handoff`, `grill-me`, `handoff`, `improve-codebase-architecture`, `loop-me`, `setup-matt-pocock-skills`, `setup-ts-deep-modules`, `teach`, `to-questionnaire`, `wait-what`, `writing-beats`, `writing-fragments`, `writing-shape`.

**Fix:** Make the blanket frontmatter rule authoritative and either list all 23 or explicitly describe the nine as the workflow subset. Align AC2 with that choice.

There is **no R6 conflict** with `implement` calling `tdd` and `code-review`: both callees permit model invocation. Their internal calls should continue without human transitions. The project’s commit-before-review override must still govern `implement/SKILL.md:15–17`, which otherwise reviews before committing.

**13. [P2] The issue-body hash rule needs a precise lifecycle.**

**Evidence:** Lines 54 and 114 permit typo edits without a version bump, but lines 110–113 hash the entire body and require an exact match. Thus an allowed typo edit invalidates the approved hash. Lines 199–203 do not clearly distinguish hash metadata stored outside the body from metadata added to it; placing the body’s own hash inside that body would be self-referential.

The specified command is deterministic, but hashes the CLI’s emitted text, including its output newline—not a separately defined raw-body representation.

**Fix:** Define one representation and command; keep approval hashes in comments/reports/tickets outside the hashed body. Either freeze approved bodies completely, including typos, or specify how nonmaterial edits receive a replacement approval binding. Store the full digest; abbreviations may be display-only. Add a local fixture check covering an unchanged body, typo edit and material edit.

**14. [P2] Several acceptance checks cannot establish their stated result.**

**Evidence:**

- AC3 requires recursive `diff` to show nothing (244–245), while lines 75–78 add `LICENSE` and `README.md` absent from the local install.
- “Match … `skills-lock.json`” (79) has no defined hash algorithm. Its `computedHash` values are not plain SHA-256 hashes of the installed `SKILL.md` files; a direct comparison matched **0/38**.
- AC8 uses an ordinary diff to demonstrate preservation (271–279). Unchanged content may be omitted from diff context.
- AC12 permits only “history wording” around `docs/plans` references (295–297), although README line 161 legitimately cites the dashboard’s historical design plan. Section 5 proposes only an unrelated README addition.

**Fix:** Compare the original 103-file manifest byte-for-byte and separately validate the two added files. Define lock consistency as structural/provenance checks unless the installer’s hash algorithm is supplied. Compare protected sections directly against `origin/main`. Permit historical plan citations in AC12.

For `.gitignore`, specify and test ancestor traversal rather than simply negating a child beneath ignored `.claude/`, for example:

```gitignore
/.claude/*
!/.claude/skills/
```

Remove the existing `/.claude/` exclusion when adopting that pattern. Check representative tracked links and ignored settings, then verify tracked link mode `120000`, relative targets and resolution in the clone.

**15. [P2] “Any change after review” includes the required review report itself.**

**Evidence:** Lines 134–139 require saving a report and reviewing any subsequent change; AC15 requires committing a branch review report (302–303). Adding that report changes the branch after its reviewed HEAD. Repeating the literal rule produces another report addition requiring another review.

**Fix:** Define reviewed content separately from review evidence. Require re-review for implementation, specification or workflow changes; allow a subsequent evidence-only commit containing the report and dispositions. Record both the reviewed implementation SHA and final evidence commit. A report containing actual policy changes must remain reviewable.

### Factual verification and overall assessment

- **R5: substantially supported.** The lock contains 38 entries with `source`, `sourceType`, `skillPath` and `computedHash`, without per-entry revisions. The installer reference confirms experimental restoration, frozen-hash failure and absence of restored agent links. There are 103 installed files, **266,243 content bytes**; `du -sk` reports **544 KB allocated**, explaining the plan’s size.
- **R5: not fully corroborable from the supplied evidence.** I found no local upstream snapshot supporting the “7 differ from upstream main” comparison, or upstream licence text establishing the exact MIT notice. Treat those as previously reported investigation results, or preserve their local evidence before approval. No licence file exists in the installed collection.
- **Vendoring:** reasonable for exact, offline availability. All 38 current links are relative, resolve inside the repository layout, and have matching skill directories. Git can preserve these symlinks. Include the complete MIT notice, preserve existing attribution such as `pr/CREDITS.md`, and perform the corrected clone checks before claiming reproducibility.
- **ADR-0006:** unused in every **locally available remote-tracking ref**: `origin/main`, `origin/feat/signup-dashboard` and `origin/HEAD`. The stronger claims about every live remote branch and no open PRs cannot be verified offline.
- **PO requirement (a): met at the policy-design level.** Lines 100–107 cover diagnosis, ready-labelled issues and other routes. Hash mechanics still need finding 13’s clarification.
- **Proportionality:** acceptable given the PO’s chosen safeguards. Short specs, optional tickets, manual verification and no retro for wording fixes contain the overhead. Do not make parallel `implement-spec` orchestration mandatory for ordinary single-session work.

### Verification

Read the complete v2 plan, round-1 report, `git show origin/main:AGENTS.md`, all five ADRs, all three `docs/agents` files, relevant README text, installed workflow skills and invocation/context references, lockfile, ignore rules, symlinks, and the supplied installer reference.

Ran local branch/divergence and ADR-ref checks, frontmatter scans, file/link inventories, size checks and a direct file-hash comparison. The branch is `docs/agents-main-flow`, **2 commits ahead / 0 behind** local `origin/main`; the worktree is clean.

No network access, edits, installation, clone, GitHub actions or application tests. One here-document inventory command was rejected by the read-only environment; its replacement completed successfully.