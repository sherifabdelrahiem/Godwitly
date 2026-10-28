# Diff review — glossary page text (#6)

> Reviewer: Claude (Opus 5.5), two parallel review agents (Standards, Spec) via `code-review`
> · Builder: Claude (Opus 5.5) · Plan: `docs/plans/2026-10-28-glossary-page-text.md`
> (approved) · Spec: #6 · Tickets: #9, #10, #11, #12 · 2026-10-28

## Round 1: APPROVED, with two items for the PO

### Standards

- No hard violations against `AGENTS.md`, `README.md` or `GLOSSARY.md`.
- Every changed English value in `js/translations.js` matches its built-in default in
  `index.html`, including both menus and both `alt` defaults.
- Every key the glossary requires was changed in both `en` and `ar`; Arabic-only changes are
  where the English already used the glossary term.
- No _Avoid_ words in any changed line. "tabletop exercises" stays; the glossary only avoids
  "tabletop" as a noun on its own.
- Judgement call, no action: one wording change means editing `en`, `ar` and the HTML default.
  This is the repo's documented design, and the copies agree.

### Spec

- All 28 rows of the spec table match exactly, diacritics included. No other keys, ids or
  anchors changed. Consent text, form fields, success message, CSS and JS are untouched.
- No scope creep; nothing implemented wrongly.

### Avoided-word search (the spec's supporting check)

Searched `js/translations.js` and `index.html` for every avoided word in the tickets. No
matches remain in any key the spec covers. Matches outside the spec table:

| Key | Text | Assessment |
|---|---|---|
| `resilience.blurb` (EN) | "scenario-based tabletop exercises" | Allowed (adjective) |
| `why.b3text` | "Track progress, readiness and maturity." / التقدّم والجاهزية | **For the PO**: "track" is a verb here (fine), but "readiness" in an organisation-level list may mean Preparedness. Not in the spec table, so not changed. |
| `why.b2title` (AR) | مسارات عمل منظّمة | "Structured workflows", not a learning track; fine |
| `why.b1text` (AR), `engage.blurb` (AR) | التدريب، الجلسات التدريبية | General "training", not Learn's Practice; fine |
| CSS class names | `bars__track`, `donut__track` | Code, not text |

### Browser verification (all run on 2026-10-28)

Run on a scratch copy of the branch (not committed), served from `127.0.0.1`, with the
Supabase URL blanked so the form could not send anything. 320px was checked inside a 320px
iframe because the browser window would not shrink below its minimum width.

- **Desktop, EN and AR:** menu link "Get notified" / احصل على إشعار; hero button "Explore Our
  Products" / استكشف منتجاتنا; products eyebrow and intro; Learn tab with the card showing
  الممارسة, "التالي: ممارسة من 15 سؤالًا" and الامتحان النهائي; Resilience tab with "Realistic
  scenarios". Pass.
- **320px, EN and AR:** mobile menu open (Arabic shows احصل على إشعار), Learn and Resilience
  panels, the form, and the footer. New labels wrap cleanly. Pass.
- **#9 error state:** filling the form in Arabic and submitting shows "نموذج طلب الإشعار غير
  متصل بعد. يُرجى المحاولة لاحقًا." Pass.
- **Toggle EN → AR → EN (and → AR):** every changed value, both `alt` texts and the meta
  description match the target language. Pass.
- **Rendered text check:** headless Chrome DOM dump per ticket, EN and AR. Pass.

### Pre-existing issue found (not caused by this change)

At 320px the header's menu button and language switch stick out by 17px (AR) and 19px (EN),
so the page can scroll sideways. Measured identically on `main`. Out of scope here (layout);
for the PO to decide whether to open an issue.

Not run: no automated tests or lint exist in this repo.
