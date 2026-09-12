---
name: db-migrations
description: Use when modifying src/db/schema.ts, running drizzle-kit commands, or setting up/debugging a local database environment. Prevents deploys with a schema out of sync and local work leaking into Preview/Production.
---

# Database migrations & local environment

For general project invariants (source of truth, secrets), see `AGENTS.md` — this skill only covers schema/migration mechanics.

## Objective

Never let a schema change reach a Preview/Production deploy without a tracked migration, and never let local iteration touch a shared database.

## Scope — read before changing anything here

- `src/db/schema.ts` — the Drizzle schema; the single source of truth for table/enum shape.
- `drizzle.config.ts` — loads `.env` then `.env.local` (with `override: true`), matching Next.js's own env precedence. Don't assume a single `.env` is enough, and don't assume `DATABASE_URL` resolves the same way some other tool reads it.
- `drizzle/*.sql` + `drizzle/meta/*_snapshot.json` + `drizzle/meta/_journal.json` — generated, tracked migrations. Never hand-edit these; they come only from `npm run db:generate`.
- `scripts/check-migrations.ts` — fails the build if `_journal.json` records a migration not yet applied to the target `DATABASE_URL`. Never applies migrations itself, and reads `DATABASE_URL` straight from `process.env` (its own `dotenv/config` import), independent of `drizzle.config.ts`.
- `scripts/build.sh` — runs `db:check` before `next build` only when Vercel sets `VERCEL_ENV`; a plain local `npm run build` never runs it.

## Constraints

- **`db:push` is local iteration only.** It applies `schema.ts` directly and untracked to whatever `DATABASE_URL` points at — never run it against Preview/Production, and never treat it as a substitute for a real migration before a deploy.
- **Every schema change destined for Preview/Production needs a tracked migration first:** `npm run db:generate`, commit the resulting `drizzle/*.sql` (+ updated `meta/`), then `npm run db:migrate` against that environment's database — before pushing a branch that triggers a deploy. Full detail: `README.md` → "Migrations".
- **Local `DATABASE_URL` must point at an isolated Neon branch dedicated to local work, never at Preview/Production's.** See `README.md` → "Local development database" for how to create and connect one.
- **Don't assume which database `DATABASE_URL` currently resolves to.** With two possible files (`.env`, `.env.local`) and drizzle-kit's own precedence, a stale `.env` can silently redirect `db:push` — verify before trusting it (see the stop condition below).

## Required verification

Before considering a schema change ready to deploy:
```bash
npm run db:check
```
(equivalent to what `VERCEL_ENV`-gated `npm run build` runs automatically). If you changed anything in `scripts/check-migrations.ts`'s comparison logic itself, also run `npm test` — `tests/diff-migrations.test.ts` covers `findMissingMigrations`.

## Stop conditions

If it isn't clear which database `DATABASE_URL` is actually pointing at right now — which `.env`/`.env.local` is in play, or whether it's the local branch versus something shared — stop and verify explicitly (e.g. print/inspect the resolved connection target) instead of assuming and running `db:push` or a migration against it.
