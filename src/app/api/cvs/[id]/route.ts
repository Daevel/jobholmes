import { requireCurrentUser } from "@/lib/current-user";
import { deleteCvForUser } from "@/lib/cvs/service";
import { t } from "@/lib/i18n/translate";
import { z } from "zod";

const paramsSchema = z.object({ id: z.string().uuid() });

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireCurrentUser();
    const parsed = paramsSchema.safeParse(await params);
    if (!parsed.success) return Response.json({ error: t("errors.invalidCv") }, { status: 400 });

    const result = await deleteCvForUser(user.id, parsed.data.id);
    if (!result) return Response.json({ error: t("errors.cvNotFound") }, { status: 404 });

    if (!result.deleted) {
      const applicationCount = result.blockedByApplicationCount;
      const template = applicationCount === 1
        ? t("cvs.deleteButton.errors.blockedByApplicationsOne")
        : t("cvs.deleteButton.errors.blockedByApplicationsOther");
      return Response.json(
        {
          error: template.replace("{count}", String(applicationCount)),
          blockedByApplicationCount: applicationCount,
        },
        { status: 409 },
      );
    }

    return Response.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return Response.json({ error: t("errors.auth.signInToDeleteCvs") }, { status: 401 });
    }

    console.error("CV delete failed", error);
    return Response.json({ error: t("cvs.deleteButton.errors.deleteFailedApi") }, { status: 500 });
  }
}
