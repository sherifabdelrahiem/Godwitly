# Diff review — characters-left counter for the Message box

> Base: `main` at `4dfc14a` · Reviewed: `f47c8fa` (build), `0ac57ea` (fixes S3, S4), `571a9cf`
> (fixes R1) on `feat/message-counter` · Spec: issue #28, **Spec version: v1**, sha256
> `d9ca7dfecba32ed832fa0bbf6f20570d1b3e94b26d648aaf5a5c9ca053cd5e82` (PO approval recorded
> on #28, 2026-10-29) · Method: two-axis `code-review` (Standards and Spec in separate
> subagents) · 2026-10-29

## Rounds

| Round | Diff | Axes | Result |
|---|---|---|---|
| 1 | `main...f47c8fa` | Standards, Spec (parallel subagents) | Standards S1–S6 (no hard violations); Spec P1–P3 (additions), nothing missing or wrong |
| 2 | `f47c8fa..0ac57ea` | Standards and Spec in one subagent | S3, S4 resolved; R1, R2; no behaviour change |
| 3 | `0ac57ea..571a9cf` | agent check (one comment line) | no findings; tests 7/7 |

## Standards

| # | Finding | Kind | Outcome |
|---|---|---|---|
| S1 | `.visually-hidden` in `css/styles.css` repeats `.dash-visually-hidden` in `css/dashboard.css`; merging them touches the dashboard | Duplicated Code (judgement) | accepted by the PO on 2026-10-30 |
| S2 | `findProblems()` keeps its own `[...text].length` helper for name and job title; the Message is trimmed in `readAnswers()` and again in `messageLength()` | Duplicated Code (judgement) | accepted by the PO on 2026-10-30 (moving other fields is out of scope in spec v1) |
| S3 | Counter block unnumbered and missing from the `form.js` header; second `languagechange` listener | structure (judgement) | fixed in `0ac57ea` |
| S4 | `number` held "left" or "over"; boolean flag argument `announce` | Mysterious Name (judgement) | fixed in `0ac57ea` |
| S5 | ADR-0006: a new test seam must be agreed in the spec first | check | no defect: spec v1 names the seam (Testing Decisions); confirmed by the Spec reviewer |
| S6 | Default "Characters left: 1,000" in `index.html` has no `data-i18n` | check | no defect: English is the default text; `form.js` redraws it on load |
| R1 | Start-up wiring sat under the section 5 banner | structure (judgement) | fixed in `571a9cf` |
| R2 | `renderMessageCount()` also updates `messageIsOver`, unlike `render()` | judgement | accepted by the PO on 2026-10-30 |

## Spec

Nothing missing, partial or wrong (round 1); no behaviour change from the fixes (round 2).

| # | Not asked for | Spec line it supports | Outcome |
|---|---|---|---|
| P1 | Extra tests: a flag counts as 2; 1,000 emoji are within the limit | "combined emoji such as flags count as more, exactly as the database does" | accepted by the PO on 2026-10-30 |
| P2 | The live region is cleared on a language change | "nothing is announced on other keystrokes" | accepted by the PO on 2026-10-30 |
| P3 | New general `.visually-hidden` class | "A polite live announcement…" | accepted by the PO on 2026-10-30 |

## Tests

- `node --test`: 7 tests, 7 pass (Node 25.9.0). Red first for: missing module, trimming,
  emoji. Passed on first run (cases already covered by earlier slices): empty/spaces-only,
  flag, Arabic, 1,000/1,001.
- TDD not applicable to the counter's look, wording, placement, announcements and layout
  (browser-only); checked by hand below. Typechecking: not applicable (no typechecker).

## Manual checks (spec #28, Testing Decisions)

Chrome, local server, `f47c8fa`; checks 3–6 re-run on `0ac57ea`.

| # | Check | Result |
|---|---|---|
| 1 | Desktop and 320px, EN and AR | pass: counter under the box at the end of the line; no horizontal scroll at 320px (318px viewport, frames) |
| 2 | "Characters left: 1,000" / "الأحرف المتبقية: 1000" on load | pass |
| 3 | Typing, pasting, emoji | pass for typed values and emoji, set via the box's `input` event; a real clipboard paste was not done |
| 4 | Over the limit: red, "over" wording; back under restores it | pass; announcement only at the two crossings |
| 5 | Language switch with text in the box | pass |
| 6 | Submit while over: corrected error, box outlined | pass; nothing sent (other fields empty) |
| 7 | Restored text counted on load | pass after Back (981 for 19 characters); Chrome restored nothing on reload, and the counter showed 1,000 |
| 8 | VoiceOver | **not run (untested, not passed)**: the PO deferred it on 2026-10-30; follow-up #29 |
| 9 | Opens by double-click (`file://`) | pass in headless Chrome (Arabic counter text drawn by the scripts); the Chrome extension can't open `file://` |

No console errors on load.

## PO decisions (2026-10-30)

- "accept 1-4": S1, S2, R2 and P1–P3 accepted as they are.
- "skip voice over and add it as a follow-up card no need for it now": manual check 8 is
  deferred to issue #29, so the acceptance check "Manual checks 1–9 pass" is met for 1–7
  and 9 only.
