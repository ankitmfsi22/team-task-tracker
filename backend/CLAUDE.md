# Backend rules

- Layers: routes -> controller -> service -> repository. Prisma is used only in repositories; services never import `@prisma/client`.
- Controllers parse input with the Zod schemas from `packages/shared` and call a service; no business logic.
- Authorization lives in services. A user who is not a project member gets 404, a member without the needed role gets 403.
- Errors use the SDS section 4 envelope and codes only (401, 403, 404, 409, 422). Never invent a code.
- Every endpoint is documented in `docs/api/openapi.yaml` (served as Swagger at `/api/docs`).
- Tests: Vitest + Supertest against the real test Postgres (port 5433); one test per scenario titled `S-DEV...`.
- Never log secrets, passwords or tokens. Scope every query by owner or membership.
