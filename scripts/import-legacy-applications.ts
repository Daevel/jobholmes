import "dotenv/config";

import { and, eq } from "drizzle-orm";
import { db } from "../src/db";
import { applications, users } from "../src/db/schema";
import { createApplicationSchema, type CreateApplicationInput } from "../src/lib/applications/schema";

type LegacyApplication = {
  input: CreateApplicationInput;
  responseAt?: Date;
  rejectionReason?: string;
};

const legacyApplications: LegacyApplication[] = [
  {
    input: parseLegacyApplication({
      appliedAt: "2026-08-11",
      company: "Klarna",
      role: "Senior Fullstack Engineer - Javascript",
      roleCategory: "Full Stack Engineer",
      seniority: "Senior",
      country: "Europe",
      workMode: "Hybrid",
      source: "Careerhound",
      cvVersion: "cv base",
      userMatchClass: "B_STRETCH",
      userMatchPercentage: 65,
      workAuthorization: "EU citizen",
      currency: "EUR",
      outcome: "REJECTED",
      stage: "APPLICATION",
    }),
    responseAt: parseDate("2026-09-03"),
    rejectionReason: `Hi Luigi,

 Thank you for your interest in Klarna and for applying to the Senior Fullstack Engineer - Javascript position. After careful consideration, we have decided to move forward with other candidates for this position. 

 We encourage you to explore other positions with us that may align with your skills and career goals. New opportunities are posted regularly on our careers page and we welcome you to consider applying for future openings.

 We sincerely appreciate your interest in joining our team and wish you success in your ongoing professional and personal endeavors.

 Best regards,

 Talent Acquisition
 Klarna Bank AB (publ)`,
  },
  {
    input: parseLegacyApplication({
      appliedAt: "2026-09-02",
      company: "Genesys",
      role: "Frontend Engineer",
      roleCategory: "Frontend Engineer",
      seniority: "Mid / II",
      country: "Galway",
      workMode: "Hybrid",
      source: "Careerhound",
      vacancyUrl: "https://genesys.wd1.myworkdayjobs.com/Genesys/job/Galway-Ireland/Frontend-Engineer_JR112145-1",
      cvVersion: "cv base",
      userMatchClass: "A_STRONG",
      userMatchPercentage: 85,
      workAuthorization: "EU citizen",
      currency: "EUR",
      outcome: "IN_PROGRESS",
      stage: "APPLICATION",
      requirementsAndGaps:
        "Gap principali: esperienza AWS professionale specifica e Conversational AI/bot-NLU. Core requirements fortemente coperti: 4+ anni frontend, Angular, TypeScript/JavaScript, REST, Git/CI-CD, accessibility; Java/Python e microservizi presenti nel profilo.",
    }),
  },
  {
    input: parseLegacyApplication({
      appliedAt: "2026-08-29",
      company: "Primer.io",
      role: "Frontend Engineer",
      roleCategory: "Frontend Engineer",
      seniority: "Mid / II",
      country: "Europe",
      workMode: "Hybrid",
      source: "Careerhound",
      cvVersion: "cv base",
      userMatchClass: "B_STRETCH",
      userMatchPercentage: 70,
      workAuthorization: "EU citizen",
      currency: "EUR",
      outcome: "REJECTED",
      stage: "APPLICATION",
    }),
    responseAt: parseDate("2026-09-02"),
    rejectionReason: `Hi Luigi,
  
 We've decided not to move forward with your application for this role, as other candidates were a closer match for what the team needs right now.

 We know job hunting is hard at the best of times and right now it's harder than most. So much of it has become automated, with applications disappearing into a system that no person ever sees. We know how draining that is, and it's part of why decisions like this are made by people here, not by AI.

 Given the amount of interest we receive, we're not able to give individual feedback, and we're sorry we can't say more. These decisions are rarely about any single shortcoming, and a "no" here reflects the strength and depth of the field rather than a judgement on your career.

 Whilst we know this isn't the answer you were hoping for, the door stays open. If another role on our careers page looks right, we'd welcome your application.

 Best of luck with the search.
  
 Primer Talent Team`,
  },
  {
    input: parseLegacyApplication({
      appliedAt: "2026-09-05",
      company: "Volkswagen Group Services",
      role: "Frontend Developer",
      roleCategory: "Frontend Developer",
      seniority: "Mid / II",
      country: "Lisbon",
      workMode: "Hybrid",
      source: "Careerhound",
      vacancyUrl: "https://jobs.volkswagen-group.com/Volkswagen-Group-Services/job/Lisboa-Frontend-Developer-1200-246/1421876933/",
      cvVersion: "cv base",
      userMatchClass: "B_STRETCH",
      userMatchPercentage: 72,
      workAuthorization: "EU citizen",
      salaryMin: 29505,
      salaryMax: 57225,
      currency: "EUR",
      outcome: "IN_PROGRESS",
      stage: "APPLICATION",
      requirementsAndGaps:
        "Gap principali: requisito 5+ anni di software development; AWS specifico (ECS, SQS, SNS, DynamoDB, RDS); English fluent rispetto a B2. Core frontend React/TypeScript, architecture, REST, IAM/SSO, CI-CD e testing ben coperti.",
    }),
  },
  {
    input: parseLegacyApplication({
      appliedAt: "2026-09-05",
      company: "TeamSystem",
      role: "Frontend Developer",
      roleCategory: "Frontend Developer",
      seniority: "Mid / II",
      country: "Turin/Milan",
      workMode: "Hybrid",
      source: "Careerhound",
      vacancyUrl: "https://teamsystem.wd103.myworkdayjobs.com/TeamSystem/job/Italy-Torino/Frontend-Developer_JR0000001769",
      cvVersion: "cv base",
      userMatchClass: "A_STRONG",
      userMatchPercentage: 88,
      workAuthorization: "EU citizen",
      salaryMin: 33000,
      salaryMax: 37000,
      currency: "EUR",
      outcome: "IN_PROGRESS",
      stage: "APPLICATION",
      requirementsAndGaps:
        "Strong match: 3+ anni richiesti, esperienza React enterprise, Angular come plus e familiarità con AI coding assistants sono fortemente coperti. Gap principale: la JD richiede inglese C1, mentre il profilo attuale è B2.",
    }),
  },
];

async function main() {
  const importUserEmail = process.env.IMPORT_USER_EMAIL;

  if (!importUserEmail) {
    console.error('IMPORT_USER_EMAIL is required. Example: IMPORT_USER_EMAIL="you@example.com" npm run import:legacy-applications');
    process.exitCode = 1;
    return;
  }

  const [user] = await db.select().from(users).where(eq(users.email, importUserEmail)).limit(1);

  if (!user) {
    console.error(`No existing JobHolmes user found for IMPORT_USER_EMAIL=${importUserEmail}. Nothing was inserted.`);
    process.exitCode = 1;
    return;
  }

  let inserted = 0;
  let skipped = 0;
  let failed = 0;

  for (const legacyApplication of legacyApplications) {
    const { input } = legacyApplication;
    const label = `${input.company} - ${input.role}`;

    try {
      const [existing] = await db
        .select({ id: applications.id })
        .from(applications)
        .where(
          and(
            eq(applications.userId, user.id),
            eq(applications.company, input.company),
            eq(applications.role, input.role),
            eq(applications.appliedAt, input.appliedAt),
          ),
        )
        .limit(1);

      if (existing) {
        skipped += 1;
        console.log(`SKIP ${label}`);
        continue;
      }

      await db.insert(applications).values({
        userId: user.id,
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
        responseAt: legacyApplication.responseAt ?? null,
        rejectionReason: legacyApplication.rejectionReason ?? null,
        requirementsAndGaps: input.requirementsAndGaps ?? null,
        notes: input.notes ?? null,
      });

      inserted += 1;
      console.log(`INSERT ${label}`);
    } catch (error) {
      failed += 1;
      console.error(`FAIL ${label}`, error instanceof Error ? error.message : "Unknown error");
    }
  }

  console.log(`Inserted: ${inserted}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Failed: ${failed}`);
}

function parseLegacyApplication(input: Record<string, unknown>) {
  return createApplicationSchema.parse(input);
}

function parseDate(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

main().catch((error) => {
  console.error("Legacy import failed", error instanceof Error ? error.message : "Unknown error");
  process.exitCode = 1;
});
