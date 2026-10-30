---
name: add-endpoint
description: Add a REST endpoint end to end following the project layering (shared schema, route, controller, service, repository, OpenAPI, tests). Use for every new API endpoint.
---

# Add an endpoint

1. Spec scenarios first (see `spec-scenario-format`), then failing tests titled with the scenario ids.
2. `packages/shared`: Zod request/response schemas and inferred types. Backend and frontend only import them.
3. Backend layers: routes -> controller -> service -> repository. Prisma only in repositories. Controllers validate with the shared schema and hold no business logic.
4. Authorization: check membership and role in the service; a non-member gets 404, a member without the role gets 403. Scope every query by owner or membership.
5. Errors use the SDS section 4 envelope and codes only; never invent one.
6. `docs/api/openapi.yaml`: add the path, schemas and every error response (Swagger at `/api/docs`).
7. Tests: Supertest against the real test database; cover success, 401, 403/404 and 422.
8. Run build, lint --max-warnings 0, typecheck, test; commit `feat(scope): ... DEV-10xx`.
