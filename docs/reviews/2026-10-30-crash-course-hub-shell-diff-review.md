# Diff review: Crash course hub shell (ticket #37)

> Base: `main` at `03e79f9` · Reviewed: `6f5c6cd` (`74a094e` docs, `5d74d86` course language,
> `6f5c6cd` hub and link) on `feat/crash-course-hub-shell`. Round 2 re-reviewed `6f5c6cd..f28f47b`:
> `8eacdda` (fixes for S3–S5) and `f28f47b` (the `AGENTS.md` fixes for S1 and S2); `c24e8dd` and
> `57a8b27` are evidence only · Ticket: #37 of spec #36, **Spec version: v3**, sha256
> `42989dc87878d0d40742fd81691c50026f16e48ba5c69a6ace2ec287cdd0b666` (PO approval recorded on #36,
> 2026-10-30; the hash was recomputed from the live body before the build and before the review) ·
> Method: `code-review`, two axes, two parallel subagents (74,826 and 70,445 tokens) · 2026-10-30

## Tests

- **TDD:** Seam 3 (course language selection) was built test-first, one red-then-green slice at a
  time, in `tests/course-language.test.js`; 15 tests. The commit holds tests and code together, so
  the order can't be seen from the commit alone.
- **TDD: not applicable** to the hub page, its wording, its CSS and the landing links: the spec names
  manual checks for them.
- **`node --test`:** 58 pass, 0 fail (before and after `8eacdda`). The hub is in the translation
  reference check; the new scripts are picked up by the syntax and key checks.
- **Typechecking:** not applicable (none exists).

## Standards

| # | Finding | Kind | Outcome |
|---|---|---|---|
| S1 | The deploy command in `AGENTS.md` (`git archive main index.html dashboard.html _headers css js assets`) leaves out `crash-course/`. After a deploy the new landing links would 404 | hard (documentation) | fixed in `f28f47b` at the PO's instruction: the archive now includes `crash-course`. Checked by running it against the branch into a scratch folder (the hub and all its relative references arrive). Against `main` it works only once this branch is merged, which the "from `main`" wording already implies |
| S2 | `AGENTS.md` "Project structure" does not list the four new files (`crash-course/index.html`, `css/course.css`, `js/course.js`, `js/course-language.js`). `README.md` was updated | hard (documentation) | fixed in `f28f47b` at the PO's instruction: four entries, with the footer year in the `js/course.js` line |
| S3 | `js/course.js`: the text-swapping and mobile-menu code copies `js/script.js`; the header comment only explained the language part | Duplicated Code (judgement) | fixed in `8eacdda`: the header now says the copy is deliberate (the landing script must stay unchanged, spec #36) and to check both copies when fixing a bug |
| S4 | The hub footer's "Crash Courses" link points to the current page but had no `aria-current` | judgement | fixed in `8eacdda` |
| S5 | "Open the guide in Arabic" links to the hub itself (`?lang=ar`); it works only as a language switch | judgement | partly fixed in `8eacdda` (`hreflang="ar"`). It stays a link, as in the approved Figma frame, so it also works without JavaScript. Accepted by the PO on 2026-10-31 (reviewed the open items and approved the merge) |
| S6 | No `?lang=` on links between the landing page and the course pages, so English chosen on the landing page gives Arabic on the hub | judgement | no change needed. This is the spec's accepted trade-off ("an English visitor switches once on the course"; landing page unchanged) |
| S7 | Glossary term "Crash courses" is lower case; the menu label is "Crash Courses" | judgement (naming) | no change needed: title case for a label, as spec v3 writes it |
| S8 | `[fromAddress, saved].find(…) ?? "ar"`, and the export line | none (checked) | no change needed: it follows `js/message-length.js` |

Clean, as the reviewer checked: every new string is in `js/translations.js` in both languages with
parity; keys are whole strings; paths are relative; no dependency, CDN or secret was added; the
menu button, language buttons, skip link and `<main>` keep their accessibility attributes.

## Spec

Ticket #37 acceptance criteria:

| Criterion | Result |
|---|---|
| Seam 3 test-first (every listed case) | met: tests for valid and invalid `?lang=`, saved choice, site-key-only, nothing saved, throwing read, never saving `?lang=`, saving on click, a failed save |
| Own storage name; never reads the site's saved language | met: key `godwitly-course-language`; the hub loads `course.js`, not `script.js`; a test covers it |
| Links between course pages carry the language | met: `link()` and `a[data-course-link]` |
| Link text keys in both languages; checks pass | met: `nav.crashCourses` = "Crash Courses" / "الدورات المكثّفة"; the hub is in the reference check |
| Manual: Arabic by default, `?lang=en`, blocked storage | **run** (see below) |
| Manual: landing page and dashboard behave as before | partly run (see below) |
| Manual: `file://`, local server, EN/AR, desktop and 320px | met on the PO's check of `file://` (2026-10-31) and the agent's local-server checks below; the PO's check was one look at three tabs, not a recorded list of cases |
| `node --test` passes | met |
| Diff review saved | this report |

| # | Finding | Spec line | Outcome |
|---|---|---|---|
| P1 | The "Open the guide in Arabic" button is not in the ticket's list (title, summary, "Available in Arabic") | #37 "What to build" | **open for PO acceptance.** It comes from the approved Figma frame `Hub / Desktop 1440 · EN`; remove it if you want only what the ticket lists. Accepted by the PO on 2026-10-31: kept |
| P2 | Extra copy: the "Free guide" eyebrow and the page's meta description | #37 "What to build" | accepted by the PO on 2026-10-31, with P1 (the eyebrow is in the Figma frames): kept |
| P3 | The hub's Arabic title is «دليل كلود للمبتدئين» | spec v3 fixes the English title only | no change needed: it is the agreed Arabic title (ADR-0007 and the glossary). The Arabic summary is placeholder wording for the PO to confirm |
| P4 | The hub's own links point to itself (`index.html`) | none | no change needed: harmless |

### Manual checks run (Chrome on a local server, `python3 -m http.server`)

- **Arabic by default:** after the landing page saved English, the hub opened in Arabic with `dir="rtl"`. Nothing was saved on the hub by loading it.
- **Language buttons:** English showed the English title, summary and "Available in Arabic"; Arabic hid that row. A click saved `godwitly-course-language` and set `?lang=` in the address. A reload with no `?lang=` kept the choice. The landing page's saved language stayed `en` throughout.
- **Landing page:** the link appears in the header menu, the mobile menu and the footer, and goes to `crash-course/index.html`. The landing page and the hub, English and Arabic, were measured at **320px** with no horizontal scroll. The hub was looked at in English and Arabic at 320px with the mobile menu open, and at 1440px.
- **Blocked storage:** with every `localStorage` access throwing, the language switch still worked and the links carried `?lang=`.

### Not run

- **`file://` by the agent:** the browser tool can't open local files. The PO opened the hub (default and `?lang=en`) and the landing page from `file://` on 2026-10-31 and reported "the three files are ok".
- **Landing Launch sign-up form and the Sign-up dashboard:** not exercised. `js/script.js`, `js/form.js` and all `dashboard.*` files are untouched (see the diff), and the form was not submitted.
- **Landing page in English and Arabic at 1024px:** the new fifth menu link was seen at 1440px and 320px, not at 1024px.
- **Hub on a real phone, and keyboard navigation:** not run.

## Round 2: re-review of `6f5c6cd..f28f47b`

Two subagents (Standards, Spec). The spec hash was rechecked: still `42989dc8…b666` (v3). `node --test`:
58 pass, 0 fail. `git diff 6f5c6cd...f28f47b -- AGENTS.md README.md` shows two `AGENTS.md` hunks only
(Project structure, Deploy line); `README.md` is untouched, as the PO asked. `8eacdda` changes a
comment and two attributes only; no behaviour changed, and `js/script.js`, the landing page and the
dashboard are untouched.

| # | Finding | Kind | Outcome |
|---|---|---|---|
| R1 | This report still listed S1 and S2 as open after `f28f47b` fixed them | hard (evidence out of date) | fixed in this commit |
| R2 | `AGENTS.md` says "The Lesson pages will live beside it" about files that don't exist yet; it goes stale if the layout changes | judgement | left as it is: it is the wording of the entry the PO approved. Accepted by the PO on 2026-10-31 |
| R3 | `README.md` "Site deploy" still lists "`dashboard.html` and `_headers`" for what the `AGENTS.md` command includes; it now also includes `crash-course` | judgement | left as it is: the PO told the agent to leave `README.md` unchanged for this fix. accepted by the PO on 2026-10-31; preferred fix later: drop the list so `AGENTS.md` stays the one source |
| R4 | The deliberate copy in `js/course.js` (Duplicated Code) | judgement | no change needed: the same finding as S3, mitigated by the comment in `8eacdda` |
| R5 | `git archive main … crash-course` fails until this branch is merged, because `main` has no `crash-course/` yet | judgement | no change needed: the command is for deploying merged work; do not deploy before the merge |

S5, P1 and P2 are accepted as above.

## Still to do

- **Nothing is open.** On 2026-10-31 the PO reviewed the open items (S5, P1, P2, R2, R3), approved the merge, approved closing #37 and decided not to deploy until the first Lesson is added.
- Pushed and PR #47 opened with the PO's approval. CI passed on Node 24 and 26 before this evidence commit.
- The commits say `Refs #36, #37`; #36 stays open (Release 1 is not finished).
- Any further change to code, site files, `AGENTS.md` or the spec needs its own review. A commit that only
  changes this report needs none.
