---
status: accepted
---

# Lessons that need Enrolment are served through Cloudflare Pages Functions

The PO decided on 2026-10-31 that Lessons which are not Preview Lessons, and their Resources,
are served through Cloudflare Pages Functions middleware. Before returning a protected file it
checks the person's Supabase session from the accounts project (ADR-0009) and their Enrolment
in that Crash course, and returns an "enrol to continue" page otherwise. Lessons stay whole
HTML pages in Git, so authoring, the project checks and the single `wrangler pages deploy`
stay as they are; the landing page and the Sign-up dashboard do not change.

## Considered options

- **Private Supabase Storage bucket, fetched by a public page outline:** keeps Supabase as the
  only enforcer and Pages purely static, but splits every Lesson into an outline in Git and
  content uploaded separately, hides the Lesson from the project checks, leaves it blank
  without JavaScript, and adds a second deploy step that needs owner credentials.
- **Vercel Routing Middleware (no framework):** the same middleware shape and the same
  Supabase session work, so it simplifies nothing that matters. Its free Hobby plan is
  non-commercial only, so Godwitly would need Pro ($20 per developer seat a month, checked
  2026-10-31), and moving off `godwitly.pages.dev` changes the public address, the dashboard's
  OAuth redirects and its CSP headers.
- **Next.js (on any host):** every page is static except the gate; a framework would mean
  rewriting every page with a build step and reversing ADR-0001 for no extra protection.
- **A hosted course platform (Teachable, Thinkific):** least backend to keep, but no free plan
  ($39 and $109 a month at the entry tier, checked 2026-10-31), partial right-to-left support,
  completion tracked per lecture rather than by Required checklist items, learner data outside
  Supabase, and Godwitly's own learning product would sit on someone else's platform.

Reopen these only if Godwitly adopts a framework for its own reasons, or keeping the gate
becomes a measurable burden.

## Consequences

- **The repository must be private before protected content enters it.** It is public today,
  so a Lesson that needs Enrolment would be readable on GitHub whatever the site enforces.
  The PO will make it private later; until then, no protected Lesson's page, draft or Resource
  is committed or pushed.
- **The gate does not check tokens itself:** it sends the person's session token, from an
  HttpOnly cookie, to one function in the accounts project, where Supabase checks it. That
  function confirms the session is still live, the Lesson is released and belongs to that Crash
  course, and the account is Enrolled. Anything else fails closed. Preview Lessons are served
  without calling Supabase.
- **Deployment safeguards are part of the gate:** the Pages "fail closed" setting for when the
  daily Functions limit runs out (otherwise files are served without the gate), an explicit
  route list covering every protected folder and everything under it, no cache rule ahead of
  the gate, security headers set in code (`_headers` does not apply to Function responses), and
  a bypass test run on the production address, the preview address and an old deployment
  address. Old deployments stay reachable, so after any security fix to the gate they are
  listed and deleted (docs/reviews/2026-10-31-accounts-enrolment-stack-panel.md).
- **The locked page is shared UI:** the gate's "enrol to continue" page is bilingual for all
  account, button and error text; only Lesson text stays Arabic-only (ADR-0008). It shows no
  Lesson content and is never cached or indexed.
- **Accounts do not go public before the legal check:** public release waits until counsel has
  named the mandatory requirements (legal basis, any Egyptian data-protection licence or
  registration, transfers, minimum age, consent evidence) and each is resolved.
- **Deploy:** the `functions` folder joins the deploy's file list; Wrangler bundles it. The
  deploy is assembled in an empty staging folder, with the Functions folder at its root and the
  website files, `_routes.json` and `_headers` in a sub-folder; Wrangler runs from the staging
  folder and deploys that sub-folder, so it compiles the Functions. The first deploy with
  Functions goes to a preview branch, where the compiled gate is proven before any production
  deploy. `AGENTS.md` records the exact commands.
- **Online only:** protected Lessons and the Course report do not work from `file://`, further
  exceptions to ADR-0001 alongside the Sign-up dashboard (ADR-0005).
