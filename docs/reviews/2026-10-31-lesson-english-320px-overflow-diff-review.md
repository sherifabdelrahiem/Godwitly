# Diff review: Lesson 1 English page at 320px (fix, no ticket)

- **Base:** 48047d0 (`main` after PR #54). **Reviewed commit:** e5301c4 (`fix/lesson-english-320px-overflow`, one CSS commit).
- **Spec:** #36, Spec version v3, sha256 `42989dc87878d0d40742fd81691c50026f16e48ba5c69a6ace2ec287cdd0b666` (recomputed 2026-10-31):
  user story 55 ("read well down to a 320px screen"), the "Mobile (to 320px)" bullet and manual check 5 ("no horizontal scroll", Arabic and English).
- **Why a separate branch:** the defect is from #39 (closed) and showed up as a failed whole-page 320px check while verifying #41 (S-12 in
  `2026-10-31-checklist-progress-diff-review.md`). The PO decided on 2026-10-31 to fix it on a separate branch off `main`.
  The fix is covered by the approved spec #36 v3 (it enforces its manual check 5); there is no ticket and no Issue was created or edited.
- **Lane:** Standard. TDD: not applicable (CSS layout; the spec names browser checks).
- **Tests run:** `node --test`: 127 pass, 0 fail.

## What it does
In the Lesson 1 intro the picture is pulled back by 19% of its width on one side and 10% on the other, to hide its empty space.
The intro block is right to left in both languages, but the picture is mirrored only in Arabic. In English (not mirrored) the empty space is
on the other side, so the pull-backs were on the wrong sides: the bird's wing ran 10px past the screen edge at 320px and the page scrolled
sideways. The new rule `html:not([dir="rtl"]) .lesson-mascot` swaps the two margins for English. Arabic is unchanged.
(A first attempt, clipping the overflow, cut the bird's wing and was dropped before committing.)

## Verification (tool-driven, Chrome; the page loaded in an embedded frame of each width, not a resized window or a real phone)
| Check | Status | Evidence |
|---|---|---|
| English: no horizontal scroll at 320, 360, 414, 639, 640, 768, 900, 1024, 1200, 1600px | passed | document scrollWidth equals the width at each; the picture lies inside the viewport at each. Before the fix: 330 at 320px, 657 at 640px, 796 at 768px (the same overhang at wider widths) |
| English at 320px: bird fully visible, aligned with the text edge | passed | zoomed screenshot |
| Arabic: same widths, no horizontal scroll | passed, unchanged by the fix | scrollWidth equals the width at each. Note (not new, not changed): in Arabic the picture's transparent margin still extends past the viewport at ≤900px, which an RTL page does not scroll to |
| Desktop English and Arabic | passed | numbers above; bird fully visible at 768px |
| Real phone, Safari, Firefox | not performed | |

## Standards findings (sub-agent review, none blocking)
| # | Finding | Outcome |
|---|---|---|
| F-1 | The new comment's "right to left in both languages" is easy to misread; the older comment at css/course.css:507-508 says "start side", true only for Arabic | **PO acceptance requested** (comment wording only) |
| F-2 | `:not([dir="rtl"])` rather than `html[dir="ltr"]` pairs less clearly with the Arabic rule, but also covers a missing `dir` attribute | **PO acceptance requested** (deliberate) |
| F-3 | The base rule now describes the Arabic case and the override repeats the pair with values swapped | **PO acceptance requested** (acceptable per the reviewer) |
| F-4 | The review report must record the 320px checks in both languages | Fixed: see Verification |

## Spec findings (sub-agent review, none blocking)
| # | Finding | Outcome |
|---|---|---|
| F-5 | Cosmetic: older comment says "start side", true only for Arabic | **PO acceptance requested** (same as F-1) |
| F-6 | The reviewer ran no browser; manual checks need a re-run at 320px in both languages | Fixed: done above (tool-driven) |
| F-7 | Spec fit: addresses story 55, the Mobile bullet and manual check 5; scope is one CSS rule plus a comment; no scope creep | Informational |

Cascade: specificity (0,2,1) beats `.lesson-mascot` (0,1,0); the ≥640px block sets only `flex: none`. Arabic's rule is untouched.
