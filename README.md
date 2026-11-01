# Godwitly landing page (English + العربية)

A static recreation of the Godwitly landing page, with an Arabic version.
HTML + CSS + a little vanilla JavaScript. No build tools, no server.

## Open it

Double-click `index.html`, or run `open index.html` in Terminal from this folder.
Add `?lang=ar` to the address to open the Arabic version directly.

The Sign-up dashboard (`dashboard.html`) is the one exception: it works only from a web
address, not by double-click. See "Sign-up dashboard" below.

## Files

| File | What it does |
|---|---|
| `index.html` | The page structure (all sections). English text is the default. |
| `css/styles.css` | All styling. Colours and fonts are variables at the top (`:root`). |
| `js/translations.js` | Every piece of text, in English (`en`) and Arabic (`ar`). |
| `js/script.js` | Language switcher, mobile menu, product tabs, smooth scrolling. |
| `crash-course/index.html` | The Crash course hub (Claude Crash Course for Beginners), linked from the landing page as "Crash Courses". |
| `crash-course/lesson-1/index.html` | Lesson 1, built from its approved draft in `docs/course/lesson-1/`. The Lesson text is Arabic; the sidebar, trail and previous/next use translation keys. Its Resource, the Sample business facts file, is `crash-course/lesson-1/resources/cafe-marasy-facts.pdf` (made from `docs/course/lesson-1/resources/cafe-marasy-facts.html`). |
| `css/course.css` | Styling for the Crash course pages only. It reuses `css/styles.css` and its `:root` variables. |
| `js/course.js` | Language switcher, mobile menu, the phone Lesson list, the checklist ticks with the ✓ marks and celebration, and footer year for the Crash course pages. They never load `js/script.js`. |
| `js/course-language.js` | Which language a Crash course page opens in, what it remembers (under its own name, never the landing page's) and how links carry it. |
| `js/course-progress.js` | The "You're done when" ticks: remembered per Lesson in the visitor's own browser, never sent anywhere. It stores and judges the ticks; `js/course.js` shows the ✓ marks and the celebration. Each hub card lists its Lesson's checklist items, kept equal to the manifest (`courses/`) by the project checks. |
| `assets/images/` | Logo, background landscapes, birds, device and product pictures, and the seven web-sized course mascots (`mascot-*.webp`; the original PNGs stay out of Git). |
| `dashboard.html` | The private Sign-up dashboard page (not linked from the landing page). |
| `css/dashboard.css` | Styling for the Sign-up dashboard only. It reuses the `:root` variables. |
| `js/dashboard.js` | Google sign-in, the Launch sign-ups list, search, figures and Access. |
| `_headers` | Cloudflare Pages security headers for `/dashboard` and `/dashboard.html` only. |
| `courses/` | The Crash course manifests: each Crash course's Lessons (number, title key, summary line, Preview, Required, released) and checklist items (id, Required, retired). The single source the project checks compare the hub and Lesson pages with. `courses/test-course.js` is a dummy test Crash course. Not part of the site. |
| `deploy-files.txt` | The files and folders the production deploy uploads, one per line (see the deploy command in `AGENTS.md`). The project checks make sure it holds no test Crash course material. |
| `tests/` | Automated tests and project checks for the development workflow: `node --test` (Node 24 or later, no packages). Not part of the site. |
| `.github/workflows/` | Runs `node --test` on Node 24 and 26 for every pull request into `main`, and reports pass or fail. Not part of the site. |
| `.agents/skills/` | Agent skills used by the development workflow (MIT; see its `README.md`). Not part of the site. |

## Common changes

- **Text:** edit `js/translations.js` (change both `en` and `ar`).
- **Colours:** edit the `--color-…` variables at the top of `css/styles.css`.
- **Images:** replace a file in `assets/images/` with one of the same name,
  or change the `src="…"` in `index.html`.

Fonts load from Google Fonts, so without internet the page falls back to system fonts.

## Contact form ("Get notified")

The form at the bottom of the page saves sign-ups in the Supabase project **godwitly**
(organisation Design Masr, region Frankfurt).

| File | What it does |
|---|---|
| `js/config.js` | Supabase address + publishable key (public by design); used by the form and the Sign-up dashboard |
| `js/form.js` | Checks the answers, sends them, shows errors / success / "Try again" and the Message's characters-left counter |
| `js/message-length.js` | The Message length rule (up to 1,000 characters), shared by the check and the counter |
| `supabase/migrations/…_launch_signups.sql` | Creates the `launch_signups` table and its rules |
| `supabase/migrations/…_notify_signup_trigger.sql` | Adds the `notify_signup` trigger that asks for a Sign-up alert after each new sign-up |
| `supabase/migrations/…_launch_signups_comment.sql` | Describes the table as "Launch sign-ups from the Godwitly landing page." |
| `supabase/migrations/…_signup_dashboard.sql` | Adds the Sign-up viewers list, the Google-only Auth hook and the read-only access for the Sign-up dashboard |
| `supabase/migrations/…_signup_viewers_email_check.sql` | Tightens the Sign-up viewer address rule (no `,` `;` or spaces; a plain domain), the same rule as the dashboard page |
| `supabase/functions/notify-signup/index.ts` | Edge Function that emails the Project owner the Sign-up alert (no visitor details; see "Email alerts") |

- **See the sign-ups:** the Project owner and Sign-up viewers use the Sign-up dashboard at
  `https://godwitly.pages.dev/dashboard` (see "Sign-up dashboard"). The Project owner can also
  use Supabase dashboard → project *godwitly* → Table Editor → `launch_signups`.
- **Who can do what:** visitors can only *add* a row with the public key. Signed-in Sign-up
  viewers (the Project owner is one too) can *read* every sign-up through the Sign-up
  dashboard; the database checks the Sign-up viewers list on every request. Nobody can change
  or delete sign-ups from the dashboard. Only the Project owner changes who is a Sign-up
  viewer, and only the Project owner deletes rows, in the Supabase dashboard.
- **Rules:** name and job title 2–100 characters, a valid email, a phone number with 7–15 digits,
  message up to 1,000 characters, consent ticked. The same rules are in `js/form.js` (the
  message length in `js/message-length.js`) and in the migration file — change them together.
- **Spam:** a hidden "honeypot" field stops simple bots. If junk rows appear, delete them in the
  Table Editor.
- **Never commit** the database password (it is in the macOS Keychain as
  `supabase-godwitly-db-password`) or the secret / service_role key.
- **Deleting old data** (e.g. 12 months after launch), in the SQL editor:
  `delete from launch_signups where created_at < '2027-12-31';`

## Email alerts

Each new sign-up asks a Supabase Edge Function to send the project owner a best-effort
alert. The email has the fixed subject "New Godwitly sign-up" and contains only the
sign-up time, the row ID and a link to the Supabase Table Editor. It does not contain
the visitor's name, email, phone number, job title or message. The table remains the
source of truth; check it in the dashboard every week because alerts can be lost.

The Edge Function secrets `RESEND_API_KEY`, `NOTIFY_TO` and `WEBHOOK_SECRET` live in
Dashboard → Edge Functions → Secrets. The same webhook value lives in Dashboard →
Integrations → Vault under the name `notify_signup_webhook_secret`. Never put these
values in this repository, a terminal command, chat, a brief or a review file.

### Set up alerts

These steps are for the project owner and need approval before any deploy or database
change.

1. Create a Resend account owned by the `NOTIFY_TO` address and create an API key. The
   test sender `onboarding@resend.dev` only delivers to that account owner's address.
2. Deploy the function with `supabase functions deploy notify-signup`. This command
   contains no secrets.
3. In Dashboard → Edge Functions → Secrets, add `RESEND_API_KEY`, `NOTIFY_TO` and
   `WEBHOOK_SECRET`. Generate the webhook secret with
   `openssl rand -hex 32 | pbcopy`, then paste it into the dashboard.
4. In Dashboard → Integrations → Vault, add `notify_signup_webhook_secret` with the
   same webhook value.
5. While the value is still on the clipboard, open Edge Functions → `notify-signup` →
   Test. Send a POST with header `x-webhook-secret` and body
   `{"id":"00000000-0000-4000-8000-000000000001","created_at":"2026-10-27T12:00:00Z"}`.
   Expect HTTP 200 and one email. Then clear the clipboard with
   `pbcopy < /dev/null`. If this fails, stop; do not create the trigger.
6. Apply the database migration with `supabase db push`.

To rotate the webhook secret, disable the trigger first. Generate a new value, update
both `WEBHOOK_SECRET` and `notify_signup_webhook_secret` in the dashboard, repeat the
dashboard probe above, and then enable the trigger. If anything fails, keep the
trigger disabled until both values match.

### Check alerts

Recent pg_net responses are kept for about six hours. In the SQL editor, find failed
requests and note their numeric request IDs:

```sql
select id, status_code, error_msg, created
from net._http_response
where status_code is distinct from 200
   or error_msg is not null
order by created desc;
```

For each failed request, search Dashboard → Logs → Postgres for
`notify-signup queued: request <id>` to find its row UUID. The request ID and row UUID
are different types, so this is two correlated checks rather than a SQL join. Also
check `launch_signups` in the Table Editor every week; there are no automatic alerts
for delivery failures.

Edge Function logs should contain only a row ID, outcome and HTTP status. They must
not contain request or response bodies. If junk sign-ups create junk alerts, disable
the trigger, delete the junk rows in the Table Editor, and consider Turnstile as a
separate approved change. Resend's test limit is 100 emails per day. Rotating the
webhook secret does not stop form spam.

Turn alerts off or back on in the SQL editor:

```sql
alter table public.launch_signups disable trigger notify_signup;
alter table public.launch_signups enable trigger notify_signup;
```

## Sign-up dashboard

`dashboard.html` is a private page where the Project owner and the Sign-up viewers they
choose sign in with Google and see every Launch sign-up, newest first, with search and a few
figures: total sign-ups, unique email addresses, sign-ups per day (last 30 days) and per
week (last 12 weeks, starting on Sunday), sign-ups by language and how many left a message.
Dates and groupings use Cairo time. There is no export or download, and nobody can change or
delete a sign-up from the page.

- **Address:** `https://godwitly.pages.dev/dashboard`. It is not linked from the landing page
  and asks search engines not to index it.
- **Who may be a Sign-up viewer:** only people working on Godwitly's launch. Visitors agreed
  only to be contacted about the launch, so giving access to anyone else needs a new consent
  text first (ADR-0005).
- **Sign-in:** Google only. The session lasts until the tab or the browser is closed, and
  **Sign out** is always visible.
- **Access:** only the Project owner sees the Access section and changes the list. There is
  exactly one Project owner, set once in the SQL editor. No email address is ever put in Git.

Design and decisions: `docs/plans/2026-10-28-signup-dashboard.md` and
`docs/adr/0005-sign-up-viewers-read-sign-ups-through-the-dashboard.md`.

### Set up the dashboard

These steps are for the Project owner. Each one needs approval, and the order matters.

**Secrets rule (same as "Email alerts"):** never put the Google client ID or secret, or any
viewer address, in this repository, chat, a terminal command, a brief or a review file. Run
`pbcopy < /dev/null` after pasting a secret.

0. **Baseline.** Record in the review file, with no email addresses: the current Site URL and
   Redirect URLs, the provider switches, the Security Advisor lint names, whether the
   `pg_graphql` extension is installed, and the result of
   `select raw_app_meta_data->>'provider', count(*) from auth.users group by 1;`.
   Expect 0 users. Delete any unexpected account (with approval) before going on, because an
   existing account with a viewer's email would get past the Auth hook.
1. **Other providers.** Authentication → Sign In / Providers. Turn **off** Email, Phone and
   Anonymous sign-ins, and manual linking. Leave "Allow new users to sign up" **on**: the
   hook and the Sign-up viewers list are the gate. Check with
   `curl -s https://ijpvbxglhxktnkabjdif.supabase.co/auth/v1/settings -H "apikey: <publishable key>"`,
   which should show `external.email=false`, `external.phone=false`,
   `anonymous_users=false` and `disable_signup=false`.
2. **Migration.** `supabase db push`. Nobody can sign in yet, because no provider is on.
3. **Project owner row.** In the SQL editor, run once:
   `insert into private.signup_viewers (email, is_owner) values (lower(btrim('<your Google address>')), true);`
   Type the address only into the SQL editor.
4. **Hook.** Authentication → Hooks → Before User Created → Postgres function →
   `public.hook_before_user_created` → enable. This must come **before** step 5.
5. **Google.**
   - In Google Cloud Console, create an OAuth client of type "Web application", with the
     authorised redirect URI `https://ijpvbxglhxktnkabjdif.supabase.co/auth/v1/callback`.
   - The consent screen asks only for the basic sign-in scopes `openid`, `email` and
     `profile`. Upload no logo. Publish the app "In production". (Google exempts
     basic-sign-in-only apps from the Testing test-user list, but publishing avoids relying on
     that. Sensitive-scope verification does not apply. Google may separately ask for brand
     verification before it shows the app's name; sign-in still works, so follow Google's
     steps only if you want the name shown. See
     <https://support.google.com/cloud/answer/15549945>.)
   - In Supabase → Providers → Google, paste the client ID and secret, then clear the
     clipboard with `pbcopy < /dev/null`.
6. **Redirects.** Authentication → URL Configuration.
   - Site URL: `https://godwitly.pages.dev`.
   - Redirect URLs: `https://godwitly.pages.dev/dashboard`,
     `https://godwitly.pages.dev/dashboard.html` and, for local testing only,
     `http://localhost:8000/dashboard.html`.
7. **Site deploy.** Use the deploy command in `AGENTS.md`; its file list, `deploy-files.txt`,
   includes `dashboard.html` and `_headers`.
8. **Clean-up.** Remove the localhost redirect URL. Check that the Security Advisor shows
   nothing new apart from lint 0027 (`pg_graphql` table exposed to authenticated) on
   `launch_signups`, which is accepted only if `pg_graphql` is installed.

### Add a Sign-up viewer

Add the person **before** they sign in. Sign in as the Project owner, open Access, and type
their address exactly as it appears in their Google account, dots included. Only add people
working on Godwitly's launch. Anyone not on the list is refused at their first sign-in, and no
account is created for them.

### Remove a Sign-up viewer

Do both steps in one sitting, in this order:

1. **Remove their dashboard access first:** Access → Remove. Their next request is refused,
   even if they are still signed in, and they see "no access".
2. **Then delete their Supabase Auth account:** Supabase dashboard → Authentication → Users.

Auth audit logs are kept for security and reviewed at the yearly clean-up. So this is access
removal and account deletion, not complete erasure of every record about the person.

### Listed but no access

If someone on the list signs in and sees "no access":

- **Address spelling:** the address in Access must match their Google account exactly, dots
  included. Remove the entry and add it again with the right spelling.
- **An older account with the same email:** an account that was not created through Google
  sign-in (for example an email account from before the setup) gets past the Auth hook but is
  refused by the database. Find it in Authentication → Users, check its provider, delete it
  (with approval) and ask the person to sign in again.
- **Google only:** the person must use "Sign in with Google". The database accepts only a
  Google sign-in.

"No access" also appears if they cancelled at Google's sign-in screen.

### Emergency stop

Use it **when suspected exposure warrants it**, for example a leaked session, a wrong viewer
or a script-injection bug. The Project owner, or the agent (pre-approved in plan amendment
A1), runs these steps straight away without asking for a further approval, then tells
everyone involved.

It **blocks future dashboard requests**, including from sessions that are already signed in.
It cannot erase information that was already loaded in someone's browser, copied or
photographed; treat any such copy as a possible personal-data incident.

1. In the SQL editor (takes effect on the next request):

   ```sql
   revoke select on public.launch_signups from authenticated;
   revoke execute on function public.dashboard_role(), public.list_signup_viewers(),
     public.add_signup_viewer(text), public.remove_signup_viewer(text) from authenticated;
   ```

2. Supabase → Providers → **Google off**, so nobody new can sign in.
3. Optional: Authentication → Users → delete the viewers' Auth accounts. This ends their
   refresh tokens.

**Restore** only with PO approval, once the cause is fixed: re-run the five `grant` statements
below (one table grant and four function grants, copied from the `…_signup_dashboard.sql`
migration), then turn Google back on.

```sql
grant select on public.launch_signups to authenticated;
grant execute on function public.dashboard_role(), public.list_signup_viewers(),
  public.add_signup_viewer(text), public.remove_signup_viewer(text) to authenticated;
```

### Where a Sign-up viewer's details are kept

| Store | What | When it is removed |
|---|---|---|
| `private.signup_viewers` | email, owner flag, date added | when the Project owner removes the viewer |
| `auth.users`, `auth.identities` | email, Google name and picture URL | deleted by hand in the same sitting as removal |
| `auth.sessions`, `auth.refresh_tokens` | IP address, browser details | when the Auth account is deleted |
| `auth.audit_log_entries`, Auth logs | sign-in events with IP address | kept; reviewed at the yearly clean-up |
| Google Cloud test users | email | not used: the app is published, and basic-sign-in apps need no test-user list |

### Run the dashboard locally

The dashboard needs a web address and an internet connection; opened from `file://` it only
shows a message saying so. From this folder, run:

```sh
python3 -m http.server 8000
```

Then open `http://localhost:8000/dashboard.html`. Google sign-in returns there only while
`http://localhost:8000/dashboard.html` is in Supabase's Redirect URLs (setup step 6); adding
it back after step 8 needs approval.
