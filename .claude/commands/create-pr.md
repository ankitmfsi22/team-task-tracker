---
name: "Create PR"
description: "Open the pull request for the current ticket branch"
allowed-tools: Bash(git:*), Bash(gh:*), Bash(pnpm:*)
---

Open the pull request for the current ticket. Never push `main`: pushing to main is forbidden, only the feature branch is pushed.

1. Check the branch is `feature/<domain>/DEV-10xx-slug` (not main) and the tree is clean. Run `pnpm build`, `pnpm lint --max-warnings 0`, `pnpm typecheck`, `pnpm test`, `pnpm spec:validate`, `pnpm check:scenarios`.
2. Summarize the diff: `git diff main...HEAD --stat` and the commit list.
3. Collect: the Linear ticket link (`https://linear.app/team-task-tracker/issue/DEV-n`), the OpenSpec change name, a scenario -> test table (each `S-DEV...` id and the test file), the `review.md` summary and any deviations.
4. `git push -u origin <branch>`.
5. `gh pr create --base main --title "type(scope): description DEV-10xx" --body ...` with the sections above. End the body with the attribution line from the session.
6. `gh pr checks <n> --watch`; fix CI failures. Merge (squash) only when green and after `review.md` verdict is PASS.
