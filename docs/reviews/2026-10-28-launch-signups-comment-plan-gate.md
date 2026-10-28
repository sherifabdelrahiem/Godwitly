# Codex plan gate — launch_signups comment (round 1)

> Reviewer: Codex (GPT-6), read-only · Plan: docs/plans/2026-10-28-launch-signups-comment.md v1 · 2026-10-28

**Verdict: PASS** (0×P1, 4×P2, 1×P3)

1. [P2] C5 correctly identifies compatible lock modes, but “instant” and “sign-ups are not blocked” overpromise: conflicting maintenance/DDL and lock queues can cause waits. Fix: qualify the claim as compatibility with ordinary concurrent inserts, acknowledge contention, and specify bounded lock/statement timeouts for application.

2. [P2] AC2 cannot prove permissions unchanged because `column_privileges` omits table-only privileges such as DELETE and TRUNCATE, while the remaining probes omit policy permissiveness and forced RLS. Fix: compare table and column ACLs, both RLS flags, and complete policy definitions before and after, using the same owner role and deterministic ordering.

3. [P2] AC3 checks only trigger name and enabled state, allowing a changed event, binding or function body to pass despite potentially changing Sign-up alert emails. Fix: compare `pg_get_triggerdef` and the bound function’s definition before and after; these metadata reads require neither inserts nor emails.

4. [P2] AC4’s count comparison cannot establish unchanged existing rows, and “the difference matches new sign-ups” lacks a defined probe under concurrent traffic. Fix: treat the aggregate count as supplemental evidence and make review of the exact single-statement migration the primary no-DML check; clarify that C7 prohibits reading personal-field values, while AC4 reads an aggregate.

5. [P3] C8 offers `NULL` as rollback even though it removes the description rather than restoring the previous state. Fix: record the actual pre-change comment and restore it verbatim through a separately approved, later-timestamped migration; reserve `NULL` for an explicitly chosen removal.