# Plan — "Why Godwitly" uses Preparedness, not Readiness

> Status: **APPROVED** by PO · 2026-10-28 (by running `/implement #14` on the published spec)
> Spec: #14 · Branch: `feat/why-preparedness` → one PR → merge to `main`

```text
LANE: Standard — one translation entry (EN + AR) and its built-in English text.
No layout, behaviour, key or anchor changes.
```

## Change

| Key | Lang | New |
|---|---|---|
| `why.b3text` | EN | Track progress, preparedness and maturity. |
| `why.b3text` | AR | تابِع التقدّم والاستعداد المؤسسي ومستوى النضج. |

Update the matching built-in English text in `index.html`. Leave the benefit title and the
Learn card's Readiness label unchanged.

## Verification

1. Rendered page with `?lang=en` and `?lang=ar`, desktop and 320px: the "Measurable
   outcomes" card shows the new sentence and wraps cleanly.
2. Toggle EN → AR → EN: the sentence never reverts.
3. Search translations and built-in English text for "readiness" and الجاهزية: only
   `cards.readiness` (both languages) and CSS class names remain.

Results go in `docs/reviews/2026-10-28-why-preparedness-diff-review.md`.

## Rollback

Revert the merge commit; text only.
