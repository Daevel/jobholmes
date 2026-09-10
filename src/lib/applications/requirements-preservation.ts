import { parseRequirementsAndGaps } from "@/lib/ai/requirements-and-gaps";

export function getNextRequirementsAndGaps(shouldInvalidateAiMatch: boolean, previousValue: string | null) {
  const previous = parseRequirementsAndGaps(previousValue);
  if (shouldInvalidateAiMatch && previous.kind === "structured") return null;
  return previousValue;
}
