## 1. Tests first
- [x] 1.1 Test-writer: `scripts/claude-hooks.test.mjs` and `scripts/claude-config.test.mjs` for S-DEV1002-01..24 (failing)
- [x] 1.2 Checkpoint: build, lint, typecheck, test, test:tooling (expected red until 2-4)

## 2. Enforcement
- [x] 2.1 `.claude/hooks/guard.mjs` (Bash + Read|Edit|Write)
- [x] 2.2 [PARALLEL] `.claude/hooks/format.mjs`
- [x] 2.3 [PARALLEL] `.claude/hooks/stop.mjs`
- [x] 2.4 `.claude/settings.json` permissions + hook registration
- [x] 2.5 Checkpoint: build, lint, typecheck, test, test:tooling

## 3. Commands, skills, docs
- [x] 3.1 [PARALLEL] `.claude/commands/create-pr.md`
- [x] 3.2 [PARALLEL] skills `spec-scenario-format`, `add-endpoint`
- [x] 3.3 [PARALLEL] `docs/FRS.md`
- [x] 3.4 [PARALLEL] layer CLAUDE.md files (backend, frontend, shared)
- [x] 3.5 Checkpoint: build, lint, typecheck, test, test:tooling, format:check

## 4. Workflow instructions
- [x] 4.1 Update `CLAUDE.md`, `AGENTS.md`
- [x] 4.2 Update `openspec/config.yaml` (Approval waiver, tasks rules)
- [x] 4.3 Checkpoint: build, lint, typecheck, test, spec:validate, check:scenarios
