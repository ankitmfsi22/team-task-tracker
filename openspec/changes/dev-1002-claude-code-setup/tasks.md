## 1. Tests first
- [ ] 1.1 Test-writer: `scripts/claude-hooks.test.mjs` and `scripts/claude-config.test.mjs` for S-DEV1002-01..21 (failing)
- [ ] 1.2 Checkpoint: build, lint, typecheck, test, test:tooling (expected red until 2-4)

## 2. Enforcement
- [ ] 2.1 `.claude/hooks/guard.mjs` (Bash + Read|Edit|Write)
- [ ] 2.2 [PARALLEL] `.claude/hooks/format.mjs`
- [ ] 2.3 [PARALLEL] `.claude/hooks/stop.mjs`
- [ ] 2.4 `.claude/settings.json` permissions + hook registration
- [ ] 2.5 Checkpoint: build, lint, typecheck, test, test:tooling

## 3. Commands, skills, docs
- [ ] 3.1 [PARALLEL] `.claude/commands/create-pr.md`
- [ ] 3.2 [PARALLEL] skills `spec-scenario-format`, `add-endpoint`
- [ ] 3.3 [PARALLEL] `docs/FRS.md`
- [ ] 3.4 [PARALLEL] layer CLAUDE.md files (backend, frontend, shared)
- [ ] 3.5 Checkpoint: build, lint, typecheck, test, test:tooling, format:check

## 4. Workflow instructions
- [ ] 4.1 Update `CLAUDE.md`, `AGENTS.md`
- [ ] 4.2 Update `openspec/config.yaml` (Approval waiver, tasks rules)
- [ ] 4.3 Checkpoint: build, lint, typecheck, test, spec:validate, check:scenarios
