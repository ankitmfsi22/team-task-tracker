## Purpose

Projects with per-project membership and roles (OWNER, MEMBER): create, read, update, archive projects and manage members, with no existence leak to non-members.

## ADDED Requirements

### Requirement: Create project
`POST /api/projects` SHALL create a project and make the caller its OWNER.

#### Scenario: S-DEV1007-01 Create returns project with OWNER role
- WHEN an authenticated user POSTs a valid name and description
- THEN the response is 201 with the project and role OWNER, and the caller is a member with role OWNER

#### Scenario: S-DEV1007-02 Create rejects invalid input
- WHEN the body has an empty or 101-character name
- THEN the response is 422 VALIDATION_ERROR with details naming `name`

#### Scenario: S-DEV1007-03 Create requires authentication
- WHEN no access token is sent
- THEN the response is 401 UNAUTHORIZED

### Requirement: List projects
`GET /api/projects` SHALL return only projects the caller belongs to, paginated.

#### Scenario: S-DEV1007-04 List returns only member projects
- WHEN the caller belongs to project A and not to project B
- THEN the response is 200 and items contain A and not B, with page, pageSize, total and totalPages

#### Scenario: S-DEV1007-05 List rejects invalid pagination
- WHEN `pageSize=101` is sent
- THEN the response is 422 VALIDATION_ERROR

### Requirement: Get project
`GET /api/projects/:projectId` SHALL return the project to any member and hide it from non-members.

#### Scenario: S-DEV1007-06 Member gets project
- WHEN a MEMBER requests the project
- THEN the response is 200 with the project and the caller's role

#### Scenario: S-DEV1007-07 Non-member gets 404
- WHEN a user who is not a member requests the project
- THEN the response is 404 NOT_FOUND, identical to a missing project id

#### Scenario: S-DEV1007-08 Get rejects a malformed id
- WHEN the projectId is not a UUID
- THEN the response is 422 VALIDATION_ERROR

### Requirement: Update project
`PATCH /api/projects/:projectId` SHALL let only an OWNER update name or description of a non-archived project.

#### Scenario: S-DEV1007-09 Owner updates project
- WHEN the OWNER sends a new name
- THEN the response is 200 with the new name and a later updatedAt

#### Scenario: S-DEV1007-10 Member cannot update
- WHEN a MEMBER sends PATCH
- THEN the response is 403 FORBIDDEN and the project is unchanged

#### Scenario: S-DEV1007-11 Non-member update gets 404
- WHEN a non-member sends PATCH
- THEN the response is 404 NOT_FOUND

#### Scenario: S-DEV1007-12 Update rejects invalid input
- WHEN the body is empty or the name is 101 characters
- THEN the response is 422 VALIDATION_ERROR

#### Scenario: S-DEV1007-13 Archived project cannot be updated
- WHEN the OWNER sends PATCH to an archived project
- THEN the response is 409 PROJECT_ARCHIVED

### Requirement: Archive project
`POST /api/projects/:projectId/archive` SHALL let only an OWNER archive the project (soft, `archivedAt` set, nothing deleted).

#### Scenario: S-DEV1007-14 Owner archives project
- WHEN the OWNER posts to archive
- THEN the response is 200 with archivedAt set and the project is still listed and readable

#### Scenario: S-DEV1007-15 Member cannot archive
- WHEN a MEMBER posts to archive
- THEN the response is 403 FORBIDDEN and archivedAt stays null

#### Scenario: S-DEV1007-16 Non-member archive gets 404
- WHEN a non-member posts to archive
- THEN the response is 404 NOT_FOUND

#### Scenario: S-DEV1007-17 Archiving twice is a conflict
- WHEN the OWNER archives an already archived project
- THEN the response is 409 PROJECT_ARCHIVED

### Requirement: List members
`GET /api/projects/:projectId/members` SHALL return the members to any member of the project.

#### Scenario: S-DEV1007-18 Member lists members
- WHEN a MEMBER requests the members
- THEN the response is 200 with userId, email, displayName, role and joinedAt per member, and no passwordHash

#### Scenario: S-DEV1007-19 Non-member list members gets 404
- WHEN a non-member requests the members
- THEN the response is 404 NOT_FOUND

### Requirement: Add member
`POST /api/projects/:projectId/members` SHALL let only an OWNER add an existing user by email as MEMBER to a non-archived project.

#### Scenario: S-DEV1007-20 Owner adds member by email
- WHEN the OWNER posts the email of a registered user (any letter case)
- THEN the response is 201 with the new member with role MEMBER and the user can then GET the project

#### Scenario: S-DEV1007-21 Member cannot add members
- WHEN a MEMBER posts a member
- THEN the response is 403 FORBIDDEN

#### Scenario: S-DEV1007-22 Non-member add gets 404
- WHEN a non-member posts a member
- THEN the response is 404 NOT_FOUND

#### Scenario: S-DEV1007-23 Add rejects invalid email
- WHEN the body email is not a valid email
- THEN the response is 422 VALIDATION_ERROR with details naming `email`

#### Scenario: S-DEV1007-24 Add unknown email
- WHEN no user has the email
- THEN the response is 404 USER_NOT_FOUND

#### Scenario: S-DEV1007-25 Add duplicate member
- WHEN the user is already a member
- THEN the response is 409 CONFLICT

#### Scenario: S-DEV1007-26 Add to archived project
- WHEN the OWNER adds a member to an archived project
- THEN the response is 409 PROJECT_ARCHIVED

### Requirement: Remove member
`DELETE /api/projects/:projectId/members/:userId` SHALL let only an OWNER remove a MEMBER of a non-archived project; the OWNER cannot be removed.

#### Scenario: S-DEV1007-27 Owner removes member
- WHEN the OWNER deletes a MEMBER
- THEN the response is 204 and the user then gets 404 NOT_FOUND on the project

#### Scenario: S-DEV1007-28 Member cannot remove members
- WHEN a MEMBER deletes another member
- THEN the response is 403 FORBIDDEN

#### Scenario: S-DEV1007-29 Non-member remove gets 404
- WHEN a non-member deletes a member
- THEN the response is 404 NOT_FOUND

#### Scenario: S-DEV1007-30 Owner cannot be removed
- WHEN the OWNER deletes the OWNER membership
- THEN the response is 409 OWNER_CANNOT_BE_REMOVED

#### Scenario: S-DEV1007-31 Remove unknown member
- WHEN the userId is not a member of the project
- THEN the response is 404 NOT_FOUND

#### Scenario: S-DEV1007-32 Remove rejects a malformed userId
- WHEN the userId is not a UUID
- THEN the response is 422 VALIDATION_ERROR

#### Scenario: S-DEV1007-33 Remove from archived project
- WHEN the OWNER deletes a member of an archived project
- THEN the response is 409 PROJECT_ARCHIVED
