import { getConversationMessagesForUser } from "@/lib/ai/conversations";
import { requireCurrentUser } from "@/lib/current-user";
import { z } from "zod";

const paramsSchema = z.object({ id: z.string().uuid() });

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireCurrentUser();
    const parsed = paramsSchema.safeParse(await params);
    if (!parsed.success) {
      return Response.json({ error: "Invalid analysis." }, { status: 400 });
    }

    const messages = await getConversationMessagesForUser(user.id, parsed.data.id);
    if (!messages) {
      return Response.json({ error: "Analysis not found." }, { status: 404 });
    }

    return Response.json({ messages });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return Response.json({ error: "You must be signed in to view messages." }, { status: 401 });
    }

    console.error("AI messages load failed", error);
    return Response.json({ error: "Could not load messages." }, { status: 500 });
  }
}
