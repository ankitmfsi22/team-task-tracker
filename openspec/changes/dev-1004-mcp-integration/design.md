## Context
DEV-1002 already committed `.mcp.json` and the Linear write tools in `ask`. This change specs/tests them, adds docs and the fallback.

## Decisions
- Live evidence in MCP.md is trimmed real output captured during propose (2026-10-30T11:01Z): DEV-5 get_issue, DEV-9999 -> `invalid_request: Could not find referenced Issue.`, Context7 `/colinhacks/zod` resolve + query-docs.
- Verified read tools: list_teams, get_issue, list_issues, list_projects. Write tools (save_issue, save_project, save_comment) exist but are never called without explicit user approval.
- `scripts/ticket-source.mjs`: ESM, exports `loadTicket(id, {dir})`; reads `fixtures/linear/<ID>.fixture.json`; Zod object schema {source: literal label, id, title, status, description?} via `safeParse` (Context7-verified, zod v4 `result.error.issues`). Zod 4.6.7 added to root devDependencies (needs approval for `pnpm add`).
- Banner `FIXTURE - NOT LIVE LINEAR DATA` printed first on every success; errors go to stderr, exit 1, no partial ticket output. Id must match `^DEV-\d+$` (no path traversal).
- Fixtures: minimal DEV-5 and DEV-8 copies; malformed ones are created in temp dirs by tests.
- Tests: `scripts/mcp-config.test.mjs` and `scripts/ticket-source.test.mjs` (node --test, `pnpm test:tooling`); titles start with S-DEV1004-nn.

## Risks
- Live data may drift from docs evidence (timestamped). Doc size cap checked by test.
- Context7 npx pin depends on npm availability.
