# Plan — Align landing page text with the glossary (EN + AR)

> Status: **APPROVED** by PO · 2026-10-28 (wording as in the #6 spec table)
> Spec: #6 · Tickets: #9, #10, #11, #12 (no blockers between them)
> Branch: `feat/glossary-page-text` → one PR → merge to `main`

```text
LANE: Standard — visible text, image descriptions and the meta description only.
No layout, behaviour, form-field, consent, Supabase or key/anchor changes.
```

## Goal

Every phrase on the page uses the term agreed in `GLOSSARY.md`, in English and Arabic,
so a visitor meets one word per concept and the menu link honestly names the Launch
sign-up form.

## Approval needed

The PO approves the **New** wording in the spec's Implementation Decisions table (#6).
The glossary rules behind each row are already agreed and are not reopened here.
Arabic wording was proposed by the agent; the PO has the final say on naturalness.

## Tickets

Each ticket is one commit on this branch. They touch different translation entries and can
be done in any order.

| Ticket | Spec rows | Delivers |
|---|---|---|
| #9 Sign-up wording | 1, 11 | Menu link "Get notified" / احصل على إشعار; Arabic "not connected" error says نموذج طلب الإشعار |
| #10 Product and Preparedness | 2, 3, 4, 5 | "Our products" / "Explore Our Products"; footer and Arabic hero/meta use Preparedness; products intro says "real-world preparedness" |
| #11 Resilience | 6, 7 | "Realistic scenarios"; Arabic description without محاكاة; both image descriptions give the maturity score to the organisation |
| #12 Learn | 8, 9, 10 | "Structured programmes"; "Final exams" / الامتحان النهائي; Arabic Practice = الممارسة |

## How each ticket is made

- Change the value in both `en` and `ar` in `js/translations.js`, as the spec table lists.
- For every changed English value, update the matching built-in English text in
  `index.html` (visible text and `alt` defaults).
- Do not rename keys, ids or anchors.

## Verification

Per ticket, and again for the whole branch before the PR:

1. Open `index.html` from the file system with `?lang=en` and `?lang=ar`, on desktop and at
   320px width.
2. Confirm every new value appears: visible text, the two image `alt` texts, and the meta
   description.
3. Toggle EN → AR → EN; nothing reverts to old wording.
4. #9 only: show the Arabic "not connected" error using an uncommitted local copy with the
   Supabase settings blanked; discard the copy afterwards.
5. Check the menu (desktop and mobile), hero button, Learn and Resilience tabs and cards,
   and footer for wrapping or overflow. If a label doesn't fit, stop and raise it; no
   restyling in this change.
6. Search the translations and built-in English text for the avoided words listed in each
   ticket; expected no matches apart from the allowed English "tabletop exercises".

Results go in `docs/reviews/2026-10-28-glossary-page-text-diff-review.md`.

## Out of scope

- #7 (table comment) and renaming the `notify-signup` Edge Function.
- Consent text, form fields and the success message.
- Any layout, colour or behaviour change.

## Rollback

Revert the merge commit; the change is text only.
