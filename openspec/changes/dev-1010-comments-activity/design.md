## Dependency
Requires DEV-1008 (tasks) merged first: this change extends its task service, repository and transaction helper, and reuses its project-membership lookup. Start apply only after that merge.

## Layering (SDS section 2)
- `packages/shared`: schemas/types first (contract task); backend imports them.
- New backend module `comments` (routes, controller, service, repository) and `activity` (read route/controller/service, plus recorder). Wired in `src/app.ts` via factories.
- Authorization in services: membership lookup (non-member or unknown task => NOT_FOUND), then author/OWNER rules (=> FORBIDDEN), then archived check (=> CONFLICT). Order: 404, 403, 409, then validation is already done by `validate()` earlier (422).

## Activity extension point
`ActivityRecorder { record(tx, entry: { projectId, taskId, actorId, action, metadata }): Promise<void> }` is implemented by the activity repository and injected into the task service. Task service methods (create, assign/update, change status, archive) call `record` inside their existing `runInTransaction` callback, so the task write and the log row commit or roll back together. Rejected changes throw before `record`. Only the 4 actions are recorded; comments record none (keeps the log task-lifecycle only).

## Data
No migration: `Comment` and `ActivityLog` exist. Comment list ordered `createdAt asc, id asc`, activity `createdAt desc, id desc` (UUIDv7 tiebreak); both use `@@index` already present. Queries always filter by `projectId` + `taskId` (ownership in query). Comment edit/delete use repository lookup by `id` + `taskId`.

## Risks
- DEV-1008 transaction helper shape may differ; adapt the recorder signature to it.
- Pagination envelope in SDS also lists `totalPages`; return it too (superset of `{items,page,pageSize,total}`).
