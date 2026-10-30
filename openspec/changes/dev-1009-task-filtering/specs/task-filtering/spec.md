## Purpose

Filtering, sorting and pagination of the project task list `GET /api/projects/:projectId/tasks` (introduced by DEV-1008).

## ADDED Requirements

### Requirement: Shared query contract
`packages/shared` SHALL export a Zod `TaskListQuery` schema and `TaskListResponse` type that backend and frontend import.

#### Scenario: S-DEV1009-01 Defaults applied
- WHEN `TaskListQuery` parses an empty object
- THEN the result has page 1, pageSize 20, sort createdAt, order desc and includeArchived false

#### Scenario: S-DEV1009-02 Multi-value params parse
- WHEN `TaskListQuery` parses `status=TODO&status=DONE` and `priority=HIGH,URGENT`
- THEN status is [TODO, DONE] and priority is [HIGH, URGENT]

#### Scenario: S-DEV1009-03 Unknown param rejected
- WHEN `TaskListQuery` parses an object containing `foo=1`
- THEN parsing fails

### Requirement: Filtering
The endpoint SHALL return only tasks of the project that match every supplied filter; values inside one multi-value filter match any.

#### Scenario: S-DEV1009-04 Filter by status
- WHEN a member requests `?status=TODO`
- THEN 200 and every item has status TODO

#### Scenario: S-DEV1009-05 Filter by multiple statuses
- WHEN a member requests `?status=TODO&status=DONE`
- THEN 200 and items are only TODO or DONE tasks

#### Scenario: S-DEV1009-06 Filter by priority
- WHEN a member requests `?priority=HIGH&priority=URGENT`
- THEN 200 and items are only HIGH or URGENT tasks

#### Scenario: S-DEV1009-07 Filter by assignee
- WHEN a member requests `?assigneeId=<member id>`
- THEN 200 and every item is assigned to that member

#### Scenario: S-DEV1009-08 Filter unassigned
- WHEN a member requests `?assigneeId=unassigned`
- THEN 200 and every item has assigneeId null

#### Scenario: S-DEV1009-09 Due date range inclusive
- WHEN a member requests `?dueFrom=2026-11-01&dueTo=2026-11-30`
- THEN 200 and every item has a dueDate within that range, bounds included, and tasks without dueDate are excluded

#### Scenario: S-DEV1009-10 Filters combine with AND
- WHEN a member requests `?status=IN_PROGRESS&priority=HIGH&assigneeId=<member id>`
- THEN 200 and every item matches all three filters and `total` counts only those

#### Scenario: S-DEV1009-11 Archived excluded by default
- WHEN a member requests the list while an archived task exists
- THEN the archived task is not in items and not in total

#### Scenario: S-DEV1009-12 Archived included on request
- WHEN a member requests `?includeArchived=true`
- THEN the archived task is in items

#### Scenario: S-DEV1009-13 Other projects never leak
- WHEN a member requests the list of project A while project B has matching tasks
- THEN no item belongs to project B

### Requirement: Sorting
The endpoint SHALL sort by a whitelisted `sort` field (`dueDate`, `priority`, `createdAt`) in `order` asc or desc, defaulting to createdAt desc, with a stable tie-break on id.

#### Scenario: S-DEV1009-14 Sort by dueDate ascending
- WHEN a member requests `?sort=dueDate&order=asc`
- THEN items are ordered by dueDate earliest first

#### Scenario: S-DEV1009-15 Null dueDate last in both orders
- WHEN a member requests `?sort=dueDate` with `order=asc` and then `order=desc`
- THEN tasks without dueDate appear after all dated tasks in both responses

#### Scenario: S-DEV1009-16 Priority sorts by rank
- WHEN a member requests `?sort=priority&order=desc`
- THEN items are ordered URGENT, HIGH, MEDIUM, LOW, not alphabetically

#### Scenario: S-DEV1009-17 Sort by createdAt
- WHEN a member requests `?sort=createdAt&order=asc`
- THEN items are ordered oldest first

#### Scenario: S-DEV1009-18 Default order
- WHEN a member requests the list with no sort or order
- THEN items are ordered by createdAt descending

#### Scenario: S-DEV1009-19 Sort with filter
- WHEN a member requests `?status=TODO&sort=priority&order=asc`
- THEN items are only TODO tasks ordered LOW to URGENT

### Requirement: Pagination envelope
The endpoint SHALL return `{ items, page, pageSize, total, totalPages }` per SDS 4.1, with `pageSize` defaulting to 20 and at most 100.

#### Scenario: S-DEV1009-20 Default pagination
- WHEN a member requests the list with 25 matching tasks and no page params
- THEN 200 with 20 items, page 1, pageSize 20, total 25, totalPages 2

#### Scenario: S-DEV1009-21 Second page
- WHEN a member requests `?page=2&pageSize=20` with 25 matching tasks
- THEN 200 with 5 items and no task repeated from page 1

#### Scenario: S-DEV1009-22 Page beyond the last
- WHEN a member requests `?page=99`
- THEN 200 with empty items and the true total

#### Scenario: S-DEV1009-23 Empty result
- WHEN no task matches the filters
- THEN 200 with items [], total 0, totalPages 0

#### Scenario: S-DEV1009-24 Maximum page size
- WHEN a member requests `?pageSize=100` and then `?pageSize=101`
- THEN the first returns 200 and the second returns 422 VALIDATION_ERROR

#### Scenario: S-DEV1009-25 Total ignores paging
- WHEN a member requests `?pageSize=5&status=TODO` with 12 TODO tasks
- THEN items has 5 entries and total is 12

### Requirement: Query validation
Invalid query values SHALL be rejected with 422 `VALIDATION_ERROR` and `details` naming each offending field.

#### Scenario: S-DEV1009-26 Invalid enum values
- WHEN a member requests `?status=BOGUS&priority=NOPE`
- THEN 422 VALIDATION_ERROR with details containing fields status and priority

#### Scenario: S-DEV1009-27 Non-whitelisted sort
- WHEN a member requests `?sort=title` or `?order=sideways`
- THEN 422 VALIDATION_ERROR with details naming sort or order

#### Scenario: S-DEV1009-28 Bad paging values
- WHEN a member requests `?page=0`, `?page=abc` or `?pageSize=0`
- THEN 422 VALIDATION_ERROR with details naming the field

#### Scenario: S-DEV1009-29 Bad dates and range
- WHEN a member requests `?dueFrom=not-a-date` or `?dueFrom=2026-12-01&dueTo=2026-11-01`
- THEN 422 VALIDATION_ERROR with details naming dueFrom or dueTo

#### Scenario: S-DEV1009-30 Bad assignee value
- WHEN a member requests `?assigneeId=abc`
- THEN 422 VALIDATION_ERROR with details naming assigneeId

### Requirement: Access control
Only project members SHALL list tasks; unauthenticated callers and non-members MUST NOT learn the project exists.

#### Scenario: S-DEV1009-31 Non-member gets 404
- WHEN an authenticated non-member requests the list, with or without filters
- THEN 404 NOT_FOUND

#### Scenario: S-DEV1009-32 Unauthenticated gets 401
- WHEN a request without a token lists tasks
- THEN 401 UNAUTHORIZED

#### Scenario: S-DEV1009-33 Any member role may list
- WHEN a MEMBER (not OWNER) requests the list
- THEN 200 (a 403 does not apply to this read endpoint)
