# Review log

| date | reviewer | severity | file:line | finding | resolution |
| --- | --- | --- | --- | --- | --- |
| 2026-10-30 | independent reviewer (fresh context) | BLOCKING | scripts/ticket-source.mjs:17 | No ticket-id validation: `DEV-5/../DEV-8` loads DEV-8, `../../x` reads outside fixtures/linear, `DEV-5.fixture.json/..` leaks raw ENOTDIR with absolute path, not-found message echoes unsanitised input | Fixed: id validated against `^DEV-\d+$` before any path join; fixed message `ticket not found: invalid ticket id` (no echo). Tests S-DEV1004-11 |
| 2026-10-30 | independent reviewer (fresh context) | MEDIUM | scripts/ticket-source.mjs:35 | Fixture `id` not required to equal the requested id | Fixed: mismatch rejected, test S-DEV1004-12 |
| 2026-10-30 | independent reviewer (fresh context) | MEDIUM | docs/MCP.md:44 | Permissions table does not match .claude/settings.json | Fixed: settings `allow` has all verified read-only get_*/list_*/search_documentation/extract_images; `ask` has all write tools; MCP.md reworded to match, with an "unsupported via this setup" row. S-DEV1004-03 still green |
| 2026-10-30 | independent reviewer (fresh context) | LOW | design.md:5 | Capture time 11:01Z differs from MCP.md 11:08Z | Fixed: design.md now 11:08Z |
| 2026-10-30 | author | LOW (optional) | scripts/ticket-source.mjs | No size cap on fixtures | Fixed: 1 MB cap, test S-DEV1004-13 |

Original verdict: BLOCKING (1).
Verdict: PASS (all findings resolved after fix commit).
