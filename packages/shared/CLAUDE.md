# Shared package rules

- The only place for Zod schemas, inferred types and limits. Backend and frontend import them; they never redefine them.
- Export the schema and the inferred type together (`z.infer`).
- Pure ESM only: no CommonJS, no side effects, no Node or DOM APIs.
- Use exact dependency versions. Keep schemas aligned with `docs/SDS.md` and `docs/api/openapi.yaml`.
- Build with `pnpm --filter @team-task-tracker/shared build`; consumers use the built output.
- Tests: unit tests per schema, titled with the scenario id.
