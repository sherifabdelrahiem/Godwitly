# Diff review: Checklist progress (ticket #41)

- **Base:** 7064aa4. **Reviewed commit:** 32b0ef4. **Follow-up fix commit:** b853b0b (small, listed below; PO to decide whether it needs its own review).
- **Spec:** #36, Spec version v3, sha256 `42989dc87878d0d40742fd81691c50026f16e48ba5c69a6ace2ec287cdd0b666` (recomputed before building; matches the v3 approval record).
- **Ticket wording:** #41 says "against #36 v1" but its header says v3; this review uses v3.
- **TDD:** applied to seam 2 (`tests/course-progress.test.js`, 14 tests, red first: module missing, then green). Written as one test file before the module, not strictly one test per cycle. The page wiring, CSS and celebration: TDD not applicable (DOM/CSS, checked by hand).
- **Tests run:** `node --test`: 120 pass, 0 fail (after the follow-up too).
- **Manual, run in Chrome over http://localhost (not file://, which the browser tool refuses):** ticking 3 of 4 items shows no ✓ and no celebration; the 4th shows both; reload keeps the ticks, ✓ and celebration; the hub card shows ✓ «تم»; storage holds the ticks and item ids only. **Not run:** private window, `file://`, 320px, English UI visuals, Arabic mirrored bird, screen-reader announcement, Back-button restore. Failure of storage is covered by the fake-storage tests only.

## Standards
| Finding | Outcome |
|---|---|
| Key `godwitly.course.progress.` unlike `godwitly-course-language` | Fixed in b853b0b |
| Mysterious names `savedList`, `show` | Fixed in b853b0b (`textEntries`, `showDone`) |
| `lessonId` string round trip ("lesson-1" ↔ number) | Not changed: low-value; PO may accept |
| Duplicated storage try/catch with course-language | Not changed: spec keeps the modules separate |
| Celebration text key in an Arabic Lesson section | Checked: Arabic UI shows the Arabic string; English UI uses the English key |
| 320px / EN+AR visual check | Not run (see above) |

## Spec
| Finding | Outcome |
|---|---|
| Manual checks 4 and 6 had no evidence | Check 4 run (above); check 6 (private window) not run |
| Saved item list + `isLessonComplete` not named in spec Behaviour | Kept: the hub can't see a Lesson's checklist; needed for "✓ on the hub". Covered by tests. PO to confirm |
| Hub from Back/forward cache not refreshed | Fixed in b853b0b (`pageshow`) |
| `role="status"` inside a container hidden at load may not be announced | Open, minor; not required by the spec |
| Ticket says v1 | Noted above |
