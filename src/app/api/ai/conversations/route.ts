import { createConversationForUser, listConversationsForUser } from "@/lib/ai/conversations";
import { requireCurrentUser } from "@/lib/current-user";
import { t } from "@/lib/i18n/translate";

export async function GET() {
  try {
    const user = await requireCurrentUser();
    const conversations = await listConversationsForUser(user.id);
    return Response.json({ conversations });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return Response.json({ error: t("errors.auth.signInToViewAnalyses") }, { status: 401 });
    }

    console.error("AI conversations list failed", error);
    return Response.json({ error: t("aiAnalyst.errors.loadAnalysesFailed") }, { status: 500 });
  }
}

export async function POST() {
  try {
    const user = await requireCurrentUser();
    const conversation = await createConversationForUser(user.id, t("aiAnalyst.newConversationTitle"));
    return Response.json({ conversation });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return Response.json({ error: t("errors.auth.signInToCreateAnalysis") }, { status: 401 });
    }

    console.error("AI conversation create failed", error);
    return Response.json({ error: t("aiAnalyst.errors.createAnalysisFailed") }, { status: 500 });
  }
}
