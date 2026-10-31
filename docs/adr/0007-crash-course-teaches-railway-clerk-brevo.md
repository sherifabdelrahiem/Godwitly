---
status: accepted
---

# The Crash course teaches Railway, Clerk and Brevo, not Godwitly's own stack

The PO decided on 2026-10-30 that the Claude Crash Course for Beginners ends with one project:
a sample business page whose form saves messages to Postgres on Railway, a private dashboard
where only the owner signs in with Clerk to read them, and a Brevo email to the owner for each
new message. Railway hosts both the site and the database, so a beginner learns one platform
for hosting and data instead of two. Godwitly itself runs on Supabase and Cloudflare Pages
(ADR-0001, ADR-0002, ADR-0005); the course does not teach them.

## Considered options

- **Godwitly's own stack (Supabase + Cloudflare Pages):** free to keep running and already
  covered by the reference worksheets, but two platforms for a beginner, and Supabase's
  publishable/secret keys and row-level security are a lot to learn alone.
- **Railway without Clerk:** Railway has no sign-in service, so Claude would have to build
  its own login for a page that shows people's messages. Rejected as the riskiest option.

## Consequences

- **Cost for every Course taker:** Claude Code needs Claude Pro or higher, and Railway's free
  trial is a one-time credit for 30 days; keeping the site online needs a paid Railway plan.
  Clerk and Brevo have free plans. Prices were checked on 2026-10-30 and change; the course
  states them with a date.
- **The dashboard always uses Clerk sign-in**, because it shows personal data.
- **Course content must not describe how Godwitly works.** The course's project is the
  Course taker's own, on a different stack.
