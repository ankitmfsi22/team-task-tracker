## Purpose

Keep the OpenSpec commands, config and docs aligned with `docs/reference/SDD-GUIDE.md`, and make `pnpm check:changes` fail when they drift.

## ADDED Requirements

### Requirement: The apply command carries the guide rules
`.claude/commands/opsx/apply.md` SHALL itself instruct the agent to run the test-writer first, commit once per task, run the reviewer in a fresh context after the last task and leave a clean working tree.

#### Scenario: S-DEV1018-01 Apply starts with the test-writer
- WHEN apply.md is read
- THEN it tells the agent to invoke the test-writer agent to write failing tests from the spec scenarios before implementing

#### Scenario: S-DEV1018-02 Apply commits once per task
- WHEN apply.md is read
- THEN it requires one commit per task

#### Scenario: S-DEV1018-03 Apply ends with a fresh-context review
- WHEN apply.md is read
- THEN it requires the reviewer agent to run in fresh context after the last task and its output to be written to review.md

#### Scenario: S-DEV1018-04 Apply checks the tree is clean
- WHEN apply.md is read
- THEN it requires `git status --porcelain` to be empty after the review run

### Requirement: Other commands enforce the gates
The verify, propose and archive commands SHALL carry the review and approval rules.

#### Scenario: S-DEV1018-05 Verify requires the reviewer report
- WHEN verify.md is read
- THEN it requires the reviewer agent report and a review.md verdict

#### Scenario: S-DEV1018-06 Propose creates approvals.md
- WHEN propose.md is read
- THEN it requires approvals.md to be created with Gate 1 pending

#### Scenario: S-DEV1018-07 Archive keeps approvals and review
- WHEN archive.md is read
- THEN it requires approvals.md and review.md to stay in the archived change

### Requirement: Config matches the real workflow
`openspec/config.yaml` SHALL describe Gate 1 as a human batch approval and archive as a separate small PR after merge.

#### Scenario: S-DEV1018-08 No stale waiver line
- WHEN openspec/config.yaml is read
- THEN no line contains the word "waived"

#### Scenario: S-DEV1018-09 Archive rule matches README
- WHEN the archive guidance in openspec/config.yaml is read
- THEN it says archive is a separate small PR after merge

### Requirement: Decisions are recorded
`docs/decisions/` SHALL hold at least three ADRs of at most 15 lines each, linked from AGENTS.md.

#### Scenario: S-DEV1018-10 Three short ADRs are linked
- WHEN docs/decisions is listed
- THEN it has at least 3 files (JWT/refresh cookie, 409 INVALID_TRANSITION, Linear instead of Plane), each at most 15 lines and linked from AGENTS.md

### Requirement: Approvals stay honest
Retroactive records SHALL NOT claim a human approved.

#### Scenario: S-DEV1018-11 DEV-1001 and DEV-1002 claim no human approval
- WHEN the approvals.md of the archived DEV-1001 and DEV-1002 changes are read
- THEN they hold the bootstrap or waiver line and no "Approved by" line

### Requirement: README states deviations and how to verify
README SHALL list the departures from the guide and point to `pnpm check:changes`.

#### Scenario: S-DEV1018-12 Deviations and verify line present
- WHEN the README is read
- THEN the Deviations section mentions no human PR review and tests committed with the implementation, and a "How to verify" line names `pnpm check:changes`

### Requirement: check:changes enforces the alignment
`pnpm check:changes` SHALL fail when the aligned files drift.

#### Scenario: S-DEV1018-13 Apply without test-writer or reviewer fails
- WHEN apply.md lacks the word test-writer or reviewer
- THEN check:changes exits non-zero and names the file

#### Scenario: S-DEV1018-14 Waived line in config fails
- WHEN openspec/config.yaml contains the word "waived"
- THEN check:changes exits non-zero

#### Scenario: S-DEV1018-15 Too few ADRs fails
- WHEN docs/decisions has fewer than 3 files
- THEN check:changes exits non-zero

#### Scenario: S-DEV1018-16 Aligned repo passes
- WHEN check:changes runs on the aligned repository
- THEN it exits zero

### Requirement: Approvals name what was approved
An `approvals.md` that records a human approval SHALL also contain the sentence `proposal, design, specs and tasks approved by <name> on <date>`, and `pnpm check:changes` SHALL require it.

#### Scenario: S-DEV1018-17 Archived DEV-1003 to DEV-1005 name the approval
- WHEN the approvals.md of the archived DEV-1003, DEV-1004 and DEV-1005 changes are read
- THEN each contains `proposal, design, specs and tasks approved by Ankit on 2026-10-30` on its own line after the original line

#### Scenario: S-DEV1018-18 Two-line approvals pass the checker
- WHEN an approvals.md holds the `Approved by <name> on <date>` line followed by the approved-sentence line
- THEN check:changes accepts it

#### Scenario: S-DEV1018-19 Missing sentence fails the checker
- WHEN an approvals.md holds only the `Approved by <name> on <date>` line
- THEN check:changes exits non-zero and names the file

### Requirement: The guard blocks network download tools
The Bash guard hook SHALL block `curl` and `wget`.

#### Scenario: S-DEV1018-20 curl is blocked
- WHEN the guard receives a Bash command running curl
- THEN it exits with code 2 and prints a reason

#### Scenario: S-DEV1018-21 wget is blocked
- WHEN the guard receives a Bash command running wget
- THEN it exits with code 2 and prints a reason

#### Scenario: S-DEV1018-22 Ordinary commands stay allowed
- WHEN the guard receives `git status`, `gh pr list` and a path containing the text "curly"
- THEN it exits with code 0

### Requirement: Explore evidence exists for one real ticket
One real `/opsx:explore` run on DEV-1011 SHALL be recorded, without inventing history for earlier tickets.

#### Scenario: S-DEV1018-23 DEV-1011 explore note is recorded
- WHEN openspec/changes/dev-1018-guide-alignment/explore-dev-1011.md is read
- THEN it has at most 15 lines, cites Linear DEV-15 and states it is the evidence of one /opsx:explore run

### Requirement: DB changes get the db-change-checker
The db-change-checker agent SHALL be run on DEV-1006's DB surface, and the note SHALL say honestly what was checked.

#### Scenario: S-DEV1018-24 DEV-1006 DB check is recorded honestly
- WHEN openspec/changes/dev-1018-guide-alignment/db-check-dev-1006.md is read
- THEN it states that DEV-1006 adds no migration, names the User and RefreshToken tables and the db-change-checker agent, and holds the agent's findings table

### Requirement: Propose asks for approval of all four artifacts
The propose command's final message SHALL tell the user to approve proposal, design, specs and tasks.

#### Scenario: S-DEV1018-25 Propose asks to approve all four artifacts
- WHEN propose.md is read
- THEN its final-output instructions tell the user to approve the proposal, design, specs and tasks before apply
