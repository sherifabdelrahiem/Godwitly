# Plan — Document that Cloudflare Pages deploys are manual

> Status: **APPROVED** by PO · 2026-10-28 (asked in session to "add the AGENTS.md fix")
> Branch: `docs/why-preparedness-review` → PR → merge to `main`

```text
LANE: Standard — documentation only. No site, Supabase or Cloudflare changes.
```

## Problem

`AGENTS.md` says merging to `main` deploys to Cloudflare Pages. On 2026-10-28 the Pages
project `godwitly` turned out to have no Git connection: every deployment is an ad-hoc upload.
PRs #13 and #16 were merged but not live until the PO approved a manual deploy (deployment
`833e6f11`).

## Change

- `AGENTS.md` "Development commands": replace the automatic-deploy sentence with the manual
  deploy steps that were used (clean folder of site files from `main`, then
  `wrangler pages deploy`), and say to ask the PO first.
- `AGENTS.md` workflow: add step 4, deploy `main` when site files changed, with PO approval.
- `AGENTS.md` "Boundaries": drop "(merging deploys to production)".

Also on this branch: the #14 diff review, which could not join PR #16 before it was merged.

## Acceptance

- No sentence in `AGENTS.md` or `README.md` says merging deploys.
- The documented commands match the ones that produced deployment `833e6f11`.
