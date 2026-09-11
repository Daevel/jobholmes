import { z } from "zod";
import { baseApplicationFields, clearLocationWhenRemoteOnly, validateApplicationLocationFields } from "@/lib/applications/schema";
import { createApplicationFromVerifiedJobFit } from "@/lib/applications/service";
import { saveSourceForUser } from "@/lib/applications/sources-service";
import { verifyJobFitSignature } from "@/lib/ai/job-fit-signature";
import { parseRequirementsAndGaps } from "@/lib/ai/requirements-and-gaps";
import { requireCurrentUser } from "@/lib/current-user";
import { syncApplicationToGoogleSheet } from "@/lib/google/sheets";

const INVALID_JOB_FIT_MESSAGE = "The job fit result is no longer valid or has expired. Please re-run the analysis before creating the application.";

const matchClasses = ["A_STRONG", "B_STRETCH", "C_LONG_SHOT"] as const;

const jobFitSchema = z.object({
  jdText: z.string().min(1),
  cvDocumentId: z.string().uuid(),
  score: z.number().int().min(0).max(100).nullable(),
  matchClass: z.enum(matchClasses).nullable(),
  confidence: z.number().int().min(0).max(100).nullable(),
  requirementsAndGapsJson: z.string().min(1),
  signature: z.string().min(1),
  expiresAt: z.number(),
});

const confirmSchema = baseApplicationFields
  .omit({ jdText: true, cvDocumentId: true })
  .extend({ jobFit: jobFitSchema })
  .refine((input) => !input.salaryMin || !input.salaryMax || input.salaryMax >= input.salaryMin, {
    message: "Salary max must not be lower than salary min",
    path: ["salaryMax"],
  })
  .superRefine(validateApplicationLocationFields)
  .transform(clearLocationWhenRemoteOnly);

export async function POST(request: Request) {
  let userId: string;
  try {
    const user = await requireCurrentUser();
    userId = user.id;
  } catch {
    return Response.json({ error: "You must be signed in to create an application." }, { status: 401 });
  }

  const rawBody = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const { saveSource: saveSourceRaw, ...body } = rawBody ?? {};
  const saveSource = Boolean(saveSourceRaw);

  const parsed = confirmSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: "Invalid request.", fieldErrors: parsed.error.flatten().fieldErrors }, { status: 400 });

  const { jobFit, ...applicationFields } = parsed.data;

  const isSignatureValid = verifyJobFitSignature(
    {
      userId,
      cvDocumentId: jobFit.cvDocumentId,
      jdText: jobFit.jdText,
      score: jobFit.score,
      matchClass: jobFit.matchClass,
      confidence: jobFit.confidence,
      requirementsAndGapsJson: jobFit.requirementsAndGapsJson,
      expiresAt: jobFit.expiresAt,
    },
    jobFit.signature,
  );
  if (!isSignatureValid) return Response.json({ error: INVALID_JOB_FIT_MESSAGE }, { status: 400 });

  const parsedRequirementsAndGaps = parseRequirementsAndGaps(jobFit.requirementsAndGapsJson);
  if (parsedRequirementsAndGaps.kind !== "structured") return Response.json({ error: INVALID_JOB_FIT_MESSAGE }, { status: 400 });

  try {
    const application = await createApplicationFromVerifiedJobFit(userId, {
      ...applicationFields,
      cvDocumentId: jobFit.cvDocumentId,
      jdText: jobFit.jdText,
      aiMatchClass: jobFit.matchClass,
      aiMatchPercentage: jobFit.score,
      aiMatchConfidence: jobFit.confidence,
      requirementsAndGaps: jobFit.requirementsAndGapsJson,
    });

    if (saveSource && applicationFields.source) {
      await saveSourceForUser(userId, applicationFields.source);
    }

    try {
      await syncApplicationToGoogleSheet(application);
    } catch (error) {
      console.error("Google Sheets sync failed", { applicationId: application.id, company: application.company, role: application.role, errorName: error instanceof Error ? error.name : "UnknownError" });
    }

    return Response.json({ application }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error && error.message === "CV_NOT_FOUND" ? "Select an uploaded CV before creating the application." : "Could not create application. Please try again." }, { status: 400 });
  }
}
