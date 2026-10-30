## Contract (packages/shared, committed first)
- `ProjectSchema` {id, name 1-100, description nullable max 1000, archivedAt nullable, createdAt, updatedAt, role: caller's role}.
- `ProjectMemberSchema` {userId, email, displayName, role, joinedAt}; `CreateProjectInputSchema`, `UpdateProjectInputSchema` (partial, at least one field), `AddMemberInputSchema` {email lower-cased}, `ProjectIdParamsSchema`, `MemberParamsSchema`; list responses via `paginated()`.
- `ErrorCodeSchema` gains `PROJECT_ARCHIVED` (409), `OWNER_CANNOT_BE_REMOVED` (409), `USER_NOT_FOUND` (404); SDS 4.2 updated to match.
## Backend (routes, controller, service, repository)
- Routes behind the auth middleware (DEV-1006) with `validate()`; Prisma only in `projects.repository.ts`.
- Service resolves the caller's membership once per request: none -> `NOT_FOUND`; MEMBER on an owner action -> `FORBIDDEN`; archived + write -> `PROJECT_ARCHIVED`. Order: 404, 403, 409 archived, 422 is raised earlier by `validate()`.
- Create project + OWNER membership in one transaction. List filters by `members.some(userId)`.
- Add member: lookup by lower-cased email; unknown -> `USER_NOT_FOUND`; existing row -> `CONFLICT` (composite key, also catches the race).
- Remove: target must be a member else `NOT_FOUND`; role OWNER -> `OWNER_CANNOT_BE_REMOVED`.
## Parallel work with DEV-1008
DEV-1008 does its own membership lookup in its tasks module: no code dependency. Shared files that will conflict textually at integration (resolve by keeping both sides): backend app router registration (`backend/src/app.ts`), `packages/shared/src/index.ts` exports, `docs/api/openapi.yaml`. Contract group 0 merges first to keep the overlap minimal.
## Risks
Migration touches `Project` only. Last-write-wins on PATCH (no versioning).
