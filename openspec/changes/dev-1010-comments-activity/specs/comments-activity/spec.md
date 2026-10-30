## Purpose

Task comments (add, list, edit, delete) and an append-only activity history of task changes, both scoped to project members.

## ADDED Requirements

### Requirement: Create and list comments
A project member SHALL create a comment (body 1..2000 chars) on a task and list its comments oldest first with `page`/`pageSize`; a non-member gets 404 NOT_FOUND; invalid body gets 422 VALIDATION_ERROR.

#### Scenario: S-DEV1010-01 Member creates a comment
- WHEN a member POSTs `{ "body": "Looks good" }` to the task comments endpoint
- THEN the response is 201 with `id`, `taskId`, `authorId` (the caller), `body`, `createdAt`, `updatedAt`

#### Scenario: S-DEV1010-02 Member lists comments
- WHEN a member GETs the comments of a task with 3 comments
- THEN the response is 200 `{ items, page, pageSize, total }` with the 3 comments oldest first

#### Scenario: S-DEV1010-03 Non-member cannot create or list
- WHEN a user who is not a member of the project POSTs or GETs comments
- THEN the response is 404 NOT_FOUND and no comment is stored

#### Scenario: S-DEV1010-04 Invalid body is rejected
- WHEN a member POSTs an empty body, a 2001-character body or a missing body
- THEN the response is 422 VALIDATION_ERROR with details naming `body`

#### Scenario: S-DEV1010-05 Unknown task is not found
- WHEN a member POSTs a comment to a taskId that does not exist in that project
- THEN the response is 404 NOT_FOUND

### Requirement: Edit comment
Only the comment author SHALL edit a comment (PATCH, same body rule); any other member, including the project OWNER, gets 403 FORBIDDEN.

#### Scenario: S-DEV1010-06 Author edits own comment
- WHEN the author PATCHes `{ "body": "Updated" }`
- THEN the response is 200 with the new body and an `updatedAt` later than `createdAt`

#### Scenario: S-DEV1010-07 Non-author cannot edit
- WHEN another member or the project OWNER PATCHes a comment they did not write
- THEN the response is 403 FORBIDDEN and the body is unchanged

#### Scenario: S-DEV1010-08 Edit validation and missing comment
- WHEN the author PATCHes a 2001-character body, or any member PATCHes an unknown commentId
- THEN the responses are 422 VALIDATION_ERROR and 404 NOT_FOUND respectively

### Requirement: Delete comment
The comment author or the project OWNER SHALL delete a comment (204); any other member gets 403 FORBIDDEN; a non-member gets 404.

#### Scenario: S-DEV1010-09 Author deletes own comment
- WHEN the author DELETEs the comment
- THEN the response is 204 and the comment is gone from the list

#### Scenario: S-DEV1010-10 Project owner deletes any comment
- WHEN the project OWNER DELETEs a comment written by a MEMBER
- THEN the response is 204

#### Scenario: S-DEV1010-11 Other member cannot delete
- WHEN a MEMBER who is not the author DELETEs the comment
- THEN the response is 403 FORBIDDEN and the comment remains

#### Scenario: S-DEV1010-12 Non-member cannot edit or delete
- WHEN a non-member PATCHes or DELETEs a comment
- THEN the response is 404 NOT_FOUND

### Requirement: Comments are read-only on archived tasks
Creating, editing or deleting a comment on an archived task SHALL return 409 CONFLICT; listing stays allowed.

#### Scenario: S-DEV1010-13 Archived task blocks comment writes
- WHEN a member POSTs, PATCHes or DELETEs a comment on an archived task
- THEN each response is 409 CONFLICT and nothing changes

#### Scenario: S-DEV1010-14 Archived task comments remain readable
- WHEN a member GETs comments of an archived task
- THEN the response is 200 with its existing comments

### Requirement: Task changes are recorded as activity
The task service SHALL record an `ActivityLog` row (`projectId`, `taskId`, `actorId`, `action`, `metadata`, `createdAt`) for task.created, task.assigned (`{from,to}` assignee ids), task.status_changed (`{from,to}`) and task.archived, in the same database transaction as the task change. Comments write no activity.

#### Scenario: S-DEV1010-15 Task creation is recorded
- WHEN a member creates a task
- THEN one row with action `task.created`, the task id and the creator as `actorId` exists

#### Scenario: S-DEV1010-16 Assignment is recorded with from/to
- WHEN a task is reassigned from user A to user B (or from none to B)
- THEN one `task.assigned` row has metadata `{ "from": A-or-null, "to": B }` and the caller as actor

#### Scenario: S-DEV1010-17 Status change is recorded with from/to
- WHEN a task moves from TODO to IN_PROGRESS
- THEN one `task.status_changed` row has metadata `{ "from": "TODO", "to": "IN_PROGRESS" }`

#### Scenario: S-DEV1010-18 Archiving is recorded
- WHEN a task is archived
- THEN one `task.archived` row exists with the caller as actor

#### Scenario: S-DEV1010-19 Activity is atomic with the task change
- WHEN the activity insert fails during a status change (forced repository error)
- THEN the request fails, the task status is unchanged and no activity row exists; conversely a failing task update leaves no activity row

#### Scenario: S-DEV1010-20 Rejected changes write no activity
- WHEN a status change is rejected with INVALID_STATUS_TRANSITION
- THEN no activity row is added

### Requirement: List activity
A project member SHALL GET `.../tasks/:taskId/activity` paginated, newest first, as `{ items, page, pageSize, total }` with entries `{ id, taskId, actorId, action, metadata, createdAt }`; a non-member gets 404 NOT_FOUND.

#### Scenario: S-DEV1010-21 Activity is newest first and paginated
- WHEN a member GETs activity with `page=1&pageSize=2` for a task with 3 entries
- THEN the response is 200 with the 2 newest entries, `total` 3, `page` 1, `pageSize` 2

#### Scenario: S-DEV1010-22 Non-member cannot read activity
- WHEN a non-member GETs the activity of a task
- THEN the response is 404 NOT_FOUND

#### Scenario: S-DEV1010-23 Activity pagination is validated
- WHEN a member GETs activity with `pageSize=101` or `page=0`
- THEN the response is 422 VALIDATION_ERROR

### Requirement: Shared contract
`packages/shared` SHALL export Zod schemas and inferred types `Comment`, `CreateCommentInput`, `UpdateCommentInput`, `ActivityEntry` and the `ActivityAction` enum (the 4 actions); backend and frontend import them.

#### Scenario: S-DEV1010-24 Shared schemas validate the contract
- WHEN the shared schemas parse a valid and an invalid sample
- THEN `CreateCommentInput` accepts 1 and 2000 chars and rejects 0 and 2001, and `ActivityAction` accepts only the 4 actions
