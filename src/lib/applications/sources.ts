export const DEFAULT_SOURCES: readonly string[] = ["LinkedIn", "CareerHound"];

/**
 * Trims, collapses internal whitespace, and lowercases — this is what counts as a
 * "duplicate" source. Deeper variants (abbreviations, synonyms, e.g. "LI" vs "LinkedIn")
 * are deliberately NOT unified by this normalization: known limitation, not a bug.
 */
export function normalizeSourceName(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

/**
 * Merges predefined sources with a user's saved sources, deduplicating by normalized name.
 * When a saved source normalizes to the same value as a predefined one, the predefined
 * casing wins. Result order: predefined first (as given), then saved extras alphabetically.
 */
export function mergeSources(predefined: string[], saved: Array<{ name: string }>): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const name of predefined) {
    const normalized = normalizeSourceName(name);
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    result.push(name);
  }

  const extras = saved
    .filter(({ name }) => {
      const normalized = normalizeSourceName(name);
      if (seen.has(normalized)) return false;
      seen.add(normalized);
      return true;
    })
    .map(({ name }) => name)
    .sort((a, b) => a.localeCompare(b));

  return [...result, ...extras];
}

export function matchesKnownSource(value: string, knownSources: string[]): boolean {
  const normalized = normalizeSourceName(value);
  if (!normalized) return false;
  return knownSources.some((known) => normalizeSourceName(known) === normalized);
}
