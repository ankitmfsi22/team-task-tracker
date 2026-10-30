## Purpose
Account registration, login, token refresh, logout and request authentication for the Team Task Tracker API.

## ADDED Requirements

### Requirement: Shared auth contract
The `RegisterInput`, `LoginInput`, `AuthUser` and `AuthResponse` Zod schemas SHALL live in `packages/shared` and SHALL NOT expose `passwordHash`.

#### Scenario: S-DEV1006-01 shared schemas validate and strip secrets
- WHEN `RegisterInput` parses a valid body with a mixed-case padded email
- THEN the email is trimmed and lower-cased
- AND `RegisterInput` rejects a 7-char password, a bad email and an empty displayName, and `AuthResponse` rejects an object with `passwordHash`

### Requirement: Register
`POST /api/auth/register` SHALL create a user with an Argon2id password hash and return 201 with `AuthResponse` and a refresh cookie.

#### Scenario: S-DEV1006-02 register creates the account
- WHEN a valid body is posted to `/api/auth/register`
- THEN the response is 201 with `{ user: { id, email, displayName }, accessToken }` and no `passwordHash`
- AND a `Set-Cookie` for `refresh_token` is present

#### Scenario: S-DEV1006-03 password is stored as Argon2id hash
- WHEN a user registers
- THEN the stored `passwordHash` starts with `$argon2id$` and does not contain the password

#### Scenario: S-DEV1006-04 register validation failure
- WHEN the body has an invalid email, a password shorter than 8 characters or a missing displayName
- THEN the response is 422 `VALIDATION_ERROR` with `details` naming each field
- AND no user is created

#### Scenario: S-DEV1006-05 duplicate email conflicts
- WHEN the email is already registered (compared case-insensitively)
- THEN the response is 409 `EMAIL_TAKEN` and no second user exists

### Requirement: Login
`POST /api/auth/login` SHALL return 200 with `AuthResponse` and a refresh cookie for correct credentials, and 401 `INVALID_CREDENTIALS` with an identical body for an unknown email or a wrong password.

#### Scenario: S-DEV1006-06 login succeeds
- WHEN a registered user posts the correct email and password
- THEN the response is 200 with `accessToken` and `user`
- AND a new refresh token row exists with only its SHA-256 hash stored

#### Scenario: S-DEV1006-07 wrong password is rejected
- WHEN the password is wrong
- THEN the response is 401 `INVALID_CREDENTIALS` and no cookie is set

#### Scenario: S-DEV1006-08 unknown email is indistinguishable
- WHEN the email is not registered
- THEN the response is 401 `INVALID_CREDENTIALS` with the same status and message as S-DEV1006-07

#### Scenario: S-DEV1006-09 login validation failure
- WHEN the body is missing the password or has a malformed email
- THEN the response is 422 `VALIDATION_ERROR`

### Requirement: Access token
The access token SHALL be an HS256 JWT signed with `JWT_ACCESS_SECRET`, expire after 900 seconds, carry the user id as `sub`, and be returned only in the response body.

#### Scenario: S-DEV1006-10 access token claims
- WHEN a user logs in
- THEN the token verifies with HS256, `sub` equals the user id and `exp - iat` equals 900
- AND the cookie value does not equal the access token

### Requirement: Refresh cookie
The refresh token SHALL be an opaque random value in an `HttpOnly`, `SameSite=Strict` cookie with `Path=/api/auth` and `Max-Age` of 7 days, `Secure` when `COOKIE_SECURE` is true.

#### Scenario: S-DEV1006-11 cookie attributes
- WHEN login succeeds
- THEN `Set-Cookie` has `HttpOnly`, `SameSite=Strict`, `Path=/api/auth` and `Max-Age=604800`
- AND with `COOKIE_SECURE=true` it also has `Secure`

### Requirement: Refresh and rotation
`POST /api/auth/refresh` SHALL accept the refresh cookie from an allowed Origin, rotate it, and return a new access token; presenting an already rotated token SHALL return 401 `UNAUTHORIZED` and revoke the token family.

#### Scenario: S-DEV1006-12 refresh rotates the token
- WHEN a valid refresh cookie is posted with `Origin` equal to `APP_ORIGIN`
- THEN the response is 200 `AuthResponse` with a new cookie value
- AND the old row has `rotatedAt` and `revokedAt` set and the new row is active

#### Scenario: S-DEV1006-13 reuse of a rotated token revokes the family
- WHEN the old (already rotated) cookie is posted again
- THEN the response is 401 `UNAUTHORIZED`
- AND the newer token from S-DEV1006-12 is revoked and its refresh also returns 401 `UNAUTHORIZED`

#### Scenario: S-DEV1006-14 missing, unknown or expired refresh token
- WHEN refresh is called with no cookie, a random value, or a token past `expiresAt`
- THEN each response is 401 `UNAUTHORIZED` and the cookie is cleared

#### Scenario: S-DEV1006-15 refresh from a foreign origin is forbidden
- WHEN refresh is posted with `Origin: https://evil.example`
- THEN the response is 403 `FORBIDDEN` and the token is not rotated

#### Scenario: S-DEV1006-16 refresh has no body to validate
- WHEN refresh is posted with an extra JSON body
- THEN the body is ignored (validation does not apply; the cookie is the only input) and the outcome follows S-DEV1006-12

### Requirement: Logout
`POST /api/auth/logout` SHALL revoke the presented refresh token, clear the cookie and return 204, idempotently, only from an allowed Origin.

#### Scenario: S-DEV1006-17 logout revokes and clears
- WHEN a logged-in client posts logout with its cookie
- THEN the response is 204 and `Set-Cookie` expires `refresh_token`
- AND the token row has `revokedAt` set and a later refresh returns 401 `UNAUTHORIZED`

#### Scenario: S-DEV1006-18 logout without a cookie is idempotent
- WHEN logout is posted without a cookie
- THEN the response is 204

#### Scenario: S-DEV1006-19 logout from a foreign origin is forbidden
- WHEN logout is posted with `Origin: https://evil.example`
- THEN the response is 403 `FORBIDDEN` and the token stays active

### Requirement: Current user and requireAuth
`GET /api/auth/me` and every route guarded by `requireAuth` SHALL require `Authorization: Bearer <access token>` and answer 401 `UNAUTHORIZED` otherwise.

#### Scenario: S-DEV1006-20 me returns the caller
- WHEN `/api/auth/me` is called with a valid access token
- THEN the response is 200 `AuthUser` without `passwordHash`

#### Scenario: S-DEV1006-21 me without a token
- WHEN `/api/auth/me` is called with no header or a non-Bearer scheme
- THEN the response is 401 `UNAUTHORIZED`

#### Scenario: S-DEV1006-22 me with a bad token
- WHEN the token is expired, signed with another secret, uses `alg: none`, or its user no longer exists
- THEN the response is 401 `UNAUTHORIZED`

#### Scenario: S-DEV1006-23 requireAuth sets the caller
- WHEN a route behind `requireAuth` receives a valid token
- THEN the handler sees `req.auth.userId` equal to the token `sub`
- AND without a token the handler is not reached (401 `UNAUTHORIZED`)

### Requirement: API documentation
Every auth endpoint SHALL be documented in `docs/api/openapi.yaml`.

#### Scenario: S-DEV1006-24 openapi lists every auth route
- WHEN the registered routes are compared with `docs/api/openapi.yaml`
- THEN register, login, refresh, logout and me are all documented with their 401/403/409/422 responses
