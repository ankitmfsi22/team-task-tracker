## Why
DEV-1006 (Linear DEV-10, after DEV-1005): users must register, log in and stay signed in safely; Projects, Tasks and the frontend (DEV-1007/1008/1011) depend on `requireAuth`.
## What changes
- Endpoints `POST /api/auth/register|login|refresh|logout`, `GET /api/auth/me`; `requireAuth` middleware.
- Shared Zod contract in `packages/shared`: `RegisterInput`, `LoginInput`, `AuthUser`, `AuthResponse`.
- Argon2id hashing (`@node-rs/argon2`), 15 min HS256 access JWT (`jose`, in body), opaque rotating refresh cookie (hashed in DB, reuse revokes the family).
- `docs/api/openapi.yaml` entries for all five endpoints; add `jose` dependency (exact pin).
Linear: https://linear.app/team-task-tracker/issue/DEV-10
## Out of scope
Password reset, email verification, rate limiting, profile edit, frontend (DEV-1011), social login.
## Rollback
Revert the PR. [ASSUMPTION - confirm] No migration: User/RefreshToken already exist; "family" = all of the user's refresh tokens (see design.md).
