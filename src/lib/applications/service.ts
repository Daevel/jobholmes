import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { applications } from "@/db/schema";
import type { CreateApplicationInput, UpdateApplicationInput } from "@/lib/applications/schema";
export function listApplicationsForUser(userId:string){return db.select().from(applications).where(eq(applications.userId,userId)).orderBy(desc(applications.appliedAt));}
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
  | "userMatchClass"
  | "outcome"
  | "stage"
>;

export async function getApplicationStatsForUser(userId: string): Promise<ApplicationStats> {
  const [stats] = await db
    .select({
      total: sql<number>`count(*)`.mapWith(Number),
      strongMatches: sql<number>`count(*) filter (where ${applications.userMatchClass} = 'A_STRONG')`.mapWith(Number),
      stretchMatches: sql<number>`count(*) filter (where ${applications.userMatchClass} = 'B_STRETCH')`.mapWith(Number),
      longShotMatches: sql<number>`count(*) filter (where ${applications.userMatchClass} = 'C_LONG_SHOT')`.mapWith(Number),
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
      userMatchClass: applications.userMatchClass,
      outcome: applications.outcome,
      stage: applications.stage,
    })
    .from(applications)
    .where(eq(applications.userId, userId))
    .orderBy(desc(applications.appliedAt))
    .limit(limit);
}

export async function createApplicationForUser(userId: string, input: CreateApplicationInput) {
  const [created] = await db
    .insert(applications)
    .values({
      userId,
      appliedAt: input.appliedAt,
      company: input.company,
      role: input.role,
      roleCategory: input.roleCategory ?? null,
      seniority: input.seniority ?? null,
      country: input.country ?? null,
      workMode: input.workMode ?? null,
      source: input.source ?? null,
      vacancyUrl: input.vacancyUrl ?? null,
      cvVersion: input.cvVersion ?? null,
      userMatchClass: input.userMatchClass ?? null,
      userMatchPercentage: input.userMatchPercentage ?? null,
      workAuthorization: input.workAuthorization ?? null,
      sponsorshipRequired: input.sponsorshipRequired,
      salaryMin: input.salaryMin ?? null,
      salaryMax: input.salaryMax ?? null,
      currency: input.currency ?? null,
      outcome: input.outcome,
      stage: input.stage,
      requirementsAndGaps: input.requirementsAndGaps ?? null,
      notes: input.notes ?? null,
    })
    .returning();

  return created;
}

export async function updateApplicationForUser(userId: string, applicationId: string, input: UpdateApplicationInput) {
  const previous = await getApplicationForUser(userId, applicationId);

  if (!previous) return null;

  const [updated] = await db
    .update(applications)
    .set({
      appliedAt: input.appliedAt,
      company: input.company,
      role: input.role,
      roleCategory: input.roleCategory ?? null,
      seniority: input.seniority ?? null,
      country: input.country ?? null,
      workMode: input.workMode ?? null,
      source: input.source ?? null,
      vacancyUrl: input.vacancyUrl ?? null,
      cvVersion: input.cvVersion ?? null,
      userMatchClass: input.userMatchClass ?? null,
      userMatchPercentage: input.userMatchPercentage ?? null,
      workAuthorization: input.workAuthorization ?? null,
      sponsorshipRequired: input.sponsorshipRequired,
      salaryMin: input.salaryMin ?? null,
      salaryMax: input.salaryMax ?? null,
      currency: input.currency ?? null,
      outcome: input.outcome,
      stage: input.stage,
      responseAt: input.responseAt ?? null,
      rejectionReason: input.rejectionReason ?? null,
      requirementsAndGaps: input.requirementsAndGaps ?? null,
      notes: input.notes ?? null,
      updatedAt: new Date(),
    })
    .where(and(eq(applications.userId, userId), eq(applications.id, applicationId)))
    .returning();

  return { previous, updated };
}
