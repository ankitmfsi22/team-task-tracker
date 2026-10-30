# Agents setup

Six project sub-agents live in `.claude/agents/<name>.md` (frontmatter: `name`, `description`, `tools`, `model`). No agent grades its own work: the test-writer writes tests, the implementer makes them pass, the reviewer (read-only) checks the result, the coordinator persists findings.

Field names verified against the Claude Code sub-agent docs (https://code.claude.com/docs/en/sub-agents, fetched 2026-10-30): `name` and `description` required; `tools` a comma-separated string or YAML list; `model` accepts `sonnet`. The page does not document `Bash(pattern)` specifiers inside `tools`; the reviewer uses them as the ticket requires, and the guard hook and permissions stay the enforcement layer.

| agent             | scope                              | permitted actions                                              | expected output                          | restrictions                                       |
| ----------------- | ---------------------------------- | -------------------------------------------------------------- | ---------------------------------------- | -------------------------------------------------- |
| reviewer          | Fresh-context review of a change   | Read, Grep, Glob, `git diff`, `git log`, `pnpm test`           | Findings table and PASS or BLOCKING      | No Write or Edit; ignores implementer summary      |
| test-writer       | Failing tests from spec scenarios  | Read, Write, Bash                                              | Test files, one per scenario id          | Must not edit implementation; spec scenarios only  |
| db-change-checker | Prisma schema and migrations       | Read, Grep                                                     | Findings against the SDS                 | No Bash, no Write                                  |
| security-auditor  | Authz, validation, secrets in logs | Read, Grep, Bash (read-only commands)                          | Findings table and verdict               | No Write or Edit; never reads secret files         |
| implementer       | One tasks.md task at a time        | Read, Write, Edit, Grep, Glob, Bash                            | One commit per task, gates green         | Tests first; never edits specs; never pushes       |
| coordinator       | Whole ticket flow                  | Read, Write, Edit, Grep, Glob, Bash, Agent                     | review.md, stage summaries, merged PR    | One sub-agent per stage; does not implement/review |

## Evidence

One demonstrated run per agent, recorded by the coordinator.

- reviewer: 2026-10-30, retro review of DEV-1001 (c12dd3d): PASS, 4 findings, see `openspec/changes/archive/2026-10-30-dev-1001-project-setup/review.md`. Also reviewed DEV-1002 and DEV-1005 (their `review.md`).
- test-writer: 2026-10-30, wrote failing tests from spec scenarios for DEV-1002 (21), DEV-1003 (10), DEV-1004 (10), DEV-1005 (17); no implementation touched.
- db-change-checker: 2026-10-30, schema and init migration: no blockers; 3 MEDIUM (missing `Project.archivedAt`, task indexes for filters, activity index), fed into DEV-1007 to DEV-1010.
- security-auditor: 2026-10-30, `pnpm audit --audit-level=high` exit 0 (1 low, dev-only path), no secrets tracked, logging redaction and non-root images checked: PASS.
- implementer: 2026-10-30, apply stages of DEV-1002 to DEV-1005: one task group per commit, all gates green.
- coordinator: this Claude Code session ran the DEV-1002 to DEV-1010 flow, spawning one sub-agent per stage and keeping summaries only.

Honest note: these runs used general-purpose sub-agents that were told to follow the matching `.claude/agents/<name>.md` as their role. The harness did not enforce the tool lists for them. For the read-only agents (reviewer, db-change-checker, security-auditor) we confirmed afterwards that `git status` showed no file changes.
