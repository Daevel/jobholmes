import { requireCurrentUser } from "@/lib/current-user";
import { getCvForUser } from "@/lib/cvs/service";
import { getPrivateCvPdf } from "@/lib/cvs/storage";
import { z } from "zod";

const paramsSchema = z.object({ id: z.string().uuid() });

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireCurrentUser();
    const parsed = paramsSchema.safeParse(await params);
    if (!parsed.success) return Response.json({ error: "Invalid CV." }, { status: 400 });

    const cv = await getCvForUser(user.id, parsed.data.id);
    if (!cv) return Response.json({ error: "CV not found." }, { status: 404 });

    const blob = await getPrivateCvPdf(cv.storagePath);
    if (!blob) return Response.json({ error: "CV file not found." }, { status: 404 });

    return new Response(blob.stream, {
      headers: {
        "Content-Type": cv.mimeType,
        "Content-Disposition": `attachment; filename="${cv.originalFileName.replace(/"/g, "")}"`,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return Response.json({ error: "You must be signed in to download CVs." }, { status: 401 });
    }

    console.error("CV download failed", error);
    return Response.json({ error: "Could not download CV." }, { status: 500 });
  }
}
