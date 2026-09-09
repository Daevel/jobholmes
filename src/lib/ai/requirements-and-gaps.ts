import { z } from "zod";
import type { JobRequirement } from "@/lib/ai/jd-requirements";
import type { RequirementGap, UnverifiedRequirement } from "@/lib/ai/requirement-gaps";
import type { RequirementAssessment } from "@/lib/ai/requirement-evidence";

const matchClasses = ["A_STRONG", "B_STRETCH", "C_LONG_SHOT"] as const;
const requirementCategories = ["technical", "experience", "education", "language", "location", "work_authorization", "domain", "other"] as const;
const requirementPriorities = ["must_have", "nice_to_have", "unknown"] as const;
const requirementCoverageStatuses = ["covered", "partial", "not_covered", "unknown"] as const;

const requirementEvidenceSchema = z.object({ sourceText: z.string().min(1) });

const jobRequirementSchema = z.object({
  text: z.string().min(1),
  category: z.enum(requirementCategories),
  priority: z.enum(requirementPriorities),
  sourceText: z.string().min(1),
});

const requirementAssessmentSchema = z.object({
  requirementIndex: z.number().int().min(0),
  status: z.enum(requirementCoverageStatuses),
  evidence: z.array(requirementEvidenceSchema),
});

const requirementGapSchema = z.object({
  requirementIndex: z.number().int().min(0),
  requirementText: z.string().min(1),
  category: z.enum(requirementCategories),
  priority: z.enum(requirementPriorities),
  type: z.enum(["partial", "missing"]),
  evidence: z.array(requirementEvidenceSchema),
});

const unverifiedRequirementSchema = z.object({
  requirementIndex: z.number().int().min(0),
  requirementText: z.string().min(1),
  category: z.enum(requirementCategories),
  priority: z.enum(requirementPriorities),
});

const analysisMetadataSchema = z.object({
  analyzedAt: z.string().min(1),
  jdFingerprint: z.string().min(1),
  cvDocumentId: z.string().nullable(),
  cvFingerprint: z.string().min(1),
  score: z.number().int().min(0).max(100).nullable(),
  matchClass: z.enum(matchClasses).nullable(),
  confidence: z.number().int().min(0).max(100).nullable(),
  scoringPolicy: z.string().min(1),
  confidencePolicy: z.string().min(1),
});

export const requirementsAndGapsPayloadSchema = z.object({
  version: z.literal(1),
  provisional: z.boolean(),
  provisionalReasons: z.array(z.string()),
  requirements: z.array(jobRequirementSchema),
  assessments: z.array(requirementAssessmentSchema),
  gaps: z.array(requirementGapSchema),
  unverifiedRequirements: z.array(unverifiedRequirementSchema),
  analysis: analysisMetadataSchema,
});

export type RequirementsAndGapsPayload = {
  version: 1;
  provisional: boolean;
  provisionalReasons: string[];
  requirements: JobRequirement[];
  assessments: RequirementAssessment[];
  gaps: RequirementGap[];
  unverifiedRequirements: UnverifiedRequirement[];
  analysis: z.infer<typeof analysisMetadataSchema>;
};

export type ParsedRequirementsAndGaps =
  | { kind: "empty" }
  | { kind: "legacy"; text: string }
  | { kind: "structured"; payload: RequirementsAndGapsPayload };

export function serializeRequirementsAndGaps(payload: RequirementsAndGapsPayload) {
  return JSON.stringify(payload);
}

export function parseRequirementsAndGaps(value: string | null | undefined): ParsedRequirementsAndGaps {
  const trimmed = value?.trim();
  if (!trimmed) return { kind: "empty" };

  try {
    const parsed = requirementsAndGapsPayloadSchema.safeParse(JSON.parse(trimmed));
    if (parsed.success) return { kind: "structured", payload: parsed.data as RequirementsAndGapsPayload };
  } catch {
    // Legacy free text is intentionally supported.
  }

  return { kind: "legacy", text: trimmed };
}
