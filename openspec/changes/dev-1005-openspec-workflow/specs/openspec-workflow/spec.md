## Purpose

Make the OpenSpec ticket workflow checkable: documented commands, approval gates, size limits, traceability and archival, enforced by `scripts/check-changes.mjs`.

## ADDED Requirements

### Requirement: Native commands are documented
The README SHALL list the native `/opsx:*` commands present in `.claude/commands/opsx/` and explain the expanded profile.

#### Scenario: S-DEV1005-01 Every installed command is documented
- WHEN the files in `.claude/commands/opsx/` are compared with the README
- THEN each `/opsx:<name>` appears in the README Workflow section

#### Scenario: S-DEV1005-02 Profile and global config are documented
- WHEN the README Workflow section is read
- THEN it mentions `openspec config profile`, `openspec update` and the global config file

### Requirement: Change size and content limits
`pnpm check:changes` SHALL fail when a change breaks the size or content rules.

#### Scenario: S-DEV1005-03 Long proposal fails
- WHEN a proposal.md has 16 lines
- THEN the script exits 1 naming proposal.md

#### Scenario: S-DEV1005-04 Proposal without Linear link fails
- WHEN a proposal.md has no Linear issue URL, or one that does not match the ticket (n - 1000 + 4)
- THEN the script exits 1 naming proposal.md

#### Scenario: S-DEV1005-05 Long design fails
- WHEN a design.md has 36 lines
- THEN the script exits 1 naming design.md

#### Scenario: S-DEV1005-06 Missing tasks fails
- WHEN a change folder has no tasks.md
- THEN the script exits 1 naming tasks.md

### Requirement: Approval gate is recorded
Every change SHALL have an approvals.md in an accepted form.

#### Scenario: S-DEV1005-07 Missing approvals fails
- WHEN a change folder has no approvals.md
- THEN the script exits 1 naming approvals.md

#### Scenario: S-DEV1005-08 Accepted forms pass
- WHEN approvals.md is `Approved by <name> on <date>`, the bootstrap form, or the exact waiver sentence
- THEN the script exits 0

#### Scenario: S-DEV1005-09 Unrecognised approval fails
- WHEN approvals.md holds any other text such as `approved`
- THEN the script exits 1 naming approvals.md

#### Scenario: S-DEV1005-10 Pending is allowed only while draft
- WHEN approvals.md is `Status: PENDING human Gate 1 (batch approval)`
- THEN the script exits 0 by default and exits 1 with `--ready`

### Requirement: Review verdict
A non-draft or archived change SHALL have a review.md whose last `Verdict:` line starts with PASS.

#### Scenario: S-DEV1005-11 Missing verdict fails when ready
- WHEN review.md has no `Verdict:` line
- THEN the script exits 0 by default and exits 1 with `--ready`

#### Scenario: S-DEV1005-12 Archived change needs verdict and review
- WHEN an archived change has no review.md or no `Verdict:` line
- THEN the script exits 1 even without `--ready`

#### Scenario: S-DEV1005-18 Only a PASS verdict passes when ready
- WHEN the last `Verdict:` line of review.md is BLOCKING, empty or any value not starting with PASS
- THEN the script exits 0 by default and exits 1 with `--ready` (and always for archived changes); `Verdict: PASS` passes

### Requirement: Scenario ids belong to the ticket
Scenario ids in a change SHALL carry the ticket of the folder name.

#### Scenario: S-DEV1005-13 Foreign scenario id fails
- WHEN folder `dev-1005-x` has a scenario `S-DEV1006-01`
- THEN the script exits 1 naming the spec file

### Requirement: README status table lists every change
Every active and archived change SHALL appear in the README status table with a Linear link, and archived ones with a PR link.

#### Scenario: S-DEV1005-14 Unlisted change fails
- WHEN a change folder name appears in no README table row
- THEN the script exits 1 naming the change

#### Scenario: S-DEV1005-15 Archived row needs Linear and PR links
- WHEN an archived change row lacks a `linear.app` link or a `/pull/` link
- THEN the script exits 1 naming the change

### Requirement: Repository state passes and is wired
The repository SHALL pass the script, which runs in CI and in `pnpm test:tooling`.

#### Scenario: S-DEV1005-16 Archived DEV-1002 passes
- WHEN the script runs on the repository root
- THEN it exits 0 and checks the archived dev-1002-claude-code-setup change

#### Scenario: S-DEV1005-17 Script is wired
- WHEN package.json and ci.yml are read
- THEN `check:changes` exists as a script and the CI verify job runs it

### Requirement: CI hardening
The CI workflow SHALL re-run when a draft is marked ready and SHALL typecheck before the tests.

#### Scenario: S-DEV1005-19 CI re-runs when a draft is marked ready
- WHEN ci.yml is read
- THEN the pull_request trigger lists opened, synchronize, reopened and ready_for_review

#### Scenario: S-DEV1005-20 CI verify typechecks before the tests
- WHEN the verify job is read
- THEN it runs `pnpm typecheck` before `pnpm test`

### Requirement: Link and approval validation
The Linear link SHALL be an anchored `https://linear.app/<workspace>/issue/DEV-<n>` URL and approvals SHALL be a single valid line.

#### Scenario: S-DEV1005-21 Linear link must be an anchored linear.app issue URL
- WHEN proposal.md only has a URL on another host, a bare `linear.app/...` or an `http://` link
- THEN the script exits 1 naming proposal.md

#### Scenario: S-DEV1005-22 Approval date must be real and the file a single line
- WHEN approvals.md has a date such as 2026-02-30, trailing text or extra lines
- THEN the script exits 1 naming approvals.md
