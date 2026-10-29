# R5 evidence — can the skills be restored exactly from `skills-lock.json`?

> Collected by the agent on 2026-10-29, read-only (nothing installed). Supports plan
> `docs/plans/2026-10-28-agents-main-flow.md` decision R5 = (b).

## Sources

- **Local install:** `.agents/skills/` (installed 2026-10-27), with `.claude/skills/<name>`
  as relative symlinks into it. `skills-lock.json` is version 1, with 38 entries. Each
  entry has `source` (`mattpocock/skills`), `sourceType` (`github`), `skillPath` and
  `computedHash`. **No commit, tag or version** is recorded.
- **Installer:** CLI reference `vercel-labs/skills` `docs/commands.md`
  (read 2026-10-29 with `gh api`), section "Restore skills from the project lock file".
  It says `npx skills experimental_install`:
  - is **experimental**;
  - restores from the recorded sources;
  - with `--frozen-lockfile`, exits 1 when content differs from the recorded hash;
  - does **not** create agent-specific links (`.claude/skills`).
- **Upstream:** `mattpocock/skills` at commit `a496f5513d4a4cf889bc48e189e579f4b0bdf6aa`
  (`main` on 2026-10-29). It is licensed MIT.

## Upstream licence (as at that commit)

```text
MIT License

Copyright (c) 2026 Matt Pocock

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## Installed `SKILL.md` vs upstream at that commit

31 identical and 7 different. "SHA-256" is of the `SKILL.md` file bytes, first 12 hex
characters. These are plain file hashes, not the lock file's `computedHash`.

| Skill | Upstream `SKILL.md` | Local SHA-256 | Upstream SHA-256 |
|---|---|---|---|
| ask-matt | same | 1371f5ce005d | 1371f5ce005d |
| chief-of-staff | DIFFERENT | a187d9e36e65 | d13f3a542a46 |
| claude-handoff | same | 79357a18425d | 79357a18425d |
| code-review | DIFFERENT | 09eb147f793e | 9c921a8d8813 |
| codebase-design | same | 2c20617f87ec | 2c20617f87ec |
| diagnosing-bugs | same | 849198df88cd | 849198df88cd |
| domain-modeling | same | 7b925d7b1e34 | 7b925d7b1e34 |
| git-guardrails-claude-code | same | 69b291d65562 | 69b291d65562 |
| grill-me | same | caaf8b8de168 | caaf8b8de168 |
| grill-with-docs | same | 7de372c13488 | 7de372c13488 |
| grilling | DIFFERENT | befdff1e27a1 | a146842ed93c |
| handoff | same | 4cbb043950da | 4cbb043950da |
| implement | same | 483bdc4ccf4a | 483bdc4ccf4a |
| implement-spec | DIFFERENT | 7a22dd2e60b8 | 1993a473cec4 |
| improve-codebase-architecture | DIFFERENT | 552240a5ab5c | 35b03a3db61e |
| loop-me | same | e44d1cc3e760 | e44d1cc3e760 |
| migrate-to-shoehorn | same | de4da4c11d92 | de4da4c11d92 |
| pr | same | ab63f1cf7864 | ab63f1cf7864 |
| prototype | same | 714de632d116 | 714de632d116 |
| research | DIFFERENT | 985569f15739 | 1f629e18ab89 |
| retro | same | 33fbc28568e3 | 33fbc28568e3 |
| scaffold-exercises | same | 75f5c9d77160 | 75f5c9d77160 |
| setup-matt-pocock-skills | same | b01e05bfe8c3 | b01e05bfe8c3 |
| setup-pre-commit | same | c9819d7f1e3b | c9819d7f1e3b |
| setup-ts-deep-modules | same | 29acca66ac99 | 29acca66ac99 |
| tdd | same | 5505d25bbaa8 | 5505d25bbaa8 |
| teach | same | 550482c2d674 | 550482c2d674 |
| to-questionnaire | same | b5eb929842ee | b5eb929842ee |
| to-spec | same | 43ad9cf318e5 | 43ad9cf318e5 |
| to-tickets | same | 56ec23c5b278 | 56ec23c5b278 |
| triage | same | 917b0baf74be | 917b0baf74be |
| wait-what | same | d961bb37defd | d961bb37defd |
| wayfinder | DIFFERENT | 9be7b478c389 | 0c9fa96791ae |
| wizard | same | bdf31d48211e | bdf31d48211e |
| writing-beats | same | a96abafa2372 | a96abafa2372 |
| writing-for-agents | same | 551adca94222 | 551adca94222 |
| writing-fragments | same | 298b0edd23df | 298b0edd23df |
| writing-shape | same | f5e6c57bdd85 | f5e6c57bdd85 |

Re-run: for each lock entry, `gh api "repos/mattpocock/skills/contents/<skillPath>?ref=a496f55…"`
and compare its decoded content with `.agents/skills/<name>/SKILL.md`.
