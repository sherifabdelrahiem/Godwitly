---
status: accepted
---

# The Sign-up alert carries no personal data and is best-effort

Each new Launch sign-up triggers an email to the project owner with only a fixed subject, the
time, the row ID and a link to the Supabase Table Editor, never the visitor's name, email,
phone, job title or message. Visitors consented only to be contacted about the launch, and
copying their details into an email provider and a mailbox would create more copies to secure
and delete. The PO chose this alert-only design on 2026-10-27 after the Codex plan gate failed
the first version on privacy (`docs/plans/2026-10-27-signup-email-notify.md`, v2).

## Considered options

- **Email with all sign-up fields** (plan v1): convenient, but sent personal data to Resend
  and the inbox, outside the consent and the deletion process.

## Consequences

- Alerts are best-effort: the insert never fails because of an alert, and a lost alert is
  acceptable. The `launch_signups` table is the source of truth; check it weekly.
- To see who signed up, open the Table Editor. Don't add personal fields to the alert.
