## Key decisions

- Agents are Markdown files with YAML frontmatter in `.claude/agents/` (Claude Code sub-agent format); verify field names with Context7 during apply.
- Least privilege via `tools`: reviewer has no Write/Edit; it cannot persist review.md, so it returns findings and the coordinator writes them. Read-only is by tool list (plus `disallowedTools`), prompt, the `.claude/settings.json` allow/deny lists and a mandatory post-run `git status --porcelain` check by the coordinator; it is not provable from the tool list alone.
- Reviewer runs in a fresh context (sub-agent), receives only the change name and base branch, never the implementer's summary; it reads `git diff main...HEAD` and runs `pnpm test` itself.
- test-writer has Write (tests only) and Bash; its prompt restricts paths to test files and forbids implementation edits. Enforcement is by prompt plus reviewer check; the guard hook is unchanged.
- db-change-checker (Read, Grep) checks Prisma schema/migrations against the SDS; security-auditor (Read, Grep, Bash) checks authz, validation, secrets in logs.
- implementer: one task per commit, tests first, runs gates, never edits spec files.
- coordinator: one sub-agent per stage, keeps only summaries, writes review.md from reviewer output.
- Spec scenarios are tested by a node test (`scripts/claude-agents.test.mjs`, run by `pnpm test:tooling`) that parses frontmatter and asserts file contents, like DEV-1002.
- "One demonstrated run per agent" is recorded in the Evidence section of AGENTS-SETUP.md with command/output excerpts; the DEV-1001 retro review.md is the reviewer's run.
- Retro DEV-1001 is written directly into the archive folder (no active change), dated 2026-10-30.
