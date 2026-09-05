import { createConversationForUser, listConversationsForUser } from "@/lib/ai/conversations";
import { requireCurrentUser } from "@/lib/current-user";

export async function GET() {
  try {
    const user = await requireCurrentUser();
    const conversations = await listConversationsForUser(user.id);
    return Response.json({ conversations });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return Response.json({ error: "You must be signed in to view analyses." }, { status: 401 });
    }

    console.error("AI conversations list failed", error);
    return Response.json({ error: "Could not load analyses." }, { status: 500 });
  }
}

export async function POST() {
  try {
    const user = await requireCurrentUser();
    const conversation = await createConversationForUser(user.id, "New analysis");
    return Response.json({ conversation });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return Response.json({ error: "You must be signed in to create an analysis." }, { status: 401 });
    }

    console.error("AI conversation create failed", error);
    return Response.json({ error: "Could not create analysis." }, { status: 500 });
  }
}
