import "server-only";

import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { applicationSources } from "@/db/schema";
import { DEFAULT_SOURCES, mergeSources, normalizeSourceName } from "@/lib/applications/sources";

export async function listSourcesForUser(userId: string): Promise<string[]> {
  const saved = await db.select({ name: applicationSources.name }).from(applicationSources).where(eq(applicationSources.userId, userId));
  return mergeSources([...DEFAULT_SOURCES], saved);
}

/**
 * Best-effort: a failure here (including the unique-constraint race when the same source is
 * saved concurrently) must never surface as an error to the caller — the application itself
 * has already been saved successfully by the time this runs.
 */
export async function saveSourceForUser(userId: string, name: string): Promise<void> {
  const trimmed = name.trim();
  if (!trimmed) return;

  const normalized = normalizeSourceName(trimmed);
  if (DEFAULT_SOURCES.some((source) => normalizeSourceName(source) === normalized)) return;

  const [existing] = await db
    .select({ id: applicationSources.id })
    .from(applicationSources)
    .where(and(eq(applicationSources.userId, userId), eq(applicationSources.normalizedName, normalized)))
    .limit(1);
  if (existing) return;

  try {
    await db.insert(applicationSources).values({ userId, name: trimmed, normalizedName: normalized });
  } catch (error) {
    console.error("Failed to save application source", { userId, error });
  }
}
