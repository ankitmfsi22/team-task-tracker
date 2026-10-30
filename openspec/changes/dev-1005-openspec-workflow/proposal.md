## Why
DEV-1005 (Linear DEV-9, after DEV-1002): make ticket-to-change traceability, approval gates, verify and archive checkable instead of tribal.
## What changes
- Document native `/opsx:*` commands (confirmed on OpenSpec 1.15.0), expanded profile (`openspec config profile` + `openspec update`) and the global-config note.
- `scripts/check-changes.mjs` (`pnpm check:changes`, node tests, CI verify, `pnpm test:tooling`): size limits, ticket link, approvals form, review verdict, scenario-id ticket, README status table.
- README sections: approval gates (Gate 1 batch in approvals.md, Gate 2 reviewer + CI) and archive step; CLAUDE.md pointer.
Linear: https://linear.app/team-task-tracker/issue/DEV-9
## Out of scope
New traceability docs (README status table only); changing check-scenarios.mjs. [ASSUMPTION] PENDING approvals and missing Verdict fail only with `--ready` (CI, non-draft PRs).
## Rollback
Revert the PR; only a script, tests, CI step and docs change.
