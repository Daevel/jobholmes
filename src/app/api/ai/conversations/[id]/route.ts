import { deleteConversationForUser } from "@/lib/ai/conversations";
import { requireCurrentUser } from "@/lib/current-user";
import { z } from "zod";

const paramsSchema = z.object({ id: z.string().uuid() });

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireCurrentUser();
    const parsed = paramsSchema.safeParse(await params);
    if (!parsed.success) {
      return Response.json({ error: "Invalid analysis." }, { status: 400 });
    }

    const { deleted } = await deleteConversationForUser(user.id, parsed.data.id);
    if (!deleted) {
      return Response.json({ error: "Analysis not found." }, { status: 404 });
    }

    return Response.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return Response.json({ error: "You must be signed in to delete an analysis." }, { status: 401 });
    }

    console.error("AI conversation delete failed", error);
    return Response.json({ error: "Could not delete analysis." }, { status: 500 });
  }
}
