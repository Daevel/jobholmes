import { z } from "zod";
import { getApplicationForUser, saveCoverLetterForUser } from "@/lib/applications/service";
import { requireCurrentUser } from "@/lib/current-user";
import { t } from "@/lib/i18n/translate";

const paramsSchema = z.object({ id: z.string().uuid() });
const patchSchema = z.object({ coverLetter: z.string().max(10000) });

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireCurrentUser();
    const parsedParams = paramsSchema.safeParse(await params);
    if (!parsedParams.success) return Response.json({ error: t("errors.invalidApplication") }, { status: 400 });

    const application = await getApplicationForUser(user.id, parsedParams.data.id);
    if (!application) return Response.json({ error: t("errors.applicationNotFound") }, { status: 404 });

    const parsedBody = patchSchema.safeParse(await request.json().catch(() => null));
    if (!parsedBody.success) return Response.json({ error: t("applications.coverLetter.errors.invalidCoverLetterText") }, { status: 400 });

    await saveCoverLetterForUser(user.id, application.id, parsedBody.data.coverLetter);

    return Response.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return Response.json({ error: t("errors.auth.signInToSaveCoverLetter") }, { status: 401 });
    }

    console.error("Cover letter save failed", error);
    return Response.json({ error: t("applications.coverLetter.errors.saveApiFailed") }, { status: 500 });
  }
}
