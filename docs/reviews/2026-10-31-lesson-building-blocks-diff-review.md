# Diff review: Lesson building blocks (ticket #40)

> Base: `eed3880` (`main`) · Reviewed: `843bfc3` on `feat/lesson-building-blocks`. The fix commit
> `4167a21` was self-checked, not subagent-reviewed · Ticket: #40 of spec #36, **Spec version: v3**,
> sha256 `42989dc87878d0d40742fd81691c50026f16e48ba5c69a6ace2ec287cdd0b666` (recomputed from the live
> body before the build: unchanged). The ticket's last criterion still says "v1"; the header names v3
> and this review uses v3 · Method: `code-review`, two axes, two parallel subagents · 2026-10-31

## Tests

- **TDD:** the callout rules in the Lesson-page check (`tests/checks.js`) were built test-first: three
  tests red, then green. Real-file test for Lesson 1 covers the converted callouts.
- **TDD: not applicable** to Copy, tabs, the print style and CSS: the ticket and spec name manual checks.
- **`node --test`:** 104 pass, 0 fail (99 before).
- **Manual, run in Chrome over a local server (`python3 -m http.server`):**
  - Copy: the text sent to the clipboard equals the box's text exactly (multi-line, quotes, `&`, `<>`).
    Not run: `file://`, keyboard activation, pasting into a text editor.
  - Tabs: one panel shows at a time; arrow key switches and moves focus. Not run: English mode, Home/End.
  - Print: headless Chrome prints the sample page to **1 page** containing only the برشامة.
  - Callouts: the four render in Lesson 1 in Arabic (bird mirrored, danger border). Not run: English, 320px.
  - Not run: Self-check (unchanged since #39).
- **Typechecking:** not applicable (none exists).

## Scope

- Self-check was built in #39 / PR #50 (scope note on #40); not rebuilt here.
- Watch out uses mascot 7 in place of 6 (PO accepted, scope note on #40).
- Lesson 1 uses none of code boxes, tabs or the برشامة, so they are on the development-only
  `tests/samples/components.html` with placeholder text.
- The one-line Lesson title (`h1` nowrap + clamp) was made at the PO's request in this session.

## Standards

| # | Finding | Outcome |
|---|---|---|
| 1 | Copy message kept its old language if the language was switched within 4 s | Fixed in `4167a21` (stored as a key) |
| 2 | Check that `course.copied` / `course.copyFailed` are seen by the keys check | No change needed: the check passes with the keys in place |
| 3 | `tests/samples/` not in `AGENTS.md` structure | Fixed in `4167a21` |
| 4 | Sample page uses inline `style` | No change needed (development only, `noindex`) |
| 5 | `h1` clamp assumes the current Lesson 1 title length; a longer later title with `nowrap` could overflow | **Accepted by the PO, 2026-10-31**; revisit the title when each Lesson is built |

## Spec

| # | Finding | Outcome |
|---|---|---|
| 1 | Mascot mirroring in RTL possibly lost | No change needed: `html[dir="rtl"] .callout__bird` is in `css/course.css` |
| 2 | "At most one mascot per screen" only checked as "no two callouts in a row" | Accepted by the PO, 2026-10-31: the rest is by eye (documented in the check) |
| 3 | Mascot 6 in ticket/spec text, 7 in code | Accepted by the PO, 2026-10-31: Changes note on the spec if wanted |
| 4 | Ticket says "against v1" | Accepted by the PO, 2026-10-31: ticket wording only |
| 5 | `h1` change outside #40 | Recorded under Scope |
| 6 | Print button and its keys not asked for | Accepted by the PO, 2026-10-31: kept so the برشامة can be printed by mouse |
| 7 | Tests allow a callout with no bird | Accepted by the PO, 2026-10-31: kept as a looser rule |
| 8 | Tab arrow keys used the page direction, but the Lesson text is always right to left | Fixed in `4167a21` (uses the tabs' own direction) |

The PO accepted the findings above on 2026-10-31 in the session.

Later change (PO request, after the review): table cells are vertically centred (`vertical-align: middle` in `css/course.css`) so tool names sit in the middle of their rows. This CSS-only change needs its own re-review before merge.
