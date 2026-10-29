# Diff review — Adopt the Matt Pocock main flow in AGENTS.md

> **Base:** `origin/main` at `d090b6b`. **Reviewed content:** `b23e0d9` on
> `docs/agents-main-flow`. **Spec:** `docs/plans/2026-10-28-agents-main-flow.md`,
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
| 4 | `bacae69..b23e0d9` (fixes) | earlier fixed; 1 minor note; no new smell | section 4 met; nothing newly wrong |

## Standards — findings and outcomes

| # | Finding | Outcome |
|---|---|---|
| S1 | Sprawl: `AGENTS.md` 164 → 310 lines; Spec versions, Diff review and External actions could move behind a pointer | **Not changed**: plan 2.2 puts them in `AGENTS.md`. Raised with the PO as a possible later change. |
| S2 | Who starts a skill stated three times; `prototype` missing from one list | **Fixed** `92bbee7`, `bacae69`: one rule ("Who starts a skill"), the table column, and Agent skills as paths only |
| S3 | `[Agent]` rule, closing rule and spec-body format in both `AGENTS.md` and `issue-tracker.md`, and drifting | **Fixed** `bacae69`, `b23e0d9`: rules in `AGENTS.md`, formats in `issue-tracker.md` |
| S4 | Critical order repeats the step table | **Not changed**: plan Q2 requires the Critical order stated |
| S5 | Two lists of PO-approval actions (Boundaries, External actions) | **Kept**: Boundaries must stay word for word (AC8). External actions now says it adds to Boundaries. |
| S6 | Dangling pointer to the old process; then a branch-only commit ID | **Fixed** `92bbee7`, `bacae69`: `git show d090b6b:AGENTS.md` |
| S7 | "Install: none" stale after ADR-0006, then a duplicate of the Test line | **Fixed** `bacae69`: "none (no dependencies; for tests, see Test)" |
| S8 | "Agent stops … until" wording | **Fixed** `92bbee7`: "Agent waits" column |
| S9 | Negations: "Don't edit them in place"; "The hash is never written into the body" | **Fixed** `92bbee7`, `b23e0d9`: positive wording, or cut |
| S10 | Explanation "because other skill collections…" | **Kept**: it records the reason for path naming (Q8), which an agent can't find elsewhere |
| S11 | Unused vendored skills (e.g. `setup-pre-commit`) add to always-loaded descriptions | **Not changed**: the PO approved vendoring all 38 (R5). For the PO's information. |
| S12 | Agent skills pointer said "One gate" covers `ask-matt` and `wayfinder` | **Fixed** `bacae69` |

Vendored files: all 103 files under `.agents/skills` (excluding `LICENSE` and `README.md`) are
byte-identical to the local install, and every `.claude/skills` symlink resolves.

## Spec — findings and outcomes

| # | Finding | Outcome |
|---|---|---|
| P1 | Hash command, full digest and storage were only behind a pointer (2.2, AC6) | **Fixed** `92bbee7`: in `AGENTS.md`, "Spec versions" |
| P2 | Steps lacked literal `.claude/skills/<name>/SKILL.md` paths (AC1, Q8); `tdd` had no path (AC13) | **Fixed** `92bbee7`, `bacae69` |
| P3 | `[Agent]` on PR bodies goes beyond R1 | **Fixed** `92bbee7`: issues and comments only |
| P4 | `prototype`'s "fold into real code" step could bypass the gate | **Fixed** `92bbee7`, `bacae69`: the answer goes into the spec; folding waits for step 7 |
| P5 | Closing rule lacked "approval of the spec or implementation never implies it" (F11) | **Fixed** `92bbee7` |
| P6 | `prototype` "agent-started once the PO agrees" isn't in the plan | **Open: PO decision.** It's an inference (the skill isn't restricted), with the gate rule above. |
| P7 | Section 4: `issue-tracker.md` lost "tickets name their parent spec version and hash"; closing note covered only **Close** | **Fixed** `b23e0d9`: ticket and gate-report header format; every `gh issue close` in that file needs approval |
| P8 | Evidence for AC3, AC5, AC6, AC8, AC15 not yet in the diff | **Fixed** by this report |

## Round 4

One subagent, with the two axes reported separately (14-line diff).

- **Standards:**
  - fixed: the negation is gone, and "PR or commit" matches in both files;
  - minor: the `Closes #n` line in `issue-tracker.md` is partly a rule in a "formats"
    section. **Accepted**: it's the format the rule produces, and the pointer sits where
    the close commands are used;
  - no new smell.
- **Spec:** section 4 is met (ticket and gate-report header with the full hash; approval
  covers **Close** and **Resolve**). AC6 and AC11 hold, and nothing is newly wrong.

**Result:** no open findings except P6, the PO's decision on who starts `prototype`.

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
| 14 | Transition rule stated; the only plan file changed is this plan. ✅ |
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

## Read as a whole

`AGENTS.md` (310 lines) reads top to bottom as: what the project is → where truth lives → the
Workflow (who starts what, steps, lanes, one gate, versions, sizing, tests, review,
external actions, retro) → structure, commands, rules, design, security, verification,
boundaries, completion report, skills. The dashboard rules sit where they were. The
Workflow refers to Boundaries rather than restating it. No section contradicts another:
"ask first" (Boundaries) and "External actions" agree, and the second adds closing and
issue edits.

## Not run

- A live end-to-end run of the new workflow (no spec Issue was created): it starts with
  the next piece of work.
- Fresh-clone checks used a local clone, not a clone from GitHub, because nothing is
  pushed yet.
