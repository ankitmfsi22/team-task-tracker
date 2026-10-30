## 1. Contract (first)
- [x] 1.1 `packages/shared`: `RegisterInput`, `LoginInput`, `AuthUser`, `AuthResponse` schemas, types and unit tests
- [x] 1.2 Checkpoint: build, lint, typecheck, test

## 2. Tests first
- [x] 2.1 Test-writer: integration tests (real Postgres, Supertest) for S-DEV1006-01..24 (failing)

## 3. Backend
- [x] 3.1 Add `jose` 6.2.13 (exact pin) to backend
- [x] 3.2 [PARALLEL] password hasher and token service (jose) with unit tests
- [x] 3.3 [PARALLEL] `requireAuth` middleware and origin check
- [x] 3.4 auth repository, service, controller, routes; wire in `app.ts`
- [x] 3.5 `docs/api/openapi.yaml`: five paths, `AuthResponse`, `AuthUser`, 401/403/409/422 responses
- [x] 3.6 Checkpoint: build, lint --max-warnings 0, typecheck, test, spec:validate, check:scenarios

## 4. Review fixes
- [x] 4.1 Close review findings (S-DEV1006-25..27, HS512, eager dummy hash), verify pass
