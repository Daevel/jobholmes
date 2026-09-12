import { requireCurrentUser } from "@/lib/current-user";
import { unlinkCvFromApplication } from "@/lib/applications/service";
import { t } from "@/lib/i18n/translate";
import { z } from "zod";

const paramsSchema = z.object({ id: z.string().uuid() });

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireCurrentUser();
    const parsed = paramsSchema.safeParse(await params);
    if (!parsed.success) return Response.json({ error: t("errors.invalidApplication") }, { status: 400 });

    const updated = await unlinkCvFromApplication(user.id, parsed.data.id);
    if (!updated) return Response.json({ error: t("errors.applicationNotFound") }, { status: 404 });

    return Response.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return Response.json({ error: t("errors.auth.signInToUpdateApplication") }, { status: 401 });
    }

    console.error("Application CV unlink failed", error);
    return Response.json({ error: t("applications.edit.errors.unlinkCvApiFailed") }, { status: 500 });
  }
}
