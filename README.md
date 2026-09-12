# JobHolmes — Alpha 0.1

> Understand why your job search is not converting.

## Stack
- Next.js + TypeScript
- Neon PostgreSQL
- Drizzle ORM
- Auth.js + GitHub OAuth
- OpenAI Responses API
- Zod
- Tailwind CSS

## Core rule
PostgreSQL is the source of truth. OpenAI reasons over JobHolmes data; it is not the database.

## Setup
```bash
npm install
cp .env.example .env.local
```
Configure `DATABASE_URL`, `AUTH_SECRET`, GitHub OAuth credentials, and `OPENAI_API_KEY`. For `DATABASE_URL`, use your own isolated Neon branch rather than the one Preview/Production use — see *Local development database* below before running any `db:*` command.

Google Sheets mirror support requires `GOOGLE_SHEETS_SPREADSHEET_ID`, `GOOGLE_SHEETS_SHEET_NAME`, `GOOGLE_SERVICE_ACCOUNT_EMAIL`, and `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`. Share the target spreadsheet with the service account email using Editor permission. PostgreSQL remains the source of truth; the sheet is only a one-way mirror for new JobHolmes applications.

GitHub OAuth local URLs:
- Homepage: `http://localhost:3000`
- Callback: `http://localhost:3000/api/auth/callback/github`

Create schema:
```bash
npm run db:generate
npm run db:migrate
```
For rapid alpha development you can use `npm run db:push`.

## Migrations
`npm run db:push` (fast local iteration) does **not** generate or track a migration — it only
applies your current `src/db/schema.ts` directly to whatever database `DATABASE_URL` points to.

Every Vercel deploy (Preview and Production) runs `npm run build`, which — only when Vercel sets
`VERCEL_ENV` — first runs `npm run db:check` (`scripts/check-migrations.ts`) before `next build`.
That check fails the build if `drizzle/meta/_journal.json` contains a migration that hasn't been
applied to the target database yet. It never applies migrations itself.

So: **before pushing a branch that will trigger a Preview or Production deploy**, generate a real
migration for any schema change with `npm run db:generate`, commit the resulting `drizzle/*.sql`
file, and apply it to that environment's database with `npm run db:migrate` — otherwise the
deploy's build will fail at the migrations check. `npm run db:check` can also be run by hand
locally at any time to check your own database.

Import the current legacy tracker once, after the target JobHolmes user already exists:
```bash
IMPORT_USER_EMAIL="you@example.com" npm run import:legacy-applications
```
The import skips existing applications with the same user, company, role, and applied date.

Run:
```bash
npm run dev
```
Health check: `http://localhost:3000/api/health`.

## Local development database
Don't point your local `.env.local` at the same Neon database used by Preview or Production. `npm run db:push` (see *Migrations* above) applies `src/db/schema.ts` directly and untracked to whatever `DATABASE_URL` resolves to — running it against a shared database risks clobbering someone else's schema or data.

Instead, give local development its own isolated Neon branch:

1. In the Neon console: **Project → Branches → Create Branch**, branching from `main` (or from `preview`, if you'd rather start from whatever schema Preview currently has). Name it something like `local-dev`.
   - Optional alternative: the Neon CLI (`neonctl branches create --name local-dev`), if you already have it installed and authenticated. The dashboard is the simpler default and needs no separate setup.
2. Copy that branch's connection string into your own `.env.local` as `DATABASE_URL`.
3. `npm run db:push` now only ever touches this branch — Preview and Production stay untouched no matter what you run locally.

drizzle-kit commands read `DATABASE_URL` from `.env.local` (falling back to `.env`), matching Next.js's own precedence — if you keep an old `.env` file around, make sure it doesn't silently point `db:push` at the wrong database.

To start over, delete and recreate the branch from the Neon dashboard (seconds), or use its "reset from parent" action if your Neon plan supports it (not available on every plan — check your project in the Neon console).

If you work from two machines (e.g. Windows and macOS), point both `.env.local` files at the *same* `local-dev` branch rather than creating one per machine — it just needs to stay separate from Preview/Production, not separate per machine. The other credentials — `AUTH_SECRET`, the GitHub OAuth app, `OPENAI_API_KEY`, and the Google Sheets service account — stay shared across machines and environments too: unlike the database schema, none of them track mutable application state, so they don't need per-branch isolation.

One exception: uploaded CV files. There is no branching equivalent for Vercel Blob storage — local, Preview, and Production all read and write the *same* Blob store today. Test CVs you upload while developing locally land in that same shared store; delete them from the Vercel dashboard afterward if you don't want test files lingering there.

Do not commit `.env.local` — it's already covered by `.gitignore`.

## Initial domain
- users
- user_profiles
- applications
- ai_conversations
- ai_messages

The next slice should implement the application table/form, funnel KPI cards, profile onboarding, persistent Investigations UI, and import of the existing tracker.
