# Diff review: PR checks (Spec A)

> Base: `main` at `fed2005` · Reviewed: `ad06ea7` (build), `ec521e8` (round 1 fixes),
> `36ef75a` (round 2 fixes), `9636eb0` (round 3, comments only) on `feat/pr-checks`.
> `42b33b7` is the Codex gate report (evidence only). · Spec: issue #31, **Spec version: v2**,
> sha256 `bb79030bf108b7275a6c8a37739317d4a4513c7cb8744312c03e03fc16547bc4` (PO approval
> recorded on #31, 2026-10-30; the hash was rechecked before the build, and by each reviewer) ·
> Method: `code-review`, two axes · 2026-10-30

## Rounds

| Round | Diff | Axes | Result |
|---|---|---|---|
| 1 | `fed2005...ad06ea7` | Standards, Spec (parallel subagents; 89,801 and 87,037 tokens) | Standards S1–S7, Spec P1–P7 |
| 2 | `ad06ea7..ec521e8` | Standards and Spec in one subagent (90,440 tokens) | all round-1 items fixed or left for the PO; new R1–R6 |
| 3 | `ec521e8..36ef75a` | Standards and Spec in one subagent (74,903 tokens) | R1–R5 resolved; two minor comment gaps |
| 4 | `36ef75a..9636eb0` | agent check (comments only): each claim confirmed with a probe | no findings; tests 40/40 |

## Standards

| # | Finding | Kind | Outcome |
|---|---|---|---|
| S1 | The documented limits were incomplete. `ns + "." + name`, `` `${ns}.${name}` ``, a prefix held in a variable, and `+= ".title"` pass unnoticed | hard (documentation accuracy) | fixed in `ec521e8`: documented in the checker's Limits list and pinned by the limits test. R1–R3 were not widened, because that would change the spec's rejected patterns. See R6 |
| S2 | Scanner: a `/` after `++` or `--` was read as a regex, and a `/` after `await`, `else`, `throw`, `yield` or `do` as division, which hid the key typos after it | judgement (silent miss) | fixed in `ec521e8` and `36ef75a` (tests for every keyword). A `/` after `)` is a documented limit |
| S3 | Scanner: a backslash line break in a template, or the line break ending an unfinished regex, wasn't counted | judgement | fixed in `ec521e8`, and pinned by tests in `ec521e8` and `36ef75a` |
| S4 | The "missing in which languages" logic was duplicated | Duplicated Code (judgement) | fixed in `ec521e8` (`languagesWithout`) |
| S5 | The key check listed only the top level of `js/`; the syntax check went recursively | judgement | fixed in `ec521e8` (one recursive listing) |
| S6 | `AGENTS.md` said "Node 24 and 26 for every PR" twice | writing-for-agents (single source of truth) | fixed in `ec521e8`: the structure entry points to the Test line |
| S7 | The exception machinery is unused while the list is empty | Speculative Generality (judgement) | **pending PO**. The agent's view: the spec requires it ("One named list… An entry that no longer matches anything fails") |
| R1 | The test named `throw`, `yield` and `do` but didn't cover them | hard (test name) | fixed in `36ef75a` |
| R2 | The regex line-count fix had no test | hard | fixed in `36ef75a` |
| R3 | A property named like a keyword (`options.do`) was read as the keyword | judgement | fixed in `36ef75a`. `obj. do` (with a space or line break after the dot) and `this.#do` are documented limits (`9636eb0`) |
| R4 | The attribute pattern matched inside other values, and missed `DATA-I18N` and `data-i18n-x2` | judgement | fixed in `36ef75a`. The leftover extra-failure case is documented (`9636eb0`) |
| R5 | Messages printed `="key"` whatever the quoting, and one test name under-described its check | judgement | fixed in `36ef75a` |

## Spec

Hash checked in every round. Implemented as specified:
- **Workflow:** trigger, permissions, the three steps, `persist-credentials: false`, `token: ''`, `package-manager-cache: false`, pins with version comments, the 24/26 matrix, and the 5-minute timeout.
- **Checker:** parity (3 rules), page and script references, R1–R3 with near-misses, the limits, the exception list, and the per-file syntax check.
- **Export line and docs.**

| # | Finding | Spec line | Outcome |
|---|---|---|---|
| P1 | Same as S5 | "every string literal … in the site's scripts" | fixed in `ec521e8` |
| P2 | Single-quoted and unquoted `data-i18n` values were skipped | "the value of every `data-i18n` and every `data-i18n-*` attribute" | fixed in `ec521e8` |
| P3 | `fail-fast: false` in the matrix (not asked for; it makes both versions report) | "CI is green on Node 24 and Node 26" | **pending PO** |
| P4 | A one-line note in the `js/translations.js` header ("Loaded … by the checks in tests/") | "the same guarded export line" | **pending PO** |
| P5 | Example tests beyond the listed set: regex quotes, templates with no slot, an exception limited to its own file, the limits test, the regression tests | Testing Decisions | **pending PO** |
| P6 | An exception also silenced R1–R3 for its string | "for dotted strings that aren't translation keys" | fixed in `ec521e8` |
| P7 | An exception's `reason` was never checked | "Each entry gives the exact string, the file and a one-line reason" | fixed in `ec521e8` |
| R6 | The spec's "Documented limits" names 2; the checker now lists 9, including the scanner limits. This is consistent with "It never claims to catch every dynamic key", and `AGENTS.md` points to the checker's list | Implementation Decisions, Documented limits | **pending PO**: accept the difference, or a v3 of the spec |

## Tests

`node --test`: 40 tests, 40 pass, on local Node 25.9.0, which reached end-of-life on 2026-06-01, so this counts for development only.

| File | Tests |
|---|---|
| `tests/message-length.test.js` | 7 |
| `tests/checks.test.js` | 23 (example tests) |
| `tests/project-checks.test.js` | 10 (the real files) |

Red first, in order:
- parity: a missing key, blank text, placeholders;
- the real-file parity test, before the export line;
- pages: a missing key, comments, all three quote forms, and case or digits in attribute names;
- scripts: a key-shaped non-key, comments and regex quotes, templates with no slot;
- R1, R2, R3;
- an exception limited to its own file, a stale exception, and an exception with no reason;
- an exception doesn't lift R1–R3;
- the syntax check on a temporary broken file;
- the review regressions: regex or division after keywords, and the line count after a backslash line break.

Passed on first run:
- **Already covered:** pages checking every `data-i18n-*` attribute, since the first pattern was already general.
- **Real-file tests:** they pass by design, and their red cases are the example tests.
- **Pins and records:** the limits test records non-detection, and the regex line-count test pins a fix that a reviewer had shown failing on the earlier code.

Scanner check: on the real scripts with empty translations, the scanner finds 47, 15 and 2 key strings (41, 13 and 2 distinct) in `js/dashboard.js`, `js/form.js` and `js/script.js`. These match the counts in the retro review.

TDD was not applicable to the workflow file (it runs only on GitHub) or to the docs. Typechecking: not applicable.

## Manual checks (spec #31, Testing Decisions)

Done on `ad06ea7`. Later commits changed only `tests/` and one `AGENTS.md` line, so no site file changed. Method: a headless Chrome script driven through the DevTools protocol that loads the page, clicks the language buttons, and collects exceptions and `console.error`. The script itself was shown to catch a deliberate `ReferenceError`.

| # | Check | Result |
|---|---|---|
| 1 | Landing page by double-click (`file://`): English, then Arabic, then English | pass: `lang` and `dir` switch `en/ltr` → `ar/rtl` → `en/ltr`; the title and navigation text change; 0 console errors. The counter shows "Characters left: 1,000" / "الأحرف المتبقية: 1000" |
| 2 | Landing page over the local server (`python3 -m http.server 8000`), English and Arabic | pass, the same results |
| 3 | Sign-up dashboard over the local server only (HTTP-only exception, ADR-0005) | pass: text loads in English and switches to Arabic and back; 0 console errors. Signing in was not tried |

Limits:
- These checks establish page state (language, direction, text) and the absence of script errors. They don't establish appearance, layout or accessibility.
- There was no Cloudflare preview, since that would be a deployment.

## Action pins and setup-node inputs

- **Tags:** `actions/checkout` tag `v7.0.1` resolves to `3d3c42e5aac5ba805825da76410c181273ba90b1`, and `actions/setup-node` tag `v7.1.0` to `949feb2413d6458794dcd2491c4babbbce0c15c1`. Both are lightweight tags in the official repositories. The agent checked this, and the Spec reviewer checked it again in round 1. The workflow uses exactly these hashes.
- **`action.yml` at the pinned commits:**
  - setup-node has `token` (default `github.token`) and `package-manager-cache` (default `true`);
  - checkout has `persist-credentials` (default `true`).

  The workflow sets them to `""`, `false` and `false`.

## Pending until the PR runs on GitHub

- CI is green on Node 24 and Node 26.
- The actual check names. Intended: "Checks / node 24" and "Checks / node 26".
- The exact Node version each run used, taken from the run logs.

These need the branch pushed and a PR opened, which needs the PO's approval. They will be added to this report as evidence.

## Disclosures

- **Local runtime:** every local run used Node 25.9.0, which is end-of-life. The supported-version evidence will be the CI runs on 24 and 26.
- **Red runs:** the example tests prove the checker catches each kind of problem, and they run in CI too. The green runs prove CI runs and reports. Nobody watches a red run on GitHub. That rests on `node --test` exiting non-zero when a test fails (seen locally during the red steps) and on GitHub failing a step that exits non-zero.
- **Unauthenticated downloads:** with `token: ''`, setup-node's download may occasionally hit GitHub's rate limit. That would be a setup failure, not a test result. If it happens on a real PR, it is recorded as a finding (spec v2).
