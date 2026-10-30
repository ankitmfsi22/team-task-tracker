# Review log

| date | reviewer | severity | file:line | finding | resolution |
| ---- | -------- | -------- | --------- | ------- | ---------- |

## Apply notes (2026-10-30)

- Context7 worked: `/panva/jose` (v6.2.13) confirms `SignJWT.setSubject/setExpirationTime` and `jwtVerify(..., { algorithms })`; `/napi-rs/node-rs` confirms `@node-rs/argon2` `hash(password, { memoryCost, timeCost })` and `verify(hashed, password)`. `Algorithm` is an ambient const enum, unusable under `verbatimModuleSyntax`, so Argon2id is passed as `2 as Algorithm`.
- Commit granularity: the pre-commit hook runs the whole test suite, so red tests cannot be committed. The test-writer files were committed with the group that turns them green: shared test with 1.1; password/access-token tests with 3.1-3.2; require-auth test with 3.3; integration tests, `tests/support/auth.ts` and the openapi tests with 3.4+3.5. Tasks 3.4 and 3.5 are ONE commit because the "documents every registered route" test fails as soon as routes exist without OpenAPI entries (that test now expects 6 routes).
- Test-writer names were implemented as guessed; no test was changed. `GET /api/auth/me` returns a bare `AuthUser`.
- README status row for DEV-1006 added (check:changes requires it).
- Security: cookie `HttpOnly; SameSite=Strict; Path=/api/auth; Max-Age=604800`, `Secure` per `COOKIE_SECURE`; refresh token stored as SHA-256 hex only; unknown email verifies a dummy Argon2 hash; logger already redacts authorization, cookie, set-cookie and `req.body.password`.
- Coverage (`vitest --coverage`): backend all files 94.9% lines, auth module 90.9%; 80% threshold passes.
