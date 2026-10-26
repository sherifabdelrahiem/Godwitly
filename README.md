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
