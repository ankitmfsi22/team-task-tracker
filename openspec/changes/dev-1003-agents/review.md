# Review log

| date | reviewer | severity | file:line | finding | resolution |
| ---- | -------- | -------- | --------- | ------- | ---------- |
| 2026-10-30 | reviewer agent (independent) | HIGH | .claude/agents/reviewer.md:4 | Docs do not describe `Bash(pattern)` specifiers inside a sub-agent `tools`; read-only is unverified, yet AGENTS-SETUP presents the reviewer as provably read-only. | Docs checked: `disallowedTools` is documented; added `disallowedTools: Write, Edit, NotebookEdit` to reviewer.md. Softened AGENTS-SETUP.md and design.md: read-only is by tool list, prompt, `.claude/settings.json` allow/deny lists and a mandatory post-run `git status --porcelain` check by the coordinator (added to coordinator.md, openspec/config.yaml apply guidance, CLAUDE.md). S-DEV1003-03 still holds. Added S-DEV1003-11 with a named test. |
| 2026-10-30 | reviewer agent (independent) | MEDIUM | .claude/agents/reviewer.md:4 | `Bash(pnpm test:*)` can write (tests write DB/tmp; prefix also matches test:e2e). | Kept: narrowing to `Bash(pnpm test)` / `Bash(pnpm test:tooling)` would break S-DEV1003-03 as specified. Documented as a residual limit in AGENTS-SETUP "Enforcement limits"; the git status check is the backstop. |
| 2026-10-30 | reviewer agent (independent) | LOW | .claude/agents/test-writer.md, security-auditor.md | Bash/Write unscoped. | One line each in AGENTS-SETUP: restriction is prompt-level, the reviewer is the backstop. |
| 2026-10-30 | reviewer agent (independent) | LOW | docs/AGENTS-SETUP.md (Evidence) | Evidence runs used general-purpose sub-agents following the agent files. | Added: the harness-enforced tool lists were not exercised in those runs. |

Verdict (original): BLOCKING (1)
Verdict (after fix): PASS, all findings resolved.
