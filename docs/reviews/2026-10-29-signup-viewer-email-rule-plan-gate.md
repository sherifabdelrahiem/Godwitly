# Codex plan gate — Sign-up viewer address rule (dashboard plan D2, rounds 1–2)

> Reviewer: Codex (`codex exec --sandbox read-only`) · Plan: `docs/plans/2026-10-28-signup-dashboard.md` D2 + uncommitted diff of `js/dashboard.js` and `supabase/migrations/20261029120000_signup_viewers_email_check.sql` · 2026-10-29

## Round 1

Verdict: FAIL — 0 P1, 1 P2, 0 P3

1. **[P2] Identical regex text does not ensure identical whitespace rules.** Evidence: [js/dashboard.js:200](js/dashboard.js:200), [migration:16](supabase/migrations/20261029120000_signup_viewers_email_check.sql:16), and [D2:63](docs/plans/2026-10-28-signup-dashboard.md:63). JavaScript uses ECMAScript’s fixed whitespace set; PostgreSQL interprets `\s` as `[[:space:]]`, with non-ASCII membership dependent on database locale. Consequently, the claimed equivalence is not established by the 20 cases. Node rejects an embedded U+FEFF but accepts U+0085; PostgreSQL classification can differ. This mismatch predates D2, but D2 explicitly promises parity while retaining it. **Fix:** define an explicit shared whitespace policy, encode equivalent character sets in both engines, and add embedded Unicode-whitespace cases to D2’s verification matrix. [PostgreSQL semantics](https://www.postgresql.org/docs/current/functions-matching.html).

Other gate checks:

- Both expressions are syntactically valid. Node checks confirmed ordinary Gmail, plus-addressing, Workspace-style subdomains, Punycode domains and AC7 remain accepted; the reported comma and trailing-dot mistakes are rejected.
- Unicode domain spelling is deliberately refused. Punycode passes, but converting an address must not be presented as guaranteeing access: the stored value must still match Google’s emitted email exactly. Google documents ASCII domain restrictions for Workspace. [Google guidance](https://knowledge.workspace.google.com/admin/domains/choose-your-primary-domain).
- The single `ALTER TABLE` is atomic: validation failure or timeout preserves the original constraint. It scans existing rows under an `ACCESS EXCLUSIVE` lock; the configured timeouts bound waiting and execution. No separate `BEGIN` is needed for this statement’s atomicity. [PostgreSQL ALTER TABLE](https://www.postgresql.org/docs/17/sql-altertable.html).
- No authorization expansion, grants change or data rewrite found. Invalid addresses that still pass, such as `a@-example.com`, cannot bypass exact-email authorization.
- No further README, translation, Auth-hook or RLS change is required for the stated ASCII-domain scope. Extend the acceptance cases for the parity fix.

Verification: Node checks ran; PostgreSQL execution, lock/failure probes and rollback tests were **not run**. No files changed.
**Fixed after round 1:** both rules list whitespace explicitly (`[^@ 	
,;]`) instead of `\s`. Parity was checked with 33 cases (including U+00A0, U+0085, U+FEFF, U+2003, U+3000 and `é`) in Node and with the migration applied inside a rolled-back transaction on the isolated `godwitly-test` database: 0 mismatches. The Known-limit wording now follows the round-1 note on `xn--` addresses.

## Round 2

Verdict: PASS — 0 P1, 0 P2, 0 P3.

Round-1 [P2]: **closed**.

- The patterns at `js/dashboard.js:201` and `supabase/migrations/20261029120000_signup_viewers_email_check.sql:18` are equivalent. With `standard_conforming_strings=on`, PostgreSQL preserves the backslashes for ARE parsing; `\t\n\r\f\v` represent the same characters inside both bracket expressions. See [PostgreSQL escape rules](https://www.postgresql.org/docs/current/functions-matching.html#POSIX-ESCAPE-SEQUENCES).
- Case-sensitive PostgreSQL ranges use character-code intervals, so `a-z` and `0-9` match the ECMAScript ranges; they do not expand to accented letters through locale collation. See [PostgreSQL implementation](https://github.com/postgres/postgres/blob/REL_17_STABLE/src/backend/regex/regc_locale.c#L400).
- The single `ALTER TABLE` atomically replaces and validates the constraint. Invalid existing rows or a timeout leave the original constraint intact. No data, privileges, policies or functions change.

Findings: none. No additional changes required within D2’s scope.

Verification: inspected the scoped diff and migration; Node probes rejected trailing line terminators, vertical-tab whitespace and accented domains. PostgreSQL execution was not repeated because `psql` is unavailable. No files edited.