## Why
Our commands and docs drifted from `docs/reference/SDD-GUIDE.md`: apply lacks the test-writer/reviewer rules, config says the human gate is waived, approvals do not say what was approved, decisions and evidence are missing.
## What changes
- `.claude/commands/opsx/{apply,verify,propose,archive}.md`: guide rules inside the commands; propose ends by asking to approve all four artifacts.
- `openspec/config.yaml`: drop the "waived" line; archive = separate small PR after merge. 3 ADRs in `docs/decisions/` linked from `AGENTS.md`; README deviations + "How to verify".
- Approvals name what was approved: sentence added to archived DEV-1003/1004/1005 `approvals.md` (new commit); open DEV-1006..1010 later on their own branches.
- Guard hook blocks curl/wget. Evidence: one `/opsx:explore` on DEV-1011; db-change-checker on DEV-1006's DB surface (it adds no migration).
- `pnpm check:changes` enforces all of it (+ tests in `scripts/`). DEV-1001/1002 stay honest (no human claim).
Linear: https://linear.app/team-task-tracker/issue/DEV-22 (assignment DEV-1018)
## Out of scope
Code of open branches (DEV-1006 to DEV-1010, PRs #7 to #11); merging. [ASSUMPTION] Linear DEV-22 is blocked by DEV-1014/DEV-1017; this runs early on the user's instruction.
## Rollback
Revert the PR; only commands, config, docs, a hook rule and a script change.
