import { enrichApplicationFields } from "@/lib/ai/enrichment";
import { requireCurrentUser } from "@/lib/current-user";

export async function POST(request: Request) {
  try {
    await requireCurrentUser();
    const input = await request.json();
    const suggestions = await enrichApplicationFields(input);
    return Response.json({ suggestions });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return Response.json({ error: "You must be signed in to extract details." }, { status: 401 });
    }

    if (error instanceof Error && error.message === "MISSING_SOURCE") {
      return Response.json({ error: "Paste a job description or vacancy URL first." }, { status: 400 });
    }

    console.error("Application enrichment failed", error);
    return Response.json({ error: "JobHolmes could not extract details. Please try again." }, { status: 500 });
  }
}
