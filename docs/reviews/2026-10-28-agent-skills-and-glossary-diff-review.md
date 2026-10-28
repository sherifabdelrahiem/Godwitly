# Diff review — agent skills setup and domain glossary

> Reviewer: Claude (Opus 5.5) · Builder: Claude (Opus 5.5) · Plan:
> `docs/plans/2026-10-28-agent-skills-and-glossary.md` (approved) · 2026-10-28

Self-review: the same agent wrote and reviewed this change. It is documentation and
configuration only, so no second-model review was run.

## Round 1: APPROVED

Files reviewed: `AGENTS.md`, `GLOSSARY.md`, `docs/agents/issue-tracker.md`,
`docs/agents/triage-labels.md`, `docs/agents/domain.md`, and the plan.

Acceptance criteria, each checked by command on the branch:
- **AC1:** `git status` lists only `AGENTS.md`, `GLOSSARY.md`, `docs/agents/`, the plan
  and this review. No site, form or Supabase file changed.
- **AC2:** all four paths named in `## Agent skills` exist.
- **AC3:** `gh label list` shows all five triage labels.
- **AC4:** the diff has no match for secret-key, JWT, Resend-key, password or email-address
  patterns.
- **AC5:** `GLOSSARY.md` passes a UTF-8 round trip (`iconv`).

Content checks:
- `GLOSSARY.md` follows the domain-modeling format: one- or two-sentence definitions,
  `_Avoid_` lists, and no implementation details (table, function and file names are kept
  out and tracked in issues #6 and #7 instead).
- Every term matches what the PO approved in the session; the count is 31 terms in seven
  groups.
- The `docs/agents/` files are the unchanged skill templates; `issue-tracker.md` keeps
  "PRs as a request surface: no".

Findings:
1. [P3] `AGENTS.md` "Project structure" did not mention `docs/agents/` or `GLOSSARY.md`.
   **Resolved:** both added.
2. [P3] The edited "Task tracking" line ran past the file's line width. **Resolved:**
   re-wrapped.
3. [P3] The plan first said 32 terms in six groups; a count on the file gives 31 in seven.
   **Resolved:** plan corrected.

Not run: browser checks (no user-facing change).
