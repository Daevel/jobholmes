/**
 * Given the ids of every migration expected to exist (in any order) and the ids already
 * applied to a database (in any order), returns the expected ids that are missing —
 * preserving the order they were given in `expectedIds`.
 */
export function findMissingMigrations(expectedIds: string[], appliedIds: string[]): string[] {
  const appliedSet = new Set(appliedIds);
  return expectedIds.filter((id) => !appliedSet.has(id));
}
