---
status: accepted
---

# Node's built-in test runner, for development only

The PO decided on 2026-10-28 that new work follows the Matt Pocock skills' main flow
(`AGENTS.md`, Workflow). Its `implement` and `tdd` skills build behaviour test-first, so
they need a way to run tests. The site has no package manager and must open by double-click
(ADR-0001), so tests use **Node's built-in runner, `node --test`, with no npm packages**.
Test files live in `tests/*.test.js` and need Node 24 or later. Node is a requirement for
developing the site, never for opening or hosting it.

Updated 2026-10-30 (spec #31): the minimum was raised from Node 20 to Node 24, because Node 20
reached end-of-life on 2026-04-30.

## Considered options

- **Playwright or another browser test framework.** It could test real pages, but it needs
  a `package.json` and installed packages, which ADR-0001 rules out.
- **No automated tests.** That keeps today's setup, but then `tdd` has nothing to drive,
  and the main flow's build step falls back to manual checks every time.

## Consequences

- The site still has no build step, no dependencies and no `package.json`, and still opens
  by double-click.
- Tests cover only logic that runs in Node. Supabase permissions, Google sign-in and page
  layout stay manual, SQL or browser checks, and the spec names them. The review records
  "TDD: not applicable" with the reason.
- Most current code runs in the browser and isn't yet reachable from Node. Restructuring it
  to create a test seam is agreed in the spec first; adopting the runner doesn't do it.
