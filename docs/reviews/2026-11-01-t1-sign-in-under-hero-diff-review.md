# Diff review: T1 follow-up, sign-in bar under the hero (#58)

- **Base:** `d215205` (main, after PR #70).
- **Reviewed commit:** `1e39c71` (one file: `crash-course/index.html`, +22/−22).
- **Spec:** #56 v5, sha256 `cf3693461f6199577ac855b16d1994a49cd872888b9cac74ddaf4c9dc0945878`. The spec asks for a "Sign in with Google" button on every Crash course page and does not fix its position, so this is a placement change inside the approved scope (PO request, 2026-11-01: "add the sign in with google under the hero section"). Lesson pages have no hero and are unchanged.
- **TDD:** not applicable (layout only; project checks and browser checks instead).

## Evidence

- `node --test` 195/195 locally.
- Browser (Chrome, localhost:8000): hub in English and Arabic, full width and 320px. The bar is a child of `<main>`, directly after `.course-hero` (gap 0), shown, no horizontal overflow, sign-in behaviour unchanged. A first Arabic check looked wrong because the frame served a stale cached copy of the old page; a fresh load confirmed the new position.
- Codex (read-only), `VERDICT: PASS`: selectors in `js/account-bar.js` and `js/course.js` do not depend on DOM order or on the bar being a child of `body`; the bar is a named region inside the main landmark; tab order follows the visual order; the skip link still targets `#main`; logical CSS properties are used (RTL safe). Codex's `node --test` showed 194 passed and one sandbox EPERM on a temp directory (not a code failure). Browser and screen-reader behaviour were judged from the source only.

## Standards

No findings.

## Spec

No findings. The live region stays outside the bar (spec "Status messages go to one persistent polite live region").

## Outcomes

No findings to fix or accept. PR, merge and deploy still need the PO's approval (AGENTS.md, External actions).
