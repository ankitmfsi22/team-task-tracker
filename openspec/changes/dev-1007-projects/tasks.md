## 0. Contract (shared)
- [ ] 0.1 `packages/shared`: Project, ProjectMember, input/params schemas, types, exports, new error codes (+ SDS 4.2 row update); unit tests; commit before parallel work starts
- [ ] 0.2 Checkpoint: build, lint, typecheck, test

## 1. Tests first
- [ ] 1.1 Test-writer: integration tests (Supertest, real Postgres) for S-DEV1007-01..33 (failing)

## 2. Backend: project CRUD [PARALLEL with DEV-1008]
- [ ] 2.1 Prisma migration `Project.archivedAt`
- [ ] 2.2 Repository, service, controller, routes: create, list, get, update, archive
- [ ] 2.3 Checkpoint: build, lint, typecheck, test

## 3. Backend: members [PARALLEL with DEV-1008]
- [ ] 3.1 Repository, service, controller, routes: list, add by email, remove
- [ ] 3.2 Register module in `app.ts`
- [ ] 3.3 Checkpoint: build, lint, typecheck, test

## 4. Docs
- [ ] 4.1 `docs/api/openapi.yaml` for all 8 endpoints
- [ ] 4.2 Checkpoint: build, lint, typecheck, test, spec:validate, check:scenarios
