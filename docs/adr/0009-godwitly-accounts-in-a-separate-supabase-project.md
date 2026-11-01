---
status: accepted
---

# Godwitly accounts live in a separate Supabase project

The PO decided on 2026-10-31 that Godwitly accounts, Enrolments and Course progress live in
their own Supabase project, not in `godwitly`. The `godwitly` project's "Before User Created"
Auth hook refuses every Google account that is not on the Sign-up viewers list, and it acts
for the whole project. Opening it to every Google account would remove the first of the two
barriers in front of Launch sign-ups (ADR-0005) and give strangers signed-in sessions against
the database that holds them. A separate project keeps `godwitly`, its hook and ADR-0005
unchanged, and makes "a Godwitly account never gives access to Launch sign-ups" true by
construction rather than by policy.

## Considered options

- **One project, hook opened to every Google account:** one sign-in for a Sign-up viewer who
  also takes a Crash course, but Launch sign-ups would then depend on row-level security
  alone, and every later grant to signed-in users would have to remember the viewers check.
  ADR-0005 already rejected letting anyone sign in to that project.

## Consequences

- **Two sign-ins:** a Sign-up viewer who also takes a Crash course signs in to each project
  separately. The two never share accounts or access.
- **Free plan, accepted pause risk:** both projects stay on Supabase's free plan, which allows
  two active projects and pauses a project after about a week with no activity. A paused
  accounts project means nobody can sign in, enrol or open Lessons that need Enrolment until
  the Project owner restores it. The PO accepts this for free Crash courses. The trigger for
  Supabase Pro (about $35 a month for both projects, checked 2026-10-31) is preparing the
  first paid Crash course, not traffic.
- **No free project left:** a third Supabase project needs a paid plan.
