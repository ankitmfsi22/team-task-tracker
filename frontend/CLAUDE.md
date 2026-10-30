# Frontend rules

- Organise code by `src/features/<feature>/`. Import types and schemas from `packages/shared`, never redefine them.
- Server state with TanStack Query (query keys per feature); no manual fetch caching.
- UI uses shadcn/ui components and Tailwind; do not hand-edit `src/components/ui`.
- Every list row links to its detail page; every task has a detail page route.
- Handle loading, empty and error states; forms validate with the shared Zod schemas.
- Accessibility: labelled controls, keyboard operable. Target Lighthouse 100 for accessibility, best practices and SEO.
- Tests: Vitest + Testing Library, one test per scenario titled `S-DEV...`.
