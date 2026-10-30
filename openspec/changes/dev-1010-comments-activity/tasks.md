## 1. Contract
- [ ] 1.1 packages/shared: Comment, CreateCommentInput, UpdateCommentInput, ActivityEntry, ActivityAction schemas + tests (S-DEV1010-24)

## 2. Activity recording (after DEV-1008 merged)
- [ ] 2.1 ActivityRecorder + activity repository; task service calls it in-transaction for the 4 actions (S-15..20)
- [ ] 2.2 GET activity endpoint, pagination, membership 404 (S-21..23)

## 3. Comments [PARALLEL with 2.2]
- [ ] 3.1 Comments repository + service rules (author/OWNER, archived 409) and POST/GET endpoints (S-01..05, S-13, S-14)
- [ ] 3.2 PATCH/DELETE endpoints (S-06..12)

## 4. Docs
- [ ] 4.1 docs/api/openapi.yaml for all 5 endpoints; run build, lint, typecheck, test, check:scenarios
