import test from "node:test";
import assert from "node:assert/strict";
import { flattenStageHistoryForSheet, getEffectiveStageHistory, reachedStages } from "@/lib/applications/stage-history";

test("getEffectiveStageHistory returns stageHistory as-is when already valid", () => {
  const stageHistory = {
    APPLICATION: { text: "Submitted via referral.", updatedAt: "2026-08-01" },
    RECRUITER_SCREENING: { text: "Call booked.", updatedAt: "2026-08-05" },
  };

  const result = getEffectiveStageHistory({
    stage: "RECRUITER_SCREENING",
    stageHistory,
    stageContext: "Old legacy text that should be ignored.",
    updatedAt: new Date("2026-08-05T00:00:00.000Z"),
  });

  assert.deepEqual(result, stageHistory);
});

test("getEffectiveStageHistory builds a single current-stage entry when stageHistory is empty but stageContext has text", () => {
  const result = getEffectiveStageHistory({
    stage: "TECHNICAL",
    stageHistory: null,
    stageContext: "Technical interview scheduled for next week.",
    updatedAt: new Date("2026-08-12T00:00:00.000Z"),
  });

  assert.deepEqual(result, {
    TECHNICAL: { text: "Technical interview scheduled for next week.", updatedAt: "2026-08-12" },
  });
});

test("getEffectiveStageHistory returns an empty object when both stageHistory and stageContext are empty", () => {
  assert.deepEqual(
    getEffectiveStageHistory({ stage: "APPLICATION", stageHistory: null, stageContext: null, updatedAt: new Date("2026-08-01T00:00:00.000Z") }),
    {},
  );
  assert.deepEqual(
    getEffectiveStageHistory({ stage: "APPLICATION", stageHistory: {}, stageContext: "   ", updatedAt: new Date("2026-08-01T00:00:00.000Z") }),
    {},
  );
});

test("reachedStages returns the correct ordered list for an intermediate stage", () => {
  assert.deepEqual(reachedStages("TECHNICAL"), ["APPLICATION", "RECRUITER_SCREENING", "HIRING_MANAGER", "TECHNICAL"]);
});

test("reachedStages for APPLICATION returns only APPLICATION", () => {
  assert.deepEqual(reachedStages("APPLICATION"), ["APPLICATION"]);
});

test("flattenStageHistoryForSheet produces the expected format in funnel order", () => {
  const labels = {
    APPLICATION: "Application",
    RECRUITER_SCREENING: "Recruiter screening",
    HIRING_MANAGER: "Hiring manager",
    TECHNICAL: "Technical",
    CHALLENGE: "Challenge",
    FINAL: "Final",
    OFFER: "Offer",
  } as const;

  const history = {
    RECRUITER_SCREENING: { text: "Call booked.", updatedAt: "2026-08-05" },
    APPLICATION: { text: "Submitted via referral.", updatedAt: "2026-08-01" },
  };

  assert.equal(
    flattenStageHistoryForSheet(history, labels),
    "Application (2026-08-01): Submitted via referral.\nRecruiter screening (2026-08-05): Call booked.",
  );
});

test("flattenStageHistoryForSheet handles an empty object without error", () => {
  const labels = {
    APPLICATION: "Application",
    RECRUITER_SCREENING: "Recruiter screening",
    HIRING_MANAGER: "Hiring manager",
    TECHNICAL: "Technical",
    CHALLENGE: "Challenge",
    FINAL: "Final",
    OFFER: "Offer",
  } as const;

  assert.equal(flattenStageHistoryForSheet({}, labels), "");
});
