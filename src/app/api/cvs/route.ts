import { revalidatePath } from "next/cache";
import { createCvForUser } from "@/lib/cvs/upload";
import { requireCurrentUser } from "@/lib/current-user";
import { t } from "@/lib/i18n/translate";

/**
 * Standalone JSON endpoint for uploading a CV from outside the /cvs page (e.g. the inline
 * uploader in the application forms), where a Server Action bound to revalidatePath("/cvs")
 * would be the wrong tool - the caller here doesn't want a page navigation or to disturb the
 * rest of its own form state. Still revalidates /cvs so the CV Library stays in sync afterwards.
 */
export async function POST(request: Request) {
  const formData = await request.formData();
  const name = String(formData.get("name") ?? "").trim();
  const file = formData.get("file");

  if (!name) return Response.json({ error: t("cvs.upload.errors.nameRequired") }, { status: 400 });
  if (!(file instanceof File) || file.size === 0) return Response.json({ error: t("cvs.upload.errors.fileRequired") }, { status: 400 });

  try {
    const user = await requireCurrentUser();
    const cv = await createCvForUser({ userId: user.id, name, file });
    revalidatePath("/cvs");
    return Response.json({ cv: { id: cv.id, name: cv.name } });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return Response.json({ error: t("errors.auth.signInToUploadCvs") }, { status: 401 });
    }

    // createCvForUser's own validation/extraction failures throw an Error with an already
    // i18n-ized, user-facing message (see validatePdf in src/lib/cvs/upload.ts and
    // extractPdfText in src/lib/cvs/pdf.ts) - safe to relay as-is, same as uploadCvAction does.
    if (error instanceof Error) {
      return Response.json({ error: error.message }, { status: 400 });
    }

    console.error("CV upload failed", error);
    return Response.json({ error: t("cvs.upload.errors.uploadFailed") }, { status: 500 });
  }
}
