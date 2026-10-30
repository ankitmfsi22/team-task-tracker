# tasks Specification

## Purpose
Task management inside a project: create, view, list, update, assign, status flow and archive, with project-member authorization.

## ADDED Requirements

### Requirement: Shared task contract
The shared package SHALL export Task, CreateTaskInput and UpdateTaskInput schemas and types, the task error codes and the canTransition helper.

#### Scenario: S-DEV1008-01 CreateTaskInput accepts a minimal body
- WHEN parsing `{ title: 'A' }` with CreateTaskInputSchema
- THEN it succeeds with status and priority left to server defaults

#### Scenario: S-DEV1008-02 CreateTaskInput rejects bad fields
- WHEN parsing an empty title, a title over 200 chars, description over 5000, priority `HUGE` or dueDate `31/12/2026`
- THEN it fails with an issue per offending field

#### Scenario: S-DEV1008-03 UpdateTaskInput requires at least one field and allows null
- WHEN parsing `{}` and `{ assigneeId: null, dueDate: null, description: null }`
- THEN `{}` fails and the null body succeeds

#### Scenario: S-DEV1008-04 Task error codes and transition helper are exported
- WHEN importing ErrorCodeSchema and canTransition from the shared index
- THEN ASSIGNEE_NOT_MEMBER, INVALID_TRANSITION and TASK_ARCHIVED parse, and canTransition('TODO','IN_PROGRESS') is true while ('TODO','DONE') and ('TODO','TODO') are false

### Requirement: Create task
`POST /api/projects/:projectId/tasks` SHALL let any project member create a task whose assignee, if given, is a project member.

#### Scenario: S-DEV1008-05 Owner creates a task with defaults
- WHEN an OWNER POSTs `{ title }` to /api/projects/:projectId/tasks
- THEN the response is 201 with status TODO, priority MEDIUM, assigneeId null, archivedAt null and createdById the caller
- AND the row exists in the database

#### Scenario: S-DEV1008-06 Member creates an assigned task
- WHEN a MEMBER POSTs title, description, priority HIGH, dueDate `2026-12-31` and assigneeId of another member
- THEN the response is 201 and returns those values

#### Scenario: S-DEV1008-07 Create rejects a non-member assignee
- WHEN a member POSTs a task with an assigneeId whose user is not a member of the project
- THEN the response is 422 ASSIGNEE_NOT_MEMBER and no task is created

#### Scenario: S-DEV1008-08 Create validation failure
- WHEN a member POSTs an empty title and priority `HUGE`
- THEN the response is 422 VALIDATION_ERROR with details for `title` and `priority`

#### Scenario: S-DEV1008-09 Create by a non-member is hidden
- WHEN a user who is not a member POSTs a valid task
- THEN the response is 404 NOT_FOUND and no task is created

#### Scenario: S-DEV1008-10 Unauthenticated access is rejected
- WHEN any tasks endpoint is called without a bearer token
- THEN the response is 401 UNAUTHORIZED

### Requirement: List tasks
`GET /api/projects/:projectId/tasks` SHALL return the non-archived tasks of the project, newest first, to members only.

#### Scenario: S-DEV1008-11 List returns tasks newest first
- WHEN a member GETs the project tasks after three tasks were created in order
- THEN the response is 200 with `items` ordered newest first

#### Scenario: S-DEV1008-12 List excludes archived tasks and other projects
- WHEN the project has an archived task and another project has a task
- THEN the list contains neither

#### Scenario: S-DEV1008-13 List by a non-member is hidden
- WHEN a non-member GETs the project tasks
- THEN the response is 404 NOT_FOUND

### Requirement: Get task
`GET /api/projects/:projectId/tasks/:taskId` SHALL return a task of the project, archived or not, to members only.

#### Scenario: S-DEV1008-14 Get returns one task
- WHEN a member GETs /tasks/:taskId
- THEN the response is 200 with the full task

#### Scenario: S-DEV1008-15 Get an archived task still works
- WHEN a member GETs an archived task
- THEN the response is 200 with archivedAt set

#### Scenario: S-DEV1008-16 Get unknown or foreign task is 404
- WHEN a member GETs a random UUID, and a task id that belongs to another project
- THEN both responses are 404 NOT_FOUND

#### Scenario: S-DEV1008-17 Get with a malformed id
- WHEN a member GETs /tasks/not-a-uuid
- THEN the response is 422 VALIDATION_ERROR

### Requirement: Update task
`PATCH /api/projects/:projectId/tasks/:taskId` SHALL update fields, assignee and status for an OWNER or for a MEMBER who created or is assigned the task, applying shared canTransition.

#### Scenario: S-DEV1008-18 Owner updates any task
- WHEN an OWNER PATCHes title, priority and dueDate of a task created by a MEMBER
- THEN the response is 200 with the new values

#### Scenario: S-DEV1008-19 Member updates own or assigned task
- WHEN a MEMBER PATCHes a task they created, and a task assigned to them
- THEN both responses are 200

#### Scenario: S-DEV1008-20 Member cannot update someone else's task
- WHEN a MEMBER PATCHes a task created by and assigned to others
- THEN the response is 403 FORBIDDEN and the task is unchanged

#### Scenario: S-DEV1008-21 Update assigns and unassigns
- WHEN an authorized user PATCHes assigneeId to a member, then to null
- THEN the assignee is set, then cleared

#### Scenario: S-DEV1008-22 Update rejects a non-member assignee
- WHEN a user PATCHes assigneeId of a non-member
- THEN the response is 422 ASSIGNEE_NOT_MEMBER and the task is unchanged

#### Scenario: S-DEV1008-23 Valid status transition
- WHEN a task in TODO is PATCHed to IN_PROGRESS, then to IN_REVIEW, DONE and back to IN_REVIEW
- THEN each response is 200 with the new status

#### Scenario: S-DEV1008-24 Invalid status transition
- WHEN a task in TODO is PATCHed to DONE, and another PATCH repeats the current status
- THEN both responses are 409 INVALID_TRANSITION and the status is unchanged

#### Scenario: S-DEV1008-25 Update validation failure
- WHEN a member PATCHes `{}`, and `{ status: 'DOING' }`
- THEN both responses are 422 VALIDATION_ERROR

#### Scenario: S-DEV1008-26 Update by a non-member is hidden
- WHEN a non-member PATCHes a task
- THEN the response is 404 NOT_FOUND

### Requirement: Archive task
`POST /api/projects/:projectId/tasks/:taskId/archive` SHALL let only an OWNER archive a task, and archived tasks MUST reject changes.

#### Scenario: S-DEV1008-27 Owner archives a task
- WHEN an OWNER POSTs /tasks/:taskId/archive
- THEN the response is 200 with archivedAt set and the row is kept

#### Scenario: S-DEV1008-28 Member cannot archive
- WHEN a MEMBER POSTs /archive on a task they created
- THEN the response is 403 FORBIDDEN and archivedAt stays null

#### Scenario: S-DEV1008-29 Archive by a non-member is hidden
- WHEN a non-member POSTs /archive
- THEN the response is 404 NOT_FOUND

#### Scenario: S-DEV1008-30 Archived task is read-only
- WHEN an OWNER PATCHes an archived task, and POSTs /archive on it again
- THEN both responses are 409 TASK_ARCHIVED
