import type { JobRequirement } from "@/lib/ai/jd-requirements";
import type { RequirementAssessment, RequirementEvidence } from "@/lib/ai/requirement-evidence";

export type RequirementGap = {
  requirementIndex: number;
  requirementText: string;
  category: JobRequirement["category"];
  priority: JobRequirement["priority"];
  type: "partial" | "missing";
  evidence: RequirementEvidence[];
};

export type UnverifiedRequirement = {
  requirementIndex: number;
  requirementText: string;
  category: JobRequirement["category"];
  priority: JobRequirement["priority"];
};

export function deriveRequirementGaps(requirements: JobRequirement[], requirementAssessments: RequirementAssessment[]) {
  validateRequirementAssessmentMapping(requirements.length, requirementAssessments);

  const gaps: RequirementGap[] = [];
  const unverifiedRequirements: UnverifiedRequirement[] = [];

  for (const assessment of requirementAssessments) {
    const requirement = requirements[assessment.requirementIndex];
    const baseRequirement = {
      requirementIndex: assessment.requirementIndex,
      requirementText: requirement.text,
      category: requirement.category,
      priority: requirement.priority,
    };

    switch (assessment.status) {
      case "covered":
        break;
      case "partial":
        gaps.push({ ...baseRequirement, type: "partial", evidence: assessment.evidence });
        break;
      case "not_covered":
        gaps.push({ ...baseRequirement, type: "missing", evidence: assessment.evidence });
        break;
      case "unknown":
        unverifiedRequirements.push(baseRequirement);
        break;
      default: {
        const unsupportedStatus: never = assessment.status;
        throw new Error(`UNSUPPORTED_REQUIREMENT_COVERAGE_STATUS:${unsupportedStatus}`);
      }
    }
  }

  return { gaps, unverifiedRequirements };
}

function validateRequirementAssessmentMapping(requirementCount: number, requirementAssessments: RequirementAssessment[]) {
  if (requirementAssessments.length !== requirementCount) {
    throw new Error("INVALID_REQUIREMENT_ASSESSMENT_MAPPING");
  }

  const seenIndexes = new Set<number>();
  for (const assessment of requirementAssessments) {
    if (assessment.requirementIndex < 0 || assessment.requirementIndex >= requirementCount || seenIndexes.has(assessment.requirementIndex)) {
      throw new Error("INVALID_REQUIREMENT_ASSESSMENT_MAPPING");
    }

    seenIndexes.add(assessment.requirementIndex);
  }
}
