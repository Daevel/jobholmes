import { z } from "zod";
import { generateCoverLetter } from "@/lib/ai/cover-letter";
import { parseRequirementsAndGaps } from "@/lib/ai/requirements-and-gaps";
import { getCvForUser } from "@/lib/cvs/service";
import { requireCurrentUser } from "@/lib/current-user";
import { t } from "@/lib/i18n/translate";

const bodySchema = z.object({
  jdText: z.string().min(1),
  cvDocumentId: z.string().uuid(),
  company: z.string().min(1),
  role: z.string().min(1),
  requirementsAndGapsJson: z.string().min(1),
});

/**
 * Generates a cover letter straight from a Job Fit preview, before any application exists. Unlike
 * /api/job-fit/confirm, this never persists anything and doesn't verify a signature: the result is
 * plain editable text the user can accept, edit, or discard, not a trusted value like the match
 * score, so there's nothing here that needs cryptographic verification.
 */
export async function POST(request: Request) {
  let userId: string;
  try {
    const user = await requireCurrentUser();
    userId = user.id;
  } catch {
    return Response.json({ error: t("errors.auth.signInToGenerateCoverLetter") }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: t("errors.invalidRequest") }, { status: 400 });

  const { jdText, cvDocumentId, company, role, requirementsAndGapsJson } = parsed.data;

  const parsedRequirements = parseRequirementsAndGaps(requirementsAndGapsJson);
  if (parsedRequirements.kind !== "structured") return Response.json({ error: t("jobFit.form.errors.resultExpired") }, { status: 400 });

  const cv = await getCvForUser(userId, cvDocumentId);
  if (!cv?.extractedText?.trim()) return Response.json({ error: t("errors.cvHasNoExtractedText") }, { status: 400 });

  try {
    const coverLetter = await generateCoverLetter({
      jdText,
      cvText: cv.extractedText,
      company,
      role,
      payload: parsedRequirements.payload,
    });

    return Response.json({ coverLetter });
  } catch (error) {
    if (error instanceof Error && error.message === "NO_COVERED_REQUIREMENTS") {
      return Response.json({ error: t("jobFit.form.errors.noCoveredRequirements") }, { status: 400 });
    }

    console.error("Job Fit cover letter generation failed", error);
    return Response.json({ error: t("jobFit.form.errors.coverLetterFailed") }, { status: 500 });
  }
}
