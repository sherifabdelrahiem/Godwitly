# Vendored agent skills

These are Matt Pocock's agent skills, from
[`mattpocock/skills`](https://github.com/mattpocock/skills). They are licensed MIT; see
`LICENSE` in this folder. Attribution files that came with a skill, such as
`pr/CREDITS.md`, are kept.

- **Installed:** 2026-10-27, with the `skills` CLI. Each skill's source path and hash are
  recorded in `skills-lock.json` at the repository root.
- **Compared with upstream:** commit `a496f55` on 2026-10-29. 31 of 38 `SKILL.md` files
  were identical and 7 differed. See
  `docs/reviews/2026-10-29-agents-main-flow-r5-evidence.md`.
- **Linked:** `.claude/skills/<name>` is a relative symlink to `.agents/skills/<name>`, so
  Claude Code finds each skill.

The files are committed so every clone has exactly the skills the workflow in `AGENTS.md`
was written against. `skills-lock.json` records no upstream revision, so it can't restore
them exactly.

**Don't edit these files here.** Updating them is a normal Standard change:

1. Re-install with the `skills` CLI.
2. Review the diff.
3. Commit the files, the links and `skills-lock.json` together.
