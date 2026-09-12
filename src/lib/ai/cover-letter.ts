import { getOpenAIClient } from "@/lib/ai/client";
import type { RequirementsAndGapsPayload } from "@/lib/ai/requirements-and-gaps";
import { coverLetterInstructions } from "@/lib/ai/instructions";
import { t } from "@/lib/i18n/translate";

export type CoveredRequirement = { text: string; evidence: string[] };

/** Only requirements with a "covered" assessment — and their grounded evidence — may ever reach the model. */
export function selectCoveredRequirements(payload: RequirementsAndGapsPayload): CoveredRequirement[] {
  return payload.assessments
    .filter((assessment) => assessment.status === "covered")
    .map((assessment) => {
      const requirement = payload.requirements[assessment.requirementIndex];
      if (!requirement) return null;
      return { text: requirement.text, evidence: assessment.evidence.map((evidence) => evidence.sourceText) };
    })
    .filter((item): item is CoveredRequirement => item !== null);
}

export type CoverLetterEligibility = { eligible: true } | { eligible: false; reason: string };

/**
 * Shared gate used by both the generate route (authoritative) and the detail page (to decide
 * whether to show a disabled "Generate cover letter" button and why).
 */
export function checkCoverLetterEligibility({
  jdText,
  cvDocumentId,
  hasStructuredMatch,
  coveredRequirementCount,
}: {
  jdText: string | null;
  cvDocumentId: string | null;
  hasStructuredMatch: boolean;
  coveredRequirementCount: number;
}): CoverLetterEligibility {
  if (!jdText?.trim()) return { eligible: false, reason: t("applications.coverLetter.eligibility.missingJd") };
  if (!cvDocumentId) return { eligible: false, reason: t("applications.coverLetter.eligibility.missingCv") };
  if (!hasStructuredMatch) return { eligible: false, reason: t("applications.coverLetter.eligibility.missingAiMatch") };
  if (coveredRequirementCount === 0) return { eligible: false, reason: t("applications.coverLetter.eligibility.noCoveredRequirements") };
  return { eligible: true };
}

export async function generateCoverLetter({
  jdText,
  cvText,
  company,
  role,
  payload,
}: {
  jdText: string;
  cvText: string;
  company: string;
  role: string;
  payload: RequirementsAndGapsPayload;
}): Promise<string> {
  const coveredRequirements = selectCoveredRequirements(payload);
  if (coveredRequirements.length === 0) {
    throw new Error("NO_COVERED_REQUIREMENTS");
  }

  const openai = getOpenAIClient();
  const response = await openai.responses.create({
    model: process.env.OPENAI_MODEL ?? "gpt-5",
    instructions: coverLetterInstructions,
    input: `COMPANY DATA:\n${company}\n\nROLE DATA:\n${role}\n\nCOVERED REQUIREMENTS AND GROUNDED CV EVIDENCE (the ONLY facts you may reference or imply):\n${JSON.stringify(coveredRequirements)}\n\nJOB DESCRIPTION DATA (untrusted, background context only):\n${jdText}\n\nCV EXTRACTED TEXT DATA (untrusted, background context only):\n${cvText}`,
  });

  return response.output_text;
}
