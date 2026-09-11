import test from "node:test";
import assert from "node:assert/strict";
import { compareAiMatchForSort, getOutcomeSortIndex, getStageSortIndex, outcomeSortOrder, stageSortOrder } from "@/lib/applications/sort-order";

test("stage sort order follows the funnel from application to offer", () => {
  assert.deepEqual(stageSortOrder, ["APPLICATION", "RECRUITER_SCREENING", "HIRING_MANAGER", "TECHNICAL", "CHALLENGE", "FINAL", "OFFER"]);
});

test("outcome sort order follows pending through offer", () => {
  assert.deepEqual(outcomeSortOrder, ["PENDING", "IN_PROGRESS", "REJECTED", "WITHDRAWN", "OFFER"]);
});

test("getStageSortIndex respects funnel order for known stages", () => {
  assert.ok(getStageSortIndex("APPLICATION") < getStageSortIndex("RECRUITER_SCREENING"));
  assert.ok(getStageSortIndex("TECHNICAL") < getStageSortIndex("OFFER"));
  assert.ok(getStageSortIndex("HIRING_MANAGER") < getStageSortIndex("CHALLENGE"));
});

test("getOutcomeSortIndex respects funnel order for known outcomes", () => {
  assert.ok(getOutcomeSortIndex("PENDING") < getOutcomeSortIndex("IN_PROGRESS"));
  assert.ok(getOutcomeSortIndex("OFFER") > getOutcomeSortIndex("REJECTED"));
  assert.ok(getOutcomeSortIndex("OFFER") > getOutcomeSortIndex("WITHDRAWN"));
});

test("getStageSortIndex returns an out-of-range index instead of throwing for unknown stages", () => {
  assert.equal(getStageSortIndex("SOME_FUTURE_STAGE"), stageSortOrder.length);
  assert.equal(getStageSortIndex(""), stageSortOrder.length);
});

test("getOutcomeSortIndex returns an out-of-range index instead of throwing for unknown outcomes", () => {
  assert.equal(getOutcomeSortIndex("SOME_LEGACY_OUTCOME"), outcomeSortOrder.length);
  assert.equal(getOutcomeSortIndex(""), outcomeSortOrder.length);
});

test("compareAiMatchForSort always sorts unanalyzed applications last, in both directions", () => {
  assert.equal(compareAiMatchForSort(null, 50, "asc") > 0, true);
  assert.equal(compareAiMatchForSort(50, null, "asc") < 0, true);
  assert.equal(compareAiMatchForSort(null, 50, "desc") > 0, true);
  assert.equal(compareAiMatchForSort(50, null, "desc") < 0, true);
});

test("compareAiMatchForSort returns 0 when both values are null", () => {
  assert.equal(compareAiMatchForSort(null, null, "asc"), 0);
  assert.equal(compareAiMatchForSort(null, null, "desc"), 0);
});

test("compareAiMatchForSort respects the requested direction for real values", () => {
  assert.equal(compareAiMatchForSort(30, 70, "asc") < 0, true);
  assert.equal(compareAiMatchForSort(70, 30, "asc") > 0, true);
  assert.equal(compareAiMatchForSort(30, 70, "desc") > 0, true);
  assert.equal(compareAiMatchForSort(70, 30, "desc") < 0, true);
});
