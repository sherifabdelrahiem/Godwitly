# Diff review — Sign-up viewer address rule (dashboard plan D2)

> Reviewed: the uncommitted D2 change on `feat/signup-dashboard` (on top of `6fb2f24`) · Spec:
> `docs/plans/2026-10-28-signup-dashboard.md` **D2, APPROVED by the PO on 2026-10-29** · Method:
> agent review against `AGENTS.md` (Standards) and D2 (Spec), plus the Codex gate
> (`2026-10-29-signup-viewer-email-rule-plan-gate.md`, r2 PASS), which read the same diff ·
> 2026-10-29

## Files

- `js/dashboard.js`: `EMAIL_PATTERN` and its comment (3 lines).
- `supabase/migrations/20261029120000_signup_viewers_email_check.sql` (new): replaces
  `signup_viewers_email_check` only.
- `README.md`: one row in the Supabase files table.
- `docs/plans/2026-10-28-signup-dashboard.md`: D2 in History.
- `docs/reviews/2026-10-28-signup-dashboard-setup.md`: local test results and the D2 push.
- `docs/reviews/2026-10-29-signup-viewer-email-rule-plan-gate.md` (new).

## Standards (`AGENTS.md`)

- **Rules in both places:** the page check and the database CHECK rule change together and
  use the same characters. Parity is shown with 33 cases (D2). ✅
- **Text:** no new user-facing text; the existing `dash.accessInvalid` message (EN and AR)
  covers the refusal. ✅
- **Docs:** the README files table lists the new migration. `AGENTS.md` describes the
  migrations folder in general terms and needs no change. ✅
- **Security and data:** no grants, policies, functions or data change. No personal data
  in the diff: only `example.com` placeholders. ✅
- **Boundaries:** the migration was pushed only after PO approval, with the target and the
  pending list confirmed first (setup log). ✅
- **Style:** the comments match the surrounding density and explain the one non-obvious
  choice (listed whitespace instead of `\s`). ✅

## Spec (D2)

- The rule refuses `,` `;` ASCII spaces and control whitespace anywhere, and needs a plain
  domain after `@`. ✅
- `"<b>x</b>"@example.com` (AC7), `first.last+tag@gmail.com` and multi-label domains stay
  valid. ✅
- The migration fails, and changes nothing, while a malformed row exists (tested on
  `godwitly-test`); the AC6 test entries were removed before the push. ✅
- Live checks after the push: all six malformed addresses refused with `23514` (rolled
  back), the owner row unchanged, and owner access works. ✅

## Findings

None open. Codex r1 #1 (P2, `\s` differs between engines) was fixed before approval.

## Not in scope

- The landing-page form (`js/form.js:71`) and the `launch_signups` email rule use the same
  loose pattern. The PO asked for that fix to stay separate.
- The Access UI check by hand (typing `Viewer@Example.com,` and seeing "Please enter a valid
  email address.") is part of the continuing local browser test.
