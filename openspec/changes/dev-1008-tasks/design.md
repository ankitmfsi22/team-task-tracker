## Context
Backend layering per SDS 2: `modules/tasks` routes, controller, service, repository (only Prisma user). Wired in `app.ts` via `createTasksService({ repository, clock })`. Shared Zod schemas in `packages/shared` (group 0).

## Decisions
- Membership: the tasks repository does its own `ProjectMember` lookup via Prisma (`findMembership(projectId, userId)`); no import from DEV-1007 code. Non-member or unknown project gives 404 `NOT_FOUND`.
- Check order: 401, params/body 422, 404, 403, 409 `TASK_ARCHIVED`, 422 `ASSIGNEE_NOT_MEMBER`, 409 `INVALID_TRANSITION`.
- Transition: shared `canTransition(from, to)`; same status or a skip is `INVALID_TRANSITION`.
- Archive: sets `archivedAt` (never deletes); `GET` of an archived task still works; list excludes archived.
- Error codes `ASSIGNEE_NOT_MEMBER` (422), `INVALID_TRANSITION` (409), `TASK_ARCHIVED` (409) are added to the shared `ErrorCodeSchema`.
- Extension point for DEV-1010: the service runs each mutation through `tasksRepository.runInTransaction(tx => ...)` and calls an injectable `onTaskEvent(tx, event)` hook (default no-op). DEV-1010 supplies an ActivityLog writer; not implemented here.
- Ids are UUIDv7 strings; `dueDate` is a date-only string; list order `createdAt desc, id desc`.

## Shared files that will conflict textually with DEV-1007
`backend/src/app.ts` (router registration), `packages/shared/src/index.ts` (export lines), `docs/api/openapi.yaml` (paths and components). Mitigation: add-only edits in separate blocks; the second branch to merge rebases and resolves, then reruns all gates. No code dependency otherwise.

## Risks
- Divergence from SDS: SDS 4.2 lists `INVALID_STATUS_TRANSITION` 422; the ticket instruction here is 409 `INVALID_TRANSITION` (Linear allows 409/422). Gate 1 must confirm; if kept, SDS 4.2 gets updated outside this change and `INVALID_STATUS_TRANSITION` is retired.
- Textual merge conflicts listed above.
