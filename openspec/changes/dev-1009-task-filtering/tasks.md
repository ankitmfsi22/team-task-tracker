## 1. Contract and tests first
- [ ] 1.1 `TaskListQuery` and `TaskListResponse` Zod schemas + unit tests in `packages/shared` (S-DEV1009-01..03)
- [ ] 1.2 Test-writer: backend integration tests (Postgres + Supertest) for S-DEV1009-04..33 (failing)
- [ ] 1.3 Checkpoint: build, lint, typecheck, test (red expected until 2)

## 2. Backend
- [ ] 2.1 Repository `findMany`/`count` with filters, whitelisted sort, priority rank, nulls last
- [ ] 2.2 Service `list` (membership 404, envelope) and controller/route wiring
- [ ] 2.3 [PARALLEL] Update `docs/api/openapi.yaml`
- [ ] 2.4 [PARALLEL] Add index if missing (migration)
- [ ] 2.5 Checkpoint: build, lint --max-warnings 0, typecheck, test, check:scenarios
