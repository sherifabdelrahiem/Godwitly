# Plan — README lists all Supabase files (#22)

> Status: **APPROVED** by PO · 2026-10-28 ("ok lets do it" on #22)
> Issue: #22 · Branch: `docs/readme-supabase-files` → PR → merge to `main`

```text
LANE: Standard — documentation only. No site, database or Cloudflare changes.
```

## Change

In `README.md` "Contact form", add three rows to the file table, after the existing
`…_launch_signups.sql` row, using the same `…_name.sql` shorthand:

- `…_notify_signup_trigger.sql`: the trigger that asks for a Sign-up alert
- `…_launch_signups_comment.sql`: the table description (#7)
- `supabase/functions/notify-signup/index.ts`: the Edge Function that sends the Sign-up alert

## Acceptance

- Every file in `supabase/migrations/` and `supabase/functions/` appears in the table.
- Descriptions use `GLOSSARY.md` terms (Launch sign-up, Sign-up alert).
- No site, database or Cloudflare change.
