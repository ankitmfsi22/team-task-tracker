## Why
DEV-1010 (Linear DEV-14, blocked by DEV-1008 tasks, blocks DEV-1013 frontend): members discuss tasks and see who changed what and when.
## What changes
- Comments: POST/GET `/api/projects/:projectId/tasks/:taskId/comments`, PATCH/DELETE `.../comments/:commentId`.
- Activity: GET `.../tasks/:taskId/activity` (paginated, newest first); task service records `ActivityLog` rows for task.created, task.assigned, task.status_changed, task.archived.
- Shared Zod schemas first (Comment, CreateCommentInput, ActivityEntry, ActivityAction); OpenAPI + integration tests.
Linear: https://linear.app/team-task-tracker/issue/DEV-14
## Decisions [ASSUMPTION]
Comments write no activity rows (only the 4 task actions). Archived task: comments read-only (409 CONFLICT), activity still readable. Reads need membership; no new migration (Comment, ActivityLog exist).
## Out of scope
Frontend (DEV-1013), comment activity, mentions, pagination of comments beyond the standard `page`/`pageSize`, project-level activity feed.
## Rollback
Revert the PR; tables already exist and no schema change is made.
