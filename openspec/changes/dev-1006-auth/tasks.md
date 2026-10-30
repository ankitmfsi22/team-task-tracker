## 1. Contract (first)
- [x] 1.1 `packages/shared`: `RegisterInput`, `LoginInput`, `AuthUser`, `AuthResponse` schemas, types and unit tests
- [x] 1.2 Checkpoint: build, lint, typecheck, test

## 2. Tests first
- [ ] 2.1 Test-writer: integration tests (real Postgres, Supertest) for S-DEV1006-01..24 (failing)

## 3. Backend
- [ ] 3.1 Add `jose` 6.2.13 (exact pin) to backend
- [ ] 3.2 [PARALLEL] password hasher and token service (jose) with unit tests
- [ ] 3.3 [PARALLEL] `requireAuth` middleware and origin check
- [ ] 3.4 auth repository, service, controller, routes; wire in `app.ts`
- [ ] 3.5 `docs/api/openapi.yaml`: five paths, `AuthResponse`, `AuthUser`, 401/403/409/422 responses
- [ ] 3.6 Checkpoint: build, lint --max-warnings 0, typecheck, test, spec:validate, check:scenarios
