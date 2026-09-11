import { z } from "zod";
import { checkCoverLetterEligibility, generateCoverLetter, selectCoveredRequirements } from "@/lib/ai/cover-letter";
import { parseRequirementsAndGaps } from "@/lib/ai/requirements-and-gaps";
import { getApplicationForUser, saveCoverLetterForUser } from "@/lib/applications/service";
import { getCvForUser } from "@/lib/cvs/service";
import { requireCurrentUser } from "@/lib/current-user";

const paramsSchema = z.object({ id: z.string().uuid() });
const patchSchema = z.object({ coverLetter: z.string().max(10000) });

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireCurrentUser();
    const parsedParams = paramsSchema.safeParse(await params);
    if (!parsedParams.success) return Response.json({ error: "Invalid application." }, { status: 400 });

    const application = await getApplicationForUser(user.id, parsedParams.data.id);
    if (!application) return Response.json({ error: "Application not found." }, { status: 404 });

    const parsedRequirements = parseRequirementsAndGaps(application.requirementsAndGaps);
    const hasStructuredMatch = parsedRequirements.kind === "structured";
    const coveredRequirementCount = parsedRequirements.kind === "structured" ? selectCoveredRequirements(parsedRequirements.payload).length : 0;

    const eligibility = checkCoverLetterEligibility({
      jdText: application.jdText,
      cvDocumentId: application.cvDocumentId,
      hasStructuredMatch,
      coveredRequirementCount,
    });
    if (!eligibility.eligible) return Response.json({ error: eligibility.reason }, { status: 400 });
    if (parsedRequirements.kind !== "structured" || !application.jdText || !application.cvDocumentId) {
      // Unreachable in practice: checkCoverLetterEligibility already guarantees this shape when eligible.
      return Response.json({ error: "This application needs a completed AI Match before generating a cover letter." }, { status: 400 });
    }

    const cv = await getCvForUser(user.id, application.cvDocumentId);
    if (!cv?.extractedText?.trim()) return Response.json({ error: "The selected CV has no readable extracted text." }, { status: 400 });

    const coverLetter = await generateCoverLetter({
      jdText: application.jdText,
      cvText: cv.extractedText,
      company: application.company,
      role: application.role,
      payload: parsedRequirements.payload,
    });

    await saveCoverLetterForUser(user.id, application.id, coverLetter);

    return Response.json({ coverLetter });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return Response.json({ error: "You must be signed in to generate a cover letter." }, { status: 401 });
    }
    if (error instanceof Error && error.message === "NO_COVERED_REQUIREMENTS") {
      return Response.json({ error: "This application needs a completed AI Match with at least one covered requirement before generating a cover letter." }, { status: 400 });
    }

    console.error("Cover letter generation failed", error);
    return Response.json({ error: "JobHolmes could not generate the cover letter. Please try again." }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireCurrentUser();
    const parsedParams = paramsSchema.safeParse(await params);
    if (!parsedParams.success) return Response.json({ error: "Invalid application." }, { status: 400 });

    const application = await getApplicationForUser(user.id, parsedParams.data.id);
    if (!application) return Response.json({ error: "Application not found." }, { status: 404 });

    const parsedBody = patchSchema.safeParse(await request.json().catch(() => null));
    if (!parsedBody.success) return Response.json({ error: "Invalid cover letter text." }, { status: 400 });

    await saveCoverLetterForUser(user.id, application.id, parsedBody.data.coverLetter);

    return Response.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return Response.json({ error: "You must be signed in to save a cover letter." }, { status: 401 });
    }

    console.error("Cover letter save failed", error);
    return Response.json({ error: "Could not save cover letter. Please try again." }, { status: 500 });
  }
}
