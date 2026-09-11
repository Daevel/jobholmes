import { outcomeLabels, stageLabels } from "@/lib/applications/display";

export const stageSortOrder = Object.keys(stageLabels) as Array<keyof typeof stageLabels>;
export const outcomeSortOrder = Object.keys(outcomeLabels) as Array<keyof typeof outcomeLabels>;

export function getStageSortIndex(stage: string): number {
  const index = stageSortOrder.indexOf(stage as (typeof stageSortOrder)[number]);
  return index === -1 ? stageSortOrder.length : index;
}

export function getOutcomeSortIndex(outcome: string): number {
  const index = outcomeSortOrder.indexOf(outcome as (typeof outcomeSortOrder)[number]);
  return index === -1 ? outcomeSortOrder.length : index;
}

export const sortFields = ["company", "appliedAt", "stage", "outcome", "aiMatch"] as const;
export type SortField = (typeof sortFields)[number];
export type SortDirection = "asc" | "desc";

export function isSortField(value: string | null | undefined): value is SortField {
  return !!value && (sortFields as readonly string[]).includes(value);
}

export function isSortDirection(value: string | null | undefined): value is SortDirection {
  return value === "asc" || value === "desc";
}

export function compareAiMatchForSort(a: number | null, b: number | null, direction: SortDirection): number {
  if (a === null && b === null) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return direction === "asc" ? a - b : b - a;
}
