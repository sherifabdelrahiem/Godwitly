# Diff review: Crash course hub content, Lesson list and mascots (ticket #38)

> Base: `main` at `1afe676` · Reviewed: `21b3538` on `feat/crash-course-hub-content`; the fix commit
> after it (CSS only, see S1/S6) was checked by the agent, not by a subagent (see "Re-review") ·
> Ticket: #38 of spec #36, **Spec version: v3**, sha256
> `42989dc87878d0d40742fd81691c50026f16e48ba5c69a6ace2ec287cdd0b666` (recomputed from the live body
> before the build: unchanged). Ticket #38's text says "against #36 v1"; v3 is the approved version
> and is what this review uses. · Method: `code-review`, two parallel subagents (Standards 79,133
> and Spec 79,926 tokens) · 2026-10-31

## Tests

- **TDD:** the course hub check (Seam 1, confirmed in the spec) was built test-first: example tests
  written and seen failing (`findCourseHubProblems is not a function`), then the check, then green.
  The real-file test went red against the old hub, drove the hub markup, and caught a real bug in the
  check (it read the number's key as the title); a regression example was added. The commit holds
  tests and code together, so the order can't be seen from the commit alone.
- **TDD: not applicable** to the hub wording, CSS and images: manual checks.
- **`node --test`:** 72 pass, 0 fail (before the fix commit and after it). Typechecking: not applicable.

## Standards

| # | Finding | Kind | Outcome |
|---|---|---|---|
| S1 | `css/course.css` used three hard-coded greys (`#f0eeeb`, `#dcd8d3`, `#e6e2dd`); spec #36 says no new colours | hard | fixed in the fix commit: `--color-page` and `--color-border`. Visible change: greyed cards are now lighter than the Figma frame's grey (they keep a border). Accepted by the PO on 2026-10-31: lighter greyed cards kept, no new token |
| S2 | Six `mascot-*.webp` files ship (about 200 KB) but no page uses them | judgement (Speculative Generality) | no change needed: ticket #38 requires them prepared here for the Lesson material |
| S3 | Nine near-identical card `<li>`s | judgement (Duplicated Code) | no change needed: static page without a build; the hub check catches drift |
| S4 | 18 keys translate only a digit (`course.lessonN.number`) | judgement | no change needed: gives Arabic-Indic digits in Arabic |
| S5 | A new Lesson touches the hub, `tests/course-lessons.js`, both translation blocks and the test fixture | judgement (Shotgun Surgery) | no change needed: the list is the intended single source |
| S6 | `.lesson-card__body` had no `min-width: 0`, so long words might widen the card | judgement | fixed in the fix commit; checked in Chrome at 320px (no horizontal scroll, English and Arabic) |
| S7 | Spacing differs between "Claude و Claude Code" and "Clerk وBrevo" / "وspec" | judgement (copy) | no change needed: the Lesson 6-9 titles are written as the spec fixes them |

Clean, as the reviewer checked: every string is a whole-key translation in both languages; GLOSSARY
terms; heading order, `<ol>`, `<time datetime>`; logical CSS properties for RTL; the mascots are not
referenced by any page.

## Spec

| Criterion (#38) | Result |
|---|---|
| "Before you start" lists Claude Pro or higher, GitHub (free), Mac macOS 13+ or Windows 10/11, the later-cost note, and a valid machine-readable checked date | met (`<time datetime="2026-10-30">`, enforced by the check) |
| Each card shows number, title, outcome, estimated time | met (all provisional text, see P2) |
| Six mascots renamed, resized, compressed, transparency kept; only web-sized versions committed | met: 640 px WebP with alpha, 26-38 KB each against 0.7-1.3 MB; the PNGs stay untracked |
| Course check built test-first, with missing card, wrong order, unreleased-as-link examples and a real-file test | met (the released-Lesson branch has example tests only; nothing is released yet) |
| Manual: no mascot; EN and AR; desktop and 320px | met on the agent's Chrome checks below and the PO's check (approved 2026-10-31) |
| `node --test` passes | met |
| Diff review saved | this report |

| # | Finding | Outcome |
|---|---|---|
| P1 | Lesson 1's Arabic title "أهلًا بيك في دليل كلود" is agent-written and departs from the table's subject | accepted by the PO on 2026-10-31 (approved the table of strings). Still provisional until Lesson 1's own ticket supplies its approved title |
| P2 | All 18 outcome and time strings (15, 30, 30, 45, 30, 30, 45, 60, 30 min) are agent-written; neither the spec nor Figma gives them | accepted by the PO on 2026-10-31 (approved the table of the 18 strings). Marked provisional in `js/translations.js`; Lessons 6-9 are the weakest because Release 2 is undefined (Lesson 7 says "Run your backend on Railway"; the Railway Windows install is unconfirmed) |
| P3 | English titles for Lessons 6-9 are agent-written | accepted by the PO on 2026-10-31, with P2 |
| P4 | The costs box says "hosting, sign-in and email", not Railway, Clerk and Brevo | no change needed: matches the ticket; no prices are stated, and the spec gives none |
| P5 | "Who it's for" says "You don't need to code" (not stated in the spec) and leaves out "has Claude Pro and Claude Desktop" | accepted by the PO on 2026-10-31, with P2 (the table of strings listed the who-it's-for text) |
| P6 | Extra: an eyebrow, a heading and an aria-label on the Lesson list; README and AGENTS.md upkeep | no change needed: documentation upkeep is required; no hero buttons, closing band or mascot were added |

### Manual checks run (Chrome on a local server)

- Arabic and English hubs at 1440px: the cards sit three across, in order 1-9 (right to left in Arabic); the costs box and the "Last checked" line show; no mascot; no card is a link.
- At 320px (measured in a 320px-wide frame, because the window resize did not change the viewport): no horizontal scroll in either language; one column of cards.

### Not run

- A real phone, keyboard navigation, `file://` by the agent (the browser tool can't open local files), the landing page and Sign-up dashboard (untouched).
- The hub at 1024px; the mobile menu on the hub (unchanged from #37).

## Re-review

The fix commit changes `css/course.css` only (`git diff 21b3538..HEAD`: 7 insertions, 3 deletions). The
agent checked it: no hard-coded colours remain (`grep` finds none), `node --test` 72 pass, and
Chrome at desktop and 320px as above. **AGENTS.md asks for its own review**; this was the agent's
own check, not a subagent review, so the PO may ask for a full one.

## Still to do

- **Nothing is open.** On 2026-10-31 the PO accepted S1, P1, P2, P3 and P5, and approved the hub check and the push with a PR (merging, closing #38 and deploying were not approved).
- Pushed and the PR opened with the PO's approval. #38 stays open until the PO approves closing it. The commits say `Refs #36, #38`.
