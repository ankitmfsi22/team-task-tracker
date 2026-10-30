## 1. Tests first (test-writer agent)
- [ ] 1.1 Write failing tests S-DEV1018-01..25 (`scripts/guide-alignment.test.mjs`; extend `scripts/check-changes.test.mjs` and `scripts/claude-hooks.test.mjs`)
- [ ] 1.2 Checkpoint: failing for the right reason
## 2. Commands, config, hook [PARALLEL]
- [ ] 2.1 `apply.md`: test-writer first, commit per task, reviewer fresh context, clean `git status --porcelain`
- [ ] 2.2 `verify.md`, `propose.md` (approvals.md + final message asks to approve all four artifacts), `archive.md`
- [ ] 2.3 `openspec/config.yaml`: drop the waiver line, archive = separate small PR after merge
- [ ] 2.4 `guard.mjs`: block curl and wget
## 3. Docs and approvals [PARALLEL]
- [ ] 3.1 Three ADRs in `docs/decisions/`, linked from `AGENTS.md`
- [ ] 3.2 README: deviations, "How to verify", status row
- [ ] 3.3 New commit: approved-sentence line in archived DEV-1003/1004/1005 `approvals.md`
## 4. Evidence (real runs)
- [ ] 4.1 Run `/opsx:explore` once on DEV-1011; save `explore-dev-1011.md` (max 15 lines)
- [ ] 4.2 Run the db-change-checker on DEV-1006's DB surface; save `db-check-dev-1006.md` (states: no migration)
## 5. Enforcement
- [ ] 5.1 `scripts/check-changes.mjs`: apply.md words, no "waived", >=3 ADRs, two-line approvals form (sentence required after "Approved by")
- [ ] 5.2 Checkpoint: build, lint --max-warnings 0, typecheck, test, test:tooling, spec:validate, check:scenarios, check:changes
## 6. Review
- [ ] 6.1 /opsx:verify, reviewer agent in fresh context into `review.md`, `git status --porcelain` clean
## Later, on their own branches (not in this PR)
- [ ] 7.1 DEV-1006..1010: add the approved-sentence line; copy `db-check-dev-1006.md` into DEV-1006's `review.md`; copy the explore note into DEV-1011's `explore.md` when it is proposed
