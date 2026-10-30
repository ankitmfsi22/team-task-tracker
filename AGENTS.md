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

## Workflow

1. Fetch the ticket with `mcp__linear-server__get_issue` (Linear id `DEV-(n-1000+4)`, so `DEV-1001` is Linear `DEV-5`). Verify the key and its dependencies.
2. `/opsx:explore`, then `/opsx:propose dev-10xx-short-name`: writes proposal, specs, design, tasks, plus `approvals.md` and a `review.md` stub. `pnpm exec openspec validate <change> --strict` must pass.
3. Approval: the human gate is waived on the senior's instruction. `approvals.md` holds exactly: `Human gate waived on senior's instruction; spec checked by openspec validate --strict + reviewer sub-agent`. Never claim a human approved.
4. `/opsx:apply`: the test-writer agent writes the failing tests first, then implement, one commit per task, with a build, lint and test checkpoint per phase.
5. `/opsx:verify` plus the reviewer sub-agent (fresh context, read-only) writes findings and a PASS or BLOCKING verdict into `review.md`; fix every BLOCKING finding.
6. `/create-pr`, wait until CI is green, squash merge, then `/opsx:sync` and `/opsx:archive`, then `pnpm spec:validate` and `pnpm check:scenarios`.

## Rules

- Zod schemas and API types live only in `packages/shared`. Backend and frontend import them.
- The API follows SDS section 4: error envelope, pagination, statuses 401/403/404/409/422. Never invent an error code.
- Verify every library API with Context7 before using it. Use exact versions, never `@latest` or a range.
- One named test per spec scenario, titled `S-DEV<ticket>-<nn>`; coverage at least 80% on new code.

## Never

- Push to `main`, force-push, or use `--no-verify`.
- Read, print or commit `.env` files or secrets.
- Change a binding SDS rule or the OpenAPI document without an approved change.
