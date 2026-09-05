import type { applications } from "@/db/schema";

type Application = typeof applications.$inferSelect;

export const matchLabels = {
  A_STRONG: "Strong",
  B_STRETCH: "Stretch",
  C_LONG_SHOT: "Long-shot",
} as const;

export const outcomeLabels = {
  PENDING: "Pending",
  IN_PROGRESS: "In progress",
  REJECTED: "Rejected",
  WITHDRAWN: "Withdrawn",
  OFFER: "Offer",
} as const;

export const stageLabels = {
  APPLICATION: "Application",
  RECRUITER_SCREENING: "Recruiter screening",
  HIRING_MANAGER: "Hiring manager",
  TECHNICAL: "Technical",
  CHALLENGE: "Challenge",
  FINAL: "Final",
  OFFER: "Offer",
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

export function getDaysToResponse(application: Pick<Application, "appliedAt" | "responseAt">) {
  if (!application.responseAt) return null;
  const millisecondsPerDay = 1000 * 60 * 60 * 24;
  return Math.max(0, Math.round((application.responseAt.getTime() - application.appliedAt.getTime()) / millisecondsPerDay));
}
