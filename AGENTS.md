# AGENTS.md

## Project overview

- Project: Godwitly landing page. A static English/Arabic page for Godwitly, a platform
  for learning, engagement and organisational preparedness (products: Learn, Engage,
  Resilience). It includes a "Get notified" contact form. Built during the Vibe Coding
  course at Creativa Hub Port Said.
- Users: organisations and training managers, mostly Arabic and English speakers.
- Current stage: MVP. Live at https://godwitly.pages.dev
- Technology: static HTML, CSS and vanilla JavaScript (no build tools, no package
  manager). Supabase project `godwitly` (Frankfurt, `eu-central-1`) stores form sign-ups.
  Hosted on Cloudflare Pages. Fonts are loaded from Google Fonts.

## Sources of truth

Before implementing a change, review the relevant existing sources:

- Product requirements: no requirements document exists. Approved per-feature plans live
  in `docs/plans/`, and review reports live in `docs/reviews/`.
- Architecture: no architecture document exists. See `README.md` and the relevant plan in
  `docs/plans/`.
- Design system: `css/styles.css` (tokens are the variables in `:root`), the existing
  page in `index.html`, and the behaviour in `js/`.
- Task tracking: no external tracker. The project owner (PO) is the repository owner.
  Every change follows this workflow:
  1. Write a plan in `docs/plans/YYYY-MM-DD-<topic>.md` and label its lane:
     - **Critical**: personal data, security, Supabase or other backend changes. Needs
       a full plan plus a Codex plan gate. Save the gate reports in `docs/reviews/`.
     - **Standard**: everything else. Needs a simple plan, PO approval and a diff
       review saved in `docs/reviews/`.
     - There is no lighter lane; even small text or colour fixes are Standard.
  2. Get PO approval before implementing.
  3. Work on a feature branch, push it, open a PR, and merge into `main`.

If a source does not exist or instructions conflict, report the gap.
Do not invent project requirements.

## Project structure

- `index.html`: page structure for all sections; English is the default text.
- `css/styles.css`: all styling; colours and fonts are `:root` variables.
- `js/translations.js`: every piece of text in English (`en`) and Arabic (`ar`).
- `js/script.js`: language switcher, mobile menu, product tabs and smooth scrolling.
- `js/form.js`: "Get notified" form validation, submission and error/success states.
- `js/config.js`: Supabase URL and publishable key (public by design).
- `supabase/migrations/`: SQL migrations (the `launch_signups` table and its rules).
- `assets/images/`: logo, favicon, backgrounds and illustrations.
- `docs/plans/`, `docs/reviews/`: approved plans and review reports.

## Development commands

Use the commands verified for this repository:

- Install: none (no dependencies).
- Run locally: `open index.html`. Add `?lang=ar` to the URL for the Arabic version.
- Lint: none configured.
- Test: none configured; verify manually in a browser (see Verification).
- Build: none. Pushing or merging to `main` deploys automatically to Cloudflare Pages.
  Never push to `main` directly.

If a command is unavailable or fails, report that accurately.

## Development rules

- Follow established patterns in the relevant part of the codebase.
- Keep changes focused on the requested task.
- Do not modify generated files directly unless the project specifies how.
- Update relevant documentation (`README.md`, plans) when behavior or setup changes.
- All user-facing text goes in `js/translations.js`; update both `en` and `ar` together.
- Form rules exist in both `js/form.js` and the Supabase migration; change both together.
- The page must keep working when opened by double-click (`file://`) and on Cloudflare
  Pages.

## Web app and design

- Follow the project's design system (`css/styles.css`) and existing UI patterns.
- Support current desktop and mobile browsers, down to a 320px screen width.
- Use semantic HTML and ensure keyboard access to interactive controls.
- Support both English (LTR) and Arabic (RTL); check every UI change in both.
- Avoid adding functionality or product claims that are not in scope.

## Security and data

- Do not commit secrets, tokens or personal data. Never commit the Supabase database
  password (stored in the macOS Keychain as `supabase-godwitly-db-password`) or the
  secret / service_role key. Only the publishable key belongs in `js/config.js`.
- Validate input and enforce access control at the appropriate server boundary. The
  public key may only insert into `launch_signups`, and the database enforces the
  field checks.
- Follow project requirements for authentication, privacy and logging (see `README.md`),
  including deleting old sign-ups about 12 months after launch.
- Do not expose sensitive information in logs or error messages.

## Verification

- Run checks relevant to the change.
- Test user-facing behavior affected by the change.
- For UI changes, inspect the relevant layouts and interaction states in English and
  Arabic, on desktop and at 320px width.
- Report tests that were not run and explain why.
- Do not claim a check passed unless it was actually run.

## Boundaries

- Work within the scope of the current task.
- Preserve unrelated user changes.
- Ask the PO before:
  - adding any dependency, library, CDN script or build tool;
  - creating or applying Supabase migrations, or changing data in the live `godwitly`
    project;
  - pushing branches, opening PRs or merging to `main` (merging deploys to production);
  - changing the form's personal-data fields, consent text or data retention;
  - deploying or taking any other action that affects production.
- Follow the project's rules for adding dependencies, migrations and Git actions.

## Completion report

When finished, explain:

1. What changed and why.
2. What was tested and the result.
3. Any remaining limitations, failures or decisions.
