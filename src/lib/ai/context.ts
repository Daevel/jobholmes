import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { applications, userProfiles } from "@/db/schema";

const APPLICATION_DETAIL_LIMIT = 100;
const screeningStages = ["RECRUITER_SCREENING", "HIRING_MANAGER", "TECHNICAL", "CHALLENGE", "FINAL", "OFFER"] as const;
const technicalStages = ["TECHNICAL", "CHALLENGE", "FINAL", "OFFER"] as const;
const matchClasses = ["A_STRONG", "B_STRETCH", "C_LONG_SHOT"] as const;
const stages = ["APPLICATION", "RECRUITER_SCREENING", "HIRING_MANAGER", "TECHNICAL", "CHALLENGE", "FINAL", "OFFER"] as const;
const outcomes = ["PENDING", "IN_PROGRESS", "REJECTED", "WITHDRAWN", "OFFER"] as const;

type MatchClass = (typeof matchClasses)[number];
type Stage = (typeof stages)[number];
type Outcome = (typeof outcomes)[number];

type Breakdown = {
  total: number;
  rejected: number;
  inProgress: number;
  screenings: number;
  technicals: number;
  offers: number;
  screeningRate: number;
  technicalRate: number;
  offerRate: number;
};

export type JobSearchContext = Awaited<ReturnType<typeof buildJobSearchContext>>;

export async function buildJobSearchContext(userId: string) {
  const [profile] = await db
    .select({
      headline: userProfiles.headline,
      yearsExperience: userProfiles.yearsExperience,
      englishLevel: userProfiles.englishLevel,
      workAuthorization: userProfiles.workAuthorization,
      targetRoles: userProfiles.targetRoles,
      targetCountries: userProfiles.targetCountries,
      primarySkills: userProfiles.primarySkills,
      secondarySkills: userProfiles.secondarySkills,
      profileSummary: userProfiles.profileSummary,
    })
    .from(userProfiles)
    .where(eq(userProfiles.userId, userId))
    .limit(1);

  const allApplications = await db
    .select({
      id: applications.id,
      appliedAt: applications.appliedAt,
      company: applications.company,
      role: applications.role,
      roleCategory: applications.roleCategory,
      seniority: applications.seniority,
      country: applications.country,
      workMode: applications.workMode,
      source: applications.source,
      userMatchClass: applications.userMatchClass,
      userMatchPercentage: applications.userMatchPercentage,
      workAuthorization: applications.workAuthorization,
      sponsorshipRequired: applications.sponsorshipRequired,
      salaryMin: applications.salaryMin,
      salaryMax: applications.salaryMax,
      currency: applications.currency,
      outcome: applications.outcome,
      stage: applications.stage,
      responseAt: applications.responseAt,
      rejectionReason: applications.rejectionReason,
      rejectionType: applications.rejectionType,
      requirementsAndGaps: applications.requirementsAndGaps,
      notes: applications.notes,
    })
    .from(applications)
    .where(eq(applications.userId, userId))
    .orderBy(desc(applications.appliedAt));

  const detailedApplications = allApplications.slice(0, APPLICATION_DETAIL_LIMIT).map((application) => ({
    ...application,
    appliedAt: toDateOnly(application.appliedAt),
    responseAt: toDateOnly(application.responseAt),
  }));

  const funnel = buildBreakdown(allApplications);
  const matchBreakdown = Object.fromEntries(matchClasses.map((matchClass) => [toMatchKey(matchClass), buildBreakdown(allApplications.filter((application) => application.userMatchClass === matchClass))])) as Record<"strong" | "stretch" | "longShot", Breakdown>;
  const stageBreakdown = Object.fromEntries(stages.map((stage) => [stage, allApplications.filter((application) => application.stage === stage).length])) as Record<Stage, number>;
  const outcomeBreakdown = Object.fromEntries(outcomes.map((outcome) => [outcome, allApplications.filter((application) => application.outcome === outcome).length])) as Record<Outcome, number>;

  return {
    profile: profile ?? null,
    funnel: {
      applications: funnel.total,
      screenings: funnel.screenings,
      technicals: funnel.technicals,
      offers: funnel.offers,
      rejected: funnel.rejected,
      inProgress: funnel.inProgress,
      screeningRate: funnel.screeningRate,
      technicalRate: funnel.technicalRate,
      offerRate: funnel.offerRate,
    },
    matchBreakdown,
    stageBreakdown,
    outcomeBreakdown,
    applications: detailedApplications,
    metadata: {
      totalApplications: allApplications.length,
      returnedApplications: detailedApplications.length,
      truncated: allApplications.length > detailedApplications.length,
    },
  };
}

function buildBreakdown(rows: Array<{ outcome: Outcome; stage: Stage }>): Breakdown {
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

function percentage(numerator: number, denominator: number) {
  if (denominator === 0) return 0;
  return Math.round((numerator / denominator) * 1000) / 10;
}

function toDateOnly(date: Date | null) {
  return date ? date.toISOString().slice(0, 10) : null;
}

function toMatchKey(matchClass: MatchClass) {
  if (matchClass === "A_STRONG") return "strong";
  if (matchClass === "B_STRETCH") return "stretch";
  return "longShot";
}

export async function getAiFunnelSnapshot(userId: string) {
  const [stats] = await db
    .select({
      applications: sql<number>`count(*)`.mapWith(Number),
      screenings: sql<number>`count(*) filter (where ${applications.stage} in ('RECRUITER_SCREENING','HIRING_MANAGER','TECHNICAL','CHALLENGE','FINAL','OFFER'))`.mapWith(Number),
      technicals: sql<number>`count(*) filter (where ${applications.stage} in ('TECHNICAL','CHALLENGE','FINAL','OFFER'))`.mapWith(Number),
      offers: sql<number>`count(*) filter (where ${applications.outcome} = 'OFFER')`.mapWith(Number),
      strongMatches: sql<number>`count(*) filter (where ${applications.userMatchClass} = 'A_STRONG')`.mapWith(Number),
      rejected: sql<number>`count(*) filter (where ${applications.outcome} = 'REJECTED')`.mapWith(Number),
    })
    .from(applications)
    .where(eq(applications.userId, userId));

  return {
    ...stats,
    screeningRate: percentage(stats.screenings, stats.applications),
    technicalRate: percentage(stats.technicals, stats.applications),
  };
}
