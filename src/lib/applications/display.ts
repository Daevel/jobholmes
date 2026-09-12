import type { applications } from "@/db/schema";
import { t } from "@/lib/i18n/translate";

type Application = typeof applications.$inferSelect;

// Labels come from the i18n catalog (src/lib/i18n/locales/en.ts); the object keys below must stay
// exactly the enum values from src/db/schema.ts, in this exact order — src/lib/applications/
// sort-order.ts derives the funnel sort order from Object.keys() of stageLabels/outcomeLabels.
export const matchLabels = {
  A_STRONG: t("applications.match.A_STRONG"),
  B_STRETCH: t("applications.match.B_STRETCH"),
  C_LONG_SHOT: t("applications.match.C_LONG_SHOT"),
} as const;

export const outcomeLabels = {
  PENDING: t("applications.outcome.PENDING"),
  IN_PROGRESS: t("applications.outcome.IN_PROGRESS"),
  REJECTED: t("applications.outcome.REJECTED"),
  WITHDRAWN: t("applications.outcome.WITHDRAWN"),
  OFFER: t("applications.outcome.OFFER"),
} as const;

export const stageLabels = {
  APPLICATION: t("applications.stage.APPLICATION"),
  RECRUITER_SCREENING: t("applications.stage.RECRUITER_SCREENING"),
  HIRING_MANAGER: t("applications.stage.HIRING_MANAGER"),
  TECHNICAL: t("applications.stage.TECHNICAL"),
  CHALLENGE: t("applications.stage.CHALLENGE"),
  FINAL: t("applications.stage.FINAL"),
  OFFER: t("applications.stage.OFFER"),
} as const;

export const dateFormatter = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

export function formatDate(date: Date | null) {
  return date ? dateFormatter.format(date) : "-";
}

export function formatDateInput(date: Date | null) {
  return date ? date.toISOString().slice(0, 10) : "";
}

export function formatSalary(application: Pick<Application, "salaryMin" | "salaryMax" | "currency">) {
  if (application.salaryMin === null && application.salaryMax === null) return "-";
  const currency = application.currency ? ` ${application.currency}` : "";
  if (application.salaryMin !== null && application.salaryMax !== null) return `${application.salaryMin.toLocaleString()} - ${application.salaryMax.toLocaleString()}${currency}`;
  if (application.salaryMin !== null) return `From ${application.salaryMin.toLocaleString()}${currency}`;
  return `Up to ${application.salaryMax?.toLocaleString()}${currency}`;
}

export function formatApplicationLocation(application: Pick<Application, "remoteOnly" | "city" | "country">) {
  if (application.remoteOnly) return "Remote only";
  if (application.city && application.country) return `${application.city}, ${application.country}`;
  return application.country;
}

export function getDaysToResponse(application: Pick<Application, "appliedAt" | "responseAt">) {
  if (!application.responseAt) return null;
  const millisecondsPerDay = 1000 * 60 * 60 * 24;
  return Math.max(0, Math.round((application.responseAt.getTime() - application.appliedAt.getTime()) / millisecondsPerDay));
}
