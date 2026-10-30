# Software Design Specification

Binding technical decisions for the Team Task Tracker. Linear tickets hold the requirements; a spec or a change must not contradict this document.

## 1. Pinned versions

Every dependency is an exact version (`savePrefix: ''`), no `@latest`, no ranges, no unpinned images.

| Area | Choice | Version |
| --- | --- | --- |
| Runtime | Node.js (`.nvmrc`, Docker base `node:22.21.0-slim`) | 22.21.0 |
| Package manager | pnpm (corepack, `packageManager`) | 10.34.9 |
| Language | TypeScript | 6.0.3 |
| Backend | Express / helmet / cookie-parser / pino | 5.3.0 / 8.3.0 / 1.4.7 / 10.4.0 |
| Auth libraries | jose (access JWT) / @node-rs/argon2 | 6.2.13 (added by DEV-1006) / 2.2.2 |
| Database | PostgreSQL image `postgres:16.15-bookworm` | 16.15 |
| ORM | Prisma + `@prisma/adapter-pg` | 7.10.1 |
| Validation | Zod | 4.6.7 |
| Frontend | React / Vite / Tailwind CSS / TanStack Query / react-router | 19.3.1 / 8.3.5 / 4.3.3 / 5.105.0 / 7.18.5 |
| UI | shadcn/ui (`radix-nova`, generated in `src/components/ui`) | shadcn 4.23.0 |
| Tests | Vitest / Supertest / Testing Library / msw / Playwright | 5.0.5 / 7.3.1 / 16.3.3 / 2.15.0 / 1.64.1 |
| Quality | ESLint / Prettier / Husky / commitlint | 10.13.0 / 3.9.10 / 9.1.7 / 21.2.4 |
| SDD | OpenSpec (`@fission-ai/openspec`) | 1.15.0 |
| Web server image | `nginxinc/nginx-unprivileged` | 1.31.7-alpine |

## 2. Layout and layering

pnpm workspace: `backend`, `frontend`, `packages/shared`, `e2e`. Every Zod schema, inferred type and limit constant lives in `packages/shared`; backend and frontend import them (ESLint enforces it, only the backend `Env` schema may use Zod directly). Backend layering is routes, controller, service, repository:

- routes: path, middleware and `validate()` wiring only.
- controller: reads the validated request, calls one service method, shapes the response.
- service: business rules, authorization decisions, transactions; no Express and no Prisma types.
- repository: the only code that imports Prisma. Modules are wired in `src/app.ts` with factory functions (`createXService({ repository, clock })`).

## 3. Data model (`backend/prisma/schema.prisma`)

- `User` (email unique, `passwordHash`, `displayName`), `RefreshToken` (SHA-256 `tokenHash`, `expiresAt`, `revokedAt`, `rotatedAt`).
- `Project` (name, description) and `ProjectMember` (composite key `projectId, userId`, `role` OWNER or MEMBER).
- `Task` (`status`, `priority`, `dueDate`, `assigneeId` nullable, `createdById`, `archivedAt` for soft archive, `projectId`).
- `Comment` (`taskId`, `authorId`, `body`) and `ActivityLog` (`projectId`, `taskId?`, `actorId`, `action`, `metadata` Json, `createdAt`).
- Ids are UUIDv7; timestamps are `timestamptz(3)`. Archiving sets `archivedAt` and never deletes a row.

## 4. API rules

Base path `/api`, JSON only, documented in `docs/api/openapi.yaml` (OpenAPI 3.1, served at `/api/docs`); a test fails if a route is missing from it.

### 4.1 Error envelope and pagination

Every non-2xx body is `{ "error": { "code", "message", "details?": [{ "field", "message" }], "requestId" } }`; `requestId` echoes `X-Request-Id`. Lists accept `page` (default 1) and `pageSize` (default 20, max 100) and return `{ items, page, pageSize, total, totalPages }`.

### 4.2 Error codes

| Code | Status | Meaning |
| --- | --- | --- |
| `VALIDATION_ERROR` | 422 | Body, query or params failed the Zod schema |
| `MALFORMED_JSON` | 400 | Body is not parseable JSON |
| `UNAUTHORIZED` | 401 | Missing, invalid or expired access token |
| `INVALID_CREDENTIALS` | 401 | Wrong email or password (same answer for both) |
| `FORBIDDEN` | 403 | Project member lacks the role the action needs |
| `NOT_FOUND` | 404 | Resource missing, or the caller is not a member of its project |
| `ROUTE_NOT_FOUND` | 404 | No such route |
| `EMAIL_TAKEN` | 409 | Registration with an existing email |
| `CONFLICT` | 409 | Other state conflicts (for example duplicate member) |
| `INVALID_STATUS_TRANSITION` | 422 | Status change not allowed by section 6 |
| `PAYLOAD_TOO_LARGE` | 413 | Body over 1 MB |
| `INTERNAL_ERROR` | 500 | Unexpected error, details only in logs |

### 4.3 Status codes

401 means unauthenticated, 403 means authenticated but the role is not enough, 404 hides a project from a non-member (existence is never leaked), 409 is a conflict, 422 is invalid input or an invalid transition.

## 5. Roles

Roles are per project. OWNER: update or archive the project, add and remove members, change any task, delete any comment. MEMBER: read the project, create tasks, update tasks they created or are assigned to, comment, edit or delete their own comments. A task assignee must be a member of the task's project.

## 6. Task status transitions

Order: `TODO`, `IN_PROGRESS`, `IN_REVIEW`, `DONE`. A task moves one step forward or one step back; skipping a step or staying in place is `INVALID_STATUS_TRANSITION` (`canTransition` in `packages/shared`). Reopening a `DONE` task is the step back to `IN_REVIEW`. Archived tasks cannot change status. Every status change, assignment, creation and archiving writes an `ActivityLog` row in the same transaction.

| From | Allowed to |
| --- | --- |
| TODO | IN_PROGRESS |
| IN_PROGRESS | TODO, IN_REVIEW |
| IN_REVIEW | IN_PROGRESS, DONE |
| DONE | IN_REVIEW |

## 7. Authentication

Passwords are hashed with `@node-rs/argon2` (Argon2id, at least 19456 KiB memory and time cost 2 in production). The access token is a short-lived (15 min) `jose` JWT held in frontend memory only and sent as `Authorization: Bearer`. The refresh token is an opaque random value, stored as a SHA-256 hash, delivered in an `HttpOnly`, `SameSite=Strict`, `Secure` cookie (7 days) and rotated on every use; presenting a rotated token revokes the whole token family. `POST` refresh and logout check the `Origin` header against `APP_ORIGIN`. Secrets come from the environment only and are validated at startup (`backend/src/config/env.ts`).

## 8. Operations

`docker compose --profile dev` starts `db-dev` (5432) and `db-test` (5433, tmpfs, also creates `tasktracker_e2e`). `--profile full` runs `db`, `backend` and `frontend` (nginx on 8080 proxying `/api`); both app images run as a non-root user and carry a health check. Logging is pino with redaction of `authorization`, `cookie` and password fields.

## 9. Testing

Vitest in every package with a v8 coverage threshold of 80%. Backend integration tests use a real PostgreSQL (`tasktracker_test` on 5433, migrations applied in global setup, tables truncated per test). Playwright runs against Vite and the backend on their own ports and the `tasktracker_e2e` database. Each OpenSpec scenario has exactly one test titled with its `S-DEV<ticket>-<nn>` id (`pnpm check:scenarios`).
