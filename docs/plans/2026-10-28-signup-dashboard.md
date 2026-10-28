# Plan — Sign-up dashboard (Google sign-in, Launch sign-ups list, figures)

> Status: **APPROVED v4** by the PO on 2026-10-28, including A1 and P-a–P-e (Codex gate r2: PASS, 0×P1; r2 findings fixed in v4).
> Branch: `feat/signup-dashboard` → PR → merge to `main` → manual deploy (PO approval)
> Decisions come from a grilling session with the PO on 2026-10-28 (Q1–Q26 below).

```text
LANE: Critical — opens read access to personal data, adds Supabase Auth (Google), a new
access table, an Auth hook and new database permissions.
```

## History

- **v1:** the first draft after the grilling session.
- **v2:** fixes an internal adversarial review of v1, run before the Codex gate: four lenses
  plus a skeptic per lens, with 42 confirmed and 3 rejected findings, many of them
  duplicates. The main changes:
  - **CSP:** `script-src` is pinned to the one Supabase file instead of all of jsDelivr.
  - **Password back door closed:** the Email and Phone providers are fully off, and
    `caller_email()` also requires an OAuth sign-in (`amr`).
  - **Advisor warnings:** SECURITY DEFINER code moves into `private`, behind thin INVOKER
    wrappers, so the Security Advisor has nothing new to flag.
  - **Cairo time:** AC7 is corrected (Cairo is UTC+3 until 29 Oct 2026).
  - **Removal:** the role is checked before every data load, so a removed viewer sees
    "no access", not an empty list.
  - Also clarified or added:
    - OAuth error handling, the language switch and paging;
    - DOM clean-up on sign-out;
    - an ordered rollback, a step-0 baseline and the release order;
    - the viewer-data stores;
    - stronger ACs (figures, owner add/remove, grants, script-injection probes on every
      field);
    - the docs list.
- **v3:** fixes Codex gate round 1 (FAIL: 1×P1, 5×P2, 1×P3;
  `docs/reviews/2026-10-28-signup-dashboard-plan-gate.md`).
  - r1 #1: a pre-approved **data kill switch** (revoke access) now comes before turning
    Google off.
  - r1 #2: a load generation counter discards stale responses.
  - r1 #3: console probes use a second client on the same session, and the date helpers are
    exposed as pure functions.
  - r1 #4: AC9 (was AC8) uses calendar-bounded daily and weekly SQL, with zero buckets.
  - r1 #5: the rollback assertion matches the Pages fallback.
  - r1 #6: keyset paging.
  - r1 #7: AC12 (was AC10) layout wording. ACs are renumbered: new AC5 (stale responses), AC10 (paging) and AC15 (kill switch).
- **v4:** fixes Codex gate round 2 (PASS: 0×P1, 2×P2, 1×P3).
  - r2 #2: the stale-response rule is defined by generation only, so the first role check
    from the loading state is accepted.
  - r2 #3: every AC8 call is fully qualified.
  - r2 #8: the AC3 write probes target one synthetic test row, never real sign-ups, and run
    only after the AC14 grant checks pass.
- **D1 (PO, 2026-10-28, after the build):** the dashboard view has no Try again; that
  button exists only on the error screen. AC4 and AC10 now use a page reload. AC5
  explicitly never reloads, so it still proves that late responses after Sign out or
  removal cannot restore data.

## Goal

Give the **Project owner** and the **Sign-up viewers** they choose a private page,
`dashboard.html`, where they sign in with Google and see every Launch sign-up plus a few
figures about them. Only the Project owner can change who is a Sign-up viewer. Nobody can
change or delete Launch sign-ups from the page. The landing page, the form and the Sign-up
alert do not change.

## Decisions (PO, 2026-10-28)

| # | Decision |
|---|---|
| Q1 | Access is for a fixed list of named Google accounts, starting with the Project owner. |
| Q2 | The dashboard exists so that people without a Supabase account can see sign-ups and figures. |
| Q3 | Launch sign-ups are **read-only for everyone**. The only change anyone can make is the Project owner adding or removing Sign-up viewers. Deleting junk rows and the yearly clean-up stay in the Supabase dashboard. |
| Q4 | **No CSV export** or download of any kind. |
| Q5 | Figures use Launch sign-ups only: total sign-ups, unique email addresses, sign-ups per day/week, sign-ups by language, and how many left a message. **No visitor tracking.** |
| Q6 | One extra page on the same Cloudflare Pages project, linked from nowhere, `noindex`. |
| Q7 | The dashboard works **online only** (Cloudflare Pages, or a local web server for testing), not from `file://`. The landing page keeps working from `file://`. |
| Q8 | *Superseded by Q8b* (the question was reworded because "yes" was ambiguous). |
| Q8b | English and Arabic, with the same language switch as the landing page. |
| Q9 | Glossary terms **Project owner** and **Sign-up viewer**, not "admin". |
| Q10 | The Project owner adds an address **before** that person signs in. Anyone not on the list is refused at their first sign-in, and no account is created for them. |
| Q11 | The Project owner manages the list in an **Access** section that only they can see. Removing someone cuts their access on their next request. No email addresses in Git. |
| Q12 | One level of access: Sign-up viewers see everything the Project owner sees except Access. All fields, newest first, with search. |
| Q13 | One outside script, the official Supabase library, at a fixed version, on `dashboard.html` only. Cards and bars are plain HTML/CSS. No chart library. |
| Q14 | The PO creates the Google OAuth client from the runbook below. |
| Q15 | Exactly one Project owner. The dashboard cannot make anyone an owner. |
| Q16 | The Project owner row is created by a one-off command in the SQL editor, not by a migration. |
| Q17 | Supabase Auth with Google, **not Clerk**. |
| Q18 | No Cloudflare R2 and no Render. |
| Q19 | Arabic terms: صاحب المشروع (Project owner) and مُطّلع على طلبات الإشعار (Sign-up viewer). |
| Q20 | All dates and day/week groupings use **Cairo time** (`Africa/Cairo`), labelled as such. |
| Q21 | Address: `dashboard.html`. Cloudflare Pages also serves it as `/dashboard`. |
| Q22 | A removed Sign-up viewer can still complete Google sign-in but sees "no access" and no data. Deleting their Auth account is a manual step in Supabase. |
| Q23 | The session lives in `sessionStorage`, so closing the tab or the browser signs out. A **Sign out** button is always visible. |
| Q24 | Only people working on Godwitly's launch may be Sign-up viewers. The consent text does not change. |
| Q25 | The Sign-up alert email does not change. |
| Q26 | New ADR-0005, plus a pointer in ADR-0004. |

**Additional decisions approved by the PO on 2026-10-28** (not decided in the grilling session):

- **A1.** Plan v4 is approved as the design to build. The agent may run the two
  emergency-stop SQL statements below without asking again to cut dashboard access.
  This does not authorize restoration or waive the separate setup and release approvals.
  - The emergency stop **blocks future dashboard requests**. It cannot erase information
    already loaded, copied or photographed.
  - "Without asking again" applies **when suspected exposure warrants it**, not at any
    time for any reason.

- **P-a.** The charts show the last 30 days per day and the last 12 weeks per week. Weeks
  start on Sunday. Both ranges **include today and the current Sunday-start week**, and
  every day or week in range has a bar, **including zero-count bars**.
- **P-b.** Numbers and dates use Latin digits in both languages (`en-GB` / `ar-EG-u-nu-latn`),
  matching the phone numbers and emails in the list.
- **P-c.** Arabic names: "Sign-up dashboard" = لوحة طلبات الإشعار, and "Access" = إدارة الوصول.
  The first also becomes a glossary entry. The PO confirmed on 2026-10-28 that both labels
  are natural and understandable, so no wording change is needed.
- **P-d.** The Google OAuth app is **published ("In production")** and asks only for the basic
  sign-in scopes `openid`, `email` and `profile`, with no logo uploaded.
  - **Corrected reasoning:** Google exempts basic-sign-in-only apps from the Testing
    test-user list and from the 7-day expiry, so "Testing" would also work.
  - Publishing is still chosen. It avoids depending on that exemption and doesn't put the
    app's public status in doubt.
  - Sensitive or restricted scope verification does not apply, because no such scopes are
    requested.
  - Separately, Google may require **brand verification** before it shows the app's name or
    logo on the consent screen.
  - Source: <https://support.google.com/cloud/answer/15549945>.
- **P-e.** To remove a viewer, the Project owner works in this order in one sitting
  (README step):
  1. **Remove their dashboard access first:** Access → Remove.
  2. **Then delete their Supabase Auth account:** Authentication → Users.

  Auth audit logs stay on, for security, and are reviewed at the yearly clean-up. So this is
  **access removal and account deletion, not complete erasure** of every record about the
  person.

## How it works

```text
dashboard.html ──(1) Sign in with Google──▶ Supabase Auth ──▶ Google
      ▲                                         │ first sign-in only:
      │                                         ▼ hook_before_user_created → refuse unless the
      │                                           email is in private.signup_viewers
      │ (2) PKCE code → session in sessionStorage
      │
      ├─(3) rpc dashboard_role()           → 'owner' | 'viewer' | 'none'   (before EVERY load)
      ├─(4) GET launch_signups (paged)     → RLS: rows only if caller is in signup_viewers
      └─(5) owner only: rpc list/add/remove_signup_viewer
```

There are two locks. The Auth hook keeps strangers from getting an account. The database
checks `private.signup_viewers` on **every** request, so removal takes effect at once, and the
data stays protected even if the hook is ever switched off. The database lock accepts only a
session that came from a Google OAuth sign-in.

## Database — `supabase/migrations/<ts>_signup_dashboard.sql`

The function bodies here are a specification. The final SQL is checked in the diff review.

```sql
set lock_timeout = '5s';
set statement_timeout = '15s';

-- 1. A schema the Data API does not expose (api.schemas = public, graphql_public).
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated, supabase_auth_admin;

-- 2. Who may see Launch sign-ups. Emails are stored lower-case, exactly as Google reports them.
create table private.signup_viewers (
  email     text primary key
            check (email = lower(btrim(email)) and char_length(email) <= 254
                   and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  is_owner  boolean not null default false,
  added_at  timestamptz not null default now()
);
create unique index signup_viewers_one_owner on private.signup_viewers (is_owner) where is_owner;
comment on table private.signup_viewers is
  'Sign-up viewers and the one Project owner allowed into the Sign-up dashboard.';
alter table private.signup_viewers enable row level security;
revoke all on private.signup_viewers from public, anon, authenticated;
grant select on private.signup_viewers to supabase_auth_admin;
create policy "Auth hook can read the list"
  on private.signup_viewers for select to supabase_auth_admin using (true);

-- 3. Private helpers: SECURITY DEFINER, set search_path = '', fully qualified names,
--    revoke execute from public, anon; grant execute to authenticated.
--    private.caller_email() returns text, language sql, stable:
--      lower(auth.jwt() ->> 'email') only when ALL of these hold, otherwise null:
--        auth.jwt() -> 'app_metadata' ->> 'provider' = 'google'
--        coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false
--        exists (select 1 from jsonb_array_elements(coalesce(auth.jwt() -> 'amr', '[]'))
--                where value ->> 'method' = 'oauth')        -- refuses password/OTP sessions
--    private.is_signup_viewer() boolean: a row exists with email = private.caller_email().
--    private.is_project_owner() boolean: the same, and is_owner.
--    private.dashboard_role() text: 'owner' | 'viewer' | 'none'.
--    private.list_signup_viewers() table (email, is_owner, added_at), newest first.
--    private.add_signup_viewer(viewer_email text) returns text: 'added' | 'exists'.
--      Inserts lower(btrim(viewer_email)) with is_owner = false (an invalid address fails
--      the CHECK with 23514).
--    private.remove_signup_viewer(viewer_email text) returns text: 'removed' | 'not_found'.
--      Deletes where email = lower(btrim(viewer_email)) and not is_owner.
--    list/add/remove first require private.is_project_owner(); otherwise
--      raise exception using errcode = '42501'.

-- 4. Public RPC wrappers: SECURITY INVOKER (the default), language sql, set search_path = ''.
--    Each one only calls its private twin:
--      public.dashboard_role(), public.list_signup_viewers(),
--      public.add_signup_viewer(text), public.remove_signup_viewer(text).
--    revoke execute from public, anon; grant execute to authenticated.
--    Because the definer code lives in the unexposed `private` schema, Security Advisor lint
--    0029 (definer functions callable by signed-in users in an exposed schema) does not fire.

-- 5. Sign-up viewers may read Launch sign-ups. Nothing else changes for anon or authenticated.
grant select on public.launch_signups to authenticated;
create policy "Sign-up viewers can read sign-ups"
  on public.launch_signups for select to authenticated
  using ((select private.is_signup_viewer()));

-- 6. Auth hook "Before User Created" (Postgres function; available on the Free plan).
--    public.hook_before_user_created(event jsonb) returns jsonb, language plpgsql, stable,
--    NOT security definer (Supabase's advice), set search_path = ''.
--    It returns '{}' (allow) only when
--      event -> 'user' -> 'app_metadata' ->> 'provider' = 'google' and
--      lower(event -> 'user' ->> 'email') is in private.signup_viewers.
--    Otherwise it returns
--      {"error": {"http_code": 403, "message": "This Google account is not allowed."}}.
--    grant execute to supabase_auth_admin; revoke execute from public, anon, authenticated.
--    It lives in public so the dashboard's hook picker lists it; revoking EXECUTE keeps it
--    out of the Data API.
```

**What stays exactly as it is:** `anon` may still only insert the listed columns into
`launch_signups`. `authenticated` gets SELECT only, through the policy, and no INSERT,
UPDATE or DELETE. The `notify_signup` trigger, the column checks and the table comment do not
change. New Postgres functions get EXECUTE for PUBLIC by default, so every function above
explicitly revokes it.

**Security Advisor:** step 0 records a baseline (lint names only). After setup, the only
acceptable new finding is lint 0027 (`pg_graphql` table exposed to authenticated) on
`launch_signups`, and only if `pg_graphql` is installed. It is accepted, because RLS filters
GraphQL the same way, and recorded in the review. Anything else that is new must be fixed.

## Front-end

New files, loaded only by `dashboard.html`. `index.html`, `js/script.js`, `js/form.js` and
`css/styles.css` do **not** change.

### `dashboard.html`

- The header has the logo, a language switch and **Sign out**.
- The English text is written in the HTML as the default (ADR-0001), with `data-i18n` keys.
- `<meta name="robots" content="noindex, nofollow">`. Not linked from `index.html`.
- Script order:
  1. `js/translations.js`
  2. `js/config.js`
  3. the Supabase UMD build
     `https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.3/dist/umd/supabase.js`
     with `integrity="sha384-BWcjm9OdFth9TbhCxZPdm+gAOUMAzQy9nmTs12ioXdCcbVnJaPMn+fMUoQCLt60R"`
     and `crossorigin="anonymous"` (released 2026-10-07, more than two weeks old)
  4. `js/dashboard.js`
- **States**, each with translated text:
  1. **online-only:** opened from `file://`. Explains that the dashboard needs its web
     address. No sign-in attempt is made.
  2. **loading**
  3. **signed out:** a "Sign in with Google" button.
  4. **no access:** "Sign-in didn't finish, or this Google account doesn't have access",
     with Sign out.
  5. **error:** a general message with **Try again**.
  6. **dashboard:**
     - figure cards;
     - the Day/Week bar chart, labelled "Times are Cairo time";
     - the sign-ups list, with search, an **empty** state (0 sign-ups) and a
       **no results** state (the search matches nothing).
  7. **Access** (Project owner only):
     - add an address, with the hint "Type the address exactly as it appears in the
       person's Google account (dots included)";
     - the list of viewers, each with Remove and a confirmation; the owner row has no
       Remove;
     - messages for added, already a viewer, invalid address and failed;
     - the reminder "Only add people working on Godwitly's launch."

### `js/dashboard.js`

The style follows `js/form.js`: one state object and `render()`. It is wrapped in an IIFE,
and the client is named `client`. The UMD file declares a global `var supabase`, so
`const supabase` would be a SyntaxError.

The only global the file creates is `window.GodwitlyDashboardDates = { dayKey, weekKey }`.
These are pure functions with no access to data or to the session, and the AC7 checks
call them from the console.

- **Stale responses (r1 #2, r2 #2):** a counter `loadGeneration` goes up when a new load
  starts (first load or Try again), on Sign out, and on any switch to **no access**,
  **signed out** or **error**.
  - Each request (sign-up pages, `dashboard_role`, and the Access list, add and remove)
    records the generation it started in.
  - A response is used only if its generation is still current. Any other response is
    dropped without touching the state.
  - Inside a current generation, the first load runs in **loading**: `dashboard_role` first,
    then the sign-up pages, then the dashboard is shown. A language switch only re-renders
    the page; it does not start a new generation.

- **Language:** dashboard.js has its own `setLanguage` / `getStartLanguage`. They use the same
  `data-i18n*` attributes, the same `godwitly-language` localStorage key (in try/catch) and
  `?lang=` support, and set `lang`/`dir` on `<html>`. The current language is saved before
  `signInWithOAuth`, so it survives the Google round trip. Every dynamic text, including
  dates, numbers and chart labels, re-renders when the language changes. (`js/script.js`
  can't be reused, because it touches landing-page elements without null checks.)
- **Client:**

  ```js
  window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: { flowType: "pkce", storage: window.sessionStorage, persistSession: true,
            autoRefreshToken: true, detectSessionInUrl: true } })
  ```

- **Sign-in:**

  ```js
  signInWithOAuth({ provider: "google", options: {
    redirectTo: location.origin + location.pathname,
    queryParams: { prompt: "select_account" } } })
  ```

  Any OAuth error is taken from the result of `await client.auth.initialize()`, and the
  parameters are also read from both `location.search` and `location.hash`.
  - `error=access_denied` covers both a hook refusal and a cancel at Google, which can't be
    told apart reliably. It shows **no access**.
  - Anything else shows **error**.
  - `error`, `error_code`, `error_description` and `sb` are removed from the query **and** the
    hash with `history.replaceState`.
  - `error_description` is never shown on the page.
- **Role:** before **every** data load (first load, Try again, and any reload),
  `rpc("dashboard_role")` decides between the dashboard, Access and **no access**. A
  `'none'` result shows **no access** before any row, or the empty state, can appear. Hiding
  Access in the page is only for convenience; the database enforces it.
- **Data:** select `id, created_at, full_name, email, phone, job_title, message, language,
  consent`, ordered by `created_at desc, id desc`.
  - **Keyset paging (r1 #6):** rows come in pages of `PAGE_SIZE`, a constant of 1000, at or
    below the hosted Max rows. Each next page asks only for rows strictly older than the last
    row received: `.or("created_at.lt.<t>,and(created_at.eq.<t>,id.lt.<id>)")`, with `<t>` in
    full ISO precision. Loading stops when a page has fewer than `PAGE_SIZE` rows.
  - New sign-ups that arrive during a load are newer than the first page, so they can't
    appear later or shift any page. They show up on the next load.
  - A row deleted during a load may or may not be shown; that is accepted. Junk rows are
    deleted by hand, and the next load is correct.
  - Rows are still de-duplicated by `id`, as a safety net.
- **Search:** in the browser, over the loaded rows. It matches full name, email, phone, job
  title and message, case-insensitive.
- **Figures** (in the browser, from the loaded rows):
  - total;
  - unique emails (lower-case, because duplicates are allowed by ADR-0003);
  - per day / per week, as in P-a: today and the current Sunday-start week included, and a
    bar for every day or week in range, zero included;
  - by language (`en` / `ar`);
  - with a message.

  The Cairo calendar date comes from `Intl.DateTimeFormat` with `timeZone: "Africa/Cairo"`.
  The week key is worked out with calendar arithmetic on that date (`Date.UTC(y, m - 1,
  d - weekday)`), never by subtracting multiples of 24 h from a timestamp. A bar's width is
  0 when the largest value is 0.
- **Safety:**
  - Every visitor or viewer value goes into the page through `textContent` or
    `createElement`, never `innerHTML`.
  - Emails and phone numbers are plain text, not `mailto:` or `tel:` links.
  - Nothing from a sign-up is written to the console or to storage.
  - The raw PostgREST or Auth error text is never shown; errors map to `dash.*` keys.
- **Clearing:** Sign out and every switch to **no access** empty the rows, the figures, the
  search box and the Access list. The list containers are cleared with `replaceChildren()`.
- **Sign out:** `client.auth.signOut()`, clear as above, then show **signed out**.

### `css/dashboard.css`

- It reuses the `:root` tokens from `css/styles.css`, which loads first.
- Mobile first: the list is a stack of cards and becomes a table from 768px.
- Bars are `<div>`s whose width JavaScript sets through `element.style`, which CSP allows.
- Keyboard focus is visible. The RTL rules mirror those in `styles.css`, and the bars grow
  from the start edge.

### `js/translations.js`

New `dash.*` keys in `en` and `ar`, one for every text in the states above, plus aria labels.
They use the glossary terms: "Launch sign-ups" / "طلبات الإشعار بالإطلاق" for the list title,
and never "waitlist".

### `_headers` (new, Cloudflare Pages)

Applies to `/dashboard` and `/dashboard.html` only. In the real file, each header is one line.

```text
Content-Security-Policy: default-src 'none';
  script-src 'self' https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.3/dist/umd/supabase.js;
  style-src 'self' https://fonts.googleapis.com; font-src https://fonts.gstatic.com;
  img-src 'self' data:; connect-src https://ijpvbxglhxktnkabjdif.supabase.co;
  frame-ancestors 'none'; base-uri 'none'; form-action 'none'
X-Robots-Tag: noindex, nofollow
Referrer-Policy: no-referrer
X-Content-Type-Options: nosniff
```

`script-src` names the exact file, not the whole jsDelivr host. The landing page gets no new
headers.

## Docs

- `docs/adr/0005-sign-up-viewers-read-sign-ups-through-the-dashboard.md` (new). Its status
  is `proposed`, set to `accepted` in the approval commit.
- `docs/adr/0004-…`: a pointer saying the "open the Table Editor" consequence now has a
  second route (already on this branch).
- `GLOSSARY.md`:
  - Project owner and Sign-up viewer (already added);
  - capitalise "Project owner" in the Sign-up alert entry;
  - add "Sign-up dashboard" (لوحة طلبات الإشعار), confirmed by P-c.
- `README.md`:
  - fix "Who can do what" (README:44-46) and "See the sign-ups", which become untrue;
  - add a "Sign-up dashboard" section covering:
    - who may be a Sign-up viewer;
    - the runbook;
    - how to add a viewer (exact Google address) and remove one (P-e);
    - troubleshooting for "listed but no access" (address spelling; an older non-Google
      account with the same email);
    - the emergency stop and the viewer-data stores;
  - add the new files to the file tables.
- `AGENTS.md`:
  - the deploy command adds `dashboard.html` and `_headers` to `git archive`;
  - "Run locally" adds `python3 -m http.server 8000` for the dashboard;
  - the `file://` rule notes the dashboard exception (ADR-0005);
  - "Security and data" says signed-in Sign-up viewers may SELECT `launch_signups` through
    RLS;
  - the project-structure list gains the new files.
- `js/config.js`: a comment-only update, because the file now also serves the dashboard.

## Viewer data (where a Sign-up viewer's details end up)

| Store | What | When it is removed |
|---|---|---|
| `private.signup_viewers` | email, owner flag, date added | when the owner removes the viewer |
| `auth.users`, `auth.identities` | email, Google name and picture URL | P-e: deleted by hand in the same sitting as removal |
| `auth.sessions`, `auth.refresh_tokens` | IP address, user agent | when the Auth user is deleted |
| `auth.audit_log_entries`, Auth logs | sign-in events with IP address | stays; reviewed at the yearly clean-up |
| Google Cloud test users | email | not used: the app is published (P-d), and basic-scope apps need no test-user list anyway |

## Setup runbook (PO only, each step with approval; the order matters)

**Secrets rule (same as README "Email alerts"):** never put the Google client ID or secret, or
any viewer address, in Git, chat, a terminal command, a brief or a review file. Run
`pbcopy < /dev/null` after pasting a secret.

0. **Baseline**, recorded in the review file with no emails:
   - the current Site URL and Redirect URLs;
   - the provider switches;
   - the Security Advisor lint names;
   - the `pg_graphql` extension status;
   - `select raw_app_meta_data->>'provider', count(*) from auth.users group by 1;`.

   Expect 0 users. Any unexpected account is deleted (with approval) before going on,
   because an existing account with a viewer's email would bypass the hook.
1. **Other providers:** Authentication → Sign In / Providers. Turn **off** Email, Phone and
   Anonymous sign-ins, and manual linking. The global "Allow new users to sign up" stays
   **on**, because the hook and the list are the gate. Check with
   `curl -s https://ijpvbxglhxktnkabjdif.supabase.co/auth/v1/settings -H "apikey: <publishable key>"`,
   which should show `external.email=false`, `external.phone=false`,
   `anonymous_users=false` and `disable_signup=false`.
2. **Migration:** `supabase db push`. Nobody can sign in yet, because no provider is enabled.
3. **Owner row:** in the SQL editor, run once:
   `insert into private.signup_viewers (email, is_owner) values (lower(btrim('<your Google address>')), true);`
   The address is typed only into the SQL editor.
4. **Hook:** Authentication → Hooks → Before User Created → Postgres function →
   `public.hook_before_user_created` → enable. This must come **before** step 5.
5. **Google:**
   - In Google Cloud Console, create an OAuth client of type "Web application", with the
     authorised redirect URI `https://ijpvbxglhxktnkabjdif.supabase.co/auth/v1/callback`.
   - The consent screen uses only the `openid`, `email` and `profile` scopes. Upload no
     logo. Publish it "In production" (P-d). If Google asks for brand verification before
     showing the app name, sign-in still works; follow Google's steps if the PO wants the
     name shown.
   - In Supabase → Providers → Google, paste the client ID and secret, then clear the
     clipboard.
6. **Redirects:** Authentication → URL Configuration.
   - Site URL: `https://godwitly.pages.dev`.
   - Redirect URLs: `https://godwitly.pages.dev/dashboard`,
     `https://godwitly.pages.dev/dashboard.html` and, for testing only,
     `http://localhost:8000/dashboard.html`.
7. **Site deploy:** use the `AGENTS.md` command, now including `dashboard.html` and
   `_headers`.
8. **Clean-up:** remove the localhost redirect. Check that the Security Advisor shows nothing
   new apart from the accepted 0027 described above.

## Emergency stop (pre-approved with this plan, r1 #1)

**When suspected exposure warrants it** (for example a leaked session, a wrong viewer or an
injection bug), the PO, or the agent under A1, runs these steps straight away **without
asking for a further approval**, then tells everyone involved. This is also step 1 of the
rollback.

**What it does and doesn't do:** it **blocks future dashboard requests**. It cannot erase
information that was already loaded in someone's browser, copied or photographed. Treat any
such copy as a possible personal-data incident.

1. **Kill switch**, in the SQL editor. It takes effect on the next request, even for
   sessions that are already signed in:

   ```sql
   revoke select on public.launch_signups from authenticated;
   revoke execute on function public.dashboard_role(), public.list_signup_viewers(),
     public.add_signup_viewer(text), public.remove_signup_viewer(text) from authenticated;
   ```

2. Supabase → Providers → **Google off**, so nobody new can sign in.
3. Optional: Authentication → Users → delete the viewers' Auth users. This ends their
   refresh tokens.

**Restore** only with PO approval, once the cause is fixed: re-run the two `grant` lines from
the migration, then turn Google back on.

## Rollback (ordered)

1. The emergency stop above (kill switch, then Google off).
2. Authentication → Hooks → **Before User Created off**.
3. A separate approved migration:
   - drop the policy "Sign-up viewers can read sign-ups";
   - `revoke select on public.launch_signups from authenticated;`
   - drop the 4 public wrappers and the hook function;
   - drop the private functions, then `private.signup_viewers`, then the `private` schema,
     explicitly, not with a blind CASCADE.
4. Delete the dashboard Auth users (list them first by provider).
5. Restore the Site URL and Redirect URLs recorded in step 0.
6. Redeploy the previous `main` commit without `dashboard.html` and `_headers`. The site has
   no `404.html`, so Pages serves the landing page for unknown paths instead of a 404 (r1 #5).
   Check that `curl -s https://godwitly.pages.dev/dashboard | grep -c 'js/dashboard.js'`
   prints `0`, and that `curl -sI https://godwitly.pages.dev/js/dashboard.js` does not return
   200 with JavaScript.
7. Delete the Google OAuth client.

## Acceptance criteria

**How the console probes work (r1 #3).** `dashboard.js` keeps its client inside an IIFE, so
the probes create a second client in the DevTools console on the dashboard page. It reads the
same signed-in session from `sessionStorage`:

```js
const probe = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY,
  { auth: { storage: sessionStorage, persistSession: true, autoRefreshToken: false,
            detectSessionInUrl: false } });
(await probe.auth.getSession()).data.session !== null   // expected: true when signed in
```

Each probe below states its exact call and the expected result. "Fails" means the result has
a non-null `error`; the expected `error.code` is given where it is fixed.

1. **Visitors unchanged:**
   - `curl -s "$URL/rest/v1/launch_signups?select=id" -H "apikey: $KEY"` returns an error
     with code `42501`, not rows.
   - `curl -s -X POST "$URL/rest/v1/rpc/dashboard_role" -H "apikey: $KEY"` returns an
     error, and so do the other 3 RPCs.
   - The form still submits in EN and AR from `file://` and from Pages.
2. **Strangers refused:** use a second Google account that is not on the list and has never
   signed in.
   - Sign-in returns to the dashboard and shows **no access** in EN and in AR.
   - After load, `location.search` and `location.hash` contain no `error`.
   - `select count(*) from auth.users` is the same before and after.
3. **Viewer:** the owner adds that account in Access, and it signs in. It sees the list and
   the figures, and no Access section. In the console:
   - `await probe.rpc('add_signup_viewer', { viewer_email: 'x@example.com' })` fails with
     `42501`.
   - `await probe.rpc('remove_signup_viewer', { viewer_email: 'x@example.com' })` fails
     with `42501`.
   - **Write probes touch only one synthetic row (r2 #8).** They run only after AC14 has
     passed. First, in the SQL editor as `postgres`, insert a test row with
     `full_name = 'Probe Row'` and `email = 'probe@example.com'`, using `returning id`. Then,
     with `T` set to that id:
     - `await probe.from('launch_signups').delete().eq('id', T)` fails, or deletes 0 rows;
     - `await probe.from('launch_signups').update({ job_title: 'Changed' }).eq('id', T)`
       fails, or updates 0 rows.

     Afterwards, `select job_title from public.launch_signups where id = '<T>'` returns the
     original value. The test row is deleted in the SQL editor at the end of AC3. One
     Sign-up alert email is expected.
   - `await probe.from('launch_signups').insert({ full_name: 'Test Name', email: 'a@b.co',
     phone: '+201000000000', job_title: 'Tester', language: 'en', consent: true })` fails
     with `42501`.
   - `await probe.schema('private').from('signup_viewers').select()` fails, because the
     schema is not exposed.
4. **Removal is immediate:** the owner removes the signed-in viewer. In the viewer's console:
   - `(await probe.from('launch_signups').select('id')).data` returns `[]`.
   - `(await probe.rpc('dashboard_role')).data` returns `'none'`.

   Then **reload the page** (D1). It shows **no access**, not the empty state, and
   `document.body.textContent` contains no test sign-up value. Try again exists only on the
   **error** screen, so this AC doesn't use it.
5. **Stale responses are dropped (r1 #2):** this AC must exercise late responses, so it
   **never reloads the page** (D1). In DevTools, set Network → throttling to "Slow 3G".
   - **(a) Sign out while requests are pending:** start a load as a viewer and click
     **Sign out** while the `dashboard_role` and sign-up page requests are still pending.
     Wait until the Network panel shows every request finished. The page stays **signed
     out**, and `document.body.textContent` contains no sign-up value, so no late response
     restored data.
   - **(b) The same as the owner,** with the Access list request also pending. The Access
     section stays empty and hidden.
   - **(c) Removal during a load:** start a slow load as a viewer, and have the owner remove
     that viewer before the load finishes. Without reloading, when the load completes, the
     role re-check at the end of the load shows **no access**, never the dashboard, the
     empty state or a partial list.
6. **Owner Access:**
   - Adding `"  Viewer@Example.com "` shows `viewer@example.com`.
   - Adding it again shows "already a viewer", and `not-an-email` shows "invalid address".
   - Remove asks for confirmation, and the owner row has no Remove.
   - `(await probe.rpc('remove_signup_viewer', { viewer_email: '<owner address>' })).data`
     returns `'not_found'`, and the owner row is still there.
   - No RPC takes an `is_owner` argument.
7. **No script injection:** insert one test row through the SQL editor as `postgres`, with
   `insert … returning id`. Put `<img src=x onerror=alert(1)>`-style payloads in `full_name`,
   `email` (for example `<img/src=x/onerror=alert(1)>@x.co`), `job_title` and `message`. Also
   add one Access entry `"<b>x</b>"@example.com`, which is a valid address.
   - The list, the cards, a search hit and Access all show them as text.
   - There is no alert, and `document.querySelectorAll('img[src="x"], b').length` is `0`.
   - Then delete the row by its id, and remove the Access entry. One Sign-up alert email is
     expected.
8. **Cairo time (r1 #3):** call the exposed functions in the console:
   - `GodwitlyDashboardDates.dayKey('2026-10-28T20:59:00Z')` → `'2026-10-28'`;
   - `GodwitlyDashboardDates.dayKey('2026-10-28T21:00:00Z')` → `'2026-10-29'` (UTC+3);
   - `GodwitlyDashboardDates.dayKey('2026-10-29T21:59:00Z')` → `'2026-10-29'`;
   - `GodwitlyDashboardDates.dayKey('2026-10-29T22:00:00Z')` → `'2026-10-30'` (UTC+2 after daylight saving ends);
   - `GodwitlyDashboardDates.weekKey('2026-10-31T21:30:00Z')` (Sat 31 Oct, 23:30 Cairo) →
     `'2026-10-25'`;
   - `GodwitlyDashboardDates.weekKey('2026-10-31T22:30:00Z')` (Sun 1 Nov, 00:30 Cairo) → `'2026-11-01'`.
9. **Figures match the database (r1 #4).** Run as `postgres` in the SQL editor. Every value
   must equal its card or bar, including zero buckets:
   - totals:
     `select count(*), count(distinct lower(email)), count(*) filter (where language='en'),
     count(*) filter (where language='ar'), count(*) filter (where message is not null)
     from public.launch_signups;`
   - last 30 Cairo days, today included:

     ```sql
     with today as (select (now() at time zone 'Africa/Cairo')::date d)
     select g::date as day, count(s.id)
     from today, generate_series(today.d - 29, today.d, interval '1 day') g
     left join public.launch_signups s
       on (s.created_at at time zone 'Africa/Cairo')::date = g::date
     group by 1 order by 1;
     ```

   - last 12 Sunday-start weeks, the current week included:

     ```sql
     with today as (select (now() at time zone 'Africa/Cairo')::date d),
          wk as (select d - extract(dow from d)::int as w from today)
     select g::date as week_start, count(s.id)
     from wk, generate_series(wk.w - 77, wk.w, interval '7 days') g
     left join public.launch_signups s
       on ((s.created_at at time zone 'Africa/Cairo')::date
           - extract(dow from (s.created_at at time zone 'Africa/Cairo')::date)::int) = g::date
     group by 1 order by 1;
     ```

   - **Search:** a known substring shows the same number of rows as an `ilike` query over
     the same five fields, and a nonsense term shows **no results**.
10. **Paging (r1 #6):** in a local run with `PAGE_SIZE = 2`:
    - The set of ids on the page equals `select id from public.launch_signups` (same count,
      no duplicates).
    - Then pause on a DevTools breakpoint between two page requests, insert a test row in the
      SQL editor, and resume. The page has no duplicates and no missing older rows, and the
      new row appears only after a page reload (D1). Delete the test row afterwards.
11. **Session and headers:**
    - Close the tab, open the dashboard in a new tab: the person must sign in again.
    - Sign out returns to **signed out**, and the page text no longer contains sign-up values.
      A known limit: a browser's "restore session" feature may restore `sessionStorage`.
    - `curl -sI https://godwitly.pages.dev/dashboard` shows the exact CSP from `_headers` and
      `X-Robots-Tag`, and the console shows no CSP errors.
    - In the console, run `s=document.createElement('script');
      s.src='https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js';
      document.head.append(s)`. It is blocked by CSP, and `typeof jQuery` is `'undefined'`.
    - `curl -sI https://godwitly.pages.dev/` shows no new headers.
12. **UI (r1 #7):**
    - EN and AR (RTL), in every state (signed out, no access, error, dashboard, Access).
    - Below 768px, including 320px, the list is a stack of cards. From 768px it is a table.
    - Neither layout scrolls the page sideways.
    - The language switch re-translates the cards, chart labels and dates, and the Arabic
      choice survives sign-in.
    - Every control is reachable by keyboard.
    - The empty state is checked locally with a mocked empty response, because production
      has rows.
    - Opened from `file://`, the page shows the online-only message.
13. **No personal data in Git:**
    `git log -p main..HEAD | grep -nE '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}'` and the
    same pattern over `git grep`. Every hit is checked by hand. The only expected hits are
    placeholders, `example.com` test values and `onboarding@resend.dev`.
14. **Grants and functions** (run as `postgres`):
    - `anon` on `launch_signups`:
      - `has_any_column_privilege('anon','public.launch_signups','INSERT')` = true;
      - `has_table_privilege('anon','public.launch_signups','SELECT')` = false, and the
        same for UPDATE and DELETE.
    - `authenticated` on `launch_signups`: SELECT = true; INSERT, UPDATE and DELETE = false.
    - `has_function_privilege('anon', <oid>, 'EXECUTE')` = false for every new function.
    - `authenticated`: EXECUTE on the 4 wrappers and the private helpers, but not on the hook.
      No privilege on `private.signup_viewers`.
    - `supabase_auth_admin`: EXECUTE on the hook.
    - `select n.nspname, p.proname, p.prosecdef, p.proconfig from pg_proc p join
      pg_namespace n on n.oid = p.pronamespace where n.nspname in ('public','private') and
      p.proname <> 'notify_signup';` shows:
      - definer = true only in `private`;
      - `search_path=""` on every function.
15. **Kill switch (r1 #1):** during the local test, with a viewer signed in:
    - Run the emergency-stop SQL. The viewer's
      `await probe.from('launch_signups').select('id')` now fails with `42501`, and
      `await probe.rpc('dashboard_role')` fails.
    - Re-run the migration's `grant` lines (approved as part of this test), and the viewer's
      next load works again.

## Test plan and release order

There is no automated test setup, and adding one needs PO approval. Testing is manual, in
this order:

1. Open the PR (with PO approval) and save the diff review in `docs/reviews/`.
2. PO approval to run the setup.
3. Runbook steps 0–6, then AC14 (grants and functions) straight after the migration. If any
   AC14 check fails, stop and run the emergency stop before any browser test.
4. Local test with `python3 -m http.server 8000` at `http://localhost:8000/dashboard.html`,
   running AC2–AC10, AC12 and AC15. macOS includes `python3`, so no project dependency is added.
   The test account is used in this order: AC2 (not listed), the owner adds it, AC3, AC4
   (removed), then its Auth user is deleted. Check that the `auth.users` count is back to
   the step-0 number plus the owner.
5. The PO merges the PR, then step 7 (deploy).
6. AC1, AC11, AC13 and AC14 on production, then step 8.
7. Record the results in the review file.

## Risks and limits

- **Script injection is the main risk:** it would let an attacker act as a signed-in viewer
  and read every sign-up. The mitigations are `textContent` only, a CSP pinned to one script
  file, the SRI hash, and no other outside scripts.
- **The jsDelivr outage risk is accepted:** if the CDN is down, the dashboard is down.
  Visitors and the form are not affected.
- **A stolen access token** (valid for up to 1 hour) can read sign-ups until it expires or
  the viewer is removed. It cannot be turned into a password login, because the Email
  provider is off and the `amr` check refuses one.
- **Viewer data:** see "Viewer data" above. Retention follows P-e.
- **Accounts that already exist** bypass the hook. Step 0 checks for them, and the README
  troubleshooting covers it.
- **The Supabase connector in this Claude session belongs to another account.** All Supabase
  work goes through the PO's dashboard and the repo's linked CLI (`ijpvbxglhxktnkabjdif`).
