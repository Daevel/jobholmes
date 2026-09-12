<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# JobHolmes — Agent Contract

JobHolmes tracks job applications in PostgreSQL and uses OpenAI to reason over that data. This file is a short, stable entry point for OpenCode and other agents working on this repo — for product/setup documentation aimed at humans, see `README.md`.

## Source of truth
- PostgreSQL (Neon) is the source of truth for all application data.
- Google Sheets is a one-way mirror for newly created applications only. Never read it back as a data source.

## Architectural roles
- Next.js owns UI, auth (Auth.js + GitHub OAuth), and the application backend.
- OpenAI (Responses API) reasons over data JobHolmes already has. It never originates data.

## Migrations
- `db:push` is fast local iteration only — untracked, no migration generated.
- Before pushing a branch that triggers a Preview/Production deploy: run `db:generate`, commit the resulting `drizzle/*.sql`, then run `db:migrate` against that environment's database — otherwise `scripts/check-migrations.ts` fails the build. Full detail: `README.md` → "Migrations".

## AI Match / Job Fit
- `runJobFitAnalysis` (`src/lib/ai/match.ts`) is the only match-scoring pipeline, shared by existing applications and the Job Fit Preview. Never add a second, parallel scoring algorithm — extend this one.
- `userMatchClass` / `userMatchPercentage` ("Your Match") are deprecated: kept only for legacy import compatibility. Never reintroduce them in UI, prompts, or scoring/confidence logic.

## OpenAI instructions
- All instructions strings for OpenAI calls live in `src/lib/ai/instructions.ts` as named, typed constants. Add new significant instructions there with a semantic name — don't inline them in a route/service, except for a narrow, documented exception at the definition site.

## Computed results are never free user input
- Fields representing an AI-computed result (score, class, confidence) must never be accepted arbitrarily through a public create/update form or schema. A flow that imports a result computed elsewhere (e.g. Job Fit → application creation) must go through an explicit verification step (today: HMAC, `src/lib/ai/job-fit-signature.ts`), not blind trust in client-submitted values.

## Secrets
- Never log, print, or hardcode secrets, tokens, or keys in code or commits.
- Reuse a secret already defined in `.env.example` when the use case is compatible, instead of introducing a new one without real need.

## Testing
- Pure-function tests use `node:test` + `node:assert/strict`, no mocking framework. There is no test environment with a real database — never write a test that connects to a database or calls a real external API. If some logic genuinely needs that, verify it manually and document it instead of adding a new test harness.

## Branches
- `main` is Production. As of now, `fix/ui-table-and-contrast` is the branch deployed as Preview — check the Vercel project's Git settings for whichever branch is currently wired to Preview, since this changes as feature branches come and go.

## Before adding dependencies or new architecture
- Read the existing code and the patterns already in use (form structure, API route error handling, test organization) and follow them, instead of introducing a different style just because it seems preferable in the abstract.

## Essential commands
- `npm run dev` — start the dev server
- `npm run build` — production build (also runs the migrations check when `VERCEL_ENV` is set)
- `npm run typecheck` — TypeScript check, no emit
- `npm test` — run the test suite
- `npm run db:generate` / `npm run db:migrate` — create and apply a tracked migration
- `npm run db:check` — verify migrations against `DATABASE_URL` by hand

## Extending this file
Keep this file as a short index, not a growing mega-prompt. When a domain needs deeper, specialized context (e.g. a dedicated skill for one area), add it as its own file/skill and link it here in one line instead of inlining it.
