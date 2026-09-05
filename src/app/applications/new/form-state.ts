import type { CreateApplicationInput } from "@/lib/applications/schema";

type CreateApplicationField = keyof CreateApplicationInput;

export type CreateApplicationFormState = {
  errors?: Partial<Record<CreateApplicationField, string[]>>;
  formError?: string;
  values?: Partial<Record<CreateApplicationField, string>>;
};

export const initialCreateApplicationFormState: CreateApplicationFormState = {};