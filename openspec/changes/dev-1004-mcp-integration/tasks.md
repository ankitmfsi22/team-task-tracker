## 1. Tests first
- [ ] 1.1 Test-writer: `scripts/mcp-config.test.mjs` (S-DEV1004-01..06) and `scripts/ticket-source.test.mjs` (07..10), failing
- [ ] 1.2 Checkpoint: build, lint, typecheck, test, test:tooling (expected red until 2-3)

## 2. Fallback
- [ ] 2.1 Add `zod@4.6.7` root devDependency (approval needed)
- [ ] 2.2 [PARALLEL] `fixtures/linear/DEV-5.fixture.json`, `DEV-8.fixture.json`
- [ ] 2.3 [PARALLEL] `scripts/ticket-source.mjs` with Zod schema
- [ ] 2.4 Checkpoint: build, lint, typecheck, test, test:tooling

## 3. Docs
- [ ] 3.1 `docs/MCP.md` (<=120 lines, tables, live evidence, failure table); link from README/CLAUDE.md
- [ ] 3.2 Checkpoint, then verify
