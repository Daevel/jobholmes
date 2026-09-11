import { requireCurrentUser } from "@/lib/current-user";
import { deleteCvForUser } from "@/lib/cvs/service";
import { z } from "zod";

const paramsSchema = z.object({ id: z.string().uuid() });

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireCurrentUser();
    const parsed = paramsSchema.safeParse(await params);
    if (!parsed.success) return Response.json({ error: "Invalid CV." }, { status: 400 });

    const result = await deleteCvForUser(user.id, parsed.data.id);
    if (!result) return Response.json({ error: "CV not found." }, { status: 404 });

    if (!result.deleted) {
      const applicationCount = result.blockedByApplicationCount;
      return Response.json(
        {
          error: `This CV is used by ${applicationCount} application${applicationCount === 1 ? "" : "s"} and can't be deleted. Unlink it from those applications first, or delete them.`,
          blockedByApplicationCount: applicationCount,
        },
        { status: 409 },
      );
    }

    return Response.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return Response.json({ error: "You must be signed in to delete CVs." }, { status: 401 });
    }

    console.error("CV delete failed", error);
    return Response.json({ error: "Could not delete CV." }, { status: 500 });
  }
}
