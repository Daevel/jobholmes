import { z } from "zod";
import { t } from "@/lib/i18n/translate";

const matchClasses = ["A_STRONG", "B_STRETCH", "C_LONG_SHOT"] as const;
const applicationOutcomes = ["PENDING", "IN_PROGRESS", "REJECTED", "WITHDRAWN", "OFFER"] as const;
const applicationStages = ["APPLICATION", "RECRUITER_SCREENING", "HIRING_MANAGER", "TECHNICAL", "CHALLENGE", "FINAL", "OFFER"] as const;

const emptyToUndefined = (value: unknown) => (typeof value === "string" && value.trim() === "" ? undefined : value);
const optionalTrimmedString = (max: number) => z.preprocess(emptyToUndefined, z.string().trim().max(max).optional());
const optionalText = z.preprocess(emptyToUndefined, z.string().trim().max(50000).optional());
const optionalPositiveInteger = z.preprocess(emptyToUndefined, z.coerce.number().int().positive().optional());
const optionalUuid = z.preprocess(emptyToUndefined, z.string().uuid().optional());

const sponsorshipRequired = z.preprocess(
  emptyToUndefined,
  z.enum(["unknown", "false", "true"]).optional().transform((value) => {
    if (!value || value === "unknown") return null;
    return value === "true";
  }),
);

// Checkbox input: present as "on" (HTML form) or a real boolean (JSON body) when checked,
// absent/anything else when unchecked. Always resolves to a boolean, never undefined.
const checkboxBoolean = z.preprocess((value) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value === "on" || value === "true";
  return false;
}, z.boolean());

export const baseApplicationFields = z
  .object({
    appliedAt: z.coerce.date({ error: t("applications.validation.appliedDateRequired") }),
    company: z.string().trim().min(1, t("applications.validation.companyRequired")).max(255),
    role: z.string().trim().min(1, t("applications.validation.roleRequired")).max(255),
    roleCategory: optionalTrimmedString(120),
    seniority: optionalTrimmedString(80),
    country: optionalTrimmedString(120),
    city: optionalTrimmedString(120),
    remoteOnly: checkboxBoolean,
    workMode: optionalTrimmedString(40),
    source: optionalTrimmedString(80),
    vacancyUrl: z.preprocess(emptyToUndefined, z.url(t("applications.validation.invalidVacancyUrl")).optional()),
    cvDocumentId: optionalUuid,
    jdText: optionalText,
    workAuthorization: optionalTrimmedString(120),
    sponsorshipRequired,
    salaryMin: optionalPositiveInteger,
    salaryMax: optionalPositiveInteger,
    currency: optionalTrimmedString(10),
    stageContext: optionalText,
    notes: optionalText,
  })
  .strict();

/**
 * Shared cross-field rule for country/city/remoteOnly, called from every schema that creates or
 * saves an application (create, update, and the Job Fit confirm schema) so the rule lives in one
 * place. Country is required unless the application is marked remote-only.
 */
export function validateApplicationLocationFields(data: { country?: string; city?: string; remoteOnly: boolean }, ctx: z.RefinementCtx) {
  if (!data.remoteOnly && !data.country) {
    ctx.addIssue({
      code: "custom",
      message: t("applications.validation.countryRequiredUnlessRemoteOnly"),
      path: ["country"],
    });
  }
}

// Remote-only applications have no specific location: silently clear country/city rather than
// treating a client that still sent them alongside remoteOnly=true as a validation error - the UI
// is expected to hide those fields itself, so this is a server-side safety net, not the normal path.
export function clearLocationWhenRemoteOnly<T extends { country?: string; city?: string; remoteOnly: boolean }>(input: T) {
  return input.remoteOnly ? { ...input, country: undefined, city: undefined } : input;
}

export const createApplicationSchema = baseApplicationFields
  .refine((input) => !input.salaryMin || !input.salaryMax || input.salaryMax >= input.salaryMin, {
    message: t("applications.validation.salaryMaxBelowMin"),
    path: ["salaryMax"],
  })
  .superRefine(validateApplicationLocationFields)
  .transform(clearLocationWhenRemoteOnly);

export type CreateApplicationInput = z.infer<typeof createApplicationSchema>;

export const updateApplicationSchema = baseApplicationFields
  .extend({
    outcome: z.enum(applicationOutcomes),
    stage: z.enum(applicationStages),
    responseAt: z.preprocess(emptyToUndefined, z.coerce.date().optional()),
    rejectionReason: optionalText,
  })
  .superRefine(validateApplicationLocationFields)
  .transform((input) => clearLocationWhenRemoteOnly({
    ...input,
    outcome: input.stage === "OFFER" ? "OFFER" : input.outcome,
  }));

export type UpdateApplicationInput = z.infer<typeof updateApplicationSchema>;

const legacyManualMatchFields = z
  .object({
    userMatchClass: z.preprocess(emptyToUndefined, z.enum(matchClasses).optional()),
    userMatchPercentage: z.preprocess(emptyToUndefined, z.coerce.number().int(t("applications.validation.matchPercentageMustBeInteger")).min(0).max(100).optional()),
  })
  .strict()
  .extend({
    cvVersion: optionalTrimmedString(120),
    requirementsAndGaps: optionalText,
    outcome: z.enum(applicationOutcomes),
    stage: z.enum(applicationStages),
  });

export const legacyApplicationImportSchema = baseApplicationFields
  .merge(legacyManualMatchFields)
  .refine((input) => !input.salaryMin || !input.salaryMax || input.salaryMax >= input.salaryMin, {
    message: t("applications.validation.salaryMaxBelowMin"),
    path: ["salaryMax"],
  });
export type LegacyApplicationImportInput = z.infer<typeof legacyApplicationImportSchema>;
