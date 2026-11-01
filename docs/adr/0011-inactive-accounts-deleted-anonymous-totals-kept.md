---
status: accepted
---

# Inactive Godwitly accounts are deleted; only anonymous totals are kept

The PO decided on 2026-10-31 that a Godwitly account unused for 24 months is deleted with its
Enrolments and ticks, and that every deletion, automatic or requested by the person, first adds
to two anonymous totals for each Crash course the account was enrolled in: Enrolments removed,
and Completed Crash courses removed when the account had one. The Course report adds these to
the live figures, so the purpose of counting Enrolments and completion survives the retention
rule. "Use" is a server-kept last-used date that only moves forward, set at account creation and
updated with server time, at most once per account per day, on completing a Google sign-in,
enrolling, ticking or unticking, and opening a Lesson that needs Enrolment; reading a Preview
Lesson and background session refresh do not count, because Supabase's last sign-in time is not
updated by session refresh and sessions do not expire by default.

Clean-up runs inside the accounts project (ADR-0009), which may pause on the free plan. A daily
job deletes an account within 30 days of it becoming eligible. If the project is paused, the
Project owner restores it within 30 days of Supabase's confirmation email that the project has
been paused (a warning comes about a week before) and runs the same clean-up by hand straight
away, so an account whose deadline fell during the pause is deleted within 30 days of that
email. Each run leaves a record with no personal data, and the Course report shows the last
successful run. Deleting the whole project is never routine account clean-up; a failed restore
is an incident for the PO.

## Considered options

- **Keep accounts until the person deletes them:** simplest, but most people never delete an
  account they have stopped using, so personal data would be kept with no end date.
- **Anonymise instead of delete (keep rows under a random id):** keeps detail, but a pattern of
  ticks and timestamps can still point to a person, and it is harder to build and to justify.
- **Figures from live rows only:** every deletion would quietly lower the figures the feature
  exists to measure.
- **A separate Cloudflare Worker running clean-up on a schedule:** still cannot delete while the
  project is paused, so the owner's duty remains, and it adds a service to deploy and watch.
- **A GitHub Actions schedule:** puts service credentials in GitHub; deferred.

## Consequences

- **Frozen results:** a deleted account's completion is counted as it stood when deleted; it
  never drops back when a Lesson is released later, unlike live accounts.
- **Counted twice:** someone who returns with the same Google account after deletion gets a new
  account and a second Enrolment in the all-time figures.
- **Caught up is current only:** it is not kept for deleted accounts.
- **Not complete erasure:** Supabase's Auth audit logs and Cloudflare's request logs stay for
  those vendors' own periods (the free plan takes no automatic backups); the privacy text says
  so, and that deleted accounts still count anonymously in the totals.
- **Release blockers (spec #56), each needing recorded evidence before accounts go public:**
  Supabase Cron must run on the free plan (if it doesn't, accounts don't launch until the PO
  approves another way to run the clean-up); the vendors' log periods; how the hosted Auth
  service treats the sign-in and refresh times; asymmetric signing keys on the accounts
  project; and the Google app's publishing and branding status.
