## Dependency
Depends on DEV-1008 being merged first: it introduces `GET /api/projects/:projectId/tasks`, the `Task` model and the priority enum. This change extends that endpoint, specified here as ADDED requirements in its own capability because `tasks` is not yet in `openspec/specs`. Apply only after DEV-1008 is archived.
## Contract (packages/shared first)
- `TaskListQuery` (Zod, strict): `status`/`priority` accept repeated or comma-separated values, validated against the shared enums; `assigneeId` is a UUID or `unassigned`; `dueFrom`/`dueTo` ISO dates (`z.coerce.date`), `dueFrom <= dueTo`; `sort` enum `dueDate|priority|createdAt`; `order` `asc|desc`; `page` int >= 1 (default 1); `pageSize` int 1..100 (default 20); `includeArchived` boolean (default false). Unknown params rejected.
- `TaskListResponse = { items: Task[], page, pageSize, total, totalPages }`.
## Layers
Route validates query with `TaskListQuery` (existing validate middleware, failures -> 422 `VALIDATION_ERROR` with `details[{field,message}]`) -> controller -> `taskService.list` (membership check, non-member 404) -> `taskRepository.findMany/count` (Prisma only here). Query is built from the whitelisted `sort` map, never from raw input.
## Decisions
- Priority sort uses rank (LOW=1..URGENT=4) via a CASE/raw ordering or a mapped column, not the string. Ties break on `id` for stable pages.
- `dueDate` sort puts NULL last in both asc and desc (`NULLS LAST`).
- Filters AND together; values within one multi-value filter OR together. `assigneeId=unassigned` means `assigneeId IS NULL`.
- Date bounds are inclusive; `archivedAt IS NULL` unless `includeArchived=true`.
- `total` counts all rows matching the filters (not the page). Page beyond the last returns empty `items` with correct `total`.
- Index on `(projectId, status)` may be added if DEV-1008 lacks one.
## Risks
Raw SQL ordering for priority rank; keep parameterised. Docs: update `docs/api/openapi.yaml` with every query param.
