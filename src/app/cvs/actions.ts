"use server";

import { revalidatePath } from "next/cache";
import { createCvForUser } from "@/lib/cvs/service";
import { requireCurrentUser } from "@/lib/current-user";

export type CvUploadState = {
  error?: string;
};

export async function uploadCvAction(_previousState: CvUploadState, formData: FormData): Promise<CvUploadState> {
  const name = String(formData.get("name") ?? "").trim();
  const file = formData.get("file");

  if (!name) return { error: "CV name is required." };
  if (!(file instanceof File) || file.size === 0) return { error: "Choose a PDF file to upload." };

  try {
    const user = await requireCurrentUser();
    await createCvForUser({ userId: user.id, name, file });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not upload CV. Please try again." };
  }

  revalidatePath("/cvs");
  return {};
}
