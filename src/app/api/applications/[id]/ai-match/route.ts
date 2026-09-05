import { analyzeApplicationMatch } from "@/lib/ai/match";
import { requireCurrentUser } from "@/lib/current-user";
import { syncUpdatedApplicationToGoogleSheet } from "@/lib/google/sheets";
import { getApplicationForUser } from "@/lib/applications/service";
import { z } from "zod";

const paramsSchema = z.object({ id: z.string().uuid() });

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireCurrentUser();
    const parsed = paramsSchema.safeParse(await params);
    if (!parsed.success) return Response.json({ error: "Invalid application." }, { status: 400 });

    const previous = await getApplicationForUser(user.id, parsed.data.id);
    const result = await analyzeApplicationMatch(user.id, parsed.data.id);

    if (result.status === "not_found") return Response.json({ error: "Application not found." }, { status: 404 });
    if (result.status === "missing_jd") return Response.json({ error: "Add a job description before running AI Match." }, { status: 400 });
    if (result.status === "missing_cv") return Response.json({ error: "Select an uploaded CV before running AI Match." }, { status: 400 });
    if (result.status === "missing_cv_text") return Response.json({ error: "The selected CV has no readable extracted text." }, { status: 400 });

    if (previous) {
      try {
        await syncUpdatedApplicationToGoogleSheet(result.application, previous);
      } catch (error) {
        console.error("Google Sheets AI match sync failed", { applicationId: result.application.id, error });
      }
    }

    return Response.json({ application: result.application, score: result.score, confidence: result.confidence, matchClass: result.matchClass });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return Response.json({ error: "You must be signed in to analyze a match." }, { status: 401 });
    }

    console.error("AI Match failed", error);
    return Response.json({ error: "JobHolmes could not analyze this match. Please try again." }, { status: 500 });
  }
}
