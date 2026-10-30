## Purpose

Safe, documented use of the Linear and Context7 MCP servers, with a labelled fixture fallback that is never presented as live data.

## ADDED Requirements

### Requirement: MCP server configuration
`.mcp.json` SHALL declare Linear (http) and Context7 (pinned) and SHALL NOT contain secrets.

#### Scenario: S-DEV1004-01 Servers declared without secrets
- WHEN `.mcp.json` is read
- THEN it declares a Linear server of type http at `https://mcp.linear.app/mcp` and a Context7 server, and contains no `env`, `headers`, token, key or `Authorization` value

#### Scenario: S-DEV1004-02 Context7 is pinned
- WHEN the Context7 server args are read
- THEN they include the exact version `@upstash/context7-mcp@4.4.4` and no floating tag or version range

#### Scenario: S-DEV1004-03 Linear write tools require approval
- WHEN `.claude/settings.json` is read
- THEN `ask` contains the Linear write tools save_issue, save_project and save_comment and `allow` contains none of them

### Requirement: MCP documentation
`docs/MCP.md` SHALL be one page of tables covering setup, operations, permissions, evidence and failure handling.

#### Scenario: S-DEV1004-04 Failure modes documented
- WHEN `docs/MCP.md` is read
- THEN its failure-handling table lists server unavailable, auth failure or expired OAuth, missing ticket, malformed response, unsupported operation and rate limit

#### Scenario: S-DEV1004-05 Evidence and operations present
- WHEN `docs/MCP.md` is read
- THEN it contains setup, supported operations, permissions, a timestamped DEV-5 get_issue result, a missing-ticket error and a Context7 resolve-library-id plus query-docs lookup, and is at most 120 lines

### Requirement: Labelled fixture fallback
Fixtures and the ticket-source script SHALL label fallback data and SHALL NOT present it as live.

#### Scenario: S-DEV1004-06 Fixtures are labelled
- WHEN each `fixtures/linear/*.fixture.json` is read
- THEN it has `"source":"FIXTURE - NOT LIVE LINEAR DATA"`

#### Scenario: S-DEV1004-07 Loader labels its output
- WHEN `node scripts/ticket-source.mjs <id>` loads an existing fixture ticket
- THEN stdout starts with a `FIXTURE` banner stating the data is not live Linear data, followed by the ticket fields, and exit code is 0

#### Scenario: S-DEV1004-08 Malformed fixture gives a clear error
- WHEN the loaded file is invalid JSON or lacks a required field (id, title, status or source)
- THEN the script exits non-zero with an error naming the file and the problem, and prints no ticket data

#### Scenario: S-DEV1004-09 Missing ticket is an error, not fabricated data
- WHEN the requested ticket id has no fixture
- THEN the script exits non-zero with a "ticket not found" error and prints no ticket fields

#### Scenario: S-DEV1004-10 Fixture is never shown as live
- WHEN a fixture has a wrong or missing source label, or any ticket is printed
- THEN the mislabelled fixture is rejected and the output never claims the data is live
