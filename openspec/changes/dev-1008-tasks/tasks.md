## 0. Contract (shared)
- [ ] 0.1 Test-writer: shared unit tests for S-DEV1008-01..04 (failing)
- [ ] 0.2 `packages/shared`: `TaskSchema`, `CreateTaskInputSchema`, `UpdateTaskInputSchema`, inferred types, reuse `TaskStatusSchema`/`TaskPrioritySchema`/`canTransition`; add `ASSIGNEE_NOT_MEMBER`, `INVALID_TRANSITION`, `TASK_ARCHIVED` to `ErrorCodeSchema`; export from `index.ts`
- [ ] 0.3 Commit the contract first, then checkpoint: build, lint, typecheck, test

## 1. Tests first
- [ ] 1.1 Test-writer: backend integration tests (real Postgres, Supertest) for S-DEV1008-05..30 (failing)

## 2. Backend [PARALLEL with DEV-1007]
- [ ] 2.1 `modules/tasks` repository (tasks, own membership lookup, transaction wrapper)
- [ ] 2.2 Service (authorization, assignee, transition, archive rules, `onTaskEvent` extension point)
- [ ] 2.3 Controller, routes with `validate()`, register in `app.ts`
- [ ] 2.4 `docs/api/openapi.yaml` paths and schemas
- [ ] 2.5 Checkpoint: build, lint, typecheck, test, spec:validate, check:scenarios
