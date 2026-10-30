Spec: #31 · Spec version: v1 · sha256 07fc46171bc7a7e77fc640057a20297901f31538b7da4fe7bf3304587b9fa41e

# Codex spec gate: PR checks (Spec A)

> Reviewer: Codex (`codex exec --sandbox read-only`, codex-cli 0.163.0) · Spec: issue #31 v1,
> the body exactly as `gh` prints it (hash re-checked by Codex) · Lane: Critical, with a
> proportionate gate agreed by the PO (Spec A interview, Q24) · 2026-10-30 · Not an approval

## Round 1

Verdict: **FAIL** — 1 P1, 2 P2, 0 P3

1. **[P1] "A PR can't use CI to change the repository or leak anything" claims more than the
   design protects.** A `pull_request` run uses the PR's own version of the workflow. A PR
   from a branch of the same repository can edit the workflow, ask for wider permissions or
   name secrets. So the `contents: read` line in that same file is not a fixed ceiling. Fork
   protection also depends on repository settings, which Codex didn't inspect. **Fix:**
   - limit the guarantee to the workflow as specified;
   - state that people with write access are trusted, and that an edit to the workflow needs
     a security review;
   - state that fork protection depends on the GitHub settings.

   No repository setting has to change just to disclose this.
2. **[P2] `setup-node`'s defaults contradict "no other step uses the token", and caching is
   left implicit.** Its `token` input defaults to `github.token`, and it caches
   automatically when package metadata turns caching on. **Fix:**
   - set `token: ''` and `package-manager-cache: false`;
   - leave `cache` and `registry-url` unset, and supply no `NODE_AUTH_TOKEN`;
   - check these inputs against the pinned revision.
3. **[P2] Pinning the actions doesn't pin the Node download, and doesn't guarantee the latest
   patch.**
   - Asking for a major version can use a version already in the runner's tool cache, so
     without `check-latest: true`, "each run gets the latest patch" isn't supported.
   - Node is downloaded at run time from `actions/node-versions` or nodejs.org, outside the
     commit pin.

   **Fix:**
   - disclose and accept this run-time supply-chain dependency;
   - distinguish the offline checker from the networked setup;
   - either require `check-latest: true` or describe the result as "a matching available
     version".

   Codex calls pinning the Node downloads themselves disproportionate for this scope.

Other gate checks (Codex):

- **Trigger:** `pull_request` into `main` only, with no `push` and no `pull_request_target`,
  is appropriate. The default event types (opened, synchronize, reopened) re-run the checks
  when a PR is updated.
- **Permissions:**
  - workflow-level `contents: read` with no wider job override, and `persist-credentials:
    false` on checkout, are appropriate;
  - no step exports the token, uploads artifacts or logs credentials (setup-node: see
    finding 2).
- **Actions:** full commit pins, version comments, and checks against the official release
  tags are sound. The check belongs in the build, not as a fourth CI step.
- **Checker:** it needs no network and no outside code. Loading the translations runs the
  PR's own code, which is an inherent and acceptable CI boundary.
- **Export line:** it is harmless, because nothing collides with `module`.
  - The existing guard is at `js/message-length.js:16–17`.
  - The translations load before the scripts that use them, and before the dashboard's CDN
    script (`index.html:410–417`, `dashboard.html:199–208`).
  - The CSP in `_headers` permits it unchanged.
- **Check names:** plausible. Recording the actual names before #32 is right, and the names
  shown on screen mustn't be assumed to equal the selectable required-check names.
- **Consistency:** no other inconsistency found.

Verification (Codex):
- **Read:** the full spec, `AGENTS.md`, `README.md`, ADRs 0001–0006, the scripts, both pages,
  `_headers` and the tests.
- **Online:** it reached the official GitHub docs.
- **Not checked by Codex:** the action hashes, the tag mappings and the Node release
  status.
- **Not run:** no browser, CI or checker tests. No files changed.

### Facts checked by the agent (not by Codex)

- **Action pins:** in the official `actions/*` repositories, tag `v7.0.1` of `actions/checkout`
  resolves to commit `3d3c42e5aac5ba805825da76410c181273ba90b1`, and tag `v7.1.0` of
  `actions/setup-node` to `949feb2413d6458794dcd2491c4babbbce0c15c1`. Both are lightweight
  tags that point at the commit directly.
- **`action.yml` at the pinned setup-node commit:**
  - `token` defaults to `github.token`, which it uses to "pull node distributions from
    node-versions";
  - `package-manager-cache` defaults to `true`, and turns caching on only when a
    `package.json` names npm. This repository has no `package.json`.
  - `check-latest` defaults to `false`.

  This confirms findings 2 and 3.
- **`action.yml` at the pinned checkout commit:** `persist-credentials` defaults to `true`, so
  the spec's explicit `false` is needed.
- **Repository settings, read with the GitHub API:**
  - the only collaborator is the PO (admin);
  - default workflow permissions are `read`, and Actions can't approve pull requests;
  - fork PR runs need approval for first-time contributors;
  - 0 Actions secrets, 0 variables, 0 environments;
  - the repository is public, and forking is allowed.

  These are relevant to finding 1.
- **Node release status** (Node.js release schedule, 2026-10-30): Node 24 is long-term
  support (Maintenance) until 2028-04-30; Node 26 is Active long-term support since
  2026-10-28, until 2029-04-30.

### Outcomes

All three were fixed in **v2** of #31 (2026-10-30), as the PO decided in G1–G3; see round 2.

## Round 2

Spec: #31 · Spec version: v2 · sha256 bb79030bf108b7275a6c8a37739317d4a4513c7cb8744312c03e03fc16547bc4

> Same reviewer and command. Codex diffed v2 against v1 itself and recomputed the v2 hash, which
> matched. The first attempt lost its network connection partway through (DNS failures from
> 14:49 UTC) and produced no output. The agent stopped it and ran the same prompt again on the
> same v2 body. Only the second attempt counts.

Verdict: **PASS** — 0 P1, 0 P2, 0 P3

Round 1 findings:

- **P1 (G1): resolved.** User story 11 limits the protection to the workflow as specified. The
  Lane assessment trusts people with write access, requires a security review of any workflow
  edit, and treats the repository settings as dated observations.
- **P2 (G2): resolved.** v2 sets an empty token and turns automatic caching off, with no
  `cache`, `registry-url` or `NODE_AUTH_TOKEN`, and requires these inputs to be checked.
- **P2 (G3): resolved.** "A matching major" replaces the latest-patch claim. The run-time
  download is disclosed separately from the action pins, and the actual CI versions must be
  recorded.

No new findings.

Other gate checks (Codex):

- **Fork protection:** GitHub documents that a fork's run gets a read-only token and no
  secrets. Approving a first-time contributor's run lets it execute, without granting write
  permissions or secrets. The spec's wording on settings is accurate.
- **"No token":** it means no token supplied, persisted or used by the later specified steps.
  It doesn't mean GitHub's job token is destroyed.
- **Setup-node at the pinned commit** (`src/main.ts`):
  - with an empty `token` it sends no authentication, and doesn't fall back to `github.token`;
  - an explicit `false` turns automatic caching off.
- **Rate limits:** the warning is reasonable, as a *possible* setup failure. A version in the
  runner's cache needs no download, and a failed download from GitHub falls back to nodejs.org
  (`official_builds.ts:57–117` at the pinned commit).
- **Pinning:** action pinning is correctly kept apart from pinning the Node download.
- **Checker:** "offline" is a constraint on how it is built, not network isolation against
  malicious PR code.
- **Export line and CSP:** no change is needed. The guard uses `typeof module`, which is safe
  when `module` is absent, and the dashboard's `script-src 'self'` allows the external script.
- **Check names and consistency:** the names stay provisional until seen on GitHub, and the
  acceptance checks and Changes match G1–G3. No contradiction found.

Verification (Codex):
- **Read:** both bodies and their diff, the repository docs and ADRs, the export pattern, the
  script references, the CSP, and the pinned action source and GitHub docs.
- **Not checked by Codex:** the API observations about the repository, the tag-to-hash
  mapping, the Node dates, and the live Issue body. The agent checked these, as recorded in
  round 1.
- **Not run:** no build, CI or browser checks, since this is a spec gate.

### Outcome

The gate passes on **#31 v2** (sha256 `bb79030bf108b7275a6c8a37739317d4a4513c7cb8744312c03e03fc16547bc4`).
This isn't an approval. Approval is the PO's, and binds one version and its hash (`AGENTS.md`,
Workflow, step 5).
