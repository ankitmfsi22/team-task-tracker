## 1. Tests first
- [x] 1.1 Write scripts/check-changes.test.mjs, one test per scenario (fixture roots in temp dirs)
## 2. Script and wiring
- [x] 2.1 Implement scripts/check-changes.mjs
- [x] 2.2 [PARALLEL] Add `check:changes` to package.json and a CI verify step (`--ready` on non-draft PRs)(scripts/ci-workflow.test.mjs unchanged; wiring asserted by S-DEV1005-17)
- [x] 2.3 Fix existing changes/README so `pnpm check:changes` passes (DEV-1002 archived, this change)
- [x] 2.4 Checkpoint: build, lint, typecheck, test, test:tooling, spec:validate, check:scenarios
## 3. Docs
- [x] 3.1 [PARALLEL] README: opsx command table, expanded profile, global-config note, approval gates, archive step, status row
- [x] 3.2 [PARALLEL] CLAUDE.md pointer to the README sections (AGENTS.md left unchanged)
- [x] 3.3 Run /opsx:verify, reviewer sub-agent into review.md
## 4. Review fixes
- [x] 4.1 Tests S-DEV1005-18..22 and fixes (PASS verdict, ready_for_review, typecheck step, URL/date/approval hardening); Resolutions in review.md
