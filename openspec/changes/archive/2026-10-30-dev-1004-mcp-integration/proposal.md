## Why
Claude needs verified, safe access to the issue tracker (Linear) and current library docs (Context7), with a documented failure path so work never silently proceeds on invented ticket data.

## What
- `.mcp.json` (already present from DEV-1002, now spec-covered): Linear http `https://mcp.linear.app/mcp` + Context7 stdio pinned `@upstash/context7-mcp@4.4.4`, no secrets (Linear uses OAuth).
- `docs/MCP.md` (one page, tables): setup, live-verified operations, permissions (writes in settings.json `ask`), real lookup evidence (DEV-5 `get_issue`, real missing-ticket error, Context7 resolve + query), failure-handling table (server unavailable, auth/expired OAuth, missing ticket, malformed response, unsupported operation, rate limit).
- Labelled fallback: `fixtures/linear/*.fixture.json` (`"source":"FIXTURE - NOT LIVE LINEAR DATA"`) and `scripts/ticket-source.mjs` (+ node tests) with a Zod shape check; always prints a `FIXTURE` banner.
- Linear: https://linear.app/team-task-tracker/issue/DEV-8 (depends on DEV-1002 / DEV-6, done).
- Defaults chosen (open questions): server key stays `linear-server`; write tools stay in `ask` (settings.json unchanged, only tested); zod added to root devDependencies at 4.6.7 (same pin as workspaces).

## Out of scope
Using MCP writes (no Linear tickets created/updated), CI calls to live Linear, app runtime code.

## Rollback
Revert the commits; no schema, API or runtime impact.
