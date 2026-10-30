## Purpose

Project sub-agent definitions with least-privilege tools, so implementation, testing, review and coordination are performed by separate agents with documented limits.

## ADDED Requirements

### Requirement: Agent definition files
Each of reviewer, test-writer, db-change-checker, security-auditor, implementer and coordinator SHALL exist as `.claude/agents/<name>.md` with frontmatter `name`, `description`, `tools` and `model`.

#### Scenario: S-DEV1003-01 All six agent files have required frontmatter
- WHEN the files in .claude/agents/ are parsed
- THEN exactly six files exist and each has name equal to its filename, a non-empty description, a tools list and a model

#### Scenario: S-DEV1003-02 Tool lists follow least privilege
- WHEN the tools of db-change-checker and security-auditor are read
- THEN db-change-checker is exactly Read, Grep and security-auditor is Read, Grep, Bash without Write or Edit

### Requirement: Reviewer is read-only and independent
The reviewer SHALL have no Write or Edit tool, SHALL return findings to the coordinator, and SHALL read the diff and run tests itself instead of relying on the implementer's summary.

#### Scenario: S-DEV1003-03 Reviewer has no write tools
- WHEN the reviewer tools are read
- THEN they include Read, Grep, Glob, Bash(git diff:*), Bash(git log:*), Bash(pnpm test:*) and exclude Write, Edit and NotebookEdit

#### Scenario: S-DEV1003-04 Reviewer ignores implementer summary
- WHEN the reviewer body is read
- THEN it states it must read git diff and run the tests itself, must not rely on the implementer's summary, and returns findings for the coordinator to persist in review.md

### Requirement: Test-writer never touches implementation
The test-writer SHALL write tests from spec scenarios only and SHALL NOT edit implementation files.

#### Scenario: S-DEV1003-05 Test-writer description forbids editing implementation
- WHEN the test-writer description and body are read
- THEN they forbid editing implementation, state tests come from spec scenarios only, and its tools are Read, Write, Bash

### Requirement: Implementer and coordinator roles
The implementer SHALL implement one tasks.md task per commit, tests first, and run the gates; the coordinator SHALL run the ticket flow spawning one sub-agent per stage and keeping only summaries.

#### Scenario: S-DEV1003-06 Implementer commits per task
- WHEN the implementer body is read
- THEN it requires one commit per task, tests first, and the build, lint, typecheck and test gates

#### Scenario: S-DEV1003-07 Coordinator flow
- WHEN the coordinator body is read
- THEN it lists Linear, explore, propose, apply with test-writer first, verify with reviewer, /create-pr, CI, merge, sync and archive, one sub-agent per stage

### Requirement: Agent documentation
`docs/AGENTS-SETUP.md` SHALL fit one page, list every agent with scope, permitted actions, expected output and restrictions, and give one demonstrated run per agent.

#### Scenario: S-DEV1003-08 AGENTS-SETUP lists all six agents
- WHEN docs/AGENTS-SETUP.md is read
- THEN it names all six agents in a table with the columns agent, scope, permitted actions, expected output, restrictions, and has an Evidence section with one run per agent

### Requirement: Apply uses the test-writer
The apply instruction SHALL state that apply invokes the test-writer first and commits per task.

#### Scenario: S-DEV1003-09 Apply guidance names test-writer
- WHEN openspec/config.yaml operations.apply.guidance and CLAUDE.md are read
- THEN both say apply invokes the test-writer agent first and commits once per task

### Requirement: Retroactive DEV-1001 record
The DEV-1001 bootstrap change SHALL have a retroactive archive record with approvals and a reviewer-agent review.

#### Scenario: S-DEV1003-10 Retro DEV-1001 folder is complete
- WHEN openspec/changes/archive/2026-10-30-dev-1001-project-setup/ is read
- THEN proposal.md is labelled RETROACTIVE, approvals.md holds `Human gate not applicable: bootstrap ticket (installs OpenSpec); retroactive record`, and review.md records the reviewer agent's findings against commit c12dd3d
