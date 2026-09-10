import type { LegacyApplicationImportInput } from "@/lib/applications/schema";

// This is the only active code boundary that maps deprecated manual-match input to storage.
export function legacyManualMatchValues(input: Pick<LegacyApplicationImportInput, "userMatchClass" | "userMatchPercentage">) {
  return {
    userMatchClass: input.userMatchClass ?? null,
    userMatchPercentage: input.userMatchPercentage ?? null,
  };
}
