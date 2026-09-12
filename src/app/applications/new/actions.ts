"use server";

import { createApplicationSchema } from "@/lib/applications/schema";
import { createApplicationForUser } from "@/lib/applications/service";
import { saveSourceForUser } from "@/lib/applications/sources-service";
import { requireCurrentUser } from "@/lib/current-user";
import { t } from "@/lib/i18n/translate";
import { syncApplicationToGoogleSheet } from "@/lib/google/sheets";
import { redirect } from "next/navigation";
import type { CreateApplicationFormState } from "./form-state";

export async function createApplicationAction(
  _previousState: CreateApplicationFormState,
  formData: FormData,
): Promise<CreateApplicationFormState> {
  const rawValues = Object.fromEntries(formData.entries());
  const { saveSource, ...applicationValues } = rawValues;
  const parsed = createApplicationSchema.safeParse(applicationValues);
  let applicationId: string | null = null;

  if (!parsed.success) {
    return {
      errors: parsed.error.flatten().fieldErrors,
      values: getStringValues(rawValues),
    };
  }

  try {
    const user = await requireCurrentUser();
    const application = await createApplicationForUser(user.id, parsed.data);
    applicationId = application.id;

    if (typeof saveSource === "string" && saveSource && parsed.data.source) {
      await saveSourceForUser(user.id, parsed.data.source);
    }

    try {
      await syncApplicationToGoogleSheet(application);
    } catch (error) {
      console.error("Google Sheets sync failed", {
        applicationId: application.id,
        company: application.company,
        role: application.role,
        errorName: error instanceof Error ? error.name : "UnknownError",
      });
    }
  } catch {
    return {
      formError: t("applications.new.errors.createFailed"),
      values: getStringValues(rawValues),
    };
  }

  redirect(applicationId ? `/applications/${applicationId}` : "/dashboard");
}

function getStringValues(values: Record<string, FormDataEntryValue>): CreateApplicationFormState["values"] {
  return Object.fromEntries(
    Object.entries(values).flatMap(([key, value]) => (typeof value === "string" ? [[key, value]] : [])),
  ) as CreateApplicationFormState["values"];
}
