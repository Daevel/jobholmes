import { and, asc, desc, eq, sql, type SQL } from "drizzle-orm";
import type { PgColumn } from "drizzle-orm/pg-core";
import { db } from "@/db";
import { applications } from "@/db/schema";
import type { CreateApplicationInput, UpdateApplicationInput } from "@/lib/applications/schema";
import { getCvForUser } from "@/lib/cvs/service";
import { getNextRequirementsAndGaps } from "@/lib/applications/requirements-preservation";
import { getNextRejectionReason } from "@/lib/applications/rejection-reason";
import { outcomeSortOrder, stageSortOrder, type SortDirection, type SortField } from "@/lib/applications/sort-order";
export { getNextRequirementsAndGaps } from "@/lib/applications/requirements-preservation";

function buildEnumOrderExpr(column: PgColumn, order: readonly string[]): SQL {
  const whens = order.map((value, index) => sql`WHEN ${column} = ${value} THEN ${index}`);
  return sql`(CASE ${sql.join(whens, sql` `)} ELSE ${order.length} END)`;
}

function buildAiMatchOrderExpr(direction: SortDirection): SQL {
  return direction === "asc" ? sql`${applications.aiMatchPercentage} ASC NULLS LAST` : sql`${applications.aiMatchPercentage} DESC NULLS LAST`;
}

function buildApplicationsOrderBy(sort?: { field: SortField; direction: SortDirection }): SQL[] {
  if (!sort) return [desc(applications.appliedAt)];
  const { field, direction } = sort;
  const dir = direction === "asc" ? asc : desc;
  if (field === "appliedAt") return [dir(applications.appliedAt)];
  if (field === "company") return [dir(applications.company), desc(applications.appliedAt)];
  if (field === "stage") return [dir(buildEnumOrderExpr(applications.stage, stageSortOrder)), desc(applications.appliedAt)];
  if (field === "outcome") return [dir(buildEnumOrderExpr(applications.outcome, outcomeSortOrder)), desc(applications.appliedAt)];
  return [buildAiMatchOrderExpr(direction), desc(applications.appliedAt)];
}

export function listApplicationsForUser(userId: string, sort?: { field: SortField; direction: SortDirection }) {
  return db.select().from(applications).where(eq(applications.userId, userId)).orderBy(...buildApplicationsOrderBy(sort));
}
export async function getApplicationForUser(userId:string,applicationId:string){const [row]=await db.select().from(applications).where(and(eq(applications.userId,userId),eq(applications.id,applicationId))).limit(1);return row??null;}

export type ApplicationStats = {
  total: number;
  strongMatches: number;
  stretchMatches: number;
  longShotMatches: number;
  rejected: number;
  inProgress: number;
  offers: number;
};

export type RecentApplication = Pick<
  typeof applications.$inferSelect,
  | "id"
  | "appliedAt"
  | "company"
  | "role"
  | "country"
  | "aiMatchClass"
  | "aiMatchPercentage"
  | "outcome"
  | "stage"
>;

export async function getApplicationStatsForUser(userId: string): Promise<ApplicationStats> {
  const [stats] = await db
    .select({
      total: sql<number>`count(*)`.mapWith(Number),
      strongMatches: sql<number>`count(*) filter (where ${applications.aiMatchClass} = 'A_STRONG')`.mapWith(Number),
      stretchMatches: sql<number>`count(*) filter (where ${applications.aiMatchClass} = 'B_STRETCH')`.mapWith(Number),
      longShotMatches: sql<number>`count(*) filter (where ${applications.aiMatchClass} = 'C_LONG_SHOT')`.mapWith(Number),
      rejected: sql<number>`count(*) filter (where ${applications.outcome} = 'REJECTED')`.mapWith(Number),
      inProgress: sql<number>`count(*) filter (where ${applications.outcome} = 'IN_PROGRESS')`.mapWith(Number),
      offers: sql<number>`count(*) filter (where ${applications.outcome} = 'OFFER')`.mapWith(Number),
    })
    .from(applications)
    .where(eq(applications.userId, userId));

  return stats;
}

export async function getRecentApplicationsForUser(userId: string, limit = 5): Promise<RecentApplication[]> {
  return db
    .select({
      id: applications.id,
      appliedAt: applications.appliedAt,
      company: applications.company,
      role: applications.role,
      country: applications.country,
      aiMatchClass: applications.aiMatchClass,
      aiMatchPercentage: applications.aiMatchPercentage,
      outcome: applications.outcome,
      stage: applications.stage,
    })
    .from(applications)
    .where(eq(applications.userId, userId))
    .orderBy(desc(applications.appliedAt))
    .limit(limit);
}

type BaseApplicationValuesInput = {
  appliedAt: Date;
  company: string;
  role: string;
  roleCategory?: string;
  seniority?: string;
  country?: string;
  city?: string;
  remoteOnly: boolean;
  workMode?: string;
  source?: string;
  vacancyUrl?: string;
  workAuthorization?: string;
  sponsorshipRequired: boolean | null;
  salaryMin?: number;
  salaryMax?: number;
  currency?: string;
  stageContext?: string;
  notes?: string;
  coverLetter?: string;
};

function buildBaseApplicationValues(userId: string, input: BaseApplicationValuesInput) {
  return {
    userId,
    appliedAt: input.appliedAt,
    company: input.company,
    role: input.role,
    roleCategory: input.roleCategory ?? null,
    seniority: input.seniority ?? null,
    country: input.country ?? null,
    city: input.city ?? null,
    remoteOnly: input.remoteOnly,
    workMode: input.workMode ?? null,
    source: input.source ?? null,
    vacancyUrl: input.vacancyUrl ?? null,
    workAuthorization: input.workAuthorization ?? null,
    sponsorshipRequired: input.sponsorshipRequired,
    salaryMin: input.salaryMin ?? null,
    salaryMax: input.salaryMax ?? null,
    currency: input.currency ?? null,
    outcome: "IN_PROGRESS" as const,
    stage: "APPLICATION" as const,
    stageContext: input.stageContext ?? null,
    notes: input.notes ?? null,
    coverLetter: input.coverLetter ?? null,
  };
}

export async function createApplicationForUser(userId: string, input: CreateApplicationInput) {
  const selectedCv = input.cvDocumentId ? await getCvForUser(userId, input.cvDocumentId) : null;
  if (input.cvDocumentId && !selectedCv) throw new Error("CV_NOT_FOUND");

  const [created] = await db
    .insert(applications)
    .values({
      ...buildBaseApplicationValues(userId, input),
      cvDocumentId: selectedCv?.id ?? null,
      cvVersion: selectedCv?.name ?? null,
      jdText: input.jdText ?? null,
    })
    .returning();

  return created;
}

export type CreateApplicationFromVerifiedJobFitInput = Omit<CreateApplicationInput, "cvDocumentId" | "jdText"> & {
  cvDocumentId: string;
  jdText: string;
  aiMatchClass: typeof applications.$inferSelect.aiMatchClass;
  aiMatchPercentage: number | null;
  aiMatchConfidence: number | null;
  requirementsAndGaps: string;
};

/**
 * Creates an application from a Job Fit preview result whose match data has already been
 * verified (see /api/job-fit/confirm). Deliberately separate from createApplicationForUser /
 * createApplicationSchema, which must keep rejecting client-supplied match values.
 */
export async function createApplicationFromVerifiedJobFit(userId: string, input: CreateApplicationFromVerifiedJobFitInput) {
  const selectedCv = await getCvForUser(userId, input.cvDocumentId);
  if (!selectedCv) throw new Error("CV_NOT_FOUND");

  const [created] = await db
    .insert(applications)
    .values({
      ...buildBaseApplicationValues(userId, input),
      cvDocumentId: selectedCv.id,
      cvVersion: selectedCv.name,
      jdText: input.jdText,
      aiMatchClass: input.aiMatchClass,
      aiMatchPercentage: input.aiMatchPercentage,
      aiMatchConfidence: input.aiMatchConfidence,
      requirementsAndGaps: input.requirementsAndGaps,
      jdVerifiedAt: new Date(),
    })
    .returning();

  return created;
}

export async function updateApplicationForUser(userId: string, applicationId: string, input: UpdateApplicationInput) {
  const previous = await getApplicationForUser(userId, applicationId);

  if (!previous) return null;

  const selectedCv = input.cvDocumentId ? await getCvForUser(userId, input.cvDocumentId) : null;
  if (input.cvDocumentId && !selectedCv) throw new Error("CV_NOT_FOUND");

  const normalizedJdText = input.jdText ?? null;
  const nextCvDocumentId = selectedCv?.id ?? null;
  const shouldInvalidateAiMatch = previous.jdText !== normalizedJdText || previous.cvDocumentId !== nextCvDocumentId;
  const requirementsAndGaps = getNextRequirementsAndGaps(shouldInvalidateAiMatch, previous.requirementsAndGaps);
  const rejectionReason = getNextRejectionReason({ outcome: input.outcome, submittedValue: input.rejectionReason, previousValue: previous.rejectionReason });

  const [updated] = await db
    .update(applications)
    .set({
      appliedAt: input.appliedAt,
      company: input.company,
      role: input.role,
      roleCategory: input.roleCategory ?? null,
      seniority: input.seniority ?? null,
      country: input.country ?? null,
      city: input.city ?? null,
      remoteOnly: input.remoteOnly,
      workMode: input.workMode ?? null,
      source: input.source ?? null,
      vacancyUrl: input.vacancyUrl ?? null,
      cvDocumentId: nextCvDocumentId,
      cvVersion: selectedCv?.name ?? (input.cvDocumentId ? null : previous.cvVersion),
      jdText: normalizedJdText,
      aiMatchClass: shouldInvalidateAiMatch ? null : previous.aiMatchClass,
      aiMatchPercentage: shouldInvalidateAiMatch ? null : previous.aiMatchPercentage,
      aiMatchConfidence: shouldInvalidateAiMatch ? null : previous.aiMatchConfidence,
      workAuthorization: input.workAuthorization ?? null,
      sponsorshipRequired: input.sponsorshipRequired,
      salaryMin: input.salaryMin ?? null,
      salaryMax: input.salaryMax ?? null,
      currency: input.currency ?? null,
      outcome: input.outcome,
      stage: input.stage,
      responseAt: input.responseAt ?? null,
      stageContext: input.stageContext ?? null,
      rejectionReason,
      requirementsAndGaps,
      notes: input.notes ?? null,
      coverLetter: input.coverLetter ?? null,
      jdVerifiedAt: shouldInvalidateAiMatch ? null : previous.jdVerifiedAt,
      updatedAt: new Date(),
    })
    .where(and(eq(applications.userId, userId), eq(applications.id, applicationId)))
    .returning();

  return { previous, updated };
}

export async function unlinkCvFromApplication(userId: string, applicationId: string) {
  const [updated] = await db
    .update(applications)
    .set({ cvDocumentId: null, updatedAt: new Date() })
    .where(and(eq(applications.userId, userId), eq(applications.id, applicationId)))
    .returning();

  return updated ?? null;
}

export async function saveCoverLetterForUser(userId: string, applicationId: string, coverLetter: string | null) {
  const [updated] = await db
    .update(applications)
    .set({ coverLetter, updatedAt: new Date() })
    .where(and(eq(applications.userId, userId), eq(applications.id, applicationId)))
    .returning();

  return updated ?? null;
}
