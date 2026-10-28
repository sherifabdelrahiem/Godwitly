# Codex plan gate — Sign-up dashboard (round 1)

> Reviewer: Codex (gpt-6.1-sol), read-only · Plan: docs/plans/2026-10-28-signup-dashboard.md v2 · 2026-10-28

**Verdict: FAIL** (1×P1, 5×P2, 1×P3)

1. [P1] The emergency stop does not stop existing sessions reading personal data. Disabling Google prevents new sign-ins but leaves issued JWTs usable; database access remains until rollback step 3, which requires separate approval (plan:420–429). Fix: make revoking dashboard SELECT/RPC access the first approved emergency action, then disable Google. Verify that a previously issued viewer token cannot read sign-ups or list viewer addresses.

2. [P2] Clearing sensitive state can be undone by an in-flight request. The plan requires clearing on sign-out/no-access but does not prevent an earlier sign-up or Access request from resolving afterwards and repopulating the page (plan:271–281, 294–303). Fix: invalidate pending loads on each auth/state transition and discard stale responses. Test sign-out and removal while responses are deliberately delayed.

3. [P2] Several acceptance probes cannot run as written: `client` and the grouping function are inside an IIFE, so ordinary console expressions cannot access them (plan:237–239; AC3, AC4, AC7). Fix: specify debugger breakpoints with the correct lexical scope, or provide a separate local test harness and authenticated API probes. Include complete arguments and explicit expected results.

4. [P2] AC8 does not verify the proposed chart windows or weekly figures. Its daily SQL returns the last 30 populated dates across all history, rather than the last 30 calendar days, and supplies no weekly comparison (plan:77–78, 479–489). Fix: provide daily and Sunday-based weekly queries bounded to the proposed Cairo calendar windows, including zero-count buckets, and require every displayed bucket to match.

5. [P2] Rollback’s `/dashboard` → 404 assertion lacks the required Cloudflare Pages configuration (plan:432–433). Removing `dashboard.html` alone can invoke Pages’ default SPA fallback to `index.html`; no top-level `404.html` is specified. Fix: explicitly configure the intended missing-page behavior, or change the assertion to require that the dashboard is unavailable while documenting the actual fallback.

6. [P2] Offset paging plus de-duplication and count equality cannot prove that every row was loaded. Concurrent inserts/deletes can shift offsets, producing missing rows or a mixed dataset even when the final count matches (plan:275–281; AC8). Fix: define a stable loading boundary and keyset pagination over `(created_at, id)`, with explicit handling of concurrent deletions. Add a test that changes rows between page requests.

7. [P3] AC10 requires cards on desktop as well as mobile, contradicting the specified table layout from 768px (plan:308, 499–501). Fix: require cards below 768px and the table at desktop widths, checking both languages and horizontal overflow.

---

# Round 2 (plan v3)

> Reviewer: Codex (gpt-6.1-sol), read-only · 2026-10-28

**Verdict: PASS** (0×P1, 2×P2, 1×P3)

**Round-1 disposition**

1. R1 #1 — CLOSED. The emergency stop now revokes SELECT and public RPC execution before disabling Google; AC15 checks an existing viewer session (plan:445–465, 639–644).

2. R1 #2 — PARTIALLY CLOSED [P2]. Generation checks address stale responses, but the rule also discards `dashboard_role` responses whenever the state is not already dashboard/Access. Initial authorization runs from loading, so following this literally prevents entering the dashboard (plan:225–233, 256–260, 292–295). Fix: accept current-generation authorization responses in loading; invalidate generations on cancellation/auth transitions, and define which loading phases may accept each response. Verify successful initial load as well as delayed sign-out/removal.

3. R1 #3 — PARTIALLY CLOSED [P3]. The separate probe client resolves IIFE access, but four AC8 calls still use unqualified `dayKey`/`weekKey`, which are not globals (plan:252–254, 554–561). Fix: prefix every call with `GodwitlyDashboardDates.`, or explicitly destructure both helpers before running them.

4. R1 #4 — CLOSED. AC9 now supplies bounded daily and Sunday-based weekly comparisons with zero buckets and requires every displayed value to match (plan:562–589).

5. R1 #5 — CLOSED. Rollback documents the Pages fallback and checks dashboard unavailability rather than requiring a 404 (plan:479–483).

6. R1 #6 — CLOSED. Composite keyset pagination replaces offsets, concurrent deletion behavior is explicit, and AC10 tests insertion between requests (plan:296–305, 594–599).

7. R1 #7 — CLOSED. AC12 consistently requires cards below 768px and a table from 768px, in both languages without horizontal overflow (plan:610–615).

**New findings**

8. [P2] AC3 attempts to delete and overwrite **every live sign-up**. The “local” test serves only the frontend locally; `js/config.js` still targets the hosted project. If the permissions being tested regress, these probes destroy or alter real personal data (plan:519–522; “Test plan and release order,” step 4). Fix: scope mutation probes to a dedicated synthetic row UUID, verify that row remains unchanged, then remove it through the approved SQL-editor cleanup. Run the grant checks in AC14 before mutation probes and before deployment.

**Disposition (Claude, plan v4):** r2 #2, #3 and #8 are fixed in plan v4. See the plan History.
