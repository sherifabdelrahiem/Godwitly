# Codex cross-agent review — AGENTS.md main-flow plan (round 3)

> Reviewer: Codex (`codex exec --sandbox read-only`, offline) · Plan: **draft v3** (`7ad9026`) · 2026-10-29 · 299,755 tokens (248,576 cached) · Not an approval

Verdict: NEEDS CHANGES — **1 finding: 0 [P1], 1 [P2], 0 [P3].** Prior findings assessed below: **8 CLOSED, 2 PARTIAL, 0 OPEN.**

References are to [DRAFT v3, commit `7ad9026`](docs/plans/2026-10-28-agents-main-flow.md).

| Finding | Status | v3 evidence |
|---|---|---|
| 11 — Explicit issue-closure approval | CLOSED | Lines 178–189 require specific approval for any closure, including PR keywords; scenario (h) covers automatic closure (317). |
| 12 — Restricted-skill coverage | CLOSED | R6 makes frontmatter authoritative for all 23 restricted skills and identifies the nine as a subset (77); AC2 matches (283–290). |
| 13 — Hash lifecycle | CLOSED | Exact representation, full digest, external storage, typo re-approval, material version bumps and pre-implementation comparison are defined (129–148); AC6 covers them (320–332). |
| 14 — Incorrect acceptance checks | CLOSED | Manifest comparison excludes added files; lock checks are structural; symlinks are checked (291–307). Protected sections are compared directly (341–354), and historical citations are allowed (377–384). |
| 15 — Review-evidence recursion | PARTIAL | Evidence-only commits are correctly exempted (171–177), but requiring the report to name its final evidence commit introduces another self-reference. |
| 1 — Invocation ownership | CLOSED | Blanket PO-only rule and allowed internal model-invocable calls are explicit (77); steps must state ownership and stopping points (114–119). |
| 2 — Reproducible skill availability | CLOSED | Vendoring, attribution, licence and provenance are specified (82–101); corrected clone checks cover content and links (291–302). |
| 4 — Version-bound approval | CLOSED | Approval, gate reports and tickets carry version/hash bindings; edits invalidate approval and material Critical changes require re-gating (129–148, 242–249). |
| 9 — Skill side effects | CLOSED | Separate approval covers push, PR, closure, merge and deploy; invocation grants none of these (178–195). |
| 10 — Migration and acceptance coverage | PARTIAL | Pointer migration and scenarios are addressed (108–128, 212–219, 308–332, 377–384), but AC7/AC15 remain unsatisfiable literally. |

**16. [P2] The committed report cannot contain its own final evidence-commit SHA.**

**Evidence:** Line 176 requires the report to record “the final evidence commit.” AC7 repeats this at 335, and AC15 requires the saved report to name it at 389–391.

If evidence commit `E` contains the report, inserting `E`’s SHA changes the report and creates a different commit. Adding another evidence commit merely moves the problem. The evidence-only exemption resolves repeated *review*, but cannot resolve this commit self-reference.

**Concrete fix:** Keep the base SHA, reviewed-content SHA, spec version/hash and finding outcomes inside the committed report. Record the final evidence-commit SHA **outside that commit**, such as in the completion response or an explicitly authorised PR comment. Update lines 176, 335 and 389–391 accordingly.

The other areas specifically requested are sound:

- **`.gitignore`:** Removing `.claude/` and using `/.claude/*` plus `!/.claude/skills/` permits traversal into the skills directory while ignoring settings.
- **Hash lifecycle and fixture:** The lifecycle now resolves the prior ambiguity. Local samples demonstrate repeatability and changed digests. The existing-issue portion of AC6 requires GitHub access during later verification; it was not run here.
- **Evidence exemption:** Appropriately narrow; policy changes inside a report remain reviewable (177).
- **Closure:** `Refs #n` is the prescribed fallback until closure is explicitly approved.
- **Acceptance checks:** Apart from the evidence-commit self-reference, I found no remaining check that inherently cannot pass.

Both PO requirements are **met at the policy-design level**: every implementation route passes the same versioned spec/lane/Critical-gate/approval sequence (121–148), and each listed external action needs explicit authorisation independently of skill invocation (178–195). Implementation has not yet demonstrated compliance.

**Verification**

Read v3, both prior reports, R5 evidence, local `origin/main:AGENTS.md`, ADRs, agent configuration documents, relevant installed skills, lockfile, ignore rules and installer reference.

Local checks confirmed:

- HEAD `7ad9026`; clean worktree; three commits ahead of local `origin/main`, none behind.
- 103 installed files totalling 266,243 bytes; 38 resolving relative symlinks; 23 restricted skills.
- All 38 local skill hashes match the R5 evidence’s local-hash column.
- Proposed ignore patterns distinguish settings from skill paths.
- Unchanged sample bytes hash identically; edited samples hash differently.

No network access or file edits. No installation, clone, GitHub actions or application tests. Upstream hashes/licence provenance could not be independently verified offline; the preserved evidence supplies those claims.