---
status: accepted
---

# The sign-up form writes straight to Supabase with the public key

The "Get notified" form sends each Launch sign-up from the browser directly to the
`launch_signups` table, using Supabase's publishable key, which is committed in
`js/config.js` on purpose. Safety comes from the database: the public role may only insert
listed columns (no read, update or delete), row-level security is on, check constraints
validate every field, and a hidden honeypot field stops simple bots. The PO chose this on
2026-10-27 because a server step was out of proportion for a low-traffic course site, and
accepted the risk that a determined spammer could add junk rows, to be deleted by hand.

## Considered options

- **Server function with Turnstile and rate limits** (plan v2–v3 of
  `docs/plans/2026-10-27-notify-me-form.md`): stronger spam protection, but it needed a
  server component, secrets and more failure modes. Two Codex gate rounds were still finding
  issues in it when the PO stopped and approved the simple version.

## Consequences

- The publishable key in the repo is not a leak. Never replace it with the secret or
  service_role key.
- Form rules live in both `js/form.js` and the migration, and must change together.
- If junk sign-ups become a real problem, add Turnstile as a separate, approved change; rotating
  keys or secrets does not stop form spam.
