## Why
DEV-1009 (Linear DEV-13, after DEV-1008): the task list needs filtering, sorting and pagination (FR: filter, sort, paginate by status, priority, assignee, due date).
## What changes
- Shared Zod `TaskListQuery` (+ `TaskListResponse` envelope) in `packages/shared`, first.
- `GET /api/projects/:projectId/tasks` accepts `status`, `priority`, `assigneeId` (or `unassigned`), `dueFrom`, `dueTo`, `sort`, `order`, `page`, `pageSize`, `includeArchived`.
- Response `{ items, page, pageSize, total, totalPages }` (SDS 4.1); OpenAPI + integration tests.
Linear: https://linear.app/team-task-tracker/issue/DEV-13/dev-1009-task-filtering
## Out of scope
Free-text search, saved filters, frontend filter UI (DEV-1012), cursor pagination, changing task CRUD (DEV-1008).
## Assumptions [ASSUMPTION - confirm]
Linear says "400 with error code"; SDS 4.2 says 422 `VALIDATION_ERROR`, SDS wins. Priority order LOW < MEDIUM < HIGH < URGENT (DEV-1008 owns the enum). Default sort `createdAt` desc. Archived excluded by default.
## Rollback
Revert the PR; no migration, only query handling changes (an index may be added, droppable).
