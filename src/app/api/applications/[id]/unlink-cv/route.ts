import { requireCurrentUser } from "@/lib/current-user";
import { unlinkCvFromApplication } from "@/lib/applications/service";
import { z } from "zod";

const paramsSchema = z.object({ id: z.string().uuid() });

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireCurrentUser();
    const parsed = paramsSchema.safeParse(await params);
    if (!parsed.success) return Response.json({ error: "Invalid application." }, { status: 400 });

    const updated = await unlinkCvFromApplication(user.id, parsed.data.id);
    if (!updated) return Response.json({ error: "Application not found." }, { status: 404 });

    return Response.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return Response.json({ error: "You must be signed in to update this application." }, { status: 401 });
    }

    console.error("Application CV unlink failed", error);
    return Response.json({ error: "Could not unlink the CV." }, { status: 500 });
  }
}
