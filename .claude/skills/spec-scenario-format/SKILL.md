---
name: spec-scenario-format
description: Write OpenSpec requirements and scenarios in the project format (S-DEV ids, WHEN/THEN, one test per scenario). Use when authoring or reviewing a spec.
---

# Spec scenario format

- New capability: start the spec with `## Purpose`, then `## ADDED Requirements`.
- Requirement: `### Requirement: <name>` with a sentence containing SHALL or MUST.
- Scenario: `#### Scenario: S-DEV<ticket>-<nn> <title>` (ticket digits e.g. `1006`, `nn` two digits from 01).
- Body: `- WHEN ...` then `- THEN ...`, optional `- AND ...`. No prose, no design talk.
- Every endpoint needs an authorization-denied and a validation-failure scenario, naming the exact status and error code from SDS section 4 (401, 403, 404, 409, 422).
- One test per scenario; the test title starts with the id, e.g. `test('S-DEV1006-03 login rejects a wrong password', ...)`.
- Check: `pnpm exec openspec validate <change> --strict` and `pnpm check:scenarios`.
