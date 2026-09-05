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
Configure `DATABASE_URL`, `AUTH_SECRET`, GitHub OAuth credentials, and `OPENAI_API_KEY`.

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

## Cross-device
Clone the same repo on Windows and macOS and point both `.env.local` files to the same Neon database, GitHub OAuth app and OpenAI project. Do not commit `.env.local`.

## Initial domain
- users
- user_profiles
- applications
- ai_conversations
- ai_messages

The next slice should implement the application table/form, funnel KPI cards, profile onboarding, persistent Investigations UI, and import of the existing tracker.
