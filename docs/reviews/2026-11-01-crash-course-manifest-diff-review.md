# Diff review: T0, the Crash course manifest (ticket #57)

- **Base:** 38506f0 (`docs/accounts-enrolment-design`, the accounts design docs). **Reviewed commits:** 965e353 (the build),
  fde4fa3 (round 1 fixes), 9c06518 (round 2 fixes), 807c3cc (round 3 fixes). Each fix commit had its own two-axis review.
- **Spec:** #56, Spec version v4, sha256 `14f2d54f966f056175ab86f8fe659a90a5025cc739d89098a433d224c4599453`
  (recomputed 2026-11-01 before building; matches the PO approval record on #56). Ticket #57 names the same version and hash.
- **Lane:** Critical (spec #56). This ticket changes no backend, Supabase or personal data; it is a prefactor of the project checks.
- **TDD:** used at Seam 3 (the project checks, agreed in spec #56): `tests/checks.test.js` and `tests/course-manifest.test.js`,
  red before green for each slice. Not applicable to the look of the pages (browser checks below). Typechecking: not applicable.
- **Tests run:** `node --test`: 160 pass, 0 fail (at 807c3cc).

## Decisions made by the PO in session (2026-11-01)
| Question (the spec left it open) | Decision |
|---|---|
| Which Lessons of the Claude Crash Course for Beginners are Required | All nine |
| Where each Lesson's public summary line comes from | Its approved Arabic hub outcome (`course.lessonN.outcome`), word for word; a project check enforces it |
| Where the production deploy file list lives | `deploy-files.txt`, one path per line; the command is `git archive main $(git show main:deploy-files.txt) \| tar -x -C <empty-folder>` |

These choose values the spec says each Crash course names for itself; they change no spec scope, so no new spec version.

## What it does
- `courses/manifest.js` lists the manifests, describes the format and defines `publicPart()`; `courses/claude-beginners.js`
  (id `claude-beginners`) and `courses/test-course.js` (marked `test: true`, dummy text, one released Preview Lesson and one
  released Lesson that needs Enrolment). `tests/course-lessons.js` is removed; the project checks read the manifest.
- New checks in `tests/checks.js`, sections 7-10: manifest checklist items against the hub cards and each Lesson page's `data-item`
  list and `data-required` flags; the manifest's own rules (numbering, flags, ids unique across the Crash course including
  retired ones); the public part holds only the agreed fields; the deploy list holds no test Crash course material, no manifest,
  and only plain paths.
- Lesson 1's four checkboxes gain `data-required="true"`; the hub gains an updated HTML comment. Nothing in `js/` or `css/` reads
  `data-required`.
- `AGENTS.md` (project structure, deploy command) and `README.md` (file table, dashboard deploy step) updated.

## Verification
| Check | Status | Evidence |
|---|---|---|
| `node --test` | passed | 160 pass, 0 fail |
| Checks fail on a difference (mutation) | passed | flipping an item's `required`, adding an item, releasing Lesson 2 and adding `test-course` to `deploy-files.txt` each failed the matching project check; all restored |
| New deploy command uploads the same files as the old one | passed | `git archive` file lists identical, 42 entries |
| Lesson 1 ticks and the hub "Done" mark | passed | Chrome, served from `http://127.0.0.1:8765`: ticking all four saved `{"ticked":[...4 ids]}`, hub showed "تم" in Arabic; storage cleared afterwards |
| English and Arabic, desktop | passed | Chrome screenshots of the hub (AR) and Lesson 1 (EN); `dir` rtl/ltr as expected |
| 320px, both pages, both languages | passed | each page loaded in a 320px frame: document scrollWidth equals clientWidth (no sideways scroll) |
| `file://` (double-click) | **not performed by the agent** | the browser tool cannot open `file://`; the HTML change is one attribute and one comment, no script or style change. The PO offered to open the pages |
| Real phone, Safari, Firefox | not performed | |

## Standards findings
| # | Finding | Outcome |
|---|---|---|
| S-1 | GLOSSARY.md does not define "Crash course manifest", "test Crash course", "retired item", "public part" (spec #56 uses them) | **Open, for the PO**: glossary changes belong to `/grill-with-docs`; reported as a gap, not edited |
| S-2 | New sections split section 6 in `tests/checks.js` | Fixed in fde4fa3 and 9c06518 (now sections 7-10 after section 6) |
| S-3 | `PUBLIC_FIELDS` repeats the fields `publicPart()` builds | Not changed: deliberate, so the check is independent of the code it checks (not tautological) |
| S-4 | Summaries could drift from the Arabic hub outcomes | Fixed in fde4fa3 (project check) |
| S-5 | `tests` variable name in a project test | Fixed in fde4fa3 (`testCourses`) |
| S-6 | Deploy list: a line with spaces, a glob or pathspec magic passed but deploys differently; CRLF | Fixed in fde4fa3 |
| S-7 | A real manifest file in the deploy list passed | Fixed in fde4fa3 |
| S-8 | Missing Lesson/item lists, non-number Lesson numbers, a missing public part threw instead of being reported | Fixed in fde4fa3 and 807c3cc (null items, array Lessons) |
| S-9 | **A deploy entry starting with "-" was read by git archive as an option (`-o`)** | Fixed in 9c06518: every path segment starts with a letter, digit or "_" (also refuses `.`, `..`, hidden names, leading "/") |
| S-10 | Dead ":" check; repeated literal; project test name | Fixed in 9c06518 |
| S-11 | Pre-existing: the `data-item` pattern reads double quotes only | Not changed: pre-existing, fails safe (reported as a mismatch) |
| S-12 | Section 7 comment has one 131-character line | **Open, for the PO** (cosmetic) |
| S-13 | The deploy-entry message names "." and ".." but the rule refuses any segment starting with "." | **Open, for the PO** (cosmetic) |

## Spec findings
| # | Finding | Outcome |
|---|---|---|
| P-1 | The public-part check proves `publicPart()`; nothing is published yet. Later tickets (migration, Seam 4 anonymous-read SQL) must reuse or match it | Informational, carried to T1 #58 |
| P-2 | "Retired ids never reused" is checked within one version only; an id deleted outright and re-added is not caught | Documented limit in `tests/checks.js` section 8; retired items must stay in the manifest. **For the PO to accept** |
| P-3 | Test Crash course shape not enforced | Fixed in fde4fa3 (one released Preview Lesson, one released Lesson that needs Enrolment) |
| P-4 | Hub cards carry ids only, so required flags are compared on Lesson pages only | Informational: the hub's states change in T6 #64 |
| P-5 | `folder` and `retired` go beyond the spec's literal field list | Informational: internal, kept out of the public part, needed for the deploy check and retirement |
| P-6 | Scope creep | None found |

The final evidence commit's ID is given in the completion report (a commit can't contain its own ID).
