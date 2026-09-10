export const AI_MATCH_UNANALYZED = "UNANALYZED" as const;

export type AiMatchClass = "A_STRONG" | "B_STRETCH" | "C_LONG_SHOT";
export type AiMatchFilter = AiMatchClass | typeof AI_MATCH_UNANALYZED | "";

export function matchesAiMatchFilter(application: { aiMatchClass: AiMatchClass | null }, selectedMatch: AiMatchFilter) {
  if (!selectedMatch) return true;
  if (selectedMatch === AI_MATCH_UNANALYZED) return application.aiMatchClass === null;
  return application.aiMatchClass === selectedMatch;
}

export function countAiMatchClasses(applications: Array<{ aiMatchClass: AiMatchClass | null }>) {
  return {
    strongMatches: applications.filter((application) => application.aiMatchClass === "A_STRONG").length,
    stretchMatches: applications.filter((application) => application.aiMatchClass === "B_STRETCH").length,
    longShotMatches: applications.filter((application) => application.aiMatchClass === "C_LONG_SHOT").length,
    unanalyzed: applications.filter((application) => application.aiMatchClass === null).length,
  };
}
