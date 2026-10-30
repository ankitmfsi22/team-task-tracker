# Team Task Tracker

A full-stack team task tracker: authenticated users create projects, add members, and manage tasks with assignees, status, priority, due dates, comments and activity history. It is also a spec-driven development exercise: every ticket goes through an approved OpenSpec change before any code.

## Prerequisites

- Node.js 22.21.0 (`.nvmrc`), pnpm 10.34.9 (`corepack enable`; the version is pinned in `package.json`)
- Docker (for PostgreSQL 16 and the full stack)

## Setup

```sh
pnpm install --frozen-lockfile   # installs, sets up Husky, generates the Prisma client
cp .env.example .env             # local container values only, never commit .env
pnpm db:up                       # PostgreSQL 16: dev on 5432, test on 5433
pnpm --filter backend exec prisma migrate deploy
pnpm --filter backend exec prisma db seed   # demo users, one project, a few tasks
pnpm dev                         # API on :3000, Vite on :5173
```

Seeded demo accounts (local only): `owner@example.com` and `member@example.com`, password `demo-password-1`.

## Docker

`docker compose --profile dev up -d --wait` starts only the databases (`pnpm db:up` / `pnpm db:down`). `docker compose --profile full up --build` runs the whole app: PostgreSQL, the backend (migrations run on start) and the frontend behind nginx at http://localhost:8080, which proxies `/api`. Images are pinned and run as a non-root user.

## Scripts

| Script | Purpose |
| --- | --- |
| `pnpm build` | Build shared, backend (Prisma generate + tsc) and frontend |
| `pnpm lint` / `pnpm typecheck` | ESLint (CI uses `--max-warnings 0`) / TypeScript in every package |
| `pnpm format` / `pnpm format:check` | Prettier write / check |
| `pnpm test` | Vitest in every package (backend integration tests need `pnpm db:up`) |
| `pnpm test:tooling` | Node tests of the repo tooling (hooks, commitlint, CI, Docker, scenario checker) |
| `pnpm test:e2e` | Playwright smoke tests (Vite + backend on their own ports, `tasktracker_e2e` database) |
| `pnpm spec:validate` | `openspec validate --all --strict` (skipped while there are no specs) |
| `pnpm check:scenarios` | Every spec scenario has exactly one test titled `S-DEV<ticket>-<nn>` |
| `pnpm check:changes` | OpenSpec change rules: size limits, Linear link, approvals, review verdict, README status table (`--ready` is strict) |
| `pnpm perf:lighthouse` | Lighthouse on the production build (needs `pnpm build`) |
| `pnpm db:up` / `pnpm db:down` | Start / stop the dev and test databases |

## API

REST under `/api`. Swagger UI: http://localhost:3000/api/docs (http://localhost:8080/api/docs in Docker); the OpenAPI 3.1 source is `docs/api/openapi.yaml`. Design decisions and the binding rules (error codes, roles, status transitions, auth) are in `docs/SDS.md`.

## Workflow

Requirements live in Linear. Per ticket: fetch it through the Linear MCP, `/opsx:propose` a change, get Gate 1, `/opsx:apply`, `/opsx:verify`, reviewer sub-agent, one pull request (Gate 2), then sync and archive. Commits are `type(scope): description DEV-10xx` on branches `feature/<domain>/DEV-10xx-short-name`; Husky and commitlint enforce it, CI runs verify, e2e, gitleaks and a commit check. See `CLAUDE.md`.

### OpenSpec commands

The 12 native commands in `.claude/commands/opsx/` (the expanded profile):

| Command | Use |
| --- | --- |
| `/opsx:propose` | Create a change with proposal, specs, design and tasks in one step |
| `/opsx:explore` | Think through an idea or problem before or during a change |
| `/opsx:new` | Start a change and create artifacts one by one |
| `/opsx:continue` | Create the next artifact of a change |
| `/opsx:ff` | Create all planning artifacts in one go |
| `/opsx:apply` | Implement the tasks |
| `/opsx:verify` | Check the implementation against the change artifacts |
| `/opsx:sync` | Sync delta specs into the main specs |
| `/opsx:archive` | Archive a finished change |
| `/opsx:bulk-archive` | Archive several finished changes |
| `/opsx:update` | Revise planning artifacts and keep them coherent |
| `/opsx:onboard` | Guided walk through one full cycle |

Select the expanded profile with `pnpm exec openspec config profile`, then run `pnpm exec openspec update` to regenerate the commands and skills under `.claude/`. In OpenSpec 1.15.0 the profile is stored in the global config `~/.config/openspec/config.json`, not in the repository, so each machine needs this step once.

### Approval gates

- Gate 1 (spec): the proposed changes of a batch are approved together. `approvals.md` then reads `Approved by <name> on <date>` (the bootstrap form and the senior's waiver sentence are also accepted). `Status: PENDING human Gate 1 (batch approval)` is allowed only while the change is a draft.
- Gate 2 (merge): the reviewer sub-agent reports no blockers (`Verdict:` line in `review.md`), CI is green, then squash merge with `gh pr merge <n> --squash --delete-branch`.
- After the merge: `/opsx:sync` and `/opsx:archive`, update the status table row below, and run `pnpm spec:validate`, `pnpm check:scenarios` and `pnpm check:changes`.

## Deviations from the guide

Honest list of where this repo departs from `docs/reference/SDD-GUIDE.md`. Updated as we go.

| # | Deviation | Why |
| --- | --- | --- |
| 1 | Gate 2 (code review) was done by the reviewer sub-agent + green CI + self squash-merge, not by a human reading the PR. | Same-day deadline. Each PR carries the reviewer's findings (`review.md`). |
| 2 | DEV-1001 (bootstrap) and DEV-1002 (proposed before Gate 1 was re-introduced) have no human spec approval. DEV-1001 had no OpenSpec change at all; its change was added retroactively (`archive/2026-10-30-dev-1001-project-setup`). DEV-1002's `approvals.md` carries the waiver line. | DEV-1001 installs OpenSpec itself. DEV-1002 ran under the senior's no-gates instruction. |
| 3 | Gate 1 for DEV-1003 to DEV-1010 was one batch approval by Ankit, recorded in each `approvals.md`. Later batches follow the same form. | Batch approval instead of per-ticket review, to save time. |
| 4 | Red test commits are not possible: the pre-commit hook runs the whole tooling suite. Tests are written first by the test-writer but committed together with the implementation of the same task group. | The hook is a quality gate and `--no-verify` is forbidden. |
| 5 | Archive and the README status row are a separate small PR after each feature PR (guide: sync and archive after merge). | Direct pushes to `main` are forbidden. |
| 6 | Where the SDS and a Linear ticket disagreed, the SDS won (422 for validation). Exception: DEV-1008 uses 409 `INVALID_TRANSITION`, and the SDS was updated to match. | Ankit's confirmations at Gate 1. |

## Ticket status

| Ticket | Linear | OpenSpec change | PR | Status |
| --- | --- | --- | --- | --- |
| DEV-1001 Project setup | [DEV-5](https://linear.app/team-task-tracker/issue/DEV-5) | - | - | In progress |
| DEV-1002 Claude Code setup | [DEV-6](https://linear.app/team-task-tracker/issue/DEV-6) | `claude-setup` (archived `2026-10-30-dev-1002-claude-code-setup`) | [#2](https://github.com/ankitmfsi22/team-task-tracker/pull/2) | Done |
| DEV-1003 Autonomous agents | [DEV-7](https://linear.app/team-task-tracker/issue/DEV-7) | - | - | Todo |
| DEV-1004 MCP integration | [DEV-8](https://linear.app/team-task-tracker/issue/DEV-8) | - | - | Todo |
| DEV-1005 OpenSpec workflow | [DEV-9](https://linear.app/team-task-tracker/issue/DEV-9) | `dev-1005-openspec-workflow` (archived `2026-10-30-dev-1005-openspec-workflow`) | [#6](https://github.com/ankitmfsi22/team-task-tracker/pull/6) | Done |
| DEV-1006 Authentication | [DEV-10](https://linear.app/team-task-tracker/issue/DEV-10) | - | - | Todo |
| DEV-1007 Projects | [DEV-11](https://linear.app/team-task-tracker/issue/DEV-11) | - | - | Todo |
| DEV-1008 Tasks | [DEV-12](https://linear.app/team-task-tracker/issue/DEV-12) | - | - | Todo |
| DEV-1009 Task filtering | [DEV-13](https://linear.app/team-task-tracker/issue/DEV-13) | - | - | Todo |
| DEV-1010 Comments and activity history | [DEV-14](https://linear.app/team-task-tracker/issue/DEV-14) | - | - | Todo |
| DEV-1011 Frontend: authentication and projects | [DEV-15](https://linear.app/team-task-tracker/issue/DEV-15) | - | - | Todo |
| DEV-1012 Frontend: task list, filters and detail | [DEV-16](https://linear.app/team-task-tracker/issue/DEV-16) | - | - | Todo |
| DEV-1013 Frontend: comments, activity and editing | [DEV-17](https://linear.app/team-task-tracker/issue/DEV-17) | - | - | Todo |
| DEV-1014 Git worktrees | [DEV-18](https://linear.app/team-task-tracker/issue/DEV-18) | - | - | Todo |
| DEV-1015 Codebase graph setup | [DEV-19](https://linear.app/team-task-tracker/issue/DEV-19) | - | - | Todo |
| DEV-1016 Testing | [DEV-20](https://linear.app/team-task-tracker/issue/DEV-20) | - | - | Todo |
| DEV-1017 Independent review | [DEV-21](https://linear.app/team-task-tracker/issue/DEV-21) | - | - | Todo |
| DEV-1018 Final integration | [DEV-22](https://linear.app/team-task-tracker/issue/DEV-22) | - | - | Todo |
