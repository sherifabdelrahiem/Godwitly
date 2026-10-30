# Review — message counter retro record

> Base: `main` at `ebe519d` · Reviewed: `7494af1` on `docs/message-counter-retro` (adds only
> `docs/reviews/2026-10-30-message-counter-retro.md`) · No spec Issue: the "spec" is
> `.claude/skills/retro/SKILL.md`, `AGENTS.md` Workflow → Retro, and the PO's retro decisions
> and corrections of 2026-10-30 · Method: one `code-review` subagent covering both axes, as the
> PO decided (Spec A interview, Q31), 94,263 tokens · 2026-10-30
>
> The PO chose a short review under the current rules instead of assuming the evidence-only
> exemption (Q23). The retro record is a historical record and stays unchanged. Factual
> corrections are documented here. Every finding stays open until it is fixed or the PO
> explicitly accepts it.

## Standards

| # | Line | Finding | Kind | Correction / evidence | Outcome |
|---|---|---|---|---|---|
| S1 | 33 | "All `data-i18n*` keys in `index.html` (97) and `dashboard.html` (39) exist" counts raw text-search hits. Each figure includes the `data-i18n="..."` placeholder in the page's header comment, which isn't a key | wrong fact | Outside HTML comments: **96** references in `index.html` (85 distinct keys) and **38** in `dashboard.html` (36 distinct), all present in both languages. The agent re-checked this (perl strips comments, then grep). The reviewer counted 86 and 37 distinct keys, probably by a different method | open: pending PO |
| S2 | 42–43 | The JS figures 41, 13 and 2 are distinct literals, while the HTML figures are occurrences. The record doesn't say which | judgement | Occurrences: 47 in `js/dashboard.js`, 15 in `js/form.js`, 2 in `js/script.js` (reviewer's count) | open: pending PO |
| S3 | 18 | "red first for 4 of them" | wrong fact | **3** of the 7 tests went red first: missing module, trimming, emoji (`2026-10-29-message-counter-diff-review.md`, Tests; PR #30) | open: pending PO |
| S4 | 105 | "Its lane: GitHub Actions runs code with repository permissions" is left over from before the corrections of `7494af1`, and repeats the corrected lane bullet at lines 96–99 | judgement (duplicated content) | `git diff 3476a6d 7494af1` | open: pending PO |
| S5 | 122 | "no sign-up was sent": the glossary term is "Launch sign-up" | judgement (glossary) | `GLOSSARY.md`, Launch | open: pending PO |
| S6 | — | Secrets and personal data | check | Nothing found (searched for `@`, password, secret, `sb_`, `eyJ`) | no action needed |

### Fact check

| Claim in the record | Verified? | Evidence |
|---|---|---|
| No `.github/`, hooks only `*.sample`, `core.hooksPath` unset | yes | `git ls-tree main`, `ls .git/hooks`, `git config` |
| `node --test`: 7 tests, 7 pass, Node 25.9.0 | yes | run locally (Node 25 reached end-of-life on 2026-06-01) |
| `node --check good bad` exits 0; `bad` alone exits 1 | yes | temporary files outside the repo, since deleted |
| `en`/`ar` both 165 keys, the same set | yes | loaded with `new Function` |
| HTML counts 97/39 and "all exist" | **no** | S1 |
| The placeholder sits inside each page's header comment | yes | `index.html:13`, `dashboard.html:21` |
| JS 41/13/2, none elsewhere, all exist | yes, as distinct literals | S2 |
| No key built from a template or concatenation; every key referenced | yes | every `t(` argument inspected; 0 unused |
| Spec #28 hash, label, approval record, closed; PR #30 merged as `ebe519d`; #29 open | yes | `gh issue view`, `gh pr view`, `shasum -a 256` |
| Diff review: 3 rounds; S3, S4, R1 fixed; S1, S2, R2, P1–P3 accepted 2026-10-30 | yes | diff review lines 11–38 |
| R1 is one comment line (`571a9cf`) | yes | +1 comment line, +1 blank line |
| Red first for 4 | **no** | S3 |
| No `GLOSSARY.md` or ADR change | yes | `git diff 4dfc14a ebe519d` |
| ~140-line diff; ~197k review tokens (68,022 + 67,875 + 60,732) | yes, mostly | 130 lines added, 12 removed; the sum is 196,629. All three figures appear in the session transcript, but which figure belongs to which axis wasn't checked |
| `resize_window` 320×700 left the viewport at 1,470px | yes | session transcript |
| `file://` blocked in the Chrome extension; headless `--dump-dom` used | yes | session transcript |

## Spec

| # | Finding | Requirement | Outcome |
|---|---|---|---|
| P1 | Partial: the record defines only candidates #5, #7 and #8. It never lists what #1–#4 and #6 were, or their order of severity, except through the specs they became | `retro` skill: "Present these candidates to the user, in order of severity" | open: pending PO |
| P2 | Partial: it never names where the suggestions enter the Workflow. Specs A–C imply step 3, but the record doesn't say so | `AGENTS.md`, Retro: suggestions "enter this Workflow at step 1 or 3" | open: pending PO |
| P3 | Misleading: the left-over "Its lane" bullet (S4) reads as a second reason for the lane, one the PO didn't give | PO correction: Standard unless security-related repository settings are added | open: pending PO |
| P4 | Goes beyond what was decided: the open questions assume GitHub Actions (`checkout`/`setup-node`), but the PO decided only to "distinguish CI execution from mandatory merge checks". The agent notes the line sits under "Open questions (not decided)", so it doesn't claim a decision | PO decision 1 | open: pending PO |
| P5 | Small addition: "Staying on that branch for the interview is not a build decision" adds a little to the PO's branch correction | PO correction on the branch | open: pending PO |
| P6 | Decisions 1–5 and the other corrections are recorded faithfully, and nothing is stated as approved beyond specs | PO decisions, 2026-10-30 | no action needed |

## Verification limits

- The Cloudflare deploy date wasn't checked (it needs wrangler with authentication).
- The 8-second extension timeout and "ran it by hand before each commit and push" weren't
  found in the transcript.
- Approvals given only in the session can't be checked on GitHub. The records on #28 and PR
  #30 can.
- This review covers the record as written on 2026-10-30. The Spec A interview of the same day
  has since answered most of its open questions; the record isn't updated for that.
