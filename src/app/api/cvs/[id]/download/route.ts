import { requireCurrentUser } from "@/lib/current-user";
import { getCvDownloadForUser } from "@/lib/cvs/service";
import { z } from "zod";

const paramsSchema = z.object({ id: z.string().uuid() });

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireCurrentUser();
    const parsed = paramsSchema.safeParse(await params);
    if (!parsed.success) return Response.json({ error: "Invalid CV." }, { status: 400 });

    const download = await getCvDownloadForUser(user.id, parsed.data.id);
    if (!download) return Response.json({ error: "CV not found." }, { status: 404 });

    return new Response(download.blob.stream, {
      headers: {
        "Content-Type": download.cv.mimeType,
        "Content-Disposition": `attachment; filename="${download.cv.originalFileName.replace(/"/g, "")}"`,
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
