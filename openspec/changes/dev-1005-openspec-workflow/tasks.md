## 1. Tests first
- [ ] 1.1 Write scripts/check-changes.test.mjs, one test per scenario (fixture roots in temp dirs)
## 2. Script and wiring
- [ ] 2.1 Implement scripts/check-changes.mjs
- [ ] 2.2 [PARALLEL] Add `check:changes` to package.json and a CI verify step (`--ready` on non-draft PRs); update ci-workflow test
- [ ] 2.3 Fix existing changes/README so `pnpm check:changes` passes (DEV-1002 archived, this change)
- [ ] 2.4 Checkpoint: build, lint, typecheck, test, test:tooling, spec:validate, check:scenarios
## 3. Docs
- [ ] 3.1 [PARALLEL] README: opsx command table, expanded profile, global-config note, approval gates, archive step, status row
- [ ] 3.2 [PARALLEL] CLAUDE.md and AGENTS.md pointer to the README sections
- [ ] 3.3 Run /opsx:verify, reviewer sub-agent into review.md
