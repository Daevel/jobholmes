export type AiMatchBreakdownRow = {
  aiMatchClass: "A_STRONG" | "B_STRETCH" | "C_LONG_SHOT" | null;
  outcome: "PENDING" | "IN_PROGRESS" | "REJECTED" | "WITHDRAWN" | "OFFER";
  stage: "APPLICATION" | "RECRUITER_SCREENING" | "HIRING_MANAGER" | "TECHNICAL" | "CHALLENGE" | "FINAL" | "OFFER";
};

const screeningStages = ["RECRUITER_SCREENING", "HIRING_MANAGER", "TECHNICAL", "CHALLENGE", "FINAL", "OFFER"] as const;
const technicalStages = ["TECHNICAL", "CHALLENGE", "FINAL", "OFFER"] as const;

function buildBreakdown(rows: AiMatchBreakdownRow[]) {
  const total = rows.length;
  const screenings = rows.filter((row) => screeningStages.includes(row.stage as (typeof screeningStages)[number])).length;
  const technicals = rows.filter((row) => technicalStages.includes(row.stage as (typeof technicalStages)[number])).length;
  const offers = rows.filter((row) => row.outcome === "OFFER").length;

  return {
    total,
    rejected: rows.filter((row) => row.outcome === "REJECTED").length,
    inProgress: rows.filter((row) => row.outcome === "IN_PROGRESS").length,
    screenings,
    technicals,
    offers,
    screeningRate: percentage(screenings, total),
    technicalRate: percentage(technicals, total),
    offerRate: percentage(offers, total),
  };
}

export function buildAiMatchBreakdown(rows: AiMatchBreakdownRow[]) {
  return {
    strong: buildBreakdown(rows.filter((application) => application.aiMatchClass === "A_STRONG")),
    stretch: buildBreakdown(rows.filter((application) => application.aiMatchClass === "B_STRETCH")),
    longShot: buildBreakdown(rows.filter((application) => application.aiMatchClass === "C_LONG_SHOT")),
    unanalyzed: rows.filter((application) => application.aiMatchClass === null).length,
  };
}

function percentage(numerator: number, denominator: number) {
  if (denominator === 0) return 0;
  return Math.round((numerator / denominator) * 1000) / 10;
}
