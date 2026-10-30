# Retro: PR checks (Spec A, #31 v2)

> Feature: spec #31 v2 (sha256 `bb79030bf108b7275a6c8a37739317d4a4513c7cb8744312c03e03fc16547bc4`),
> Critical lane. PR #34, merge commit `1826395826662017cb98fb955ea5f54ce9869ae1`; #31 closed with the
> PO's approval. Not deployed. · Reports: `2026-10-30-pr-checks-spec-gate.md`,
> `2026-10-30-pr-checks-diff-review.md` · Retro run on 2026-10-30 in the same session (`/retro`, started
> by the PO) · Facts checked on `main` at `1826395`, on GitHub and in the session

## The run

| Step | What happened |
|---|---|
| 1 `/grill-with-docs` | Q1–Q32 in four rounds; no `GLOSSARY.md` change and no new ADR (ADR-0006 edited in place) |
| 2 Prototype | none |
| 3 `/to-spec` | #31 v1 published with `ready-for-agent`; follow-up #32 published with `needs-triage` |
| 4 Codex gate | v1 FAIL (1 P1, 2 P2) → PO decisions G1–G3 → v2 → PASS (0/0/0). The first attempt at round 2 stalled on a network loss and was run again |
| 5 Approval | the PO approved v2 and its hash; `[Agent]` record posted on #31 |
| 6 Tickets | none (one session) |
| 7 `/implement` | test-first. Retro record PR #33 merged first (`fed2005`), then `feat/pr-checks` was created from `main` |
| 8 Diff review | 4 rounds; all findings fixed or accepted by the PO on 2026-10-30 |
| 9 PR | #34 pushed, opened and merged with the PO's approval; CI green on both versions. #31 closed with approval |
| 10 Retro | this record |

## Verified facts

- **CI.** The runs on PR #34 were 41087382861 (on `cc14e44`) and 41087559082 (on `1c93af2`).
  - Job `node 24` ran v24.22.1, from the runner's tool cache; the newest 24 is 24.22.2.
  - Job `node 26` ran v26.13.0, downloaded without a token from `actions/node-versions`, with no rate-limit messages.
  - Each passed 40 of 40 tests.
  - The job token had `Contents: read` and `Metadata: read`.
- **Check names.** The check-runs API records **`node 24`** and **`node 26`**. The spec's intended "Checks / node 24" and "Checks / node 26" are only how the PR page shows them. An `[Agent]` comment on #32 records this, and its body is unchanged.
- **Merge.** `1826395` has the same files as the CI-tested head `1c93af2`. The workflow doesn't run on pushes to `main`, so the merge commit got no run of its own.
- **Review cost.**

  | Review | Tokens |
  |---|---|
  | Round 1 (Standards, Spec) | 89,801 + 87,037 |
  | Round 2 | 90,440 |
  | Round 3 | 74,903 |
  | Total | 342,181 |

  That was for a diff of about 1,000 lines. Almost every finding after round 1 was in the hand-written JavaScript scanner in `tests/checks.js`. The earlier retro-record review cost 94,263 tokens. Codex token use wasn't recorded.
- **Codex stall.** The first attempt at round 2 logged DNS failures from 14:49 UTC, then "waiting for network", and it didn't exit. The PO noticed before the agent did.
- **Local runtime.** Every local run used Node 25.9.0, which reached end-of-life on 2026-06-01. `node --test tests/` fails on Node 25 (the folder is taken as a file), while plain `node --test` works.
- **PO-only skills.** `/to-spec` and `/implement` reached the agent as pasted text, or with a leading space, rather than as slash commands. The agent first declined `/to-spec`, then started it through the Skill tool on the PO's second paste.
- **Gate report placement.** The Codex gate report stayed untracked, with a copy in the scratchpad, from the gate until `feat/pr-checks` existed. Its first commit there was `42b33b7`.
- **Live site.** The live site still serves the old `js/translations.js`, without the export line. That's harmless (the browser ignores the line), but `main` and the live site differ until the next deploy.

## Candidates (as presented, most severe first)

1. **Automated checks: nothing guards the workflow's security settings.** *(High; mechanical)*
   - **What it rests on:** Spec A's trust model depends on a few lines of `checks.yml`:
     - `pull_request` only;
     - `contents: read`;
     - exactly two actions, each pinned to a 40-character hash;
     - `persist-credentials: false`, `token: ''` and `package-manager-cache: false`.

     Today only a human reviewer would notice if one were dropped or loosened.
   - **Proposed:** a workflow guard test that reads the YAML as text and fails on any change to those settings or on an unpinned `uses:`.
   - **What it can't do:** stop someone with write access who also edits the test. It does catch accidental weakening and makes a change visible in review.
   - **Lane:** Critical (security).
2. **Information: #32 named the wrong check names.** *(High; small)*
   - **The problem:** it said "Checks / node 24" and "Checks / node 26", but GitHub records `node 24` and `node 26`. A rule built from #32 as written would select checks that never report.
   - **Proposed:** an `[Agent]` comment on #32 with the real names and evidence.
3. **Tool economy and information: the Codex gate has no timeout or watchdog, and each prompt is improvised.** *(Medium)*
   - **The problem:** a lost network left `codex exec` on "waiting for network" with no error and no exit. Each round's prompt was written from scratch in the session scratchpad, which is gone after the session.
   - **Proposed:** a short gate how-to in `docs/agents/`, pointed to from Workflow step 4, covering:
     - a prompt template (spec path and hash, scope, P1/P2/P3 verdict format, and "say 'not verified by Codex'");
     - running `codex exec` under a `timeout`;
     - checking the log for `waiting for network` before trusting a result;
     - the rule that only a completed run counts.
4. **Workflow gaps this run hit.** *(Medium)*
   - **(a) Starting PO-only skills.** `AGENTS.md` says such a skill is started "only by the PO, with its slash command". It doesn't say whether the PO's explicit request in a message, pasted or with a leading space, counts.
   - **(b) Spec edits before approval.** When a gate finding changes a published spec before approval, it becomes a new version. This was agreed in the Spec A interview (Q25), but `AGENTS.md` doesn't say it.
   - **(c) Gate reports before the build branch exists.** Nothing says where a Critical gate report lives until the build branch is created.
   - **(d) Standalone evidence PRs.** The evidence-only exemption covers commits during a feature's re-review, not a separate evidence PR, so the earlier retro record needed a short review.
5. **Spec C: a reusable headless browser check.** *(Medium)*
   - **The problem:** the Chrome extension can't open `file://`.
   - **What worked:** a roughly 80-line script driving Chrome's DevTools protocol loaded each page, clicked the language buttons, and collected exceptions and `console.error`. Before it was relied on, it showed it caught a deliberate `ReferenceError`.
   - **What it establishes:** language, direction, text and script errors, but not appearance, layout or accessibility.
6. **Tool economy: about 342k review tokens, mostly on the scanner.** *(Low to medium)*
   - **Levers:**
     - review sized to the change (already planned for Spec B);
     - for scanner changes, a targeted adversarial probe instead of a full two-axis re-run.
7. **Information: the local Node runtime is end-of-life.** *(Low)*
   - **Proposed:** a one-line `.node-version` file containing `24`, which version managers and `setup-node` could both read. Installing Node 24 locally would stay up to the PO.

The text above matches the candidates as presented in the session. The PO said the copy Codex received was cut short in #3–#5 and #7. The agent's original was intact, so the text here comes from that original.

## Decisions (PO, 2026-10-30)

The PO approved this direction and the agent's two additions. It covers no implementation, no push, PR or deploy, and no branch deletion.

1. **#1:** no standalone Spec A2 for now. The workflow guard proposal is kept for consideration during #32's interview, without widening #32 yet.
2. **#2:** the `[Agent]` comment on #32 with the actual check names and an evidence link was approved, with the body left unchanged. It was posted on 2026-10-30.
3. **Spec B inputs:** #3, #4 (a)–(d), and the review-efficiency concerns in #6. Recording them doesn't widen Spec B: its interview decides its scope.
4. **Spec C input:** #5. The browser script is kept below as experimental supporting material, as a fenced code block (the agent's first addition). It isn't added to the project checks.
5. **Deferred:** #7 (Node configuration changes).
6. **Before any future PR for this record:** apply the current review rules (the agent's second addition). The gap in #4 (d) is still open.
7. **This record:** saved on the local branch `docs/pr-checks-retro`, created from `main`. No push or PR yet.

## Supporting material for Spec C (experimental)

> Experimental: not a project check, and not run by `node --test`. It is kept inside this record
> (not as a file in `js/` or `tests/`) so the syntax check doesn't sweep it up and nothing runs it
> by accident. Assumptions: macOS Chrome at its default path, local Node 22 or later (for the built-in
> `WebSocket` and `fetch`), and DevTools port 9333. Usage: `node lang-switch-check.mjs <url>`.
> - **Establishes:** the page's `lang` and `dir` and some sample text, at load and after clicking
>   each language button, plus exceptions and `console.error` messages.
> - **Doesn't establish:** appearance, layout or accessibility.
>
> Copied unchanged from the session scratchpad (sha256 of the original file
> `2343f169822b5d412c403d34ffaa8bad305500f570011b70464ed4f4fa9a9fae`).

```js
// Opens a page in headless Chrome (DevTools protocol), clicks the language
// buttons and reports the page language, a sample text and console errors.
import { spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const [url] = process.argv.slice(2);
const chrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const profile = mkdtempSync(join(tmpdir(), "lang-check-"));
const proc = spawn(chrome, ["--headless=new", "--disable-gpu", "--no-first-run", `--user-data-dir=${profile}`, "--remote-debugging-port=9333", "about:blank"], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

try {
  let target;
  for (let n = 0; n < 50 && !target; n++) {
    await sleep(200);
    try {
      const list = await (await fetch("http://127.0.0.1:9333/json")).json();
      target = list.find((t) => t.type === "page");
    } catch {}
  }
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener("open", r));
  let id = 0;
  const pending = new Map();
  const errors = [];
  ws.addEventListener("message", (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) pending.get(msg.id)(msg.result);
    if (msg.method === "Runtime.exceptionThrown") errors.push(msg.params.exceptionDetails.exception?.description || msg.params.exceptionDetails.text);
    if (msg.method === "Runtime.consoleAPICalled" && msg.params.type === "error") errors.push(msg.params.args.map((a) => a.value || a.description).join(" "));
  });
  const send = (method, params = {}) => new Promise((r) => { const n = ++id; pending.set(n, r); ws.send(JSON.stringify({ id: n, method, params })); });
  const evaluate = async (expression) => (await send("Runtime.evaluate", { expression, returnByValue: true })).result.value;

  await send("Runtime.enable");
  await send("Page.enable");
  await send("Page.navigate", { url });
  await sleep(2500);
  const state = () => evaluate(`JSON.stringify({ lang: document.documentElement.lang, dir: document.documentElement.dir, title: document.title, sample: (document.querySelector('[data-i18n="nav.products"],[data-i18n="dash.title"],h1') || {}).textContent?.trim() })`);
  console.log("load    ", await state());
  await evaluate(`document.querySelector('.lang-switch__btn[data-lang="ar"]').click()`);
  await sleep(500);
  console.log("click ar", await state());
  await evaluate(`document.querySelector('.lang-switch__btn[data-lang="en"]').click()`);
  await sleep(500);
  console.log("click en", await state());
  console.log("console errors:", errors.length ? errors : 0);
  ws.close();
} finally {
  proc.kill();
  await sleep(300);
  rmSync(profile, { recursive: true, force: true });
}
```

## Limits of this record

- **Codex tokens:** the token use of the two Codex rounds wasn't recorded.
- **Truncation:** the agent didn't see the cut-short copy Codex received. The candidates above come from the agent's own original.
- **The script's results:** they were seen in this session only (Chrome on macOS, 2026-10-30) and were not repeated on another machine or browser.
