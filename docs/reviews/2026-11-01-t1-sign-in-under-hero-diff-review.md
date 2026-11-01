# Diff review: T1 follow-up, sign-in placement on the hub (#58)

> History: the sections below were written for the first version (`1e39c71`, a bar under the hero). The design then changed twice at the PO's request; the final design and its review are in "Final design" at the end.

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

## Final design (PO requests, 2026-11-01)

- **Reviewed commits:** `de328be` (sign-in in the hero), and the commit that follows it (name and Sign out in the header).
- **Design:** the hero's primary button is "Sign in with Google" with its notice text under it, for English and Arabic visitors; "Open the guide in Arabic" (English visitors) is a soft pill in the old badge's colours; the "Available in Arabic" badge and its unused key `course.availableArabic` are removed. Signed in, the name and Sign out are in the site header (wide screens, 640px and up) like Google or Facebook, and at the bottom of the mobile menu on narrow screens; the hero stack and the Lesson page bar then hide. Lesson pages keep their sign-in bar under the header.
- **Codex on `de328be`:** `VERDICT: PASS`, no P0/P1. Two P2 (stale comments about the removed badge in `js/translations.js` and `css/course.css`; this report outdated): comments fixed, this section added. Contrast computed: soft pill 4.98:1 (4.56:1 on hover), notice text over the hero 7.84:1, error text 4.76:1, all AA.
- **Browser (Chrome, localhost:8000):** English and Arabic, full width, 640/700px and 320px; the signed-in state was emulated by toggling the markup (the real round trip was verified earlier at `20b02d9`); no horizontal overflow; menu shows the name and Sign out at 320px.
- **Not verified:** the real signed-in header after a live Google sign-in with the final markup (to do with the PO), screen reader, CSP on the preview.
- **Later PO requests (same day):** the sign-in button and the Arabic pill share the first row of the hero (grid; one column below 480px); the notice is shorter ("Signing in creates a Godwitly account." plus the "What we keep" link, English and Arabic) and smaller; a Privacy link is added to the footer of the hub and Lesson pages. The notice stays next to the sign-in button because spec #56 story 3 asks for it ("next to every sign-in button ... with a link to what is kept"); the footer link is an addition, hidden until `js/account-bar.js` reveals it, so on production (where the privacy page is not deployed and a missing page returns the home page) it never shows. "It does not enrol you in anything" was dropped from the notice: story 3 does not require it and signing in enrols in nothing by behaviour (story 2, SQL check C2).
