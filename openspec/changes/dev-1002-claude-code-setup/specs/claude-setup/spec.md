## Purpose

Claude Code project configuration: permissions, hooks, commands, skills and layered instructions that enforce the team workflow.

## ADDED Requirements

### Requirement: Permission policy
`.claude/settings.json` SHALL allow safe commands, ask for sensitive ones and deny secrets access.

#### Scenario: S-DEV1002-01 Safe commands are allowed
- WHEN settings.json is read
- THEN allow contains pnpm build/lint/typecheck/test/format:check/spec:validate/check:scenarios, openspec, git read commands, git add, git commit, and context7 and Linear read tools

#### Scenario: S-DEV1002-02 Sensitive commands ask
- WHEN settings.json is read
- THEN ask contains git push, pnpm add, pnpm install, docker compose, gh pr create, gh pr merge, prisma migrate and Linear write tools (save_issue, save_project, save_comment)

#### Scenario: S-DEV1002-03 Secrets and destructive commands are denied
- WHEN settings.json is read
- THEN deny contains Read of .env* and secrets, curl, git push --force and -f, git reset --hard and rm -rf

#### Scenario: S-DEV1002-04 Exactly three hooks are registered
- WHEN settings.json is read
- THEN hooks are PostToolUse (Edit|Write), PreToolUse (Bash and Read|Edit|Write) and Stop, each pointing to an existing script in .claude/hooks/

### Requirement: Guard hook blocks dangerous Bash commands
The PreToolUse guard SHALL exit 2 with a reason on stderr for dangerous commands and exit 0 otherwise.

#### Scenario: S-DEV1002-05 Secret reads are blocked
- WHEN Bash runs `cat .env`, `less .env.local`, `grep KEY .env` or `source .env`
- THEN the guard exits 2

#### Scenario: S-DEV1002-06 Destructive git is blocked
- WHEN Bash runs `git push --force`, `git push -f`, `git reset --hard`, `git clean -fd`, `git branch -D main` or `git push origin main`
- THEN the guard exits 2

#### Scenario: S-DEV1002-07 rm -rf is blocked
- WHEN Bash runs `rm -rf dist`
- THEN the guard exits 2

#### Scenario: S-DEV1002-08 Unpinned versions are blocked
- WHEN Bash runs `pnpm add zod@latest`
- THEN the guard exits 2

#### Scenario: S-DEV1002-09 Safety bypass flags are blocked
- WHEN Bash runs `git commit --no-verify` or `claude --dangerously-skip-permissions`
- THEN the guard exits 2

#### Scenario: S-DEV1002-10 Safe commands pass
- WHEN Bash runs `git status`, `pnpm test`, `cat .env.example`, `git push origin feature/claude/x` or `rm file.txt`
- THEN the guard exits 0

#### Scenario: S-DEV1002-11 File tools cannot touch .env files
- WHEN Read, Edit or Write targets `.env` or `backend/.env.local`
- THEN the guard exits 2
- AND a target of `.env.example` exits 0

### Requirement: Format hook
The PostToolUse hook SHALL run `prettier --write` on the changed file.

#### Scenario: S-DEV1002-12 Changed file is formatted
- WHEN an Edit or Write payload names an existing file
- THEN the hook runs prettier on that file and exits 0, ignoring missing or non-existent paths

### Requirement: Stop hook verifies the work
The Stop hook SHALL run `pnpm typecheck` and `pnpm test`, fail loudly on error and never loop.

#### Scenario: S-DEV1002-13 Failing gates block stopping
- WHEN a gate command fails and stop_hook_active is false
- THEN the hook prints the failure to stderr and exits 2

#### Scenario: S-DEV1002-14 No infinite loop
- WHEN the payload has stop_hook_active true
- THEN the hook exits 0 without running any command

### Requirement: Command set
Only `/opsx:*` and `/create-pr` SHALL exist as commands.

#### Scenario: S-DEV1002-15 No other custom commands
- WHEN .claude/commands is listed
- THEN it holds only create-pr.md and the opsx directory

#### Scenario: S-DEV1002-16 create-pr covers the PR workflow
- WHEN create-pr.md is read
- THEN it summarizes the diff, links the Linear ticket and OpenSpec change, maps scenarios to tests, pushes the branch, runs `gh pr create --base main` and forbids pushing main

### Requirement: Functional requirements summary
`docs/FRS.md` SHALL list FR ids per feature area mapped to tickets.

#### Scenario: S-DEV1002-17 FRS is short and mapped
- WHEN docs/FRS.md is read
- THEN it has at most 60 lines, FR ids for auth, projects, tasks, comments and workflow areas with ticket ids, and states Linear tickets are authoritative

### Requirement: Layer instructions
backend, frontend and packages/shared SHALL each have a CLAUDE.md under 50 lines.

#### Scenario: S-DEV1002-18 Layer files hold the key rules
- WHEN the three CLAUDE.md files are read
- THEN each is under 50 lines, backend names routes->controller->service->repository, Prisma-only-in-repositories, 404 for non-members and Swagger, frontend names TanStack Query, shadcn, detail-page links and Lighthouse 100, shared names Zod and ESM

### Requirement: Skills
`.claude/skills` SHALL contain `spec-scenario-format` and `add-endpoint`.

#### Scenario: S-DEV1002-19 Skills exist with front matter
- WHEN each SKILL.md is read
- THEN it has name and description front matter and fewer than 60 lines

### Requirement: Workflow instructions
Root CLAUDE.md (under 100 lines), AGENTS.md (under 200 lines) and openspec/config.yaml SHALL describe the no-human-gate workflow.

#### Scenario: S-DEV1002-20 Instructions describe the new workflow
- WHEN CLAUDE.md and AGENTS.md are read
- THEN they stay within the size limits and describe explore, propose with validate --strict, apply with test-writer first and one commit per task, verify with reviewer sub-agent, /create-pr, CI green, merge, sync and archive, plus review.md and approvals.md per change

#### Scenario: S-DEV1002-21 Config carries the waiver
- WHEN openspec/config.yaml is read
- THEN the Approval line states the human gate is waived on the senior's instruction and no longer requires "approved", and tasks rules require ending every task group with a checkpoint and creating approvals.md and review.md
