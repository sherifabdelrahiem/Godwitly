# Diff review: Lesson 1 activity, try Claude with the Sample business facts file (spec #52)

> Base: `main` at `83f2ca1` · Reviewed: `2abd9f1` on `feat/lesson-1-activity`. The fix commit `3eedda3`
> (stale CSS comment, README line) was self-checked, not subagent-reviewed · Spec: #52,
> **Spec version: v1**, sha256 `9e273674be9a915c38d0edcdeacbcd1943986af12a03f103ac7f2312c88442ae`
> (recomputed before the build: matches the PO approval of 2026-10-31) · Method: `code-review`, two axes,
> two parallel subagents · 2026-10-31

## Tests

- **TDD:** the Copy-box rule (each box holds exactly one non-empty `<code>`) was test-first: 1 test red,
  then green. The spec allowed it as its own example of an extra check.
- **TDD: not applicable** to the wording, the PDF, the CSS and the layout: manual checks agreed in #52.
- **`node --test`:** 105 pass, 0 fail (104 before).
- **Manual, Chrome over a local server:** the three Copy buttons send exactly their box's text; Self-check
  questions 4 and 5 show wrong then right feedback, each with exactly one correct answer; the Section is
  in the sidebar; no horizontal overflow in Arabic at 320px. Callout gaps: new key to warning callout 593px
  apart on desktop (screen 801px) and 765px at 320px (screen 640px).
- **PDF:** one A4 page, six products, two without ingredients; checked by rendering it.
- **Not run:** Copy from `file://`, keyboard use of Copy, pasting into a text editor, the English page at
  320px, a live end-to-end run of the activity on claude.ai (the PO tested a free-account upload on
  2026-10-31).
- **Typechecking:** not applicable (none exists).

## Standards

| # | Finding | Outcome |
|---|---|---|
| 1 | `.code-box` comment said code is always left to right, now false for Arabic prompts | Fixed in `3eedda3` |
| 2 | README did not list the facts file and its source | Fixed in `3eedda3` |
| 3 | GLOSSARY has no Arabic term for the facts file | No change: the Lesson uses «ملف حقائق كافيه المرسى» with the English term; PO may add a glossary entry |
| 4 | No review report yet | This file |
| 5 | The Lesson time lives in four places (page, draft, en and ar keys), with no check comparing them | Open for the PO: left as is |
| 6 | Code-box regex repeats the callout regex style | No change needed |
| 7 | Q4 `<div>` has extra indentation | No change needed (no effect) |

## Spec

| # | Finding | Outcome |
|---|---|---|
| 1 | All checklist items present; page matches the draft; Section, prompts, callouts, safety line, questions 4 and 5, time, PDF | No change needed |
| 2 | Heading is «جرّب بنفسك: وصف منتجات كافيه المرسى», spec says «جرّب بنفسك» | No change needed: matches the draft |
| 3 | New CSS rule for right-aligned Arabic prompts; the PDF source HTML; the Copy-box check | No change needed: each serves the spec (Arabic prompts, the Resource, the check the spec names) |
| 4 | `activity-draft.md` removed after merging into the Lesson 1 draft | No change needed: the spec says the draft is merged in; the history keeps it |
| 5 | Two bird callouts close together | Checked: 593px (desktop) and 765px (320px), each more than a screen. The older confusion to warning callouts (153px desktop) are from #39 and were accepted then |

The English page is 330px wide at 320px because of the intro mascot (from #39); this change does not cause it.
No finding is marked accepted by the PO yet.
