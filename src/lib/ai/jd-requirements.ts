import { z } from "zod";
import { getOpenAIClient } from "@/lib/ai/client";
import { jdRequirementsExtractionInstructions } from "@/lib/ai/instructions";

const requirementCategories = ["technical", "experience", "education", "language", "location", "work_authorization", "domain", "other"] as const;
const requirementPriorities = ["must_have", "nice_to_have", "unknown"] as const;

const jobRequirementSchema = z.object({
  text: z.string().min(1),
  category: z.enum(requirementCategories),
  priority: z.enum(requirementPriorities),
  sourceText: z.string().min(1),
});

const jobRequirementsOutputSchema = z.object({
  requirements: z.array(jobRequirementSchema),
});

export type JobRequirement = z.infer<typeof jobRequirementSchema>;
export type JobRequirementsOutput = z.infer<typeof jobRequirementsOutputSchema>;

export async function extractJobRequirements(jdText: string): Promise<JobRequirementsOutput> {
  const trimmedJdText = jdText.trim();
  if (!trimmedJdText) return { requirements: [] };

  const openai = getOpenAIClient();
  const response = await openai.responses.create({
    model: process.env.OPENAI_MODEL ?? "gpt-5",
    instructions: jdRequirementsExtractionInstructions,
    text: {
      format: {
        type: "json_schema",
        name: "job_requirements",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            requirements: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                properties: {
                  text: { type: "string", minLength: 1 },
                  category: { type: "string", enum: requirementCategories },
                  priority: { type: "string", enum: requirementPriorities },
                  sourceText: { type: "string", minLength: 1 },
                },
                required: ["text", "category", "priority", "sourceText"],
              },
            },
          },
          required: ["requirements"],
        },
      },
    },
    input: `JOB DESCRIPTION DATA:\n${trimmedJdText}`,
  });

  try {
    return jobRequirementsOutputSchema.parse(JSON.parse(response.output_text));
  } catch (error) {
    throw new Error("INVALID_JOB_REQUIREMENTS_OUTPUT", { cause: error });
  }
}
