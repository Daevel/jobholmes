import { parseRequirementsAndGaps } from "@/lib/ai/requirements-and-gaps";

export function serializeApplicationForAiContext<T extends { requirementsAndGaps: string | null }>(application: T) {
  const { requirementsAndGaps, ...applicationData } = application;
  const parsedRequirementsAndGaps = parseRequirementsAndGaps(requirementsAndGaps);

  return {
    ...applicationData,
    // Legacy free text can contain the removed manual assessment, unlike structured AI Match data.
    requirementsAndGaps: parsedRequirementsAndGaps.kind === "structured" ? requirementsAndGaps : null,
  };
}
