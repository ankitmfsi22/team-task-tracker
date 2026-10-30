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

- reviewer: Run: pending (recorded by coordinator)
- test-writer: Run: pending (recorded by coordinator)
- db-change-checker: Run: pending (recorded by coordinator)
- security-auditor: Run: pending (recorded by coordinator)
- implementer: Run: pending (recorded by coordinator)
- coordinator: Run: pending (recorded by coordinator)
