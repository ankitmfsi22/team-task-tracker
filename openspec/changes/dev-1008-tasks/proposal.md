## Why
Projects need tasks: create, view, update, assign, move through a status flow and archive. Linear [DEV-12](https://linear.app/team-task-tracker/issue/DEV-12/dev-1008-tasks-parallel) (assignment DEV-1008), blocked by DEV-1006 (auth), blocks DEV-1009, DEV-1010, DEV-1012. Runs [PARALLEL] with DEV-1007 (projects/members).

## What
- Shared contract first: `Task`, `CreateTaskInput`, `UpdateTaskInput`, task error codes.
- Endpoints under `/api/projects/:projectId/tasks`: POST, GET (basic list, newest first), GET/PATCH `/:taskId`, POST `/:taskId/archive`.
- Assignee must be a project member; status moves via shared `canTransition`; archived tasks are read-only; OWNER-only archive.
- Defaults chosen (open questions): list hides archived tasks; PATCH `status` equal to current is rejected (SDS 6); MEMBER may update only tasks they created or are assigned to (SDS 5), OWNER any; `dueDate` is `YYYY-MM-DD`.
- Needs an SDS 4.2 error table update (see design.md, Risks).

## Out of scope
Filtering, sorting, pagination (DEV-1009); comments and activity recording (DEV-1010, extension point only); frontend (DEV-1012); project and member endpoints (DEV-1007).

## Rollback
Revert the PR; no migration (Task table already exists in the schema).
