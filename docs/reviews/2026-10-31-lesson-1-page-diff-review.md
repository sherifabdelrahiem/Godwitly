# Diff review: Lesson 1 page with course navigation (ticket #39)

> Base: `main` at `b29e04c` · Reviewed: `c30bcd6` on `feat/lesson-1-page`. The fix commit `960127b`
> (check reads single-quoted and unquoted addresses) was self-checked, not subagent-reviewed ·
> Ticket: #39 of spec #36, **Spec version: v3**, sha256
> `42989dc87878d0d40742fd81691c50026f16e48ba5c69a6ace2ec287cdd0b666` (recomputed from the live body
> before the build and after the review: unchanged) · Approved draft:
> `docs/course/lesson-1/claude-introduction.md`, sha256
> `529977e22e3c6c4717e9b2c853e7f73f46048aae07e0d195f0ef577a39a5e640` (recomputed, unchanged) ·
> Method: `code-review`, two axes, two parallel subagents (80,482 and 86,118 tokens) · 2026-10-31

## Tests

- **TDD:** the course check's Lesson-page rules (Seam 1) were built test-first in five groups
  (sidebar, previous/next, date/Arabic marking/notice, checklist, links), each group's example tests red
  before the code. For the checklist group the red was seen only coarsely, and for the links group the
  tests and code were written together; the links tests were then shown to fail with the link rules
  removed (8 tests red). The fix commit `960127b` was red first, then green. Real-file tests were red
  (page missing, hub card not a link) before the page was built.
- **TDD: not applicable** to the page, its CSS, wording and the sidebar script: the ticket names manual checks.
- **`node --test`:** 99 pass, 0 fail (98 before `960127b`; baseline on `main` was 72).
- **Page text vs the approved draft:** compared word by word by script (1,648 tokens each, no
  difference; 27 external links identical; 4 callouts, 3 tables, 4 checklist items, 9 Sections).
  The script is not committed.
- **Typechecking:** not applicable (none exists).

## Standards

| # | Finding | Kind | Outcome |
|---|---|---|---|
| S1 | `js/course.js`: the Lesson-list Escape handler repeats the mobile-menu pattern above it | Duplicated Code (judgement) | no change needed: small, inside `course.js`, and nothing is shared with `js/script.js` |
| S2 | Header, mobile menu, footer and the nine-item sidebar are copied into every Lesson page | Duplicated Code / Shotgun Surgery risk (judgement) | accepted: no build step (ADR-0001). Each Lesson ticket (#42–#45) copies the sidebar, and the course check catches a wrong or missing entry on every page. A shared include would need a build step: a decision for the PO later |
| S3 | Literal radii, font sizes and breakpoints in `css/course.css` | judgement | no change needed: the hub's CSS does the same, and only existing `:root` tokens are used. The breakpoints (639/640, 959/960) match the hub's |
| S4 | `.callout-plain`, `.lesson-quote` and the plain Self-check styles are placeholders | Speculative Generality (judgement) | no change needed: they are the plain text the ticket allows until #40, and are commented as such |
| S5 | Trail arrow and the `html[lang="ar"]` font override | judgement | no change needed |
| S6 | Mascot mirroring keys on the page's `dir` while the Lesson text is always right to left | judgement | checked in the browser, English and Arabic (see below) |
| S7 | Markup: `role` attributes on table parts, sidebar indentation, a fixed `<time>` | judgement | roles kept on purpose (they keep table meaning when the phone layout uses `display: block`); the date is the Lesson's real last-checked date |
| S8 | `AGENTS.md` layout line wrapped long | cosmetic | fixed before the commit |
| S9 | The AGENTS.md checks (EN/AR, 320px, desktop, keyboard) are not visible in the diff | evidence | recorded below |

No hard violation. As the reviewer checked: every shared string is in `js/translations.js` in both
languages (12 new keys, whole strings, none built from pieces); no dependency, CDN or secret; paths are
relative; the toggle is a real `<button>` with `aria-expanded`/`aria-controls`; logical properties are used
throughout.

## Spec

| # | Finding | Spec line | Outcome |
|---|---|---|---|
| P1 | The "next" to an unreleased Lesson is composed of the keys "Lesson", the number and "Coming soon", not the literal «الدرس ٢ قريبًا» | #39 "the non-link «الدرس N قريبًا»" | no change needed: it reads «الدرس ٢ قريبًا» in Arabic (seen at 320px) and "Lesson 2 Coming soon" in English, and is not a link |
| P2 | The check's limits are stated in a code comment only | #39 "The check states its limits" | no change needed: the same place the hub check states its limits |
| P3 | The rules read only double-quoted `href` and `src` | #39 "every Reference is a complete, well-formed `https://` URL" | **fixed in `960127b`**, test-first |
| P4 | Sidebar Section links are checked against ids on the page, not against headings | none | no change needed: the ticket asks for the sidebar to list Sections; the ids check catches broken jumps |
| P5 | Beyond the ticket text: Escape closes the phone list and returns focus; choosing a link closes it; `AGENTS.md`/`README.md` edits; every released page joins the translation-key check | #39 "by touch and keyboard"; spec "Docs" | **for PO acceptance**: all are small and in the spirit of the ticket and the spec's Docs line |
| P6 | The English title "Welcome: Claude, Claude Code and Skills" is the agent's wording (the approved Arabic title is the PO's) | #39 "the approved title plus an English title" | **for PO acceptance**: it follows the spec's Lesson table |

Verified by the reviewer: hub card is a link with `data-course-link` and a hidden completion mark; the
sidebar entry has a hidden completion mark; checklist ids are stable and unique; all ten Lesson parts carry
`lang="ar"` `dir="rtl"`; the English notice, `<time datetime>`, trail and sidebar are present; each rule has
an example test and a real-file test; nothing describes how Godwitly itself is built.

## Manual checks run (Chrome on a local server, `python3 -m http.server`)

- **Desktop, 1470px wide:** Arabic: sidebar on the right, current Lesson expanded to its nine Sections, mascot after the title, facts box, trail «دليل كلود ← الدرس ١». English: sidebar on the left, the English title and the "available in Arabic" notice, the Lesson text still Arabic and right to left, mascot not mirrored.
- **320px (a 320px frame), Arabic and English:** no horizontal scroll (page width 316 of 316); no element past the edge; "الدروس"/"Lessons" shows and the list starts closed; click opens it (`aria-expanded` true); Escape closes it and focus returns to the button; choosing a Section closes it; table rows stack with their column labels; previous/next and the "Lesson 2 coming soon" text visible.
- **Hub:** Lesson 1's card is a link; Lessons 2–9 stay "قريبًا".

## Not run

- **`file://` by the agent:** the browser tool can't open local files; all paths are relative, but the PO's own check is still needed.
- **Real phone, a keyboard walk through every control, Safari/Firefox:** not run. The toggle, Escape and link behaviour were exercised by script, not by real key presses on the page.
- **Printing:** not part of this ticket.
- **The Lesson hub and the Lesson from the landing page's menu** were not clicked through end to end; the hub link and the "Crash Courses" menu link were checked by the course check only.
- **Resources:** Lesson 1 has none, so the missing-file rule has example tests only.

## Still to do

- The PO accepts or rejects P5 and P6, and checks `file://`.
- Nothing is pushed, no PR is open, no issue is closed (commits say `Refs #36, #39`). Nothing is deployed.
- The PO's decision on the S2 shared-include question can wait until Lesson 2.
