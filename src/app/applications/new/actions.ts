"use server";

import { createApplicationSchema } from "@/lib/applications/schema";
import { createApplicationForUser } from "@/lib/applications/service";
import { requireCurrentUser } from "@/lib/current-user";
import { syncApplicationToGoogleSheet } from "@/lib/google/sheets";
import { redirect } from "next/navigation";
import { CreateApplicationFormState } from "./form-state";

export async function createApplicationAction(
  _previousState: CreateApplicationFormState,
  formData: FormData,
): Promise<CreateApplicationFormState> {
  const rawValues = Object.fromEntries(formData.entries());
  const parsed = createApplicationSchema.safeParse(rawValues);

  if (!parsed.success) {
    return {
      errors: parsed.error.flatten().fieldErrors,
      values: getStringValues(rawValues),
    };
  }

  try {
    const user = await requireCurrentUser();
    const application = await createApplicationForUser(user.id, parsed.data);

    try {
      await syncApplicationToGoogleSheet(application);
    } catch (error) {
      console.error("Google Sheets sync failed", {
        applicationId: application.id,
        company: application.company,
        role: application.role,
        errorName: error instanceof Error ? error.name : "UnknownError",
        errorMessage: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined,
      });
    }
  } catch {
    return {
      formError: "Could not create application. Please try again.",
      values: getStringValues(rawValues),
    };
  }

  redirect("/dashboard");
}

function getStringValues(values: Record<string, FormDataEntryValue>): CreateApplicationFormState["values"] {
  return Object.fromEntries(
    Object.entries(values).flatMap(([key, value]) => (typeof value === "string" ? [[key, value]] : [])),
  ) as CreateApplicationFormState["values"];
}
