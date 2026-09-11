import { and, eq } from "drizzle-orm";
import { createHash } from "crypto";
import { db } from "@/db";
import { applications } from "@/db/schema";
import { deriveRequirementGaps, type RequirementGap, type UnverifiedRequirement } from "@/lib/ai/requirement-gaps";
import { extractJobRequirements, type JobRequirement } from "@/lib/ai/jd-requirements";
import { compareRequirementsToCv, type RequirementAssessment } from "@/lib/ai/requirement-evidence";
import { serializeRequirementsAndGaps, type RequirementsAndGapsPayload } from "@/lib/ai/requirements-and-gaps";
import { AI_MATCH_CONFIDENCE_POLICY, AI_MATCH_SCORING_POLICY, calculateAnalysisConfidence, calculateRequirementCoverageScore, deriveAiMatchClass, determineProvisionalResult } from "@/lib/ai/scoring";
import { getApplicationForUser } from "@/lib/applications/service";
import { getCvForUser } from "@/lib/cvs/service";

export { AI_MATCH_CONFIDENCE_POLICY, AI_MATCH_SCORING_POLICY, calculateAnalysisConfidence, calculateRequirementCoverageScore, deriveAiMatchClass, determineProvisionalResult } from "@/lib/ai/scoring";

export type JobFitAnalysisResult = {
  score: number | null;
  matchClass: ReturnType<typeof deriveAiMatchClass> | null;
  confidence: number | null;
  provisional: boolean;
  provisionalReasons: string[];
  requirements: JobRequirement[];
  assessments: RequirementAssessment[];
  gaps: RequirementGap[];
  unverifiedRequirements: UnverifiedRequirement[];
};

/**
 * The single shared matching pipeline: extract requirements from a JD, compare them to a CV,
 * and derive gaps/score/confidence. Used by both the saved-application AI Match flow
 * (analyzeApplicationMatch) and the unsaved Job Fit preview flow (see /api/job-fit/preview).
 */
export async function runJobFitAnalysis({ jdText, cvText }: { jdText: string; cvText: string }): Promise<JobFitAnalysisResult> {
  const { requirements } = await extractJobRequirements(jdText);
  const { assessments } = await compareRequirementsToCv(requirements, cvText);
  const { gaps, unverifiedRequirements } = deriveRequirementGaps(requirements, assessments);
  const score = calculateRequirementCoverageScore(requirements, assessments);
  const matchClass = score === null ? null : deriveAiMatchClass(score);
  const confidence = calculateAnalysisConfidence({ jdText, cvText, requirements, assessments });
  const { provisional, provisionalReasons } = determineProvisionalResult({ jdText, cvText, requirements, assessments });

  return { score, matchClass, confidence, provisional, provisionalReasons, requirements, assessments, gaps, unverifiedRequirements };
}

export function buildRequirementsAndGapsPayload(analysis: JobFitAnalysisResult, { jdText, cvText, cvDocumentId }: { jdText: string; cvText: string; cvDocumentId: string | null }): RequirementsAndGapsPayload {
  return {
    version: 1,
    provisional: analysis.provisional,
    provisionalReasons: analysis.provisionalReasons,
    requirements: analysis.requirements,
    assessments: analysis.assessments,
    gaps: analysis.gaps,
    unverifiedRequirements: analysis.unverifiedRequirements,
    analysis: {
      analyzedAt: new Date().toISOString(),
      jdFingerprint: fingerprintText(jdText),
      cvDocumentId,
      cvFingerprint: fingerprintText(cvText),
      score: analysis.score,
      matchClass: analysis.matchClass,
      confidence: analysis.confidence,
      scoringPolicy: AI_MATCH_SCORING_POLICY,
      confidencePolicy: AI_MATCH_CONFIDENCE_POLICY,
    },
  };
}

export async function analyzeApplicationMatch(userId: string, applicationId: string) {
  const application = await getApplicationForUser(userId, applicationId);
  if (!application) return { status: "not_found" as const };
  if (!application.jdText?.trim()) return { status: "missing_jd" as const };
  if (!application.cvDocumentId) return { status: "missing_cv" as const };

  const cv = await getCvForUser(userId, application.cvDocumentId);
  if (!cv) return { status: "missing_cv" as const };
  if (!cv.extractedText?.trim()) return { status: "missing_cv_text" as const };

  const analysis = await runJobFitAnalysis({ jdText: application.jdText, cvText: cv.extractedText });
  const { score, matchClass, confidence, provisional, provisionalReasons, requirements, assessments, gaps, unverifiedRequirements } = analysis;
  const storedPayload = buildRequirementsAndGapsPayload(analysis, { jdText: application.jdText, cvText: cv.extractedText, cvDocumentId: cv.id });

  const [updated] = await db
    .update(applications)
    .set({
      aiMatchPercentage: score,
      aiMatchClass: matchClass,
      aiMatchConfidence: confidence,
      requirementsAndGaps: serializeRequirementsAndGaps(storedPayload),
      jdVerifiedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(and(eq(applications.userId, userId), eq(applications.id, applicationId)))
    .returning();

  return { status: "complete" as const, application: updated, score, confidence, matchClass, provisional, provisionalReasons, requirements, assessments, requirementAssessments: assessments, gaps, unverifiedRequirements };
}

export function fingerprintText(value: string) {
  return createHash("sha256").update(value).digest("hex");
}
