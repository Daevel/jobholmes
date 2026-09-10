import type { JobRequirement } from "@/lib/ai/jd-requirements";
import type { RequirementAssessment } from "@/lib/ai/requirement-evidence";

export const AI_MATCH_SCORING_POLICY = "v1: requirement priority weights must_have=3, unknown=2, nice_to_have=1; coverage values covered=1, partial=0.5, not_covered=0, unknown=0; score=weighted covered value / total weight rounded to nearest percent.";
export const AI_MATCH_CONFIDENCE_POLICY = "v1: reliability starts at 100 and subtracts penalties for incomplete JD, insufficient CV text, few/no requirements, low grounded evidence, unverifiable requirements, and unknown material requirements; deprecated manual-match values are ignored.";

const priorityWeights: Record<JobRequirement["priority"], number> = {
  must_have: 3,
  unknown: 2,
  nice_to_have: 1,
};

const coverageValues: Record<RequirementAssessment["status"], number> = {
  covered: 1,
  partial: 0.5,
  not_covered: 0,
  unknown: 0,
};

export function deriveAiMatchClass(score: number) {
  if (score >= 80) return "A_STRONG";
  if (score >= 60) return "B_STRETCH";
  return "C_LONG_SHOT";
}

export function calculateRequirementCoverageScore(requirements: JobRequirement[], assessments: RequirementAssessment[]) {
  if (requirements.length === 0 || assessments.length !== requirements.length) return null;

  let coveredWeight = 0;
  let totalWeight = 0;

  for (const assessment of assessments) {
    const requirement = requirements[assessment.requirementIndex];
    if (!requirement) return null;

    const weight = priorityWeights[requirement.priority];
    totalWeight += weight;
    coveredWeight += weight * coverageValues[assessment.status];
  }

  if (totalWeight === 0) return null;
  return clampPercentage(Math.round((coveredWeight / totalWeight) * 100));
}

export function calculateAnalysisConfidence({ jdText, cvText, requirements, assessments }: { jdText: string; cvText: string; requirements: JobRequirement[]; assessments: RequirementAssessment[] }) {
  if (requirements.length === 0 || assessments.length !== requirements.length) return null;

  const completeness = assessInputCompleteness(jdText, cvText);
  const unknownWeight = sumRequirementWeight(requirements, assessments.filter((assessment) => assessment.status === "unknown"));
  const totalWeight = requirements.reduce((sum, requirement) => sum + priorityWeights[requirement.priority], 0);
  const unknownWeightRatio = totalWeight === 0 ? 1 : unknownWeight / totalWeight;
  const verifiedRatio = assessments.length === 0 ? 0 : assessments.filter((assessment) => assessment.status !== "unknown").length / assessments.length;
  const groundedEvidenceRatio = assessments.length === 0 ? 0 : assessments.filter((assessment) => assessment.evidence.length > 0).length / assessments.length;

  let confidence = 100;
  if (!completeness.jdComplete) confidence -= 20;
  if (!completeness.cvComplete) confidence -= 25;
  if (requirements.length < 3) confidence -= 20;
  if (requirements.every((requirement) => requirement.priority === "unknown")) confidence -= 10;
  confidence -= Math.round((1 - verifiedRatio) * 30);
  confidence -= Math.round(unknownWeightRatio * 25);
  confidence -= Math.round((1 - groundedEvidenceRatio) * 10);

  return clampPercentage(Math.round(confidence));
}

export function determineProvisionalResult({ jdText, cvText, requirements, assessments }: { jdText: string; cvText: string; requirements: JobRequirement[]; assessments: RequirementAssessment[] }) {
  const completeness = assessInputCompleteness(jdText, cvText);
  const provisionalReasons: string[] = [];

  if (!completeness.jdComplete) provisionalReasons.push("The job description appears incomplete, so some requirements may be missing.");
  if (!completeness.cvComplete) provisionalReasons.push("The selected CV has limited readable content, so evidence may be incomplete.");
  if (requirements.length === 0) provisionalReasons.push("No reliable requirements could be extracted from the job description.");
  if (assessments.some((assessment) => assessment.status === "unknown" && requirements[assessment.requirementIndex]?.priority !== "nice_to_have")) provisionalReasons.push("One or more material requirements could not be verified from the selected CV.");

  return { provisional: provisionalReasons.length > 0, provisionalReasons };
}

function assessInputCompleteness(jdText: string, cvText: string) {
  const normalizedJd = normalizeText(jdText);
  const normalizedCv = normalizeText(cvText);
  return {
    jdComplete: normalizedJd.length >= 300 && wordCount(normalizedJd) >= 50,
    cvComplete: normalizedCv.length >= 500 && wordCount(normalizedCv) >= 80,
  };
}

function sumRequirementWeight(requirements: JobRequirement[], assessments: RequirementAssessment[]) {
  return assessments.reduce((sum, assessment) => sum + (requirements[assessment.requirementIndex] ? priorityWeights[requirements[assessment.requirementIndex].priority] : 0), 0);
}

function normalizeText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function wordCount(value: string) {
  return value ? value.split(" ").length : 0;
}

function clampPercentage(value: number) {
  return Math.max(0, Math.min(100, value));
}
