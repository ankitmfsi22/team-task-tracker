# Functional Requirements Summary

Short index only. The Linear tickets are authoritative; if this file disagrees with Linear, Linear wins. Technical rules: `docs/SDS.md`.

| ID | Area | Requirement | Ticket |
| --- | --- | --- | --- |
| FR-AUTH-1 | auth | A user registers with email and password | DEV-1006 |
| FR-AUTH-2 | auth | A user logs in and logs out; tokens are handled safely | DEV-1006 |
| FR-PROJ-1 | project | A user creates, reads, updates and deletes projects | DEV-1007 |
| FR-PROJ-2 | project | The owner adds and removes members; non-members get 404 | DEV-1007 |
| FR-TASK-1 | task | Members create, update and delete tasks in a project | DEV-1008 |
| FR-TASK-2 | task | A task has assignee, status, priority and due date | DEV-1008 |
| FR-TASK-3 | task | Task lists paginate, sort and filter | DEV-1009 |
| FR-COMM-1 | comment | Members comment on tasks | DEV-1010 |
| FR-COMM-2 | comment | Task activity history records changes | DEV-1010 |
| FR-WFLOW-1 | workflow | Task status follows the allowed transitions of the SDS | DEV-1008 |
| FR-UI-1 | project | Frontend auth and project pages | DEV-1011 |
| FR-UI-2 | task | Frontend task list, filters and detail pages | DEV-1012 |
| FR-UI-3 | comment | Frontend comments, activity and task editing | DEV-1013 |
