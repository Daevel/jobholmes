import { z } from "zod";
import { formatDateInput, stageLabels } from "@/lib/applications/display";
import { stageSortOrder } from "@/lib/applications/sort-order";

export type ApplicationStage = keyof typeof stageLabels;

export type StageHistoryEntry = { text: string; updatedAt: string };
export type StageHistory = Partial<Record<ApplicationStage, StageHistoryEntry>>;

const stageHistoryEntrySchema = z.object({ text: z.string(), updatedAt: z.string().min(1) });
const storedStageHistorySchema = z.record(z.string(), stageHistoryEntrySchema);

/**
 * Reads the per-stage history for an application, falling back to the legacy stageContext column
 * when stageHistory hasn't been populated yet (older rows created before this model existed). The
 * fallback treats that free text as the entry for the application's *current* stage — the only
 * stage a legacy row could plausibly have been describing — and is applied only in memory: nothing
 * is written back to the database here. It stops applying the moment a row is resaved through the
 * new model (which always writes a real, even if empty, stageHistory object).
 */
export function getEffectiveStageHistory(application: {
  stage: ApplicationStage;
  stageHistory: unknown;
  stageContext: string | null;
  updatedAt: Date;
}): StageHistory {
  const parsed = storedStageHistorySchema.safeParse(application.stageHistory);
  if (parsed.success && Object.keys(parsed.data).length > 0) return parsed.data as StageHistory;

  if (application.stageContext?.trim()) {
    return { [application.stage]: { text: application.stageContext, updatedAt: formatDateInput(application.updatedAt) } };
  }

  return {};
}

/** Stages from APPLICATION through currentStage inclusive, in funnel order. */
export function reachedStages(currentStage: ApplicationStage): ApplicationStage[] {
  const index = stageSortOrder.indexOf(currentStage);
  const cutoff = index === -1 ? stageSortOrder.length : index + 1;
  return stageSortOrder.slice(0, cutoff);
}

/** Multi-line "{Label} ({date}): {text}" rendering for the Google Sheets mirror, funnel-ordered. */
export function flattenStageHistoryForSheet(history: StageHistory, labels: Record<ApplicationStage, string>): string {
  return stageSortOrder
    .filter((stage) => Boolean(history[stage]))
    .map((stage) => {
      const entry = history[stage] as StageHistoryEntry;
      return `${labels[stage]} (${entry.updatedAt}): ${entry.text}`;
    })
    .join("\n");
}

/** Parses the JSON string carried by the edit/new form's hidden stageHistory input. */
export function parseStageHistoryFormValue(value: string | undefined): StageHistory {
  if (!value) return {};

  try {
    const parsed: unknown = JSON.parse(value);
    return parsed && typeof parsed === "object" ? (parsed as StageHistory) : {};
  } catch {
    return {};
  }
}

/** Serializes form state back to JSON for that hidden input, dropping any blank-text entries. */
export function serializeStageHistoryForForm(history: StageHistory): string {
  const cleaned = Object.fromEntries(Object.entries(history).filter(([, entry]) => entry?.text.trim()));
  return JSON.stringify(cleaned);
}
