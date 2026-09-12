import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// Mirrors Next.js's own env precedence (.env first, .env.local overrides) so drizzle-kit
// commands (db:push/db:generate/db:migrate) resolve DATABASE_URL the same way `next dev` does.
// On Vercel, DATABASE_URL is injected directly into process.env by the platform — no .env files
// exist there, so config() on a missing path is a no-op and never overrides it.
config({ path: ".env" });
config({ path: ".env.local", override: true });
export default defineConfig({schema:"./src/db/schema.ts",out:"./drizzle",dialect:"postgresql",dbCredentials:{url:process.env.DATABASE_URL!}});
