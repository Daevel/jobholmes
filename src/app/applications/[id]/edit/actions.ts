"use server";

import { notFound, redirect } from "next/navigation";
import { updateApplicationSchema } from "@/lib/applications/schema";
import { updateApplicationForUser } from "@/lib/applications/service";
import { requireCurrentUser } from "@/lib/current-user";
import { syncUpdatedApplicationToGoogleSheet } from "@/lib/google/sheets";
import type { UpdateApplicationFormState } from "@/app/applications/[id]/edit/form-state";

export async function updateApplicationAction(
  applicationId: string,
  _previousState: UpdateApplicationFormState,
  formData: FormData,
): Promise<UpdateApplicationFormState> {
  const rawValues = Object.fromEntries(formData.entries());
  const parsed = updateApplicationSchema.safeParse(rawValues);

  if (!parsed.success) {
    return {
      errors: parsed.error.flatten().fieldErrors,
      values: getStringValues(rawValues),
    };
  }

  try {
    const user = await requireCurrentUser();
    const result = await updateApplicationForUser(user.id, applicationId, parsed.data);

    if (!result) notFound();

    try {
      await syncUpdatedApplicationToGoogleSheet(result.updated, result.previous);
    } catch (error) {
      console.error("Google Sheets update sync failed", {
        applicationId: result.updated.id,
        company: result.updated.company,
        role: result.updated.role,
        errorName: error instanceof Error ? error.name : "UnknownError",
      });
    }
  } catch {
    return {
      formError: "Could not update application. Please try again.",
      values: getStringValues(rawValues),
    };
  }

  redirect(`/applications/${applicationId}`);
}

function getStringValues(values: Record<string, FormDataEntryValue>): UpdateApplicationFormState["values"] {
  return Object.fromEntries(
    Object.entries(values).flatMap(([key, value]) => (typeof value === "string" ? [[key, value]] : [])),
  ) as UpdateApplicationFormState["values"];
}
