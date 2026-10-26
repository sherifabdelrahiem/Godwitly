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
