# Plan — Agent skills setup and domain glossary

> Status: **APPROVED** by PO · 2026-10-28 (choices approved in session; this plan was
> written after the files were drafted, see "Process note")
> Branch: `chore/agent-skills-setup` → PR → merge to `main`

```text
LANE: Standard — documentation and agent configuration only. No page, form, Supabase or
deploy-affecting changes.
```

## Goal

1. Configure the engineering skills (`to-tickets`, `to-spec`, `triage`, `wayfinder`,
   `domain-modeling` and related) so they know where issues live, which triage labels to
   use and where domain docs live.
2. Record the domain vocabulary agreed with the PO in a `/grill-with-docs` session, in
   English and Arabic, so future plans, issues and translations use the same words.

## Decisions (made by the PO on 2026-10-28)

| # | Decision |
|---|---|
| D1 | Issues live in GitHub Issues for `sherifabdelrahiem/Godwitly`. External PRs are not a triage surface. |
| D2 | Triage labels use the five defaults: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. |
| D3 | Domain docs are single-context: one `GLOSSARY.md` and (when first needed) `docs/adr/` at the repo root. |
| D4 | `GLOSSARY.md` holds 31 terms in seven groups (Platform and products, People, Learn, Engage, Resilience, Outcomes, Launch), each with its Arabic term and words to avoid. It contains no implementation details. |
| D5 | No ADRs: none of the session's decisions is hard to reverse, surprising and the result of a real trade-off at once. |
| D6 | Places where the page or database disagree with the glossary are tracked as issues, not fixed here: #6 (page text, Standard) and #7 (table comment, Critical). |

## Changes

- `AGENTS.md`: "Task tracking" now points at GitHub Issues; `docs/agents/` and
  `GLOSSARY.md` added to "Project structure"; new `## Agent skills` section.
- `docs/agents/issue-tracker.md`, `docs/agents/triage-labels.md`, `docs/agents/domain.md`:
  the skill's seed templates, unchanged.
- `GLOSSARY.md`: new.
- Outside the repo (already done, approved in session): created GitHub labels
  `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`; opened issues #6 and #7.

## Out of scope

- Any change to `index.html`, `css/`, `js/`, `supabase/` or `README.md`.
- Fixing the glossary mismatches (issues #6 and #7).

## Acceptance criteria

- AC1: Only `AGENTS.md`, `GLOSSARY.md`, `docs/agents/*` and the plan/review files change.
- AC2: Every path named in the `## Agent skills` section exists on the branch.
- AC3: The five triage labels exist on GitHub.
- AC4: No secrets, keys or personal data in the diff.
- AC5: Arabic text in `GLOSSARY.md` is valid UTF-8 and renders on GitHub.

## Process note

`AGENTS.md` asks for the plan before implementation. Here the PO approved each choice
interactively (tracker, labels, file drafts and every glossary term) before the files were
written, and this plan records those approvals afterwards. The diff review is in
`docs/reviews/2026-10-28-agent-skills-and-glossary-diff-review.md`.
