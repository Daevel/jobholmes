import { z } from "zod";
import { buildRequirementsAndGapsPayload, runJobFitAnalysis } from "@/lib/ai/match";
import { signJobFitResult } from "@/lib/ai/job-fit-signature";
import { serializeRequirementsAndGaps } from "@/lib/ai/requirements-and-gaps";
import { getCvForUser } from "@/lib/cvs/service";
import { requireCurrentUser } from "@/lib/current-user";
import { t } from "@/lib/i18n/translate";

const JOB_FIT_PREVIEW_TTL_MS = 30 * 60 * 1000;

const previewSchema = z.object({
  jdText: z.string().trim().min(1, t("jobFit.form.errors.jdRequired")),
  cvDocumentId: z.string().uuid(t("jobFit.form.errors.cvRequired")),
});

export async function POST(request: Request) {
  let userId: string;
  try {
    const user = await requireCurrentUser();
    userId = user.id;
  } catch {
    return Response.json({ error: t("errors.auth.signInToAnalyzeJobFit") }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = previewSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: parsed.error.issues[0]?.message ?? t("errors.invalidRequest") }, { status: 400 });

  const { jdText, cvDocumentId } = parsed.data;

  const cv = await getCvForUser(userId, cvDocumentId);
  if (!cv) return Response.json({ error: t("jobFit.form.errors.selectCvBeforeJobFit") }, { status: 400 });
  if (!cv.extractedText?.trim()) return Response.json({ error: t("errors.cvHasNoExtractedText") }, { status: 400 });

  let analysis;
  try {
    analysis = await runJobFitAnalysis({ jdText, cvText: cv.extractedText });
  } catch (error) {
    console.error("Job Fit preview failed", error);
    return Response.json({ error: t("jobFit.form.errors.previewFailed") }, { status: 500 });
  }

  const payload = buildRequirementsAndGapsPayload(analysis, { jdText, cvText: cv.extractedText, cvDocumentId: cv.id });
  const requirementsAndGapsJson = serializeRequirementsAndGaps(payload);
  const expiresAt = Date.now() + JOB_FIT_PREVIEW_TTL_MS;
  const signature = signJobFitResult({
    userId,
    cvDocumentId: cv.id,
    jdText,
    score: analysis.score,
    matchClass: analysis.matchClass,
    confidence: analysis.confidence,
    requirementsAndGapsJson,
    expiresAt,
  });

  return Response.json({
    score: analysis.score,
    matchClass: analysis.matchClass,
    confidence: analysis.confidence,
    provisional: analysis.provisional,
    provisionalReasons: analysis.provisionalReasons,
    requirements: analysis.requirements,
    assessments: analysis.assessments,
    gaps: analysis.gaps,
    unverifiedRequirements: analysis.unverifiedRequirements,
    cvDocumentId: cv.id,
    requirementsAndGapsJson,
    signature,
    expiresAt,
  });
}
