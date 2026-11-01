# Diff review: glossary and ADR follow-up for spec #56 (commits f94ce7e, 41a1dae)

- **Base:** `f0ddf80` (`docs/accounts-enrolment-design`, PR #68's branch; this branch is stacked
  on it). **Reviewed commit:** `41a1dae`. **Fix commit:** `f8b6231`.
- **Spec:** #56, Spec version v4, sha256 `14f2d54f966f056175ab86f8fe659a90a5025cc739d89098a433d224c4599453`
  (recomputed 2026-11-01; matches the approval record on #56).
- **Scope:** GLOSSARY.md, ADR-0010, ADR-0011, the stack panel record and the Codex review report
  (`2026-11-01-glossary-adr-followup-codex-review.md`). It closes the findings marked "Deferred"
  in `2026-11-01-accounts-enrolment-design-diff-review.md`, from the PO's `/grill-with-docs`
  session of 2026-11-01. The PO took Claude's recommendation on every technical question in it.
- **Lane:** Critical (spec #56). Docs only; no code, site files or backend change. **TDD:** not
  applicable (docs). **Typecheck:** not applicable. `node --test`: 160 passed, 0 failed.
- **Secrets and personal data:** none in the diff.

## Deferred findings closed

DS-1 to DS-6 and DP-1 to DP-7 are closed by `f94ce7e`. Both axes confirmed this. DP-6 was closed by
removing the glossary sentence; the spec rule that would stop the case is a separate v5 proposal
for the PO. DP-9 (the spec body's "Not approved yet… Next: the Codex gate") is left for the PO,
because it is an edit to the spec Issue.

## Standards findings
| # | Finding | Outcome |
|---|---|---|
| S-1 | Codex review report names its base by branch, not commit (AGENTS.md, Diff review step 3) | Fixed in `f8b6231` (pinned to `f0ddf80`) |
| S-2 | Enrolment, which this change rewrote, has 5 sentences (GLOSSARY-FORMAT: one or two max); Crash course manifest and Godwitly account have 3 | Fixed for Enrolment in `f8b6231` (2 sentences). Others skipped: "Used in docs and specs only" follows Course taker, and Godwitly account's third sentence is the access rule spec story 10 asks for |
| S-3 | "Lesson lock" and "the Course report's owner list" are used but not defined | Fixed in `f8b6231`: Test Crash course now says "access to Lessons that need Enrolment", and Course report names its owner list |
| S-4 | The owner-list rule is in Godwitly account and Project owner, but Course report still read as the PO's page only | Fixed in `f8b6231` (Course report names the owner list) |
| S-5 | ADR-0010 says "`AGENTS.md` records the exact commands", which is not true yet | Fixed in `f8b6231` ("will record… (spec #56)"). The online-only line states the decision, so it stays |
| S-6 | The manifest entry's "id is never used again" is a data rule in the glossary | Skipped: the PO asked for retired items to be covered inside the entry; it states what the term means, not how it is stored |
| S-7 | The panel record's rounds line is one long sentence | Fixed in `f8b6231` (sub-bullets) |

## Spec findings
| # | Finding | Outcome |
|---|---|---|
| P-1 | ADR-0011 lists 3 of the spec's 5 release blockers, but reads as the whole list | Fixed in `f8b6231` (all five listed) |
| P-2 | ADR-0010 keeps "the `functions` folder joins the deploy's file list" beside the staging layout | Rejected: spec line 146 says "with the Functions folder added to the file list"; the two sentences repeat the spec |
| P-3 | Glossary says a retired *Lesson* "stays listed"; the manifest format has `retired` for items only, and the spec says only "A retired item or Lesson id stays retired" | Fixed in `f8b6231`: only a retired item stays listed, and no retired Lesson or item id is reused |
| P-4 | No scope creep; no other contradiction with the spec, the manifest or the other ADRs | Passed |

## Codex review loop

1 round: P0 0, P1 0, P2 0, P3 1 (the same sentence-count point as S-2). See
`2026-11-01-glossary-adr-followup-codex-review.md`.

**Outcome:** every finding is fixed in `f8b6231` or rejected with its reason. Two items are left for
the PO: the proposed spec v5 rule (DP-6), and the spec body's stale status line (DP-9).
