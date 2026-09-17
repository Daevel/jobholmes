import { extractTextFromDocument } from "@/lib/documents/extract-text";
import { requireCurrentUser } from "@/lib/current-user";
import { t } from "@/lib/i18n/translate";

/**
 * Extracts text from an uploaded .txt/.pdf/.docx file to populate a cover letter field, without
 * persisting the file anywhere. Auth-gated (like every other route here) even though nothing is
 * written to the DB, so this doesn't become an open file-parsing endpoint for anyone.
 */
export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    return Response.json({ error: t("documents.textExtraction.errors.fileRequired") }, { status: 400 });
  }

  try {
    await requireCurrentUser();
    const text = await extractTextFromDocument(file);
    return Response.json({ text });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return Response.json({ error: t("errors.auth.signInToExtractDocumentText") }, { status: 401 });
    }

    // extractTextFromDocument's own failures (unsupported format, no readable text) throw an
    // Error with an already i18n-ized, user-facing message - safe to relay as-is.
    if (error instanceof Error) {
      return Response.json({ error: error.message }, { status: 400 });
    }

    console.error("Cover letter text extraction failed", error);
    return Response.json({ error: t("documents.textExtraction.errors.extractFailed") }, { status: 500 });
  }
}
