import { enrichApplicationFields } from "@/lib/ai/enrichment";
import { requireCurrentUser } from "@/lib/current-user";
import { t } from "@/lib/i18n/translate";

export async function POST(request: Request) {
  try {
    await requireCurrentUser();
    const input = await request.json();
    const suggestions = await enrichApplicationFields(input);
    return Response.json({ suggestions });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return Response.json({ error: t("errors.auth.signInToExtractDetails") }, { status: 401 });
    }

    if (error instanceof Error && error.message === "MISSING_SOURCE") {
      return Response.json({ error: t("applications.form.enrichment.errors.missingSource") }, { status: 400 });
    }

    console.error("Application enrichment failed", error);
    return Response.json({ error: t("applications.form.enrichment.errors.extractFailed") }, { status: 500 });
  }
}
