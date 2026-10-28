# Diff review — ADRs 0001–0004

> Reviewer: Claude (Opus 5.5), self-review · Builder: Claude (Opus 5.5) · Plan:
> `docs/plans/2026-10-28-adrs.md` (approved) · 2026-10-28

Self-review: documentation only, so no second-model review was run.

## Round 1: APPROVED

Each claim was checked against its source:

- **0001:** no build tools and `file://` + Cloudflare Pages support (`AGENTS.md` overview and
  "Development rules"; notify-me-form D7); course origin (`AGENTS.md` overview); "Common
  changes" (`README.md`); English text in both `index.html` and `js/translations.js` (repo
  pattern, confirmed in the #13 review).
- **0002:** insert-only column grant, RLS, checks and honeypot (`supabase/migrations/
  20261027120000_launch_signups.sql`, notify-me-form D4); PO decision and accepted spam risk
  (notify-me-form LANE note, D4, History); server function + Turnstile in v2–v3 and two failed
  Codex rounds (notify-me-form History); "rotating secrets does not stop form spam" (`README.md`).
- **0003:** no unique email rule and the enumeration reason (notify-me-form D3 and History).
- **0004:** alert contents and best-effort behaviour (`README.md` "Email alerts";
  signup-email-notify Goal, E3, E5); v1 sent all fields and failed the gate on privacy
  (signup-email-notify-plan-gate r1 #3); PO chose alert-only on 2026-10-27 (signup-email-notify
  History v2).

No secrets or personal data. Not run: no tests or lint exist in this repo.
