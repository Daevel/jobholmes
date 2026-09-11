/**
 * Fails (exit code 1) if any migration recorded in drizzle/meta/_journal.json has not been
 * applied to the database at DATABASE_URL. Run automatically by `npm run build` whenever
 * VERCEL_ENV is set (Preview/Production, see scripts/build.sh) — never during `npm run dev`.
 *
 * Local workflow stays unchanged: `npm run db:push` is still the fast way to iterate against
 * your own database, and it does NOT generate or track a migration, so this check will never
 * see it and never runs locally on its own. Before pushing a branch that triggers a Vercel
 * Preview/Production deploy, generate a real migration with `npm run db:generate` and commit
 * it, then apply it to the target database with `npm run db:migrate` — otherwise the deploy's
 * build will fail here. This script never runs `drizzle-kit migrate` itself: it only checks
 * and blocks, applying migrations stays a manual, explicit step.
 *
 * Can also be run by hand at any time: `npm run db:check`.
 */
import "dotenv/config";
import { readFileSync } from "fs";
import path from "path";
import { sql } from "drizzle-orm";
import { db } from "../src/db";
import { findMissingMigrations } from "./lib/diff-migrations";

// Matches what `drizzle-kit migrate` creates and reads on Postgres for this project (no custom
// migrationsTable/migrationsSchema is configured in drizzle.config.ts) — confirmed by inspecting
// the real database after running `npm run db:migrate`.
const MIGRATIONS_SCHEMA = "drizzle";
const MIGRATIONS_TABLE = "__drizzle_migrations";

type JournalEntry = { idx: number; when: number; tag: string };

async function main() {
  const environment = process.env.VERCEL_ENV ?? "local/unknown";

  if (!process.env.DATABASE_URL) {
    console.error(`[check-migrations] DATABASE_URL is not set — cannot verify migrations for environment "${environment}".`);
    process.exit(1);
  }

  const entries = readJournalEntries();

  let appliedIds: string[];
  try {
    appliedIds = await readAppliedMigrationIds();
  } catch (error) {
    console.error(`[check-migrations] Environment: ${environment}`);
    console.error(`[check-migrations] Could not read the migrations tracking table (${MIGRATIONS_SCHEMA}.${MIGRATIONS_TABLE}):`, error instanceof Error ? error.message : error);
    console.error(`[check-migrations] If this is a brand-new database, run "npm run db:migrate" against it before deploying.`);
    process.exit(1);
    return;
  }

  const expectedIds = entries.map((entry) => String(entry.when));
  const missingIds = findMissingMigrations(expectedIds, appliedIds);

  if (missingIds.length > 0) {
    const missingTags = entries.filter((entry) => missingIds.includes(String(entry.when))).map((entry) => entry.tag);
    console.error(`[check-migrations] Environment: ${environment}`);
    console.error(`[check-migrations] ${entries.length} migration(s) expected, ${entries.length - missingIds.length} applied, ${missingIds.length} MISSING:`);
    for (const tag of missingTags) console.error(`  - ${tag}`);
    console.error(`[check-migrations] Run "npm run db:migrate" against the ${environment} database before retrying this deploy.`);
    process.exit(1);
    return;
  }

  console.log(`[check-migrations] Environment: ${environment} — all ${entries.length} migration(s) are applied.`);
  process.exit(0);
}

function readJournalEntries(): JournalEntry[] {
  const journalPath = path.join(process.cwd(), "drizzle", "meta", "_journal.json");
  try {
    const journal = JSON.parse(readFileSync(journalPath, "utf8")) as { entries: JournalEntry[] };
    return [...journal.entries].sort((a, b) => a.when - b.when);
  } catch (error) {
    console.error(`[check-migrations] Could not read or parse ${journalPath}:`, error instanceof Error ? error.message : error);
    process.exit(1);
    throw error; // unreachable, keeps TypeScript's control-flow analysis happy
  }
}

async function readAppliedMigrationIds(): Promise<string[]> {
  const result = await db.execute(sql`select created_at from ${sql.identifier(MIGRATIONS_SCHEMA)}.${sql.identifier(MIGRATIONS_TABLE)}`);
  const rows = result.rows as Array<{ created_at: string | number }>;
  return rows.map((row) => String(row.created_at));
}

main();
