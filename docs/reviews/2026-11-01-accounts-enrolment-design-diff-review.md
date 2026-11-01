# Diff review: accounts and Enrolment design docs (commit 38506f0)

- **Base:** 9f78c44 (`main` after PR #55). **Reviewed commit:** 38506f0 (`docs/accounts-enrolment-design`): GLOSSARY.md
  (Accounts and Enrolment section), ADR-0009, ADR-0010, ADR-0011, the stack panel record
  (`2026-10-31-accounts-enrolment-stack-panel.md`) and the Codex gate report (`2026-11-01-accounts-enrolment-spec-gate.md`).
- **Spec:** #56, Spec version v4, sha256 `14f2d54f966f056175ab86f8fe659a90a5025cc739d89098a433d224c4599453`
  (recomputed 2026-11-01; matches the approval record on #56).
- **Lane:** Critical (spec #56). Docs only; no code, site files or backend change. **TDD:** not applicable (docs).
- **Secrets and personal data:** none found in the diff (only the role name `service_role` and spec hashes).

## Standards findings
| # | Finding | Outcome |
|---|---|---|
| DS-1 | ADR-0011 has three lines longer than the ~95-column wrap the other docs use | Deferred to the glossary/ADR follow-up |
| DS-2 | "Enrolled account" (Completed Lesson, Course progress, Caught up, Resources) vs Enrolment saying "Enrolled" describes a Course taker's state | Deferred to the glossary/ADR follow-up |
| DS-3 | Organisation lists `account` under _Avoid_, but "Godwitly account" is now a term | Deferred to the glossary/ADR follow-up |
| DS-4 | Panel record's "Related" line names ADR-0009 and 0010 but not ADR-0011 (D15, D16 are recorded there) | Deferred to the glossary/ADR follow-up |
| DS-5 | Panel record says "Rounds: 3 of a maximum of 4" but cites Rounds 4-6 (question rounds vs panel rounds, not said) | Deferred to the glossary/ADR follow-up |
| DS-6 | Required Lesson and Required checklist item have no _Avoid_ line (optional field) | Deferred to the glossary/ADR follow-up |
| DS-7 | ADR numbering, status, format; GLOSSARY format; gate header format and hashes | Passed |

## Spec findings
| # | Finding | Outcome |
|---|---|---|
| DP-1 | GLOSSARY "Project owner" does not mention the Course report owner list (spec: "Its first member is the Project owner") | Deferred to the glossary/ADR follow-up |
| DP-2 | GLOSSARY "Godwitly account" says only "never gives access to Launch sign-ups"; spec story 10 also names the Sign-up dashboard and the Course report (except via the owner list) | Deferred to the glossary/ADR follow-up |
| DP-3 | ADR-0010 names only protected Lessons as online-only; the spec adds the Course report | Deferred to the glossary/ADR follow-up |
| DP-4 | ADR-0010 omits the spec's deploy layout (staging folder, site sub-folder, first Functions deploy to a preview branch) | Deferred to the glossary/ADR follow-up (minor) |
| DP-5 | ADR-0011 omits the one-per-day throttle on `last_used_at` | Deferred to the glossary/ADR follow-up (minor) |
| DP-6 | GLOSSARY "Completed Lesson": "A Lesson with no Required checklist items is never complete" is not in the spec; a Required Lesson with no Required items would block a Completed Crash course for good | Deferred to the glossary/ADR follow-up (**decide: adopt in the spec or drop from the glossary**) |
| DP-7 | ADR-0011's "To verify in the spec: Supabase Cron on the free plan" is stale; the spec made it a release blocker | Deferred to the glossary/ADR follow-up |
| DP-8 | The gate report's first line names v1 (the version it was made from, per `docs/agents/issue-tracker.md`); round 4 names v4 with the approved hash and PASS | Informational: matches the header rule; the round headers carry v2-v4 |
| DP-9 | Spec #56's body still says "Not approved yet… Next: the Codex gate, then PO approval" | Deferred to the glossary/ADR follow-up: a typo-level edit needing the PO's one-line re-approval with the new hash |
| DP-10 | All 13 terms on the spec's "Terms" line are in GLOSSARY; ADR-0009/0010/0011 match the spec's core decisions | Passed |

**Outcome:** the PO accepted, on 2026-11-01, deferring every finding marked "Deferred" above to one follow-up: a
`/grill-with-docs` session in a fresh context, started by the PO before T1 #58.
