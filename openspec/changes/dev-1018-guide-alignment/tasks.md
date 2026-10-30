## 1. Tests first (test-writer agent)
- [ ] 1.1 Write failing tests S-DEV1018-01..16 in `scripts/guide-alignment.test.mjs` and extend `scripts/check-changes.test.mjs`
- [ ] 1.2 Checkpoint: failing for the right reason
## 2. Commands and config [PARALLEL]
- [ ] 2.1 `apply.md`: test-writer first, commit per task, reviewer fresh context, clean `git status --porcelain`
- [ ] 2.2 `verify.md`, `propose.md`, `archive.md` rules
- [ ] 2.3 `openspec/config.yaml`: drop the waiver line, archive = separate small PR after merge
## 3. Docs [PARALLEL]
- [ ] 3.1 Three ADRs in `docs/decisions/`, linked from `AGENTS.md`
- [ ] 3.2 README: deviations, "How to verify", status row
## 4. Enforcement
- [ ] 4.1 `scripts/check-changes.mjs`: apply.md words, no "waived" in config, >=3 ADRs
- [ ] 4.2 Checkpoint: build, lint --max-warnings 0, typecheck, test, test:tooling, spec:validate, check:scenarios, check:changes
## 5. Review
- [ ] 5.1 /opsx:verify, reviewer agent in fresh context into `review.md`, `git status --porcelain` clean
