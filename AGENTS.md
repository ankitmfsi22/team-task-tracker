# AGENTS.md

Universal context for every AI tool. Requirements: the Linear tickets (team `team-task-tracker`). Technical truth: `docs/SDS.md` (binding). Assignment rules: `docs/reference/ASSIGNMENT.md`. If documents disagree, the assignment wins, then the Linear ticket, then the SDS.

## Project

Team Task Tracker: users register, create projects, add members, and manage tasks (assignee, status, priority, due date) with comments and activity history. 18 tickets, `DEV-1001` to `DEV-1018`, one PR per ticket.

Out of scope: real-time collaboration, chat, file attachments, mobile apps, OAuth, payments, email delivery.

## Layout

```text
backend/          Express 5 API: routes -> controller -> service -> repository (Prisma only in repositories)
frontend/         React 19 + Vite + Tailwind + shadcn/ui + TanStack Query, organised by features/
packages/shared/  Zod schemas, inferred types, limits. The only place types live
e2e/              Playwright tests
docs/             SDS.md, api/openapi.yaml, reference/
openspec/         config.yaml, specs/ (current behaviour), changes/ (active), changes/archive
```

## Commands

- `pnpm install --frozen-lockfile`, `pnpm build`, `pnpm lint --max-warnings 0`, `pnpm typecheck`, `pnpm format:check`
- `pnpm db:up` starts Postgres (dev 5432, test 5433); copy `.env.example` to `.env` first. `pnpm test` needs the test database.
- `pnpm test`, `pnpm test:tooling`, `pnpm test:e2e`, `pnpm spec:validate`, `pnpm check:scenarios`

## Rules

- Zod schemas and API types live only in `packages/shared`. Backend and frontend import them.
- The API follows SDS section 4: error envelope, pagination, statuses 401/403/404/409/422. Never invent an error code.
- Verify every library API with Context7 before using it. Use exact versions, never `@latest` or a range.
- One named test per spec scenario, titled `S-DEV<ticket>-<nn>`; coverage at least 80% on new code.

## Never

- Push to `main`, force-push, or use `--no-verify`.
- Read, print or commit `.env` files or secrets.
- Change a binding SDS rule or the OpenAPI document without an approved change.
