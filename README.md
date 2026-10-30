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
| `pnpm perf:lighthouse` | Lighthouse on the production build (needs `pnpm build`) |
| `pnpm db:up` / `pnpm db:down` | Start / stop the dev and test databases |

## API

REST under `/api`. Swagger UI: http://localhost:3000/api/docs (http://localhost:8080/api/docs in Docker); the OpenAPI 3.1 source is `docs/api/openapi.yaml`. Design decisions and the binding rules (error codes, roles, status transitions, auth) are in `docs/SDS.md`.

## Workflow

Requirements live in Linear. For each ticket: fetch it through the Linear MCP, `/opsx:propose` a change, get the human `approved` in the change's `approvals.md`, `/opsx:apply`, `/opsx:verify`, `/opsx:archive`, then one pull request. Commits are `type(scope): description DEV-10xx` on branches `feature/<domain>/DEV-10xx-short-name`; Husky and commitlint enforce it, CI runs verify, e2e, gitleaks and a commit check. See `CLAUDE.md`.

## Ticket status

| Ticket | Linear | OpenSpec change | PR | Status |
| --- | --- | --- | --- | --- |
| DEV-1001 Project setup | [DEV-5](https://linear.app/team-task-tracker/issue/DEV-5) | - | - | In progress |
| DEV-1002 Claude Code setup | [DEV-6](https://linear.app/team-task-tracker/issue/DEV-6) | - | - | Todo |
| DEV-1003 Autonomous agents | [DEV-7](https://linear.app/team-task-tracker/issue/DEV-7) | - | - | Todo |
| DEV-1004 MCP integration | [DEV-8](https://linear.app/team-task-tracker/issue/DEV-8) | - | - | Todo |
| DEV-1005 OpenSpec workflow | [DEV-9](https://linear.app/team-task-tracker/issue/DEV-9) | - | - | Todo |
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
