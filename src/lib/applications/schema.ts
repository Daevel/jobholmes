import { z } from "zod";

const matchClasses = ["A_STRONG", "B_STRETCH", "C_LONG_SHOT"] as const;
const applicationOutcomes = ["PENDING", "IN_PROGRESS", "REJECTED", "WITHDRAWN", "OFFER"] as const;
const applicationStages = ["APPLICATION", "RECRUITER_SCREENING", "HIRING_MANAGER", "TECHNICAL", "CHALLENGE", "FINAL", "OFFER"] as const;

const emptyToUndefined = (value: unknown) => (typeof value === "string" && value.trim() === "" ? undefined : value);
const optionalTrimmedString = (max: number) => z.preprocess(emptyToUndefined, z.string().trim().max(max).optional());
const optionalText = z.preprocess(emptyToUndefined, z.string().trim().max(50000).optional());
const optionalPositiveInteger = z.preprocess(emptyToUndefined, z.coerce.number().int().positive().optional());
const optionalPercentage = z.preprocess(emptyToUndefined, z.coerce.number().int("Match percentage must be an integer").min(0).max(100).optional());
const optionalUuid = z.preprocess(emptyToUndefined, z.string().uuid().optional());

const sponsorshipRequired = z.preprocess(
  emptyToUndefined,
  z.enum(["unknown", "false", "true"]).optional().transform((value) => {
    if (!value || value === "unknown") return null;
    return value === "true";
  }),
);

const baseApplicationFields = z
  .object({
    appliedAt: z.coerce.date({ error: "Applied date is required" }),
    company: z.string().trim().min(1, "Company is required").max(255),
    role: z.string().trim().min(1, "Role is required").max(255),
    roleCategory: optionalTrimmedString(120),
    seniority: optionalTrimmedString(80),
    country: optionalTrimmedString(120),
    workMode: optionalTrimmedString(40),
    source: optionalTrimmedString(80),
    vacancyUrl: z.preprocess(emptyToUndefined, z.url("Enter a valid vacancy URL").optional()),
    cvDocumentId: optionalUuid,
    jdText: optionalText,
    userMatchClass: z.preprocess(emptyToUndefined, z.enum(matchClasses).optional()),
    userMatchPercentage: optionalPercentage,
    workAuthorization: optionalTrimmedString(120),
    sponsorshipRequired,
    salaryMin: optionalPositiveInteger,
    salaryMax: optionalPositiveInteger,
    currency: optionalTrimmedString(10),
    requirementsAndGaps: optionalText,
    notes: optionalText,
  })
  .refine((input) => !input.salaryMin || !input.salaryMax || input.salaryMax >= input.salaryMin, {
    message: "Salary max must not be lower than salary min",
    path: ["salaryMax"],
  });

export const createApplicationSchema = baseApplicationFields;
export type CreateApplicationInput = z.infer<typeof createApplicationSchema>;

export const updateApplicationSchema = baseApplicationFields
  .extend({
    outcome: z.enum(applicationOutcomes),
    stage: z.enum(applicationStages),
    responseAt: z.preprocess(emptyToUndefined, z.coerce.date().optional()),
    rejectionReason: optionalText,
  })
  .transform((input) => ({
    ...input,
    outcome: input.stage === "OFFER" ? "OFFER" : input.outcome,
  }));

export type UpdateApplicationInput = z.infer<typeof updateApplicationSchema>;
