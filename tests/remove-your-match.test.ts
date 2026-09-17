import test from "node:test";
import assert from "node:assert/strict";
import { AI_MATCH_UNANALYZED, countAiMatchClasses, matchesAiMatchFilter } from "@/lib/applications/ai-match";
import { createApplicationSchema, legacyApplicationImportSchema, updateApplicationSchema } from "@/lib/applications/schema";
import { legacyManualMatchValues } from "@/lib/applications/legacy";
import { getNextRequirementsAndGaps } from "@/lib/applications/requirements-preservation";
import { getNextRejectionReason, shouldShowRejectionReason } from "@/lib/applications/rejection-reason";
import { buildAiMatchBreakdown } from "@/lib/ai/match-breakdown";
import { serializeApplicationForAiContext } from "@/lib/ai/context-application";
import { serializeRequirementsAndGaps, type RequirementsAndGapsPayload } from "@/lib/ai/requirements-and-gaps";
import { getLegacyManualMatchCells, toSheetRow } from "@/lib/google/sheets-row";
import type { ApplicationMobileCardApplication } from "@/components/application-ui";
import type { RecentApplication } from "@/lib/applications/service";
import type { JobSearchContext } from "@/lib/ai/context";

const activeInput = {
  appliedAt: new Date("2026-09-10T00:00:00.000Z"),
  company: "Acme",
  role: "Engineer",
};

test("AI Match filter ignores different historical manual values", () => {
  const strongWithLegacyLongShot = { aiMatchClass: "A_STRONG" as const, userMatchClass: "C_LONG_SHOT", userMatchPercentage: 10 };
  const strongWithLegacyStrong = { aiMatchClass: "A_STRONG" as const, userMatchClass: "A_STRONG", userMatchPercentage: 95 };

  assert.equal(matchesAiMatchFilter(strongWithLegacyLongShot, "A_STRONG"), true);
  assert.equal(matchesAiMatchFilter(strongWithLegacyStrong, "A_STRONG"), true);
  assert.equal(matchesAiMatchFilter(strongWithLegacyLongShot, "C_LONG_SHOT"), false);
  assert.equal(matchesAiMatchFilter({ aiMatchClass: null }, AI_MATCH_UNANALYZED), true);
});

test("dashboard AI Match counts exclude unanalyzed applications", () => {
  assert.deepEqual(
    countAiMatchClasses([
      { aiMatchClass: "A_STRONG" },
      { aiMatchClass: "B_STRETCH" },
      { aiMatchClass: "C_LONG_SHOT" },
      { aiMatchClass: null },
      { aiMatchClass: null },
    ]),
    { strongMatches: 1, stretchMatches: 1, longShotMatches: 1, unanalyzed: 2 },
  );
});

test("AI context breakdown uses AI classes and represents unanalyzed applications", () => {
  const breakdown = buildAiMatchBreakdown([
    { aiMatchClass: "A_STRONG", outcome: "IN_PROGRESS", stage: "APPLICATION" },
    { aiMatchClass: "B_STRETCH", outcome: "REJECTED", stage: "APPLICATION" },
    { aiMatchClass: null, outcome: "IN_PROGRESS", stage: "APPLICATION" },
  ]);

  assert.equal(breakdown.strong.total, 1);
  assert.equal(breakdown.stretch.total, 1);
  assert.equal(breakdown.longShot.total, 0);
  assert.equal(breakdown.unanalyzed, 1);
});

test("AI context serialization excludes legacy manual notes", () => {
  const contextApplication = serializeApplicationForAiContext({
    company: "Acme",
    stageContext: "Technical interview will cover system design.",
    requirementsAndGaps: "Legacy strong match assessment",
  });

  assert.deepEqual(contextApplication, { company: "Acme", stageContext: "Technical interview will cover system design.", requirementsAndGaps: null });
});

test("active create and edit inputs reject manual match values", () => {
  assert.equal(createApplicationSchema.safeParse({ ...activeInput, userMatchClass: "A_STRONG" }).success, false);
  assert.equal(createApplicationSchema.safeParse({ ...activeInput, userMatchPercentage: 95 }).success, false);
  assert.equal(updateApplicationSchema.safeParse({ ...activeInput, outcome: "IN_PROGRESS", stage: "APPLICATION", userMatchClass: "A_STRONG" }).success, false);
  assert.equal(updateApplicationSchema.safeParse({ ...activeInput, outcome: "IN_PROGRESS", stage: "APPLICATION", userMatchPercentage: 95 }).success, false);
});

test("create and update inputs retain stage context", () => {
  const stageContext = "Recruiter confirmed the screening format.";
  const created = createApplicationSchema.parse({ ...activeInput, stageContext, country: "Germany" });
  const updated = updateApplicationSchema.parse({ ...activeInput, stageContext, country: "Germany", outcome: "IN_PROGRESS", stage: "RECRUITER_SCREENING" });

  assert.equal(created.stageContext, stageContext);
  assert.equal(updated.stageContext, stageContext);
});

test("rejection reason is visible only for rejected applications", () => {
  assert.equal(shouldShowRejectionReason("REJECTED"), true);
  assert.equal(shouldShowRejectionReason("IN_PROGRESS"), false);
  assert.equal(shouldShowRejectionReason("OFFER"), false);
});

test("non-rejected edits preserve historical rejection reasons", () => {
  assert.equal(
    getNextRejectionReason({ outcome: "IN_PROGRESS", submittedValue: undefined, previousValue: "Historical rejection feedback" }),
    "Historical rejection feedback",
  );
});

test("rejected edits can update or clear rejection reasons", () => {
  assert.equal(
    getNextRejectionReason({ outcome: "REJECTED", submittedValue: "Missing required experience.", previousValue: "Old feedback" }),
    "Missing required experience.",
  );
  assert.equal(
    getNextRejectionReason({ outcome: "REJECTED", submittedValue: undefined, previousValue: "Old feedback" }),
    null,
  );
});

test("unrelated edits preserve historical values and structured AI analysis", () => {
  const structuredAnalysis = serializeRequirementsAndGaps(makePayload());
  const legacyNotes = "Historical requirements and gaps notes";

  assert.equal(getNextRequirementsAndGaps(false, structuredAnalysis), structuredAnalysis);
  assert.equal(getNextRequirementsAndGaps(false, legacyNotes), legacyNotes);
  assert.equal(getNextRequirementsAndGaps(true, structuredAnalysis), null);
  assert.equal(getNextRequirementsAndGaps(true, legacyNotes), legacyNotes);
});

test("legacy import accepts and maps historical manual match values", () => {
  const legacyInput = legacyApplicationImportSchema.parse({
    ...activeInput,
    outcome: "IN_PROGRESS",
    stage: "APPLICATION",
    userMatchClass: "B_STRETCH",
    userMatchPercentage: 65,
  });

  assert.deepEqual(legacyManualMatchValues(legacyInput), { userMatchClass: "B_STRETCH", userMatchPercentage: 65 });
});

test("Google Sheets keeps legacy manual cells positioned and untouched", () => {
  const application = {
    ...activeInput,
    id: "00000000-0000-0000-0000-000000000000",
    userId: "00000000-0000-0000-0000-000000000001",
    roleCategory: null,
    seniority: null,
    country: null,
    workMode: null,
    source: null,
    vacancyUrl: null,
    cvVersion: null,
    cvDocumentId: null,
    jdText: null,
    userMatchClass: "A_STRONG",
    userMatchPercentage: 95,
    aiMatchClass: "B_STRETCH",
    aiMatchPercentage: 65,
    aiMatchConfidence: 80,
    workAuthorization: null,
    sponsorshipRequired: null,
    salaryMin: null,
    salaryMax: null,
    currency: null,
    outcome: "IN_PROGRESS" as const,
    stage: "APPLICATION" as const,
    responseAt: null,
    stageContext: "Recruiter call booked.",
    rejectionReason: null,
    rejectionType: null,
    requirementsAndGaps: null,
    notes: null,
    jdVerifiedAt: null,
    createdAt: new Date("2026-09-10T00:00:00.000Z"),
    updatedAt: new Date("2026-09-10T00:00:00.000Z"),
  } as Parameters<typeof toSheetRow>[0];

  const newRow = toSheetRow(application, 1);
  const historicalCells = getLegacyManualMatchCells([1, "10/09/2026", "Acme", "Engineer", "", "", "", "", "", "", "", "A - Strong", "95%"]);
  const updatedRow = toSheetRow(application, 1, historicalCells);

  assert.deepEqual(newRow.slice(11, 13), ["", ""]);
  assert.deepEqual(updatedRow.slice(11, 13), ["A - Strong", "95%"]);
  assert.deepEqual(updatedRow.slice(25, 28), ["B - Stretch", "65%", "80%"]);
  // stageHistory is absent on this fixture, so the legacy stageContext fallback applies: it's
  // rendered as the current stage's (APPLICATION) entry — see stage-history.test.ts for the
  // fallback itself and flattenStageHistoryForSheet's format.
  assert.equal(updatedRow[28], "Application (2026-09-10): Recruiter call booked.");
});

type HasManualMatchFields<T> = "userMatchClass" extends keyof T ? true : "userMatchPercentage" extends keyof T ? true : false;
const mobileCardOmitsManualMatch: HasManualMatchFields<ApplicationMobileCardApplication> = false;
const recentApplicationOmitsManualMatch: HasManualMatchFields<RecentApplication> = false;
const aiContextOmitsManualMatch: HasManualMatchFields<JobSearchContext["applications"][number]> = false;

test("mobile cards, recent applications, and AI context omit manual-match fields", () => {
  assert.equal(mobileCardOmitsManualMatch, false);
  assert.equal(recentApplicationOmitsManualMatch, false);
  assert.equal(aiContextOmitsManualMatch, false);
});

function makePayload(): RequirementsAndGapsPayload {
  return {
    version: 1,
    provisional: false,
    provisionalReasons: [],
    requirements: [],
    assessments: [],
    gaps: [],
    unverifiedRequirements: [],
    analysis: {
      analyzedAt: "2026-09-10T00:00:00.000Z",
      jdFingerprint: "jd",
      cvDocumentId: "00000000-0000-0000-0000-000000000000",
      cvFingerprint: "cv",
      score: 100,
      matchClass: "A_STRONG",
      confidence: 100,
      scoringPolicy: "test",
      confidencePolicy: "test",
    },
  };
}
