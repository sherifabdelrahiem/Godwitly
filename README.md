# Godwitly landing page (English + العربية)

A static recreation of the Godwitly landing page, with an Arabic version.
HTML + CSS + a little vanilla JavaScript. No build tools, no server.

## Open it

Double-click `index.html`, or run `open index.html` in Terminal from this folder.
Add `?lang=ar` to the address to open the Arabic version directly.

## Files

| File | What it does |
|---|---|
| `index.html` | The page structure (all sections). English text is the default. |
| `css/styles.css` | All styling. Colours and fonts are variables at the top (`:root`). |
| `js/translations.js` | Every piece of text, in English (`en`) and Arabic (`ar`). |
| `js/script.js` | Language switcher, mobile menu, product tabs, smooth scrolling. |
| `assets/images/` | Logo, background landscapes, birds, device and product pictures. |

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
| `js/config.js` | Supabase address + publishable key (public by design) |
| `js/form.js` | Checks the answers, sends them, shows errors / success / "Try again" |
| `supabase/migrations/…_launch_signups.sql` | Creates the `launch_signups` table and its rules |

- **See the sign-ups:** Supabase dashboard → project *godwitly* → Table Editor → `launch_signups`.
- **Who can do what:** visitors can only *add* a row. Reading, changing and deleting are blocked
  for the public key; only the project owner sees the data in the dashboard.
- **Rules:** name and job title 2–100 characters, a valid email, a phone number with 7–15 digits,
  message up to 1,000 characters, consent ticked. The same rules are in `js/form.js` and in the
  migration file — change both together.
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
