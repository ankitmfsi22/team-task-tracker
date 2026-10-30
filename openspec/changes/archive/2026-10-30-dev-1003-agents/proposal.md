## Why
DEV-1003 (Linear DEV-7, after DEV-1002): independent implementation, testing, review and coordination agents so no agent grades its own work.
## What changes
- `.claude/agents/`: reviewer, test-writer, db-change-checker, security-auditor, implementer, coordinator (frontmatter name/description/tools/model).
- `docs/AGENTS-SETUP.md`: one page, table per agent plus one demonstrated run each.
- `/opsx:apply` guidance (`openspec/config.yaml`, `CLAUDE.md`): test-writer first, one commit per task.
- Retroactive record for DEV-1001 (archive folder, approvals.md, reviewer-written review.md against c12dd3d).
Linear: https://linear.app/team-task-tracker/issue/DEV-7
## Out of scope
Feature code, hooks changes, MCP docs (DEV-1004). [ASSUMPTION] agent model is `sonnet`; the ticket's "tester" is named test-writer.
## Rollback
Revert the PR; only agent definitions, config and docs change.
