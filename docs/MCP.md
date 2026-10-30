# MCP integration (Linear + Context7)

Requirements come from Linear through MCP; library docs come from Context7. All evidence below was captured from real calls on 2026-10-30.

## Setup

| Step | What                                                                                                                                            |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | `.mcp.json` (committed, no secrets) declares `linear-server` (HTTP `https://mcp.linear.app/mcp`) and `context7` (`npx -y @upstash/context7-mcp@4.4.4`, pinned). |
| 2    | In Claude Code run `/mcp`, choose `linear-server`, and complete the browser OAuth login. Tokens stay in the client keychain, never in the repo.   |
| 3    | Context7 needs no login. Resolve a library id first, then query docs.                                                                           |

## Supported operations (verified)

Verified through real calls at 2026-10-30T11:08Z.

| Operation                       | Call                                  | Real result (trimmed)                                                             |
| ------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------- |
| List teams                      | `list_teams`                          | team `DEV` "Team Task Tracker", `hasNextPage:false`                               |
| Look up a ticket                | `get_issue` `DEV-5`                   | `title: "DEV-1001 — Project setup"`, `status: "Backlog"`, project Team Task Tracker |
| List issues                     | `list_issues` team `DEV`, limit 3     | DEV-22, DEV-21, DEV-20 and `hasNextPage:true` with a `cursor`                     |
| List projects                   | `list_projects`                       | `P-DEV-1` "Team Task Tracker", status Backlog                                     |
| Missing ticket                  | `get_issue` `DEV-9999`                | `{"error":"invalid_request","message":"Could not find referenced Issue.","status":400}` |
| Context7 resolve library        | `resolve-library-id` "zod"            | `/colinhacks/zod` (High reputation, versions incl. v4.6.5)                        |
| Context7 query docs             | `query-docs` `/colinhacks/zod`        | `safeParse` result `error.issues` with `code`, `path`, `message`                  |

Ticket mapping: assignment `DEV-10NN` is Linear `DEV-(NN+4)` (DEV-1004 is `DEV-8`).

## Permissions

Mirrors `.claude/settings.json` exactly (Linear server `linear-server`).

| Tool kind                                                                                                       | Policy                                          |
| --------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| Read: every `get_*` and `list_*` Linear tool (incl. `get_issue`, `list_issues`, `list_teams`, `list_projects`), `search_documentation`, `extract_images`, Context7 `resolve-library-id` and `query-docs` | `allow`: no prompt.                             |
| Write: `save_*`, `create_*`, `delete_*`, `merge_diff`, `submit_diff_review`, `share_issue`, `unshare_issue`, `mark_notification`, `resolve_diff_thread`, `retire_*`, `restore_*`, `update_diff`, `prepare_*_upload` | `ask`: explicit user approval every time.       |
| Unsupported via this setup                                                                                      | No hard delete of projects or issues (archive/cancel only); no Plane integration. |

## Failure handling

Never fabricate ticket data: if a call fails, report the failure, do not guess titles, statuses or acceptance criteria.

| Failure mode         | Detection                                       | Action                                                          | Never                                         |
| -------------------- | ----------------------------------------------- | --------------------------------------------------------------- | --------------------------------------------- |
| Server unavailable   | Timeout, connection refused, tool not listed    | Retry once, check `/mcp` status, then use the fixture fallback  | Invent ticket content                         |
| Auth failure / expired OAuth | 401/403, "unauthorized", login prompt   | Re-run `/mcp` login, retry once; else fixture fallback          | Put tokens in files or `.mcp.json`            |
| Missing ticket       | `Could not find referenced Issue.` (400)        | Check the id and the DEV-10NN to DEV-(NN+4) mapping; ask user   | Substitute another ticket's data              |
| Malformed response   | Not JSON, missing `title`/`status`/`id`         | Treat as failed; retry once; fall back to a fixture             | Fill gaps with assumed values                 |
| Unsupported operation | Tool absent or "unknown tool" error            | Use a supported operation from the table above or ask the user  | Emulate the result by hand                    |
| Rate limit           | 429 or "rate limit" message                     | Wait, retry with backoff, reduce calls (fewer `list_*` pages)   | Loop retries without limit                    |

## Fixture fallback

Use only when the real server cannot answer. Fixtures live in `fixtures/linear/<ID>.fixture.json`, were captured from real data on 2026-10-30, and carry `"source": "FIXTURE - NOT LIVE LINEAR DATA"`.

1. Run `node scripts/ticket-source.mjs DEV-5`. The first output line starts with the fixture label.
2. A Zod schema validates `source`, `id`, `title`, `status`; a bad file fails with a message naming the file and the field.
3. An unknown id prints `ticket not found` to stderr and exits non-zero. Never create a fixture to hide a missing ticket.
4. State in your notes that fixture data was used, and re-check against the real server when it returns.
