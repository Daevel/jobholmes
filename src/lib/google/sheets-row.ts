import type { applications } from "@/db/schema";

export type SheetApplication = typeof applications.$inferSelect;

const matchLabels = {
  A_STRONG: "A - Strong",
  B_STRETCH: "B - Stretch",
  C_LONG_SHOT: "C - Long shot",
} as const;

const outcomeLabels = {
  PENDING: "Pending",
  IN_PROGRESS: "In progress",
  REJECTED: "Rejected",
  WITHDRAWN: "Withdrawn",
  OFFER: "Offer",
} as const;

const stageLabels = {
  APPLICATION: "Application",
  RECRUITER_SCREENING: "Recruiter screening",
  HIRING_MANAGER: "Hiring manager",
  TECHNICAL: "Technical",
  CHALLENGE: "Challenge",
  FINAL: "Final",
  OFFER: "Offer",
} as const;

// Columns L:M remain in their legacy positions. New active records leave them blank,
// while updates carry existing cell values forward instead of clearing historical data.
export function toSheetRow(application: SheetApplication, sheetId: number, legacyManualMatchCells: unknown[] = []) {
  return [
    sheetId,
    formatDate(application.appliedAt),
    application.company,
    application.role,
    application.roleCategory ?? "",
    application.seniority ?? "",
    application.country ?? "",
    application.workMode ?? "",
    application.source ?? "",
    application.vacancyUrl ?? "",
    application.cvVersion ?? "",
    legacyManualMatchCells[0] ?? "",
    legacyManualMatchCells[1] ?? "",
    application.workAuthorization ?? "",
    application.salaryMin ?? "",
    application.salaryMax ?? "",
    application.currency ?? "",
    outcomeLabels[application.outcome],
    stageLabels[application.stage],
    application.responseAt ? formatDate(application.responseAt) : "",
    getDaysToResponse(application),
    application.rejectionReason ?? "",
    application.requirementsAndGaps ?? "",
    application.notes ?? "",
    truncateForSheet(application.jdText ?? ""),
    application.aiMatchClass ? matchLabels[application.aiMatchClass] : "",
    application.aiMatchPercentage === null ? "" : `${application.aiMatchPercentage}%`,
    application.aiMatchConfidence === null ? "" : `${application.aiMatchConfidence}%`,
  ];
}

export function getLegacyManualMatchCells(row: unknown[]) {
  return row.slice(11, 13);
}

function truncateForSheet(value: string) {
  return value.length > 45000 ? `${value.slice(0, 45000)}\n[Truncated in Google Sheet; full JD is stored in JobHolmes.]` : value;
}

function getDaysToResponse(application: SheetApplication) {
  if (!application.responseAt) return "";
  const millisecondsPerDay = 1000 * 60 * 60 * 24;
  return Math.max(0, Math.round((application.responseAt.getTime() - application.appliedAt.getTime()) / millisecondsPerDay));
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}
