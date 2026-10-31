# Diff review: Checklist progress (ticket #41)

- **Base:** 7064aa4. **Final implementation commit reviewed:** bfb500b.
  Commits: 32b0ef4 (feature), b853b0b, ec97817, 5f513b1, bfb500b (fixes). The report's own commit only adds this file.
- **Spec:** #36, Spec version v3, sha256 `42989dc87878d0d40742fd81691c50026f16e48ba5c69a6ace2ec287cdd0b666`
  (recomputed from the Issue body on 2026-10-31; equals the v3 approval record). The ticket says "against #36 v1" but its header
  says v3; this review uses v3 and the Issue is not edited.
- **How it was reviewed:** the first review (32b0ef4) and a later one over `7064aa4...5f513b1` were each run by two fresh
  sub-agents (Standards, Spec). Their fixes are in `bfb500b`, which a third agent checked (`5f513b1...bfb500b`, both axes, no
  blocking findings). The agents that review are not the author, but they are all model reviews, not a human one.
- **TDD:** applied to the progress module (`tests/course-progress.test.js`, 15 tests) and the hub item check
  (`findHubChecklistProblems`, 5 tests + 1 real-file test); each new rule's test was red first (damaged record,
  hub-before-Lesson, repeated card id). Page wiring, CSS, live region: TDD not applicable (DOM/CSS, checked by hand).
- **Tests run:** `node --test`: 127 pass, 0 fail, at bfb500b.

## PO decisions applied (2026-10-31, in session)
1. A saved record with any invalid entry is rejected whole (corrects the existing damaged-data requirement; no spec change).
2. Hub cards carry the Lesson's current item ids (`data-checklist-items`), checked against the Lesson page; the hub judges completion
   from those ids and the saved ticks and no longer trusts a saved item list. PO: implementation correction, no version bump.
   Rationale: user stories 45 and 46 ("complete" means every item of the current checklist is ticked).
   Seam note: the check is a new function (`findHubChecklistProblems(hub, lessons, lessonPages)`); it does not change the signature
   of the existing course-check functions, but it is not among the Seam 1 rules the spec lists (see finding S-1).
3. The celebration is an always-present, empty live region filled on completion.
4. #41 stays browser-local; no migration into future accounts is promised.

## Verification
Done, with the tool used:
| Check | Result |
|---|---|
| Tick 3 of 4 / 4 of 4, untick, reload (Chrome via http://localhost) | ✓ and celebration only at 4 of 4; both go on unticking; ticks survive reload |
| Hub ✓ after a full Lesson (http) | shown; hidden when an item is added to the card's list (old checklist ticked); hidden for a damaged record; shown again for a valid one |
| Back button (hub ← Lesson with an item unticked) | hub shows no ✓. Not established whether the page came from the back/forward cache, so the `pageshow` path itself is untested |
| Storage failure (page copy whose `localStorage` throws) | no page error; ticking, unticking, ✓, celebration work for the visit |
| `file://` (headless Chrome on a copy of the site; ticks saved, restored by a second run, hub ✓) | works. Chrome only |
| Desktop 1200px, EN and AR | no horizontal overflow; bird mirrored only in Arabic; line text correct in both languages and switches with the language button |
| 320px, EN and AR, Lesson and hub | no overflow except the English Lesson page at 330px, caused by the intro `.lesson-mascot` image (known since #39, not this change); celebration fits, bird mirrored in Arabic; the English line sits in an Arabic (RTL) section, fixed with `dir="auto"` (5f513b1) |

**Pending, needs the PO (not done by me):**
1. Real private window (Chrome Incognito, Safari Private, Firefox Private): open `crash-course/lesson-1/index.html`, tick all four items,
   reload. Expected: no error; where storage is allowed the ticks survive the reload in that window, where it is blocked ticking works
   during the visit and the ✓/celebration appear but are gone after reload. The hub in the same window shows ✓ only if ticks were kept.
2. Real double-click open of `crash-course/lesson-1/index.html` in the browser you use (Safari/Firefox if relevant): tick, reload.
3. A screen reader (VoiceOver: Cmd+F5): tick all four items. Expected: the line "Well done! You finished this Lesson." (or the Arabic line)
   is announced once. **Actual screen-reader announcement has not been tested by me**; I only verified the DOM (an always-present
   empty `role="status"` region that is filled when complete).
I'll mark these pending until you report.

## Standards findings
| # | Finding | Outcome |
|---|---|---|
| T-1 | `resolveLink`'s comment sat above the new function | Fixed in bfb500b |
| T-2 | AGENTS.md and README did not describe the new `js/course.js` behaviour or the hub item check | Fixed in bfb500b |
| T-3 | README overstated what `course-progress.js` does | Fixed in bfb500b |
| T-4 | Storage key unlike `godwitly-course-language`; mysterious names | Fixed in b853b0b; `showDone` renamed `showProgress` in bfb500b |
| T-5 | Lesson id string round trip ("lesson-1" ↔ number) in `js/course.js` | **Open: needs PO acceptance** (judgement call; unchanged) |
| T-6 | `open()` is an odd verb; `showCelebration` reads translations directly; section 8 of `course.js` has three jobs | **Open: needs PO acceptance** (judgement calls; unchanged) |
| T-7 | Item ids live on the hub card and on the Lesson page | **Open: needs PO acceptance** (deliberate; a test keeps them equal) |
| T-8 | Storage try/catch duplicated with `course-language.js` | **Open: needs PO acceptance** (the spec keeps the modules separate) |

## Spec findings
| # | Finding | Outcome |
|---|---|---|
| S-1 | The hub item check is not among the Seam 1 rules listed in the spec, and the check takes the Lesson pages as an input | **Open: needs PO acceptance.** The PO decided before the review that it needs no version bump; this records the exact gap, the PO should confirm it |
| S-2 | A saved item list was not named in the spec | Fixed in ec97817 (no longer saved at all) |
| S-3 | A record with an invalid entry was filtered, not rejected | Fixed in ec97817 |
| S-4 | Hub trusted a saved item list after a checklist change | Fixed in ec97817 |
| S-5 | Hub from the back/forward cache not refreshed | Fixed in b853b0b |
| S-6 | Repeated card id could hide a missing one; regex matched `data-checklist-items`; first `li[data-lesson]` anywhere was used | Fixed in bfb500b |
| S-7 | A tick on a removed item is dropped from storage on the next change, so an item brought back loses its old tick | **Open: needs PO acceptance** (the spec says such ticks are "ignored") |
| S-8 | A Lesson already complete on load fills the live region at load; many screen readers don't announce content present at load | **Open: needs PO acceptance** (announcement is intended for a tick made during the visit) |
| S-9 | Manual checks: private window, real screen reader, real double-click | Pending, see Verification |
| S-10 | Ticket wording "against #36 v1" | Noted; Issue not edited |
| S-11 | Test-first not visible from a single commit | Noted: tests were written before the module (red run kept in the session) |

## Other (agent notes, no finding)
- Hub list check requires the exact `class="lesson-list"` and stops at the first `</ol>`; both fail loudly if the markup changes.
- Nothing in the change sends data anywhere: no network request, cookie or analytics.
