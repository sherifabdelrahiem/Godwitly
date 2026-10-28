# Diff review — "Why Godwitly" uses Preparedness (#14)

> Reviewer: Claude (Opus 5.5), two parallel review agents (Standards, Spec) via `code-review`
> · Builder: Claude (Opus 5.5) · Plan: `docs/plans/2026-10-28-why-preparedness.md`
> (approved) · Spec: #14 · PR: #16 · 2026-10-28

The PO merged PR #16 before this report was written; it is added afterwards in its own PR.
Nothing below changes that merge.

## Round 1: APPROVED

### Standards

- No hard violations against `AGENTS.md`, `README.md` or `GLOSSARY.md`.
- `why.b3text` changed in both `en` and `ar`; the English value matches the built-in default
  in `index.html` exactly.
- EN "preparedness" and AR "الاستعداد المؤسسي" are the glossary terms for Preparedness; the
  _Avoid_ word الجاهزية is gone from this sentence.
- No baseline smells (three-line text change).
- Judgement call for the PO: the glossary calls Preparedness "a general aim, not a score",
  while the sentence sits under "Measurable outcomes" and says "Track … preparedness". This
  follows the approved spec wording; if stricter alignment is wanted, the change belongs in
  the glossary or a follow-up spec.

### Spec

- EN and AR match the spec table exactly; the Arabic was compared code point by code point
  (kasra on تابِع, shadda on التقدّم, ي at the end of المؤسسي, ى in مستوى).
- Key unchanged; benefit title and `cards.readiness` unchanged; no scope creep.
- Search for "readiness" / الجاهزية: only `cards.readiness` (EN and AR) and the CSS classes
  `ui-card--readiness` and `readiness` remain, as the spec expects.

### Browser verification (run on 2026-10-28)

Scratch copy of the branch served from `127.0.0.1`, Supabase URL blanked.

- **320px, EN and AR** (inside a 320px iframe): the "Measurable outcomes" card shows the new
  sentence and wraps cleanly. Pass.
- **Desktop, AR:** new sentence shown on two lines in the card. Pass.
- **Toggle EN → AR → EN:** sentence correct in each language. Pass.
- **Rendered text check:** headless Chrome DOM dump, EN and AR. Pass.

Not run: no automated tests or lint exist in this repo.

### Not yet live

As of this review the live site still serves the page from PR #1 (`370e7aa`, deployed
2026-10-26). The Cloudflare Pages project `godwitly` has no Git connection; every deployment
is an ad-hoc upload, so merging to `main` does not deploy. #13 and #16 need a deploy
before visitors see them.
