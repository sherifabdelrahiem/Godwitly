# Retro — characters-left counter (first run of the AGENTS.md Workflow)

> Feature: spec #28 v1 (sha256 `d9ca7dfecba32ed832fa0bbf6f20570d1b3e94b26d648aaf5a5c9ca053cd5e82`),
> PR #30, merge commit `ebe519d`, deployed 2026-10-30 · Diff review:
> `2026-10-29-message-counter-diff-review.md` · Retro run 2026-10-30 in the same session
> (`/retro`, PO-started) · Facts below verified on `main` at `ebe519d`

## The run

| Step | What happened |
|---|---|
| 1 `/grill-with-docs` | Q1–Q16 in three rounds; no `GLOSSARY.md` change, no ADR |
| 2 Prototype | skipped (Q14) |
| 3 `/to-spec` | #28 v1 published with `ready-for-agent` |
| 4 Codex gate | not applicable (Standard) |
| 5 Approval | PO approved v1 + hash in session; `[Agent]` record on #28 |
| 6 Tickets | skipped (one session) |
| 7 `/implement` | test-first, 7 tests; red first for 4 of them |
| 8 Diff review | 3 rounds; S3, S4, R1 fixed; S1, S2, R2, P1–P3 accepted by the PO 2026-10-30 |
| 9 PR | #30 opened, merged and deployed, each with PO approval; #28 closed with approval |
| 10 Retro | this record |

## Verified facts

- **No guardrail.** No `.github/` folder (no CI), no hooks in `.git/hooks` other than
  samples, `core.hooksPath` unset. `node --test`: 7 tests, 7 pass (Node 25.9.0). The agent
  ran it by hand before each commit and push.
- **`node --check` checks one file.** `node --check good.js bad.js` exits 0; `node --check
  bad.js` exits 1. Extra paths are passed to the script as arguments, so syntax checks must
  run per file. The retro's first proposal (`node --check js/*.js`) was wrong; the PO's
  direction corrects it.
- **Translation keys.** `en` and `ar` both have 165 keys, the same set.
- **Keys used in HTML.** All `data-i18n*` keys in `index.html` (97) and `dashboard.html` (39)
  exist. A plain text search also matches the placeholder `data-i18n="..."` in each page's
  header comment; a check should ignore HTML comments structurally, not exempt that
  placeholder (PO correction, 2026-10-30).
- **Keys used in JavaScript.** No key is built from a template or string concatenation.
  Keys reach `t()` as string literals, directly, through ternaries (`t(over ? "a" : "b")`)
  or through data (`FIELDS[…].message`, `statusMessage`, `ACCESS_ERRORS`, the figures
  list in `js/dashboard.js`). Every string literal shaped `<namespace>.<name>` (namespaces
  taken from the translation keys: `meta a11y nav hero products engage learn resilience
  cards why cta form error footer dash`) exists in both languages: 41 in `js/dashboard.js`,
  13 in `js/form.js`, 2 in `js/script.js`, none elsewhere. Every translation key is
  referenced somewhere as such a literal or a `data-i18n*` value. This describes today's
  code only. It is not yet a rule for finding references: a scan for key-shaped strings
  can miss a reference or mistake an unrelated string for a key (PO correction,
  2026-10-30).
- **Browser tools.** The Chrome extension can't open `file://` pages; `resize_window` to
  320×700 left the viewport at 1,470px; the extension stopped responding (8 s timeout)
  during the post-deploy check. Headless Chrome `--dump-dom` worked for `file://` and the
  live site.
- **Review cost.** Round 1 used two subagents (Standards 68,022 tokens, Spec 67,875), round
  2 one combined subagent (60,732): about 197k tokens for a ~140-line diff.

## Workflow gaps the run hit

- **Deferred acceptance check.** Spec #28 required manual checks 1–9; the PO deferred
  check 8 (VoiceOver) to #29. The agent recorded a deferral in the diff review and the PR
  description, with no new spec version. No rule says whether that is right.
- **No-defect outcomes.** `AGENTS.md`, Diff review, allows only "fixed" or "accepted by the
  PO". S5 and S6 were checks that found no defect; the report invented "no defect".
- **Small re-reviews.** The R1 fix (one comment line, `571a9cf`) got an agent check
  recorded as round 3, not a `code-review` run. The rule "any later change … gets its own
  review" doesn't say how much review.
- **First lines of a spec Issue.** `AGENTS.md` says agent-created issues start with
  `[Agent]`; `docs/agents/issue-tracker.md` says the body's first line is `Spec version:
  vN`. The agent put `Spec version: v1` first and `[Agent]` second.

## Decisions (PO, 2026-10-30)

The PO approved the direction for future specs only. That approval covers no
implementation, no external action and no branch deletion.

1. **Spec A, retro #1 + #2: PR checks.** Run `node --test`, check each JavaScript file's
   syntax individually, and test translation key parity and coverage of referenced keys.
   The spec defines coverage for JavaScript references, and distinguishes CI running
   on a PR from checks required before merge.
2. **Spec B, retro #3 + #6: Workflow rules.**
   - Clarify how a deferred acceptance check is recorded, and that changing a required
     acceptance criterion needs a new spec version and approval.
   - Distinguish checks that found no defect from findings that need action.
   - Allow review proportionate to the change, while keeping both the Standards and Spec
     axes covered and the evidence saved.
   - Document `Spec version: vN` first and `[Agent]` second.
3. **Spec C, retro #4: browser verification.** Document the methods, the tool limits
   observed, and what each method can establish. DOM output can't establish visual or
   accessibility correctness, and 320px frames have limits.
4. **Deferred:** #5 (fingerprint-check script) and #7 (`AGENTS.md` length). **No work:**
   #8 (no no-op instructions found).

## Open questions for the specs (not decided)

- **Spec A:**
  - A reliable rule for identifying translation-key references in JavaScript and HTML, so
    that a future missing key is detected. Detecting unused keys is a separate decision.
  - The lane. Agent recommendation: Standard, since tests and CI change no personal data,
    permissions or backend. If the spec adds security-related repository settings (branch
    protection, workflow permissions, required checks), assess explicitly whether the
    Critical definition ("security") applies.
  - The feature branch for the build, and how it receives this retro record (which so far
    exists only on the local branch `docs/message-counter-retro`). Staying on that branch
    for the interview is not a build decision.
  - Which checks become required before merge? Making them required is a GitHub
    branch-protection setting, an external action.
  - Its lane: GitHub Actions runs code with repository permissions.
  - Whether the third-party `checkout`/`setup-node` actions count as a tool needing
    approval under Boundaries, and how they're pinned.
- **Spec B:** where each rule lives (`AGENTS.md` or `docs/agents/`), given #7 is
  deferred.

## Limitations of this feature's verification

- VoiceOver (check 8) untested, not passed: #29.
- **320px** was checked in a 320px frame, so the viewport inside was 318px. It wasn't a
  real narrow window or device, and touch, zoom and browser chrome were untested.
- **Pasting** was simulated by setting the value and firing `input`; there was no real
  clipboard paste.
- **Restored text** was checked in Chrome only: it was restored after Back, and Chrome
  restored nothing on reload.
- **`file://` and the live site** were checked through headless Chrome DOM output only.
  That proves the scripts ran and drew the Arabic counter text, not how the page looks.
  The live form wasn't typed in and no sign-up was sent.
- **Branches:** `feat/message-counter` remains, locally and on GitHub, because the PO
  hasn't approved deleting it.
