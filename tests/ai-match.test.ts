import test from "node:test";
import assert from "node:assert/strict";
import { calculateAnalysisConfidence, calculateRequirementCoverageScore, deriveAiMatchClass, determineProvisionalResult } from "@/lib/ai/scoring";
import { parseRequirementsAndGaps, serializeRequirementsAndGaps, type RequirementsAndGapsPayload } from "@/lib/ai/requirements-and-gaps";
import type { JobRequirement } from "@/lib/ai/jd-requirements";
import type { RequirementAssessment } from "@/lib/ai/requirement-evidence";

const completeJd = repeatWords("This complete job description requires TypeScript, React, Node APIs, distributed systems ownership, testing discipline, English communication, product collaboration, remote teamwork, delivery ownership, observability, accessibility, code review, and secure engineering practices for a senior software role.", 5);
const completeCv = repeatWords("This selected CV shows TypeScript, React, Node APIs, distributed systems ownership, testing discipline, English communication, product collaboration, remote teamwork, delivery ownership, observability, accessibility, code review, and secure engineering practices across senior software roles.", 6);

test("strong grounded match scores and has high confidence", () => {
  const requirements = makeRequirements(["must_have", "must_have", "nice_to_have"]);
  const assessments = makeAssessments(["covered", "covered", "covered"], true);

  assert.equal(calculateRequirementCoverageScore(requirements, assessments), 100);
  assert.equal(deriveAiMatchClass(100), "A_STRONG");
  assert.equal(calculateAnalysisConfidence({ jdText: completeJd, cvText: completeCv, requirements, assessments }), 100);
});

test("partial match uses requirement priority and coverage", () => {
  const requirements = makeRequirements(["must_have", "must_have", "nice_to_have"]);
  const assessments = makeAssessments(["covered", "partial", "not_covered"], true);

  assert.equal(calculateRequirementCoverageScore(requirements, assessments), 64);
  assert.equal(deriveAiMatchClass(64), "B_STRETCH");
});

test("low match can have high confidence", () => {
  const requirements = makeRequirements(["must_have", "must_have", "nice_to_have"]);
  const assessments = makeAssessments(["not_covered", "not_covered", "not_covered"], false);

  assert.equal(calculateRequirementCoverageScore(requirements, assessments), 0);
  assert.equal(deriveAiMatchClass(0), "C_LONG_SHOT");
  assert.equal(calculateAnalysisConfidence({ jdText: completeJd, cvText: completeCv, requirements, assessments }), 90);
});

test("high match can have low confidence", () => {
  const requirements = makeRequirements(["must_have", "must_have", "nice_to_have"]);
  const assessments = makeAssessments(["covered", "covered", "covered"], true);

  assert.equal(calculateRequirementCoverageScore(requirements, assessments), 100);
  assert.equal(calculateAnalysisConfidence({ jdText: "Requires React.", cvText: "React", requirements, assessments }), 55);
});

test("missing manual Your Match does not affect AI result", () => {
  const requirements = makeRequirements(["must_have", "nice_to_have"]);
  const assessments = makeAssessments(["covered", "partial"], true);
  const withoutManualMatch = calculateRequirementCoverageScore(requirements, assessments);

  assert.equal(withoutManualMatch, 88);
});

test("different manual Your Match values produce the same AI result", () => {
  const requirements = makeRequirements(["must_have", "nice_to_have"]);
  const assessments = makeAssessments(["covered", "partial"], true);
  const manualStrong = { userMatchClass: "A_STRONG", userMatchPercentage: 95 };
  const manualLongShot = { userMatchClass: "C_LONG_SHOT", userMatchPercentage: 20 };

  assert.notDeepEqual(manualStrong, manualLongShot);
  assert.equal(calculateRequirementCoverageScore(requirements, assessments), calculateRequirementCoverageScore(requirements, assessments));
});

test("incomplete JD makes result provisional", () => {
  const requirements = makeRequirements(["must_have", "must_have", "nice_to_have"]);
  const assessments = makeAssessments(["covered", "covered", "covered"], true);
  const result = determineProvisionalResult({ jdText: "Requires TypeScript.", cvText: completeCv, requirements, assessments });

  assert.equal(result.provisional, true);
  assert.match(result.provisionalReasons.join(" "), /job description appears incomplete/i);
});

test("incomplete CV makes result provisional", () => {
  const requirements = makeRequirements(["must_have", "must_have", "nice_to_have"]);
  const assessments = makeAssessments(["covered", "covered", "covered"], true);
  const result = determineProvisionalResult({ jdText: completeJd, cvText: "TypeScript", requirements, assessments });

  assert.equal(result.provisional, true);
  assert.match(result.provisionalReasons.join(" "), /CV has limited readable content/i);
});

test("unknown material requirements make result provisional", () => {
  const requirements = makeRequirements(["must_have", "nice_to_have"]);
  const assessments = makeAssessments(["unknown", "covered"], true);
  const result = determineProvisionalResult({ jdText: completeJd, cvText: completeCv, requirements, assessments });

  assert.equal(calculateRequirementCoverageScore(requirements, assessments), 25);
  assert.equal(result.provisional, true);
  assert.match(result.provisionalReasons.join(" "), /could not be verified/i);
});

test("structured persistence and legacy free-text parsing are safe", () => {
  const payload = makePayload();
  const parsedStructured = parseRequirementsAndGaps(serializeRequirementsAndGaps(payload));
  const parsedLegacy = parseRequirementsAndGaps("Legacy notes about gaps");
  const parsedInvalidJson = parseRequirementsAndGaps("{not valid json");

  assert.equal(parsedStructured.kind, "structured");
  assert.equal(parsedLegacy.kind, "legacy");
  assert.equal(parsedInvalidJson.kind, "legacy");
});

test("score-to-class thresholds are deterministic", () => {
  assert.equal(deriveAiMatchClass(80), "A_STRONG");
  assert.equal(deriveAiMatchClass(79), "B_STRETCH");
  assert.equal(deriveAiMatchClass(60), "B_STRETCH");
  assert.equal(deriveAiMatchClass(59), "C_LONG_SHOT");
});

test("Immense regression: no definitive values without requirements and grounded analysis", () => {
  const score = calculateRequirementCoverageScore([], []);
  const confidence = calculateAnalysisConfidence({ jdText: completeJd, cvText: completeCv, requirements: [], assessments: [] });
  const stored = parseRequirementsAndGaps(null);

  assert.equal(score, null);
  assert.equal(confidence, null);
  assert.equal(stored.kind, "empty");
});

function makeRequirements(priorities: JobRequirement["priority"][]): JobRequirement[] {
  return priorities.map((priority, index) => ({
    text: `Requirement ${index + 1}`,
    category: "technical",
    priority,
    sourceText: `Requirement ${index + 1}`,
  }));
}

function makeAssessments(statuses: RequirementAssessment["status"][], withEvidence: boolean): RequirementAssessment[] {
  return statuses.map((status, requirementIndex) => ({
    requirementIndex,
    status,
    evidence: withEvidence && status !== "unknown" && status !== "not_covered" ? [{ sourceText: `Evidence ${requirementIndex + 1}` }] : [],
  }));
}

function makePayload(): RequirementsAndGapsPayload {
  const requirements = makeRequirements(["must_have"]);
  const assessments = makeAssessments(["covered"], true);
  return {
    version: 1,
    provisional: false,
    provisionalReasons: [],
    requirements,
    assessments,
    gaps: [],
    unverifiedRequirements: [],
    analysis: {
      analyzedAt: "2026-09-09T00:00:00.000Z",
      jdFingerprint: "jd",
      cvDocumentId: "00000000-0000-0000-0000-000000000000",
      cvFingerprint: "cv",
      score: 100,
      matchClass: "A_STRONG",
      confidence: 100,
      scoringPolicy: "test scoring policy",
      confidencePolicy: "test confidence policy",
    },
  };
}

function repeatWords(value: string, count: number) {
  return Array.from({ length: count }, () => value).join(" ");
}
