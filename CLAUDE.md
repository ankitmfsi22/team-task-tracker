# CLAUDE.md
@AGENTS.md

## Workflow (spec-driven, one ticket per session)

1. Fetch the ticket with `mcp__linear-server__get_issue` (Linear id `DEV-(n-1000+4)`, so `DEV-1001` is Linear `DEV-5`). Verify the key and its dependencies.
2. `/opsx:explore`, then `/opsx:propose dev-10xx-short-name`: writes proposal, specs, design, tasks, plus `approvals.md` and a `review.md` stub. `pnpm exec openspec validate <change> --strict` must pass.
3. Approval: the human gate is waived on the senior's instruction. `approvals.md` holds exactly: `Human gate waived on senior's instruction; spec checked by openspec validate --strict + reviewer sub-agent`. Never claim a human approved.
4. `/opsx:apply`: the test-writer agent writes the failing tests first, then implement, one commit per task, with a build, lint and test checkpoint per phase.
5. `/opsx:verify` plus the reviewer sub-agent (fresh context, read-only) writes findings and a PASS or BLOCKING verdict into `review.md`; fix every BLOCKING finding.
6. `/create-pr`, wait until CI is green, squash merge, then `/opsx:sync` and `/opsx:archive`, then `pnpm spec:validate` and `pnpm check:scenarios`.

Commands, profile setup and the Gate 1 / Gate 2 procedure: README "Workflow"; `pnpm check:changes` enforces the change rules.

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
- OpenSpec commands live in `.claude/commands/opsx/`, plus `/create-pr`; skills in `.claude/skills/`.
- Hooks in `.claude/hooks/` (guard, format, stop) and permissions in `.claude/settings.json`. Layer rules: `backend/`, `frontend/`, `packages/shared/` `CLAUDE.md`. Requirements index: `docs/FRS.md`.
