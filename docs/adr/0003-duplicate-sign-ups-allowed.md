# Duplicate sign-ups are stored, with no unique email rule

`launch_signups` has no unique constraint on email, so the same person can sign up twice and
both rows are kept. A unique rule would make a repeat submission fail with a different
response, which would let anyone probe whether an email address has already signed up. The
Codex plan gate flagged that enumeration risk, and allowing duplicates closes it at no cost
(`docs/plans/2026-10-27-notify-me-form.md`, decision D3).

Do not "fix" this with a unique index. Remove duplicates when reading the sign-ups, for
example before sending the Launch notification.
