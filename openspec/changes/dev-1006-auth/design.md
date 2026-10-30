## Contract first (task 1, packages/shared)
- `RegisterInput { email, password (8-128), displayName (1-100) }`, `LoginInput { email, password }`, `AuthUser { id, email, displayName }`, `AuthResponse { user: AuthUser, accessToken }`. Email trimmed + lower-cased. No `passwordHash` in any response schema. Errors use the existing `ErrorCodeSchema`.
- `ACCESS_TOKEN_TTL_SECONDS` (900) and `REFRESH_TOKEN_TTL_DAYS` (7) already exist in `constants/limits.ts`.

## Layers (backend/src/modules/auth, wired in app.ts)
- routes: `validate()` + origin check on refresh/logout; controller: shapes body, sets/clears cookie `refresh_token` (HttpOnly, SameSite=Strict, Secure when `COOKIE_SECURE`, Path `/api/auth`, 7 days).
- service (no Express/Prisma): register, login, refresh, logout, me; uses `Clock`, injected `hashPassword/verifyPassword` (Argon2id, `ARGON2_*` env), `signAccessToken/verifyAccessToken` (jose HS256, 15 min, `sub` = user id, `JWT_ACCESS_SECRET`).
- repository (only Prisma): user by email/id, create user, refresh token create/find by hash/rotate/revoke, `revokeAllForUser`.
- `requireAuth` (`common/http/require-auth.ts`): Bearer JWT -> `req.auth = { userId }`, else 401 `UNAUTHORIZED`.

## Decisions
- Refresh token: 32 random bytes base64url; DB stores SHA-256 hex. Refresh = in one transaction mark old `revokedAt = rotatedAt = now`, insert new. Presenting a token with `rotatedAt` set revokes every active token of the user and returns 401 `UNAUTHORIZED`.
- Login: unknown email still verifies against a dummy Argon2 hash (timing) and returns the same 401 `INVALID_CREDENTIALS` body.
- Origin check (SDS 7): refresh/logout need `Origin` equal to `APP_ORIGIN`, else 403 `FORBIDDEN`. Logout is idempotent: 204 even without a cookie.
- Duplicate email: unique violation also maps to 409 `EMAIL_TAKEN` (race).
- [ASSUMPTION - confirm] SDS 4.2 names the 401 code `UNAUTHORIZED` (not `UNAUTHENTICATED`); SDS wins.
- [ASSUMPTION - confirm] No migration; adding `familyId` would give per-device family revocation but changes SDS 3. Cost: reuse logs the user out everywhere.
- Libraries verified with Context7 (jose `SignJWT/jwtVerify`, @node-rs/argon2 `hash/verify`).
