## Approach
One dependency-free Node script, `scripts/check-changes.mjs [--root <dir>] [--ready]`, in the style of check-scenarios.mjs. Exit 1 with one line per violation.

## Checks per change folder (openspec/changes/* and archive/*)
- proposal.md: at most 15 lines; contains a Linear issue URL `linear.app/.../issue/DEV-n` where n = ticket - 1000 + 4.
- design.md (if present): at most 35 lines. tasks.md exists.
- approvals.md exists and is one of: `Approved by <name> on <date>`; the bootstrap/retro form (`Bootstrap change, no human gate: <reason>`); the exact waiver sentence; `Status: PENDING human Gate 1 (batch approval)`.
- review.md exists; with `--ready`, and always for archived changes, it has a `Verdict:` line (PASS or BLOCKING).
- specs/**: every `#### Scenario: S-DEVnnnn-nn` uses the ticket of the folder name `dev-nnnn-slug`.
- README status table: a row mentions the folder name (archived: with or without date prefix) and a `linear.app` link; archived rows also need a PR link.

## Modes
Default (local, draft): PENDING allowed, Verdict optional for active changes. `--ready` (CI on non-draft PRs): PENDING fails, Verdict required. Archived changes are always strict.

## Wiring
`pnpm check:changes`; CI verify runs it after check:scenarios, adding `--ready` when the PR is not a draft; tests in scripts/check-changes.test.mjs run by `pnpm test:tooling`.

## Docs
README Workflow section lists the 12 commands present (`openspec config profile` selects, `openspec update` regenerates `.claude/`), notes the profile lives in the global config `~/.config/openspec/config.json`, and describes Gate 1/Gate 2/archive. Verification: DEV-1002 (archived) passes the script.

## Risks
Regexes are format-coupled to the README table; mitigated by tests on fixtures.
