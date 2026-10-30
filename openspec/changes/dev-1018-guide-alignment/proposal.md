## Why
Our commands and docs drifted from `docs/reference/SDD-GUIDE.md`: the apply command does not carry the test-writer/reviewer rules, config still says the human gate is waived, and decisions are undocumented.
## What changes
- `.claude/commands/opsx/{apply,verify,propose,archive}.md`: add the guide rules inside the commands (test-writer first, commit per task, reviewer in fresh context writes `review.md`, clean `git status`, `approvals.md`, archive keeps both files).
- `openspec/config.yaml`: drop the stale "waived" line; archive rule = separate small PR after merge.
- `docs/decisions/`: 3 short ADRs linked from `AGENTS.md`. README: deviations, "How to verify".
- `pnpm check:changes` enforces the above (+ tests in `scripts/`). DEV-1001/1002 approvals stay honest (no human claim).
Linear: https://linear.app/team-task-tracker/issue/DEV-22 (assignment DEV-1018)
## Out of scope
Code of open branches (DEV-1006 to DEV-1010, PRs #7 to #11); merging. [ASSUMPTION] Linear DEV-22 is blocked by DEV-1014/DEV-1017; this runs early on the user's instruction.
## Rollback
Revert the PR; only commands, config, docs and a script change.
