# Review log

Columns: date | reviewer | severity | file:line | finding | resolution.

## Run 1: reviewer sub-agent (2026-10-30), verdict PASS, no blockers

| date | reviewer | severity | file:line | finding | resolution |
| ---- | -------- | -------- | --------- | ------- | ---------- |
| 2026-10-30 | reviewer | minor | backend/tests/integration/auth/auth.test.ts | Atomic rotation race (two concurrent refreshes) untested | Fixed: S-DEV1006-25 added (Promise.all, exactly one 200 and one 401) |
| 2026-10-30 | reviewer | minor | backend/tests/integration/auth/auth.test.ts:326 | S-22 bad-token list lacks a wrong-algorithm JWT | Fixed: HS512 token added to S-DEV1006-22 |
| 2026-10-30 | reviewer | minor | backend/src/modules/auth/auth.service.ts:51 | Lazily created dummy hash makes the first unknown-email login slower | Fixed: hash created at service creation; unit test `auth.service.test.ts` (S-DEV1006-28) |
| 2026-10-30 | reviewer | minor | backend/src/modules/auth/auth.service.ts:68 | Register timing / 409 reveals whether an email exists | Accepted by design (register must say EMAIL_TAKEN); noted in design.md |
| 2026-10-30 | reviewer | nit | .env.example:13 | Placeholder JWT secret `replace-me...` is long enough to pass validation | Fixed: production rejects any secret containing `replace-me` (env.ts, S-DEV1006-26) |
| 2026-10-30 | reviewer | nit | backend/src/modules/auth/auth.service.ts:94 | Loser of a concurrent rotation revokes all tokens | Accepted: "refresh reuse logs out all devices" confirmed at Gate 1; noted in design.md |

## Run 2: security-auditor sub-agent (2026-10-30), verdict PASS

| date | reviewer | severity | file:line | finding | resolution |
| ---- | -------- | -------- | --------- | ------- | ---------- |
| 2026-10-30 | security-auditor | medium (M1) | backend/src/modules/auth/auth.service.ts:94 | Concurrent legitimate refresh revokes the whole family | Accepted without a grace window (see Run 1); design.md |
| 2026-10-30 | security-auditor | medium (M2) | backend/src/modules/auth/auth.routes.ts:15 | No rate limiting on login/register | Accepted, out of scope of DEV-1006 and the assignment. Follow-up: add rate limiting / lockout (separate ticket) |
| 2026-10-30 | security-auditor | low | backend/src/common/errors/error-middleware.ts:49 | `logger.error({ err })` may log Prisma `meta` containing passwordHash/tokenHash | Fixed: only name, code, message, stack logged; `meta` dropped (S-DEV1006-27) |
| 2026-10-30 | security-auditor | low | backend/src/modules/auth/auth.routes.ts:15 | `requireOrigin` not applied to /login and /register | Skipped: APP_ORIGIN is the Vite origin, so same-origin Swagger UI (API origin) and curl/E2E calls without a matching Origin would get 403. Accepted: SameSite=Strict + JSON content-type |
| 2026-10-30 | security-auditor | info | backend/src/modules/auth/access-token.ts | No iss/aud claims; access tokens not revocable for up to 15 min | Accepted and documented in design.md |

## Run 3: verify (/opsx:verify, 2026-10-30)

Linear DEV-10 acceptance criteria:

| criterion | result |
| --------- | ------ |
| Register, login, logout, refresh endpoints; Zod validation from shared package | Met (S-02..19; schemas in packages/shared, `validate()` on register/login) |
| Passwords hashed with argon2 | Met (Argon2id, S-03) |
| Short-lived JWT in memory + rotating HttpOnly cookie; reuse of rotated token rejected | Met (S-10..13, S-25; token only in body) |
| Auth middleware protects routes; unauthenticated gives 401 | Met (requireAuth, S-20..23) |
| Duplicate email 409; bad credentials 401 without leaking field | Met (S-05, S-07, S-08) |
| Swagger entries for every endpoint; unit + integration tests on real Postgres | Met (S-24, openapi-auth test; integration suite uses Postgres on 5433) |

Doc cross-check: `docs/api/openapi.yaml` lists register (201/409/422), login (200/401/422), refresh (200/401/403), logout (204/403), me (200/401), each with 500; schemas `RegisterInput`, `LoginInput`, `AuthUser`, `AuthResponse`, cookie and bearer security schemes match the code. Codes `UNAUTHORIZED`, `INVALID_CREDENTIALS`, `EMAIL_TAKEN`, `VALIDATION_ERROR`, `FORBIDDEN` match SDS 4.2 statuses; SDS 7 (Argon2id, 15 min JWT, HttpOnly SameSite=Strict Secure cookie 7 days, SHA-256 hashed rotating token, Origin check on refresh/logout) matches. Note: SDS 4.2 `FORBIDDEN` wording is role-based; the Origin check reuses it (documented in openapi `ForbiddenOrigin`).

Follow-ups: rate limiting/lockout on login and register.

Verdict: PASS

## Apply notes (2026-10-30)

- Context7 worked: `/panva/jose` (v6.2.13) confirms `SignJWT.setSubject/setExpirationTime` and `jwtVerify(..., { algorithms })`; `/napi-rs/node-rs` confirms `@node-rs/argon2` `hash(password, { memoryCost, timeCost })` and `verify(hashed, password)`. `Algorithm` is an ambient const enum, unusable under `verbatimModuleSyntax`, so Argon2id is passed as `2 as Algorithm`.
- Commit granularity: the pre-commit hook runs the whole test suite, so red tests cannot be committed. The test-writer files were committed with the group that turns them green: shared test with 1.1; password/access-token tests with 3.1-3.2; require-auth test with 3.3; integration tests, `tests/support/auth.ts` and the openapi tests with 3.4+3.5. Tasks 3.4 and 3.5 are ONE commit because the "documents every registered route" test fails as soon as routes exist without OpenAPI entries (that test now expects 6 routes).
- Test-writer names were implemented as guessed; no test was changed. `GET /api/auth/me` returns a bare `AuthUser`.
- README status row for DEV-1006 added (check:changes requires it).
- Security: cookie `HttpOnly; SameSite=Strict; Path=/api/auth; Max-Age=604800`, `Secure` per `COOKIE_SECURE`; refresh token stored as SHA-256 hex only; unknown email verifies a dummy Argon2 hash; logger already redacts authorization, cookie, set-cookie and `req.body.password`.
- Coverage (`vitest --coverage`): backend all files 94.9% lines, auth module 90.9%; 80% threshold passes.
