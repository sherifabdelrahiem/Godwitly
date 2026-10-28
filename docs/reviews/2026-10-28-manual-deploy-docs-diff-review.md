# Diff review — document manual Cloudflare Pages deploys

> Reviewer: Claude (Opus 5.5), self-review · Builder: Claude (Opus 5.5) · Plan:
> `docs/plans/2026-10-28-manual-deploy-docs.md` (approved) · 2026-10-28

Self-review: documentation only, so no second-model review was run.

## Round 1: APPROVED

- **Acceptance 1:** searching `AGENTS.md` and `README.md` for claims that merging deploys
  finds only the new sentence saying it does **not**.
- **Acceptance 2:** the documented commands are the ones that produced deployment
  `833e6f11` on 2026-10-28: `git archive main index.html css js assets` into an empty folder
  (15 files), then `npx wrangler@4.153.0 pages deploy … --project-name godwitly --branch main
  --commit-hash <sha>`. That run uploaded 2 changed files and the live site then served the
  #13 and #16 text (checked with curl).
- The Cloudflare finding (no Git source, ad-hoc deployments only, latest before the fix from
  2026-10-26) came from a read-only API call to the Pages project.
- The new text keeps "ask the PO first" in both the workflow and the deploy steps, matching
  the existing "Boundaries" rule on deploying.
- No secrets: the commands rely on Wrangler's existing login and contain no tokens.

Not run: no tests or lint exist in this repo.
