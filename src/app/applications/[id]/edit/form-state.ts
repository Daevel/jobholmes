import type { UpdateApplicationInput } from "@/lib/applications/schema";

type UpdateApplicationField = keyof UpdateApplicationInput;

export type UpdateApplicationFormState = {
  errors?: Partial<Record<UpdateApplicationField, string[]>>;
  formError?: string;
  values?: Partial<Record<UpdateApplicationField, string>>;
  cvRejectionPrompt?: { cvDocumentId: string; otherApplicationsUsingCv: number };
};

export const initialUpdateApplicationFormState: UpdateApplicationFormState = {};
