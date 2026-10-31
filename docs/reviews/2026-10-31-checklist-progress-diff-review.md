# Diff review: Checklist progress (ticket #41)

- **Base:** 7064aa4. **Final implementation commit reviewed:** bfb500b.
  Commits on the branch: 32b0ef4 (feature), b853b0b, ec97817, 5f513b1, bfb500b (fixes), then evidence-only report commits.
  The final evidence commit's ID is given in the completion report and the PR description (a commit can't contain its own ID).
- **Spec:** #36, Spec version v3, sha256 `42989dc87878d0d40742fd81691c50026f16e48ba5c69a6ace2ec287cdd0b666`
  (recomputed from the Issue body on 2026-10-31; equals the v3 approval record).
  **Ticket wording:** #41 says "against #36 v1" but its header says v3. This review uses v3; the Issue is not edited (finding S-10).
- **Status: NOT fully verified.** Two manual checks are pending (double-click, screen reader), one whole-page layout check failed (inherited from #39), see Verification.
  No publication is authorised: not the push, the PR, nor closing #41.
- **Tracked files** were clean at bfb500b. Untracked, unrelated and left alone: the `Claude/` folder and 8 PNGs in `assets/images/`.
- **How it was reviewed:** the first review (32b0ef4), a second over `7064aa4...5f513b1` and a third over `5f513b1...bfb500b`
  were each run by fresh sub-agents (Standards and Spec). They are model reviews, not a human one.
- **Tests run:** `node --test`: 127 pass, 0 fail, at bfb500b.

## TDD evidence and its limits (finding S-11)
- `js/course-progress.js`: the first 14 tests were written **as one batch before the module**, then run (red: "Cannot find module"),
  then the module was written (green). That is horizontal, not one test per cycle, a deviation from the `tdd` skill.
- Later regression tests were each run **red before** their fix: a record with any invalid entry reads as nothing ticked (3 failing),
  a Lesson finished before its checklist changed is incomplete on the hub before the Lesson is reopened, and a repeated hub card
  identifier cannot hide a missing one (2 failing).
- **Limits:** these red runs are only in the session transcript. No commit records them, and the commit history does not prove their
  order. Page wiring, CSS and the live region: TDD not applicable (DOM/CSS, checked by hand).

## Decisions and acceptances (PO, 2026-10-31, in session)
Prior decisions applied (given before the review, in the PO's message answering my questions):
1. A saved record with any invalid entry is rejected whole (corrects the existing damaged-data requirement; no spec change).
2. Hub cards carry the Lesson's current item ids (`data-checklist-items`), checked against the Lesson page; the hub judges completion
   from those ids and the saved ticks. Implementation correction, no spec version bump (covers S-1 and T-7).
3. The celebration is an always-present, empty live region filled on completion.
4. #41 stays browser-local; no migration of ticks into future accounts is promised or built.

Acceptances given in the PO's later message, 2026-10-31 (recorded by the agent; each is the PO's decision):
- **S-7:** a removed item's tick may be discarded on a later save; restoring it if the item returns is not required.
  Identifiers must not be reused for different tasks.
- **S-8:** an already-complete Lesson's celebration may not be announced automatically after reload; the visible celebration stays.
  Announcement is expected when the checklist changes from incomplete to complete during the visit.
- **T-5:** the `lesson-N` ↔ number string conversion is accepted. Follow-up (not a blocker, not done here): when the next Lessons
  are built, add a course-check rule that each Lesson's `data-checklist` value matches its Lesson identity.
- **T-6:** the current naming (`open()`), `showCelebration` reading translations directly, and the responsibilities of
  section 8 of `js/course.js` are accepted; no refactor requested.
- **T-8:** separate guarded storage access in the language and progress modules is accepted.

## Verification (one row per check; evidence and scope)
| Check | Status | Evidence / scope |
|---|---|---|
| Tick 3 of 4 / 4 of 4, untick, reload | passed | Chrome via http://localhost, tool-driven; ✓ and celebration only at 4 of 4, both go on unticking, ticks survive reload |
| Hub ✓ after a full Lesson; hidden when the card lists an added item; hidden for a damaged record; shown again for a valid one | passed | same setup; also covered by unit tests |
| Storage blocked | passed (simulated) | page copy whose `localStorage` throws; no page error; ticking, ✓ and celebration work in the visit. Not a real blocked browser |
| `file://` | passed (Chrome only, copy) | headless Chrome on a copy of the site with probe scripts: ticks saved, restored by a second run, hub ✓. Not the PO's everyday browser |
| Desktop 1200px, English and Arabic | passed | page loaded in an embedded frame of that width (not a resized window); no horizontal overflow; line text correct and switches with language |
| Mirrored celebration bird | passed | computed transform: mirrored in Arabic, none in English |
| 320px: Arabic Lesson page; hub in English and Arabic | passed | embedded 320px frame, no horizontal overflow; celebration fits |
| **320px: English Lesson page** | **failed (whole page)** | 330px content at 320px, caused by `.lesson-mascot` (the intro image, from #39). #41 added nothing that overflows. Disposition: see finding S-12 |
| Back-button, cache restore (`pageshow` persisted path) | passed | Chrome via tools, 2026-10-31: hub loaded with ✓ shown; Lesson 1 opened, one item unticked; Back. `pageshow` fired with `persisted: true`, the page kept its JavaScript state (a marker set before leaving was still there, so it was not reloaded), and the hub ✓ became hidden. Scope: one run in one browser |
| Real private window | passed (PO-reported) | PO ran the steps in Chrome Incognito on http://localhost:8000 (branch checkout) on 2026-10-31 and reported "test passed". The PO gave no further detail (for example whether the ticks survived the reload); the expected result was: no errors, and ticks kept where storage is allowed. Only Chrome Incognito; Safari and Firefox private modes not tested |
| Real double-click open in the PO's everyday browser | pending (PO) | steps in the completion report |
| Screen-reader announcement of the incomplete→complete transition | pending (PO); **unverified** | only the DOM was checked: an always-present empty `role="status"` region that is filled when complete |

## Findings (19 rows, one status each)
Fixed defects (9):
| # | Finding | Commit |
|---|---|---|
| T-1 | `resolveLink`'s comment sat above the new function | bfb500b |
| T-2 | AGENTS.md and README did not describe the new behaviour or the hub item check | bfb500b |
| T-3 | README overstated what `course-progress.js` does | bfb500b |
| T-4 | Storage key unlike `godwitly-course-language`; mysterious names | b853b0b; `showDone`→`showProgress` in bfb500b |
| S-2 | A saved item list was not named in the spec | ec97817 (no longer saved) |
| S-3 | A record with an invalid entry was filtered, not rejected | ec97817 |
| S-4 | Hub trusted a saved item list after a checklist change | ec97817 |
| S-5 | Hub from the back/forward cache was not refreshed | b853b0b; persisted path verified, see Verification |
| S-6 | Repeated card id could hide a missing one; regex matched `data-checklist-items`; first `li[data-lesson]` anywhere was used | bfb500b |

Prior PO approvals (2):
| # | Finding | Approval |
|---|---|---|
| S-1 | The hub item check is not among the Seam 1 rules the spec lists and takes the Lesson pages as input | PO decision 2 above; no conflict with an explicit requirement (spec: the hub shows "a completion mark from progress"); an extension of Seam 1 |
| T-7 | Item ids live on both the hub card and the Lesson page | PO decision 2 above. Remaining risk, process only: CI is not required before merge, so a later checklist edit could merge without updating the card; each Lesson's diff review is the mitigation |

PO acceptances recorded 2026-10-31 (5): S-7, S-8, T-5, T-6, T-8 (see above).

Pending verification / open (3):
| # | Finding | Status |
|---|---|---|
| S-9 | Manual checks: private window (passed, PO-reported 2026-10-31), everyday-browser double-click, screen reader | partly pending, PO |
| S-12 | English Lesson 1 page overflows at 320px (from #39) | open, failed whole-page check. The PO wants it corrected, not waived. See the completion report for whether #36/#41 authorisation covers the fix |
| S-13 | AGENTS.md "Verification" requires 320px UI checks; this check can't be reported as fully passed while S-12 is open | open, follows S-12 |

Informational notes (2): S-10 (ticket says "v1"; reviewed against v3; Issue not edited), S-11 (TDD evidence and limits, above).
(9 fixed + 2 prior approvals + 5 acceptances + 3 pending + 2 notes = 21 entries; S-12 and S-13 are new rows, so the original 19 rows plus 2.)

## Other notes
- The hub list check requires the exact `class="lesson-list"` and stops at the first `</ol>`; both fail loudly if the markup changes.
- No network request, cookie or analytics was added.
