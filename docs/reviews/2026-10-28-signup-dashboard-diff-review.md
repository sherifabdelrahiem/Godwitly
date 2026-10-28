# Diff review — Sign-up dashboard

> Reviewed: `main...f9d6ed2` on `feat/signup-dashboard` (merge-base `daee475`; commits `e726c33`,
> `f9d6ed2`) · Spec: `docs/plans/2026-10-28-signup-dashboard.md` **APPROVED v4 + A1, P-a–P-e,
> D1**, plus ADR-0005 · Method: Matt Pocock `code-review` skill (Standards and Spec reviewed in
> parallel, not merged), plus local database tests · 2026-10-28
> Fixes are in the commit that follows `f9d6ed2`. See "Dispositions".

## Local database tests (real Postgres, no live data)

A scratch copy of `supabase/` ran on a local Supabase stack (ports 553xx, project id
`godwitly-test`). All four migrations applied cleanly. Test rows used only `example.com`
addresses, and every row was deleted afterwards. The SQL is in the session scratchpad.

| Check | Result |
|---|---|
| AC14 grants: anon INSERT (column) only; authenticated SELECT only; no rights on `private.signup_viewers` for authenticated; hook EXECUTE for `supabase_auth_admin` only (12 checks) | pass |
| Functions: SECURITY DEFINER only in `private`; `search_path=""` on all 12; no anon EXECUTE | pass |
| Anon: read `launch_signups`, call `dashboard_role()` | refused (permission denied) |
| Owner / viewer / viewer with upper-case email claim: role and rows | owner/2, viewer/2, viewer/2 |
| Stranger; viewer with `amr=password`; viewer with no `amr`; viewer with provider `email` | `none`, 0 rows each |
| Viewer: `add_signup_viewer`, `list_signup_viewers` | 42501 "Only the Project owner…" |
| Viewer: UPDATE, DELETE, INSERT on `launch_signups`; SELECT on `private.signup_viewers` | permission denied |
| Owner: add `"  New.Person@Example.com "` → `added`; again → `exists`; remove owner → `not_found`; remove unknown → `not_found`; remove new → `removed`; `not-an-email` → check violation (23514) | pass; owner row kept |
| Removal is immediate | removed viewer: `none`, 0 rows |
| Hook, as `supabase_auth_admin` login: listed Google (mixed case) → `{}`; stranger, listed via provider `email`, missing email → 403 error object | pass, with no extra `grant usage on schema public` needed |
| Kill switch (inside a rolled-back transaction) | signed-in viewer: permission denied on rows and on `dashboard_role()` |

**Not yet tested:** a real browser, Google sign-in, the hosted project, Cloudflare headers.
These are covered by the runbook and the ACs after PO-approved setup.

## Standards

No hard blockers. Checked by script:
- 67 `dash.*` keys each in `en` and `ar`, and all of them are used;
- every `data-i18n` default in `dashboard.html` matches its `en` text (ADR-0001);
- no "waitlist", "admin" or "contact form" in user-facing text;
- the Arabic terms match the glossary;
- the only email addresses are `example.com`.

**Documented-standard breaches**

1. `AGENTS.md`, Project overview, the "Technology" line was not updated: it doesn't mention
   Supabase Auth, Google sign-in or the pinned jsDelivr supabase-js. *Hard, small.*
2. `css/dashboard.css:106` `.dash-pill-danger:hover { background: #9f1239; }` breaks
   "colours … are `:root` variables". *Judgement:* `#f1f5f9` at lines 220 and 265 is also
   raw, but `styles.css` already uses that raw value 3 times.
3. README, Emergency stop → Restore says "re-run the two `grant` lines". The migration has
   five grant statements (one table and four functions). The README's own SQL block is
   correct.
4. ADR-0005 calls the dashboard a "deliberate exception to ADR-0001", but ADR-0001 has no
   back-reference. *Judgement.*

**Baseline smells (all judgement calls)**

- Duplicated Code:
  - `load()` checks the role twice with the same shape. A `readRole()` helper would cover
    both.
  - `addViewer` / `removeViewer` share the generation, busy, message, re-read and focus
    block. A `runAccessChange(...)` helper would cover both.
  - The date helpers repeat `split("-").map(Number)` and `Date.UTC`, so a `parseDayKey`
    helper would help. `formatDate` and `formatDateTime` repeat the same Intl options.
  - The "has a message" test appears in both `computeFigures` and `signupRow`.
  - SQL: the owner-check `raise` is repeated 3 times, and `is_signup_viewer` and
    `is_project_owner` differ only by `and v.is_owner`.
  - `_headers`: the CSP block is copied for `/dashboard` and `/dashboard.html`. Cloudflare
    matches exact paths, so the copies are needed, but they can drift apart.
- Primitive Obsession: the role and result strings (`owner`, `viewer`, `none`, `added`,
  `exists`, `removed`, `not_found`) are bare literals shared between SQL and JS.
- Mysterious Name: `state.confirming` holds an email address, so `confirmingEmail` would
  be clearer.
- Deliberate duplication of the language switcher: a small shared `js/i18n.js` would avoid
  it. Optional.

**Checked, nothing to report:**
- RTL uses logical properties.
- The 320px wrap works, and only the table scrolls sideways.
- Semantics and keyboard access: `aria-pressed`, a skip link, a table caption, focus moves
  when a button is hidden, and Remove has a confirm step.
- All data is inserted with `textContent`.
- The SQL comment style matches the existing migrations.

## Spec

Overall the diff matches the spec closely. There are no P1 findings. Checked:
- The pinned UMD's sha384 equals the SRI value, and the file has no `eval` or
  `new Function`, so the CSP doesn't need `'unsafe-eval'`.
- postgrest-js `or()` uses `searchParams.append`, so `+00:00` is sent as `%2B00%3A00`.
- PostgREST logic-tree values end only at `,` or `)`.
- `ar-EG-u-nu-latn` gives Latin digits.

**(a) Missing or partial**

1. Q23 says "A **Sign out** button is always visible". The header Sign out showed only when
   `hasSession` is true and the view is loading, error or dashboard. An error at start-up
   (`initialize()` failing, or an OAuth error other than `access_denied`) showed the error
   screen with no Sign out, even if a session was stored. Try again recovered it. *Low.*

**(b) Not asked for (minor, harmless)**

- `forgetSession()` removes `sb-*` keys from sessionStorage when `signOut()` fails.
- `onAuthStateChange('SIGNED_OUT')` switches to **signed out** (through `stopAndShow`, so
  the generation still goes up).
- `retry()` reloads the page when the library is missing.
- Extra Access messages `accessWorking`, `accessRemoved` (which tells the owner to delete
  the Auth account next, consistent with P-e) and `accessNotFound`.
- A "Showing X of Y" count, chart-range notes, a search hint and explanatory text on the
  signed-out screen.

**(c) Implemented and checked correct**

- The loadGeneration rule (r2 #2), including the end-of-load role re-check.
- OAuth error handling and address clean-up (query and hash; the description is never shown).
- P-a buckets with today, the current week and zero bars. P-b and P-c.
- The 7 states, with Try again on the error screen only (D1).
- Clearing on sign out and on no access.
- CSP compatibility.
- Every item in the Docs section, including the A1 and P-e wording.
- `index.html`, `script.js`, `form.js` and `styles.css` are unchanged.

Not verified: that live GoTrue maps the hook's 403 to `error=access_denied`. AC2 covers this.

## Dispositions

| Finding | Disposition |
|---|---|
| Standards 1: AGENTS "Technology" line | **Fixed:** mentions Supabase Auth with Google sign-in (ADR-0005) and the pinned jsDelivr script on the dashboard only |
| Standards 2: raw hover colour | **Fixed:** a `--color-danger-hover` token in a `:root` block in `css/dashboard.css` (`styles.css` stays unchanged, as the plan requires). `#f1f5f9`: **proposed accept**, because it matches existing `styles.css` practice |
| Standards 3: README "two grant lines" | **Fixed:** "the five `grant` statements below (one table grant and four function grants)" |
| Standards 4: ADR-0001 back-reference | **Fixed:** one consequence line points to ADR-0005 |
| Baseline smells (all) | **Proposed accept** for this MVP. The behaviour was tested, and refactoring now would re-open reviewed code. They are candidates for a later `improve-codebase-architecture` pass |
| Spec (a)1: Sign out on the start-up error screen | **Fixed:** the header Sign out is always shown on the error screen; `signOut()` already forgets a session it can't revoke |
| Spec (b): extra behaviour | **Proposed accept:** each item supports a decided behaviour (sign-out robustness, P-e guidance, clearer states) and adds no data, permission or scope |

The "proposed accept" items need the PO's explicit acceptance before merge.
