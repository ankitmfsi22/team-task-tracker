## Files touched

- `.claude/settings.json`, `.claude/hooks/{guard,format,stop}.mjs`, `scripts/claude-hooks.test.mjs` (node --test, `pnpm test:tooling`)
- `.claude/commands/create-pr.md`; `.claude/skills/{spec-scenario-format,add-endpoint}/SKILL.md`
- `docs/FRS.md`; `backend/CLAUDE.md`, `frontend/CLAUDE.md`, `packages/shared/CLAUDE.md`
- `CLAUDE.md`, `AGENTS.md`, `openspec/config.yaml`; `docs/reference/SDD-GUIDE.md` (staged, committed with the first commit)

## Key decisions

- Exactly three hooks (guide). PreToolUse has two matchers (`Bash`, `Read|Edit|Write`) calling the same `guard.mjs`, which branches on `tool_name`.
- Hooks read the JSON payload on stdin; exit 2 plus stderr reason blocks. Logic is exported as pure functions so tests call it directly and also spawn the script for exit codes.
- Guard uses regex on the whole command string; `.env.example` explicitly allowed. `git push` to main blocked by regex on the refspec/branch; push of a feature branch passes.
- Stop hook: exit 0 immediately when `stop_hook_active` is true; otherwise runs `pnpm typecheck` then `pnpm test`; exit 2 with output tail on failure.
- Format hook never fails the turn: unreadable/missing/ignored files exit 0.
- Deny rules in settings.json are the first layer, hooks the second (defence in depth).
- Waiver wording in approvals.md is fixed text; `config.yaml` Approval line replaced accordingly.
- Spec tests for docs scenarios (S-DEV1002-15..21) are node tests in `scripts/` asserting file contents and size limits.

## Verification notes (apply)

- Sources: https://code.claude.com/docs/en/hooks (exit 2 blocks PreToolUse and prevents Stop, stderr is the reason, settings format event -> matcher -> hooks, `$CLAUDE_PROJECT_DIR`; `stop_hook_active` is documented for SubagentStop, the Stop section was truncated in the fetch, so the field follows the test contract) and https://code.claude.com/docs/en/settings (allow/ask/deny lists merge; `.claude/settings.json` is the shared project file).
- Guard is deliberately conservative: any command text naming a secret env file is blocked, even inside a heredoc (seen live while editing this file).
- Commits: the pre-commit hook runs the whole `test:tooling` suite, so the config test was held out of commit 1 (hooks + settings + hooks test) and added with the docs in commit 2.
