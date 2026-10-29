# Static site with no build step, working from `file://`

The landing page is plain HTML, CSS and vanilla JavaScript with no build tools, package
manager or framework, and it must work both when opened by double-click (`file://`) and on
Cloudflare Pages. It was built during the Vibe Coding course at Creativa Hub Port Said, and
the aim is that anyone can open `index.html` and change `js/translations.js` or the `:root`
tokens without installing anything (see `README.md`, "Common changes").

## Consequences

- No bundler means no imports: scripts load in order from `index.html`, and shared values
  (such as the Supabase settings in `js/config.js`) are plain globals.
- English text exists twice, as the built-in text in `index.html` and in
  `js/translations.js`, so the page reads correctly before JavaScript runs. Change both
  together.
- Adding any dependency, CDN script or build tool needs the PO's approval (`AGENTS.md`).
- The Sign-up dashboard (`dashboard.html`) is a deliberate exception: it works online only and
  loads one pinned CDN script (ADR-0005).
