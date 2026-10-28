# Diff review — header fits at 320px (#15)

> Reviewer: Claude (Opus 5.5), two parallel review agents (Standards, Spec) via `code-review`
> · Builder: Claude (Opus 5.5) · Plan: `docs/plans/2026-10-28-header-320.md` (approved)
> · Issue: #15 · 2026-10-28

## Round 1: APPROVED (one minor fix applied)

### Standards

- No hard violations. Follows the stylesheet's mobile-first rule: base rules hold the
  smallest-screen values, and the existing `min-width: 400px` query restores today's values.
- Each change sits in its section (4 Header, 10 Larger screens). The 640px `.logo` 40px rule
  still applies after the 400px restore; the 1024px menu-button rule is unaffected; section 9
  (RTL) has no conflicting header rules.
- Judgement call: below 400px the menu button shrinks from 40px to 36px, matching the
  file's existing 36px minimum (`.lang-switch__btn`). Below the 44px AAA guideline, which the
  file did not meet before either.
- Minor, **fixed**: only one property carried an inline "see section 10" pointer. Removed it;
  the 400px query's comment explains all five restores.
- Smell, accepted: each header value now lives in two places (base and 400px query). This is
  the documented mobile-first pattern.

### Spec

- All five plan values are in place below 400px and restored from 400px. CSS only, no scope
  creep.
- Arithmetic check at 320px (280px content box): 272.6px EN, 270.9px AR, about 7–9px spare.
- Cascade: each restore uses the same selector later in the file; `.lang-switch__btn:lang(ar)`
  sets no padding, so it doesn't block the restore.

### Browser verification (run on 2026-10-28)

Scratch copy of the branch served from `127.0.0.1`, compared with a copy of `main`.

- **320px (inside a 320px iframe), EN and AR, menu closed and open:** `scrollWidth` = 320.
  Logo, language switch and menu button all within the 20px gutters (EN: logo 20–120px,
  menu 264–300px; AR: menu 20–56px, logo 200–300px). Buttons 36px tall. × fully visible.
  Pass. (Before: 339px EN / 337px AR.)
- **400px, 640px and 1280px, EN and AR:** every header measurement identical to `main`.
  Pass.
- **399px:** compact header as intended.
- **Real clicks at 320px:** menu button opens the menu; العربية switches to Arabic; the menu
  stays open and the page stays 320px wide. Pass.

Small margin to note: about 7px spare in English at 320px. A much wider fallback font before
the web font loads could use some of it.

Not run: no automated tests or lint exist in this repo.
