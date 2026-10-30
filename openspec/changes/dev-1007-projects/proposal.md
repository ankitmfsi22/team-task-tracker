## Why
DEV-1007 (Linear DEV-11, after DEV-1006, runs parallel to DEV-1008): users need projects with membership and role-based access, the base for tasks and the frontend.
## What changes
- Shared contract first: Zod schemas/types for Project, ProjectMember and inputs; three new error codes.
- Backend `projects` module: create/list/get/update/archive, list/add/remove members under `/api/projects`.
- Prisma migration: `Project.archivedAt` (soft archive, SDS section 3); `docs/api/openapi.yaml` entries.
- [ASSUMPTION - confirm] The SDS error table lacks `PROJECT_ARCHIVED`, `OWNER_CANNOT_BE_REMOVED`, `USER_NOT_FOUND` (409/409/404); the ticket names them, so SDS 4.2 and `ErrorCodeSchema` are extended.
- [ASSUMPTION - confirm] Add member always as role MEMBER; project list is paginated (SDS 4.1), archived projects included with `archivedAt`.
Linear: https://linear.app/team-task-tracker/issue/DEV-11
## Out of scope
Tasks, comments, activity log (DEV-1008+), unarchive, role change, leaving a project, frontend (DEV-1011).
## Rollback
Revert the PR and the migration (drop `archivedAt`); no other table changes.
