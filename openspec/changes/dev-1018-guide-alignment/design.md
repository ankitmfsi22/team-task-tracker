## Files touched
- `.claude/commands/opsx/{apply,verify,propose,archive}.md`: add a marked "Project rules (SDD guide)" block, keep the generated text. propose.md: final message asks to approve proposal, design, specs and tasks.
- `openspec/config.yaml`: replace the `Approval:` waiver sentence with the Gate 1 batch-approval rule; archive = separate small PR after merge.
- `docs/decisions/ADR-000{1,2,3}-*.md` (JWT + refresh cookie, 409 INVALID_TRANSITION, Linear not Plane), max 15 lines each; linked from `AGENTS.md`.
- `README.md`: Deviations rows, "How to verify: `pnpm check:changes`", DEV-1018 status row.
- `scripts/check-changes.mjs` (+ tests): apply.md words, no "waived" in config, >=3 ADRs, two-line approvals form.
- `.claude/hooks/guard.mjs` BASH_RULES: block `\b(curl|wget)\b` (+ test in `scripts/claude-hooks.test.mjs`).
- Archived DEV-1003/1004/1005 `approvals.md`: append `proposal, design, specs and tasks approved by Ankit on 2026-10-30` in a NEW commit.
- Evidence notes inside this change: `explore-dev-1011.md`, `db-check-dev-1006.md`.

## Decisions
- Rules go INSIDE the commands so a fresh `/opsx:apply` carries them. Word checks are case-insensitive substring checks; no new dependency.
- Approvals basis (honest): Ankit replied "approved" to the Gate 1 batch summary on 2026-10-30; the first line already says "batch approval". DEV-1001/1002 stay bootstrap/waiver (no human claim); a retro line only if the user replies "approved retroactively".
- DEV-1006 adds no migration (empty `backend/prisma` diff): the db check covers the User and RefreshToken tables from the init migration and the refresh-rotation queries.
- DEV-1011 has no change folder yet: the explore note lives here and is copied to its `explore.md` (or PR body) when it is proposed. No history is invented for earlier tickets.

## Risks
- `openspec update` regenerates command files and would overwrite the blocks: check:changes catches the drift.
- DEV-1006..1010 branches fail check:changes after merging main until each adds the sentence: intended, done on their own branches.
