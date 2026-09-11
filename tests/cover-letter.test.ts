import test from "node:test";
import assert from "node:assert/strict";
import { checkCoverLetterEligibility, selectCoveredRequirements } from "@/lib/ai/cover-letter";
import type { RequirementsAndGapsPayload } from "@/lib/ai/requirements-and-gaps";

test("selectCoveredRequirements returns an empty list when nothing is covered", () => {
  const payload = makePayload([
    { status: "partial", text: "TypeScript", evidence: ["Used TS at Acme"] },
    { status: "not_covered", text: "GraphQL", evidence: [] },
    { status: "unknown", text: "Rust", evidence: [] },
  ]);

  assert.deepEqual(selectCoveredRequirements(payload), []);
});

test("selectCoveredRequirements filters to only covered requirements", () => {
  const payload = makePayload([
    { status: "covered", text: "React", evidence: ["Built React apps for 3 years"] },
    { status: "partial", text: "TypeScript", evidence: ["Used TS briefly"] },
    { status: "covered", text: "Node.js", evidence: ["Node.js backend at Acme"] },
    { status: "not_covered", text: "GraphQL", evidence: [] },
    { status: "unknown", text: "Rust", evidence: [] },
  ]);

  assert.deepEqual(selectCoveredRequirements(payload), [
    { text: "React", evidence: ["Built React apps for 3 years"] },
    { text: "Node.js", evidence: ["Node.js backend at Acme"] },
  ]);
});

test("selectCoveredRequirements handles a covered requirement with no evidence without crashing", () => {
  const payload = makePayload([{ status: "covered", text: "React", evidence: [] }]);

  assert.deepEqual(selectCoveredRequirements(payload), [{ text: "React", evidence: [] }]);
});

test("checkCoverLetterEligibility blocks when the job description is missing", () => {
  const result = checkCoverLetterEligibility({ jdText: null, cvDocumentId: "cv-1", hasStructuredMatch: true, coveredRequirementCount: 2 });
  assert.equal(result.eligible, false);
});

test("checkCoverLetterEligibility blocks when no CV is selected", () => {
  const result = checkCoverLetterEligibility({ jdText: "Some JD", cvDocumentId: null, hasStructuredMatch: true, coveredRequirementCount: 2 });
  assert.equal(result.eligible, false);
});

test("checkCoverLetterEligibility blocks when AI Match has not produced a structured result", () => {
  const result = checkCoverLetterEligibility({ jdText: "Some JD", cvDocumentId: "cv-1", hasStructuredMatch: false, coveredRequirementCount: 0 });
  assert.equal(result.eligible, false);
});

test("checkCoverLetterEligibility blocks when there are zero covered requirements", () => {
  const result = checkCoverLetterEligibility({ jdText: "Some JD", cvDocumentId: "cv-1", hasStructuredMatch: true, coveredRequirementCount: 0 });
  assert.equal(result.eligible, false);
});

test("checkCoverLetterEligibility allows generation once every prerequisite is met", () => {
  const result = checkCoverLetterEligibility({ jdText: "Some JD", cvDocumentId: "cv-1", hasStructuredMatch: true, coveredRequirementCount: 1 });
  assert.equal(result.eligible, true);
});

function makePayload(items: Array<{ status: "covered" | "partial" | "not_covered" | "unknown"; text: string; evidence: string[] }>): RequirementsAndGapsPayload {
  return {
    version: 1,
    provisional: false,
    provisionalReasons: [],
    requirements: items.map((item) => ({ text: item.text, category: "technical", priority: "must_have", sourceText: item.text })),
    assessments: items.map((item, index) => ({ requirementIndex: index, status: item.status, evidence: item.evidence.map((sourceText) => ({ sourceText })) })),
    gaps: [],
    unverifiedRequirements: [],
    analysis: {
      analyzedAt: "2026-09-11T00:00:00.000Z",
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
