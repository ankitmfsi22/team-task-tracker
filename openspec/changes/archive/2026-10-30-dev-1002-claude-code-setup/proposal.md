## Why
DEV-1002 (Linear DEV-6, after DEV-1001): enforce guardrails, a lean command set and layered instructions before feature work.
## What changes
- `.claude/settings.json` permissions and 3 hooks (Node, tested via `pnpm test:tooling`).
- Commands: only `/opsx:*` and new `/create-pr`.
- `docs/FRS.md`, layer `CLAUDE.md` files, skills `spec-scenario-format`, `add-endpoint`.
- Root `CLAUDE.md`, `AGENTS.md`, `openspec/config.yaml`: no-human-gate workflow (waiver on senior's instruction).
Linear: https://linear.app/team-task-tracker/issue/DEV-6
## Out of scope
Agents (DEV-1003), MCP docs (DEV-1004), approvals/archive docs (DEV-1005). [ASSUMPTION] Stop hook runs full typecheck + test.
## Rollback
Revert the PR; only config, scripts and docs change.
