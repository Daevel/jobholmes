# JobHolmes

> Job searching without a system means scattered spreadsheets, no visibility into what's actually converting, and no easy way to tell whether a role is worth applying to before you do. JobHolmes tracks your applications through a real funnel, evaluates fit using evidence instead of a black-box score, and lets you ask questions about your own search in plain language.

## What it does

- **Application tracking with a real funnel.** Every application moves through stages (recruiter screening, technical, final, ...) and outcomes (pending, rejected, offer, ...), so you can see where things stall instead of just listing candidatures.
- **AI Match, grounded in evidence.** JobHolmes extracts structured requirements from a job description, checks each one against your selected CV's actual text, and only then produces a match class, score, and confidence — every requirement is marked covered, partial, or not covered, with the CV excerpt that backs it up. Nothing is invented.
- **Job Fit Preview.** Run the same matching engine against a job description *before* creating an application, so you can decide whether it's worth applying at all.
- **Cover letters grounded in what AI Match already confirmed.** Generation only draws on requirements AI Match marked as covered — it won't claim skills or experience your CV doesn't support.
- **AI Analyst.** Ask questions about your funnel, conversion rates, or rejection patterns in plain language; answers are grounded only in your own stored data, never invented.
- **CV library.** Keep multiple CV versions, each with extracted text used for matching and Job Fit.

## Who it's for

One person actively job searching who wants to track and understand their own process — not a recruiter-facing ATS.

## Architecture

- **Next.js** — UI, server actions/API routes, and authentication (Auth.js + GitHub OAuth) in one app.
- **PostgreSQL on Neon, via Drizzle ORM** — the source of truth for every application, CV, and conversation. Nothing else owns this data.
- **OpenAI (Responses API)** — a reasoning layer over data JobHolmes already has. It extracts requirements, compares them to CV evidence, writes cover letters, and answers AI Analyst questions; it never originates facts on its own. See `AGENTS.md` for the conventions this follows (centralized instructions, the single evidence-grounded matching pipeline, HMAC-verified Job Fit → application creation).
- **Vercel Blob** — stores uploaded CV PDFs.
- **Google Sheets (optional)** — a one-way mirror of new applications, for anyone who also wants a spreadsheet view. Postgres stays the source of truth; the sheet is never read back.

### Data model, in brief
- `users` — one row per signed-in account.
- `user_profiles` — headline/skills/target-role fields the AI context can read; there's no onboarding UI to fill them in yet, so they're empty for everyone today.
- `cv_documents` — the CV library.
- `applications` — the funnel record: stage, outcome, JD text, AI Match results, cover letter.
- `application_sources` — a per-user reusable list of "where did this come from" values.
- `ai_conversations` / `ai_messages` — AI Analyst chat history.

## Local setup

```bash
git clone <repo-url>
cd jobholmes
npm install
cp .env.example .env.local
```

Fill in `.env.local`:

| Variable | What it's for |
|---|---|
| `DATABASE_URL` | Postgres connection string. Use your own isolated Neon branch — see *Local development database* below, don't reuse Preview/Production's. |
| `AUTH_SECRET` | Auth.js session encryption secret. |
| `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET` | GitHub OAuth app credentials (sign-in is GitHub-only today). |
| `OPENAI_API_KEY` | OpenAI API key for the Responses API. |
| `OPENAI_MODEL` | Which OpenAI model to use. |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob token for CV file storage. |
| `NEXT_PUBLIC_APP_URL` | Base app URL. |
| `GOOGLE_SHEETS_SPREADSHEET_ID` / `GOOGLE_SHEETS_SHEET_NAME` / `GOOGLE_SERVICE_ACCOUNT_EMAIL` / `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` | Only needed for the optional Google Sheets mirror; share the target spreadsheet with the service account email using Editor permission. |

GitHub OAuth app, local URLs:
- Homepage: `http://localhost:3000`
- Callback: `http://localhost:3000/api/auth/callback/github`

Create the schema (see *Migrations* below for what each command actually does):
```bash
npm run db:generate
npm run db:migrate
```

Then:
```bash
npm run dev
```
Health check: `http://localhost:3000/api/health`.

### Essential commands
- `npm run dev` — start the dev server
- `npm run build` — production build (also runs the migrations check when Vercel sets `VERCEL_ENV`)
- `npm run typecheck` — TypeScript check, no emit
- `npm test` — run the test suite
- `npm run db:generate` / `npm run db:migrate` — create and apply a tracked migration
- `npm run db:push` — fast, untracked schema sync for local iteration only (see *Migrations*)
- `npm run db:check` — verify migrations against `DATABASE_URL` by hand
- `npm run db:studio` — browse your database with Drizzle Studio

One-time historical import, if you're migrating from a pre-JobHolmes tracker:
```bash
IMPORT_USER_EMAIL="you@example.com" npm run import:legacy-applications
```
Skips applications that already exist for that user/company/role/applied-date combination.

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

## Beta status

JobHolmes is in beta. A few known gaps, honestly:

- **i18n covers the main app surfaces** (applications, dashboard, CVs, Job Fit, cover letter, AI Analyst, the landing page) in English only — no language switcher yet, and a handful of marginal strings (Google Sheets export column headers, some internal log messages) aren't routed through the translation catalog.
- **No dedicated design system yet.** Styling is Tailwind utility classes reused through a couple of shared style objects, not a formal component/token library — that's planned as its own piece of work, not bundled into feature development.
- **Test coverage is unit-level only** (`node:test` against pure functions). There's no integration or end-to-end suite against a real database or the OpenAI/Vercel Blob APIs; those paths are verified manually. See `AGENTS.md` for why.

This file is a snapshot of what exists today, not the full roadmap.
