# Diff review — Adopt the Matt Pocock main flow in AGENTS.md

> **Base:** `origin/main` at `d090b6b`. **Reviewed content:** `cb6e605` on
> `docs/agents-main-flow` (rounds 1–4 reviewed up to `b23e0d9`; rounds 5–6 reviewed the
> PO's follow-up decisions). **Spec:** `docs/plans/2026-10-28-agents-main-flow.md`,
> **APPROVED v4** (PO, 2026-10-29; approved text = `d80802b`). Plan specs aren't spec Issues,
> so there is no Issue hash. The version is pinned by that commit. **Method:**
> `.claude/skills/code-review/SKILL.md`, with Standards and Spec in separate subagents, plus
> the acceptance-check commands below. 2026-10-29.
>
> Per the plan's own rules (F15, F16), this report is review evidence. The ID of the commit
> that adds it is given in the completion report and the PR description.

## Rounds

| Round | Diff | Standards | Spec |
|---|---|---|---|
| 1 | `d090b6b...5989854` | 0 hard; 8 judgement calls | 3 missing or partial, 2 beyond spec, 2 look wrong |
| 2 | `5989854..92bbee7` (fixes) | earlier: 5 fixed, 2 partly fixed; new: 1 hard (N1), 3 judgement (N2–N4) | earlier 5 all closed; new: 2 small |
| 3 | `92bbee7..bacae69` (fixes) | N1 partly fixed, N2–N4 fixed; no new hard | 2.7 and AC13 closed; section 4 partial |
| 4 | `bacae69..b23e0d9` (fixes) | earlier fixed; 1 minor note (S13); no new smell | section 4 met; nothing newly wrong |
| 5 | `eea3b29..2fa0d88` (PO decisions on prototype and transition) | 1 hard (S14), 4 judgement (S15–S18) | 3 PO decisions met; 1 nit (P10) |
| 6 | `2fa0d88..cb6e605` (fixes) | all fixed; nothing new | fully met; nothing new |

## Standards — findings and outcomes

| # | Finding | Outcome |
|---|---|---|
| S1 | Sprawl: `AGENTS.md` 164 → 310 lines; Spec versions, Diff review and External actions could move behind a pointer | **Accepted by the PO, 2026-10-29:** "I accept AGENTS.md's 310-line length for now. Do not restructure it merely to shorten it; small additions needed for clarity are fine." (Now 313 lines after the round-5 and round-6 clarifications.) |
| S2 | Who starts a skill stated three times; `prototype` missing from one list | **Fixed** `92bbee7`, `bacae69`: one rule ("Who starts a skill"), the table column, and Agent skills as paths only |
| S3 | `[Agent]` rule, closing rule and spec-body format in both `AGENTS.md` and `issue-tracker.md`, and drifting | **Fixed** `bacae69`, `b23e0d9`: rules in `AGENTS.md`, formats in `issue-tracker.md` |
| S4 | Critical order repeats the step table | **Pending PO decision.** Not changed, because plan Q2 asks for the Critical order to be stated. Agent recommendation: accept. |
| S5 | Two lists of PO-approval actions (Boundaries, External actions) | **Pending PO decision.** Not merged, because AC8 keeps Boundaries word for word. External actions now says it adds to Boundaries. Agent recommendation: accept. |
| S6 | Dangling pointer to the old process; then a branch-only commit ID | **Fixed** `92bbee7`, `bacae69`: `git show d090b6b:AGENTS.md` |
| S7 | "Install: none" stale after ADR-0006, then a duplicate of the Test line | **Fixed** `bacae69`: "none (no dependencies; for tests, see Test)" |
| S8 | "Agent stops … until" wording | **Fixed** `92bbee7`: "Agent waits" column |
| S9 | Negations: "Don't edit them in place"; "The hash is never written into the body" | **Fixed** `92bbee7`, `b23e0d9`: positive wording, or cut |
| S10 | Explanation "because other skill collections…" | **Pending PO decision.** Not cut: it records the reason for path naming (Q8), which an agent can't find elsewhere. Agent recommendation: accept. |
| S11 | Unused vendored skills (e.g. `setup-pre-commit`) add to always-loaded descriptions | **Pending PO decision.** The PO's R5 decision (2026-10-29) chose to commit the skill files, and v4 (approved) vendors all 38; that approval didn't address this context-load point. Agent recommendation: accept for now. |
| S12 | Agent skills pointer said "One gate" covers `ask-matt` and `wayfinder` | **Fixed** `bacae69` |

Vendored files: all 103 files under `.agents/skills` (excluding `LICENSE` and `README.md`) are
byte-identical to the local install, and every `.claude/skills` symlink resolves.

## Spec — findings and outcomes

| # | Finding | Outcome |
|---|---|---|
| P1 | Hash command, full digest and storage were only behind a pointer (2.2, AC6) | **Fixed** `92bbee7`: in `AGENTS.md`, "Spec versions" |
| P2 | Steps lacked literal `.claude/skills/<name>/SKILL.md` paths (AC1, Q8); `tdd` had no path (AC13) | **Fixed** `92bbee7`, `bacae69` |
| P3 | `[Agent]` on PR bodies goes beyond R1 | **Fixed** `92bbee7`: issues and comments only |
| P4 | `prototype`'s "fold into real code" step could bypass the gate | **Fixed** `92bbee7`, `bacae69`, `2fa0d88`: the answer goes into the spec; folding decisions into real code is step 7, after the gate |
| P5 | Closing rule lacked "approval of the spec or implementation never implies it" (F11) | **Fixed** `92bbee7` |
| P6 | `prototype` "agent-started once the PO agrees" isn't in the plan | **Decided by the PO, 2026-10-29:** "I approve agent initiation after my explicit agreement on the prototype's question and scope … this permits throwaway prototype code before the spec; production implementation and folding prototype decisions into real code still require the full spec, lane, Critical gate where applicable, and PO approval. External-action approvals remain unchanged." **Fixed** `2fa0d88`. |
| P9 | Transition said "before this section existed (2026-10-29)", not plan Q9's "before this change merges" (raised by the PO, 2026-10-29) | **Fixed** `2fa0d88`: "from the moment this Workflow is merged into `main`" |
| P7 | Section 4: `issue-tracker.md` lost "tickets name their parent spec version and hash"; closing note covered only **Close** | **Fixed** `b23e0d9`: ticket and gate-report header format; every `gh issue close` in that file needs approval |
| P8 | Evidence for AC3, AC5, AC6, AC8, AC15 not yet in the diff | **Fixed** by this report |

## Round 4

One subagent, with the two axes reported separately (14-line diff).

- **Standards:**
  - fixed: the negation is gone, and "PR or commit" matches in both files;
  - minor (**S13**): the `Closes #n` line in `issue-tracker.md` is partly a rule in a
    "formats" section. **Pending PO decision.** It's the format the rule produces, and the
    pointer sits where the close commands are used. Agent recommendation: accept;
  - no new smell.
- **Spec:** section 4 is met (ticket and gate-report header with the full hash; approval
  covers **Close** and **Resolve**). AC6 and AC11 hold, and nothing is newly wrong.

**Result after round 4:** P6 open (since decided; see round 5).

## Round 5

Two subagents, one per axis. The diff applies the PO's 2026-10-29 decisions on `prototype`
(P6) and the transition (P9).

- **Spec:** all three PO decisions met (prototype, transition, length); nothing beyond
  them. **P10** (nit): the decision says "explicit agreement" but the text said "agrees".
  **Fixed** `cb6e605`: "explicitly agrees".
- **Standards:**

  | # | Finding | Outcome |
  |---|---|---|
  | S14 (hard) | The prototype condition was written three times (single source of truth) | **Fixed** `cb6e605`: it lives in "One gate for every route", and the other two places point there |
  | S15 | "production code" and "real code" both used | **Fixed** `cb6e605`: "production code" throughout |
  | S16 | "from the moment this Workflow is merged into `main`" is less checkable than a date | **Decided by the PO, 2026-10-29:** "Use the merge event, not October 29 or when the section was drafted." Not changed. |
  | S17 | Lowercase "external action" pointer | **Fixed** `cb6e605`: "(see External actions)" |
  | S18 | Step 5 "before any code change" clashed with prototype code before the spec | **Fixed** `cb6e605`: "before any production code change" |

## Round 6

One subagent, with the two axes reported separately, on `2fa0d88..cb6e605`.

- **Standards:** S14, S15, S17 and S18 fixed; no new negation or duplication.
- **Spec:** the prototype decision is fully met ("explicitly agrees"; throwaway code before
  the spec; production code at step 7 after the gate; external actions unchanged). Q9,
  R6 and F3 are intact; nothing new.

**Result:** no findings left to fix. **Pending PO decisions:** S4, S5, S10, S11, S13 (each
with the agent's recommendation above). Under plan Q5, every finding must be fixed or
explicitly accepted by the PO before merge.

## Acceptance checks (run 2026-10-29 on this branch)

| AC | Result |
|---|---|
| 1 | Every step names its `.claude/skills/<name>/SKILL.md`; all 9 step paths and every other path in Agent skills exist in Git. ✅ |
| 2 | Frontmatter rule stated; `grep -l 'disable-model-invocation: true'` → 23 skills, including all 9 R6 workflow skills; none of the agent-started skills is restricted. ✅ |
| 3 | Fresh `git clone` of the branch: the 103 installed files match the pre-commit `shasum -a 256` manifest; `LICENSE` equals the upstream text in the R5 evidence; `README.md` present; 38 links have mode `120000`, are relative and resolve; lock file: 38 entries, all structurally consistent. ✅ |
| 4 | `.claude/settings.local.json` ignored by `/.claude/*`; `.claude/skills/tdd` not ignored; nothing tracked in `.claude/` outside `skills/`. ✅ |
| 5 | Scenario table below. ✅ |
| 6 | Hash command run twice on issue #26 gives the same 64-hex digest (`1bc6a359781f…`). Local samples: unchanged `f8c05d46ca54` twice; typo `17182558728e`; material `de600dd427fd`. ✅ |
| 7 | Diff-review rule: commit first, base, reviewed commit, spec version and hash, both axes, one outcome per finding, re-review of content changes, evidence-only exemption, evidence commit ID outside the commit. ✅ |
| 8 | Project overview, Web app and design, Security and data, Boundaries and Completion report are byte-identical to `origin/main` (section-by-section `diff`). All 7 dashboard additions are present. ✅ Read as a whole (below). |
| 9 | ADR-0006: Node 20+, `tests/*.test.js`, keeps ADR-0001, says what Node can't prove; "TDD: not applicable" and "typechecking is not applicable" in `AGENTS.md`. ✅ |
| 10 | Short-spec format, tickets for multi-session only, retro once per finished feature, context rule as in `ask-matt`. ✅ |
| 11 | Authorisation list: push, PR (incl. draft), merge, deploy, closing (incl. `Closes #n`), other issue edits, research branches; `pr` drafts only; `Refs #n`; `[Agent]` + triage disclaimer. ✅ |
| 12 | `docs/plans` mentions: two history lines in `AGENTS.md`, the Project structure line, and README's citation of the dashboard plan. ✅ |
| 13 | No bare slash-command names; every skill named in backticks has its path in the file. ✅ |
| 14 | Transition rule stated, tied to the merge into `main` (Q9, fixed in `2fa0d88`); the only plan file changed is this plan. ✅ |
| 15 | This report. Final evidence commit ID: see the completion report and PR description. |

## AC5 — scenarios

| Scenario | Route through `AGENTS.md` | Ends at |
|---|---|---|
| (a) Wording fix | Standard lane → short spec (problem, change, checks, lane) → PO approval → step 7 (TDD not applicable; browser check) → step 8 review | PO approval before editing; PO approval before push |
| (b) Critical Supabase change | Spec → Codex gate (step 4) → resolve → PO approval (step 5) → build; migration also needs Boundaries approval | Codex gate, then PO approval |
| (c) `ready-for-agent` issue, no approved spec | "One gate": the label is never approval → needs a versioned, approved spec | Stop: no build until approval |
| (d) Spec changed after approval | "Spec versions": hash check before building fails → typo: one-line re-approval; material: new version, re-approval, Codex again if Critical, tickets reconciled | Stop on hash mismatch |
| (e) Missing skill | "Who starts a skill": `SKILL.md` missing → stop and report | Stop |
| (f) Bug found by `diagnosing-bugs` | "One gate": it reproduces and collects evidence, which goes into a spec → lane → approval | Stop before the fix |
| (g) Fix after `code-review` | "Diff review" step 4: content change → its own review; evidence-only commit exempt | Re-review before merge |
| (h) Agent-made ticket that a PR would close | "External actions": `Refs #n` until the PO approves closing it; `issue-tracker.md` close commands need approval | PO approval before `Closes #n` |
| (i) Design question that needs runnable code | Step 2: the PO agrees the question and scope → the agent writes throwaway code on `prototype/<name>` → the answer goes into the spec → gate → step 7 folds decisions into real code; pushing the branch needs approval | PO agreement before the prototype; the gate before real code |

## Read as a whole

`AGENTS.md` (313 lines) reads top to bottom as: what the project is → where truth lives → the
Workflow (who starts what, steps, lanes, one gate, versions, sizing, tests, review,
external actions, retro) → structure, commands, rules, design, security, verification,
boundaries, completion report, skills. The dashboard rules sit where they were.

On one read-through I found **no contradiction**. This is a reading, not a proof, and two
areas overlap and need care in future edits:

- **Boundaries vs External actions.** Both cover pushing, PRs, merging and deploying, in
  different words. External actions says it adds to Boundaries, and adds issue closing and
  edits.
- **Lanes vs the step table.** Both describe the Critical order (S4).

## Not run

- A live end-to-end run of the new workflow (no spec Issue was created): it starts with
  the next piece of work.
- Fresh-clone checks used a local clone, not a clone from GitHub, because nothing is
  pushed yet.
