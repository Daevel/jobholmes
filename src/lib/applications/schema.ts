import { z } from "zod";

const matchClasses = ["A_STRONG", "B_STRETCH", "C_LONG_SHOT"] as const;
const applicationOutcomes = ["PENDING", "IN_PROGRESS", "REJECTED", "WITHDRAWN", "OFFER"] as const;
const applicationStages = ["APPLICATION", "RECRUITER_SCREENING", "HIRING_MANAGER", "TECHNICAL", "CHALLENGE", "FINAL", "OFFER"] as const;

const emptyToUndefined = (value: unknown) => (typeof value === "string" && value.trim() === "" ? undefined : value);
const optionalTrimmedString = (max: number) => z.preprocess(emptyToUndefined, z.string().trim().max(max).optional());
const optionalPositiveInteger = z.preprocess(emptyToUndefined, z.coerce.number().int().positive().optional());

export const createApplicationSchema = z
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
    cvVersion: optionalTrimmedString(120),
    userMatchClass: z.preprocess(emptyToUndefined, z.enum(matchClasses).optional()),
    userMatchPercentage: z.preprocess(
      emptyToUndefined,
      z.coerce.number().int("Match percentage must be an integer").min(0).max(100).optional(),
    ),
    workAuthorization: optionalTrimmedString(120),
    sponsorshipRequired: z.preprocess((value) => value === "on" || value === "true" || value === true, z.boolean()),
    salaryMin: optionalPositiveInteger,
    salaryMax: optionalPositiveInteger,
    currency: optionalTrimmedString(10),
    outcome: z.enum(applicationOutcomes).default("PENDING"),
    stage: z.enum(applicationStages).default("APPLICATION"),
    requirementsAndGaps: optionalTrimmedString(10000),
    notes: optionalTrimmedString(10000),
  })
  .refine((input) => !input.salaryMin || !input.salaryMax || input.salaryMax >= input.salaryMin, {
    message: "Salary max must not be lower than salary min",
    path: ["salaryMax"],
  });

export type CreateApplicationInput = z.infer<typeof createApplicationSchema>;

export const updateApplicationSchema = createApplicationSchema
  .extend({
    responseAt: z.preprocess(emptyToUndefined, z.coerce.date().optional()),
    rejectionReason: optionalTrimmedString(10000),
  })
  .transform((input) => ({
    ...input,
    outcome: input.stage === "OFFER" ? "OFFER" : input.outcome,
  }));

export type UpdateApplicationInput = z.infer<typeof updateApplicationSchema>;
