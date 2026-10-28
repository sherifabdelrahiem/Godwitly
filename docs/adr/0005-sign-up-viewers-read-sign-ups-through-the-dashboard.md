---
status: accepted
---

# Sign-up viewers read Launch sign-ups through the Sign-up dashboard

Until now only the Project owner could read Launch sign-ups, in the Supabase Table Editor
(ADR-0004). The PO decided on 2026-10-28 that people working on Godwitly's launch should see
the sign-ups and a few figures without a Supabase account. So `dashboard.html` lets a
**Sign-up viewer** sign in with Google, through Supabase Auth, and read every Launch sign-up.
Access depends on one list that only the Project owner can change. A "Before User Created"
Auth hook refuses anyone not on the list at their first sign-in, and a row-level security
policy checks the list again on every read. Launch sign-ups stay read-only for everyone
(`docs/plans/2026-10-28-signup-dashboard.md`).

## Considered options

- **Keep using the Table Editor only:** this needs no new access path to personal data, but
  everyone who reads the sign-ups would need a Supabase account.
- **Clerk for sign-in:** Clerk has a polished sign-in screen, but it would be a third company
  holding the viewers' identities. Supabase would have to trust Clerk's tokens, and Clerk's
  user list would be a second place deciding who gets in. Supabase's own Google sign-in keeps
  the list next to the data it protects, at no extra cost.
- **Anyone signs in, then the owner approves:** this would let strangers create accounts and
  fill the request list.

## Consequences

- **Online only:** `dashboard.html` does not work from `file://`, because Google sign-in
  must return to a real web address. This is a deliberate exception to ADR-0001 and to the
  `file://` rule in `AGENTS.md`. The landing page itself still works from `file://`.
- **One outside script:** the dashboard loads the Supabase library from jsDelivr, at a fixed
  version with an SRI hash, on that page only, under a strict Content-Security-Policy. Any
  script injection there would expose every sign-up, so visitor text is only ever inserted as
  text.
- **Who may be a viewer:** only people working on Godwitly's launch. Visitors agreed only to
  be contacted about the launch, so giving access to anyone else needs a new consent text
  first.
- **No email addresses in Git:** viewer and owner addresses are kept in Supabase (the access
  list and Supabase Auth), never in the repository. There is exactly one Project owner, set
  by hand in the SQL editor.
- **Google sign-in only:** the Email and Phone providers are off, and the database accepts
  only a Google OAuth session. A viewer's account cannot be given a password login.
- **Removal:** removing a Sign-up viewer from the access list blocks their dashboard requests
  at once. In the same sitting, the Project owner then deletes their Supabase Auth account by
  hand. Auth audit logs are kept, so this is access removal and account deletion, not
  complete erasure.
- **Emergency stop:** revoking the dashboard's database access blocks future requests,
  including from sessions that are already signed in. It cannot erase what was already
  loaded, copied or photographed.
