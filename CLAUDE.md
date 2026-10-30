# CLAUDE.md
@AGENTS.md

## Workflow (spec-driven, one ticket per session)

1. Fetch the ticket first with the Linear MCP tool `mcp__linear-server__get_issue`. The Linear id is `DEV-(n-1000+4)`, so `DEV-1001` is Linear `DEV-5`. Verify the key and its dependencies.
2. `/opsx:propose dev-10xx-short-name` writes the change under `openspec/changes/`. Then STOP.
3. Human approval: the user writes `approved` in the change's `approvals.md`. Never write it yourself, never skip the gate.
4. `/opsx:apply` implements the tasks, tests first, with a build, lint and test checkpoint per phase.
5. `/opsx:verify` checks the code against the change; fix every finding.
6. `/opsx:archive`, then `pnpm spec:validate` and `pnpm check:scenarios`, then open the pull request.

Typos, dependency bumps and small fixes may skip the spec. Run `/clear` between tickets.

## Spec size limits

- `proposal.md` at most 15 lines. `design.md` at most about 30 lines. `tasks.md` a short checklist, independent tasks marked `[PARALLEL]`.
- Specs hold only requirements and scenarios named `S-DEV<ticket>-<nn>` in WHEN/THEN form, one named test per scenario.

## Quality gates

- After every phase: `pnpm build`, `pnpm lint --max-warnings 0`, `pnpm typecheck`, `pnpm test`. Never continue past a failure.
- Definition of done: all gates green, `pnpm spec:validate`, `pnpm check:scenarios`, coverage at least 80% on new code, change archived, PR description lists the scenarios tested.

## Commits, branches, PRs

- Commit: `type(scope): description DEV-10xx`, for example `feat(auth): add login DEV-1006`. Scope and ticket are required; commitlint and Husky enforce it.
- Branch: `feature/<domain>/DEV-10xx-short-name`. One PR per ticket, never push to `main`.
- End commit messages with the attribution line given in the session reminder.

## Where to look

- Error codes, roles, status transitions, auth: `docs/SDS.md`. Endpoints: `docs/api/openapi.yaml` (also `/api/docs`).
- OpenSpec commands live in `.claude/commands/opsx/`, skills in `.claude/skills/openspec-*`.
