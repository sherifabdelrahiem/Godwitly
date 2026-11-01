Spec: #56 · Spec version: v4 · sha256 14f2d54f966f056175ab86f8fe659a90a5025cc739d89098a433d224c4599453

# Codex review: glossary and ADR follow-up for spec #56

> Reviewer: Codex (`gpt-6.1-sol`, medium effort, read-only; it made no edits or git writes) ·
> Orchestrator: Claude, who validated every finding against the files and the spec · Base:
> `docs/accounts-enrolment-design` · Reviewed commit: f94ce7e · Spec: issue #56 v4, saved
> verbatim (hash re-checked by Codex and by Claude: matched) · Lane: Critical · 2026-11-01 ·
> Not an approval

Scope: `git diff docs/accounts-enrolment-design..HEAD`, touching `GLOSSARY.md`, ADR-0010,
ADR-0011 and `docs/reviews/2026-10-31-accounts-enrolment-stack-panel.md`. It closes the
Deferred findings DS-1 to DS-6 and DP-1 to DP-7 in
`docs/reviews/2026-11-01-accounts-enrolment-design-diff-review.md`. Codex was asked to check
consistency with spec #56 v4 and between the files, whether each Deferred finding is closed,
and the glossary rules. It was given the PO's decisions for this change (Enrolled describes an
account; the "never complete" sentence removed on purpose; the two docs-only terms have no
Arabic; ADR edits record spec decisions only; the spec's stale status line out of scope; no
implementation details in the glossary) and told not to reopen them.

## Round 1

Verdict: **P0: 0, P1: 0, P2: 0, P3: 1**. Codex reopened no PO decision and found every
Deferred finding closed.

| # | Severity | Codex finding | Claude verdict | Action |
|---|---|---|---|---|
| 1 | P3 | `GLOSSARY.md` "Crash course manifest", "Test Crash course" and "Enrolment" go past `GLOSSARY-FORMAT.md`'s "One or two sentences max": the new entries add a third sentence, "Used in docs and specs only", and Enrolment now has five sentences. | Valid as a nit. "Used in docs and specs only" follows the existing pattern of "Course taker", and several entries already run past two sentences (for example "Godwitly account"). Enrolment does have five. | Noted only (P3). |

Claude's own check against the spec, beyond Codex's list, found no further issue:

- ADR-0011's "at most once per account per day" matches the spec's "Updates are throttled to
  at most one per account per day" (DP-5).
- ADR-0011's release blockers match the spec's Further Notes: Cron on the free plan (with the PO
  approving another way if it fails), the vendors' log periods, and the hosted sign-in and
  refresh times (DP-7).
- ADR-0010's deploy layout matches the spec's "Deploy layout" bullet in substance
  (DP-4); "protected Lessons and the Course report" as online-only matches the spec's
  "ADR-0001 and `AGENTS.md` list protected Lessons and the Course report as online-only
  exceptions" (DP-3).
- "Godwitly account" matches story 10, and its owner-list exception matches the spec's owner
  list "keyed by account id" (DP-2); "Project owner" matches "Its first member is the Project
  owner" (DP-1).
- "Test Crash course" matches stories 73 to 75 (preview only, the Project owner's test Google
  accounts, kept out of the Course report and discovery); "Crash course manifest" matches
  "Identifiers are never reused with a new meaning. A retired item or Lesson id stays retired."
- `node --test`: 160 passed, 0 failed (no fixes were made in this round).

Fix commit: none needed.

## Outcome

Converged in round 1: 0 P0 and 0 P1 after validation, so the loop stopped. One P3 is noted, not
fixed. No finding touched spec #56 itself. This report is review evidence only; it is not an
approval.
