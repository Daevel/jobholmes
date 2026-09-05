import { getOpenAIClient } from "@/lib/ai/client";
import { buildJobSearchContext } from "@/lib/ai/context";
import { requireCurrentUser } from "@/lib/current-user";
import { z } from "zod";

const openai = getOpenAIClient();

const schema = z.object({ message: z.string().trim().min(1).max(10000) });
export async function POST(request: Request) {
    try {
        const user = await requireCurrentUser(); const { message } = schema.parse(await request.json()); const context = await buildJobSearchContext(user.id); const response = await openai.responses.create({
            model: process.env.OPENAI_MODEL ?? "gpt-5", instructions: "You are JobHolmes, an evidence-driven job-search analyst. PostgreSQL data supplied by JobHolmes is the source of truth. Never invent application facts. Focus on funnel conversion and distinguish strong matches from stretch/long-shot applications.", input: [{
                role: "user", content: `CURRENT JOBHOLMES CONTEXT:
${JSON.stringify(context)}

USER MESSAGE:
${message}`
            }]
        }); return Response.json({ text: response.output_text, responseId: response.id, usage: response.usage ?? null });
    } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "AI request failed" }, { status: 400 }); }
}
