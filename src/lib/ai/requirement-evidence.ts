import { z } from "zod";
import { getOpenAIClient } from "@/lib/ai/client";
import type { JobRequirement } from "@/lib/ai/jd-requirements";
import { requirementEvidenceComparisonInstructions } from "@/lib/ai/instructions";

const requirementCoverageStatuses = ["covered", "partial", "not_covered", "unknown"] as const;

const requirementEvidenceSchema = z.object({
  sourceText: z.string().min(1),
});

const requirementAssessmentSchema = z.object({
  requirementIndex: z.number().int().min(0),
  status: z.enum(requirementCoverageStatuses),
  evidence: z.array(requirementEvidenceSchema),
});

const requirementAssessmentsOutputSchema = z.object({
  assessments: z.array(requirementAssessmentSchema),
});

export type RequirementCoverage = (typeof requirementCoverageStatuses)[number];
export type RequirementEvidence = z.infer<typeof requirementEvidenceSchema>;
export type RequirementAssessment = z.infer<typeof requirementAssessmentSchema>;
export type RequirementAssessmentsOutput = z.infer<typeof requirementAssessmentsOutputSchema>;

export async function compareRequirementsToCv(requirements: JobRequirement[], cvText: string): Promise<RequirementAssessmentsOutput> {
  if (requirements.length === 0) return { assessments: [] };

  const trimmedCvText = cvText.trim();
  if (!trimmedCvText) throw new Error("MISSING_CV_TEXT");

  const indexedRequirements = requirements.map((requirement, index) => ({ index, ...requirement }));
  const openai = getOpenAIClient();
  const response = await openai.responses.create({
    model: process.env.OPENAI_MODEL ?? "gpt-5",
    instructions: requirementEvidenceComparisonInstructions,
    text: {
      format: {
        type: "json_schema",
        name: "requirement_cv_evidence",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            assessments: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                properties: {
                  requirementIndex: { type: "integer", minimum: 0, maximum: requirements.length - 1 },
                  status: { type: "string", enum: requirementCoverageStatuses },
                  evidence: {
                    type: "array",
                    items: {
                      type: "object",
                      additionalProperties: false,
                      properties: {
                        sourceText: { type: "string", minLength: 1 },
                      },
                      required: ["sourceText"],
                    },
                  },
                },
                required: ["requirementIndex", "status", "evidence"],
              },
            },
          },
          required: ["assessments"],
        },
      },
    },
    input: `INDEXED REQUIREMENTS DATA:\n${JSON.stringify(indexedRequirements)}\n\nSELECTED CV EXTRACTED TEXT DATA:\n${trimmedCvText}`,
  });

  let parsed: RequirementAssessmentsOutput;
  try {
    parsed = requirementAssessmentsOutputSchema.parse(JSON.parse(response.output_text));
  } catch (error) {
    throw new Error("INVALID_REQUIREMENT_EVIDENCE_OUTPUT", { cause: error });
  }

  validateRequirementAssessmentIndexes(parsed.assessments, requirements.length);
  return parsed;
}

function validateRequirementAssessmentIndexes(assessments: RequirementAssessment[], requirementCount: number) {
  if (assessments.length !== requirementCount) {
    throw new Error("INVALID_REQUIREMENT_ASSESSMENT_INDEXES");
  }

  const seenIndexes = new Set<number>();
  for (const assessment of assessments) {
    if (assessment.requirementIndex >= requirementCount || seenIndexes.has(assessment.requirementIndex)) {
      throw new Error("INVALID_REQUIREMENT_ASSESSMENT_INDEXES");
    }

    seenIndexes.add(assessment.requirementIndex);
  }
}
