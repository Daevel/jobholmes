"use server";

import { redirect } from "next/navigation";
import { createApplicationSchema, type CreateApplicationInput } from "@/lib/applications/schema";
import { createApplicationForUser } from "@/lib/applications/service";
import { requireCurrentUser } from "@/lib/current-user";

type CreateApplicationField = keyof CreateApplicationInput;

export type CreateApplicationFormState = {
  errors?: Partial<Record<CreateApplicationField, string[]>>;
  formError?: string;
  values?: Partial<Record<CreateApplicationField, string>>;
};

export const initialCreateApplicationFormState: CreateApplicationFormState = {};

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
    await createApplicationForUser(user.id, parsed.data);
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
