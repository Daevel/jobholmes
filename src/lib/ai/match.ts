import { and, eq } from "drizzle-orm";
import { createHash } from "crypto";
import { db } from "@/db";
import { applications } from "@/db/schema";
import { deriveRequirementGaps } from "@/lib/ai/requirement-gaps";
import { extractJobRequirements } from "@/lib/ai/jd-requirements";
import { compareRequirementsToCv } from "@/lib/ai/requirement-evidence";
import { serializeRequirementsAndGaps, type RequirementsAndGapsPayload } from "@/lib/ai/requirements-and-gaps";
import { AI_MATCH_CONFIDENCE_POLICY, AI_MATCH_SCORING_POLICY, calculateAnalysisConfidence, calculateRequirementCoverageScore, deriveAiMatchClass, determineProvisionalResult } from "@/lib/ai/scoring";
import { getApplicationForUser } from "@/lib/applications/service";
import { getCvForUser } from "@/lib/cvs/service";

export { AI_MATCH_CONFIDENCE_POLICY, AI_MATCH_SCORING_POLICY, calculateAnalysisConfidence, calculateRequirementCoverageScore, deriveAiMatchClass, determineProvisionalResult } from "@/lib/ai/scoring";

export async function analyzeApplicationMatch(userId: string, applicationId: string) {
  const application = await getApplicationForUser(userId, applicationId);
  if (!application) return { status: "not_found" as const };
  if (!application.jdText?.trim()) return { status: "missing_jd" as const };
  if (!application.cvDocumentId) return { status: "missing_cv" as const };

  const cv = await getCvForUser(userId, application.cvDocumentId);
  if (!cv) return { status: "missing_cv" as const };
  if (!cv.extractedText?.trim()) return { status: "missing_cv_text" as const };

  const { requirements } = await extractJobRequirements(application.jdText);
  const { assessments: requirementAssessments } = await compareRequirementsToCv(requirements, cv.extractedText);
  const { gaps, unverifiedRequirements } = deriveRequirementGaps(requirements, requirementAssessments);
  const score = calculateRequirementCoverageScore(requirements, requirementAssessments);
  const matchClass = score === null ? null : deriveAiMatchClass(score);
  const confidence = calculateAnalysisConfidence({ jdText: application.jdText, cvText: cv.extractedText, requirements, assessments: requirementAssessments });
  const provisional = determineProvisionalResult({ jdText: application.jdText, cvText: cv.extractedText, requirements, assessments: requirementAssessments });
  const storedPayload: RequirementsAndGapsPayload = {
    version: 1,
    provisional: provisional.provisional,
    provisionalReasons: provisional.provisionalReasons,
    requirements,
    assessments: requirementAssessments,
    gaps,
    unverifiedRequirements,
    analysis: {
      analyzedAt: new Date().toISOString(),
      jdFingerprint: fingerprint(application.jdText),
      cvDocumentId: cv.id,
      cvFingerprint: fingerprint(cv.extractedText),
      score,
      matchClass,
      confidence,
      scoringPolicy: AI_MATCH_SCORING_POLICY,
      confidencePolicy: AI_MATCH_CONFIDENCE_POLICY,
    },
  };

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

  return { status: "complete" as const, application: updated, score, confidence, matchClass, provisional: provisional.provisional, provisionalReasons: provisional.provisionalReasons, requirements, assessments: requirementAssessments, requirementAssessments, gaps, unverifiedRequirements };
}

function fingerprint(value: string) {
  return createHash("sha256").update(value).digest("hex");
}
