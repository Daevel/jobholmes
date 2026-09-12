"use server";

import { revalidatePath } from "next/cache";
import { createCvForUser } from "@/lib/cvs/upload";
import { requireCurrentUser } from "@/lib/current-user";
import { t } from "@/lib/i18n/translate";

export type CvUploadState = {
  error?: string;
};

export async function uploadCvAction(_previousState: CvUploadState, formData: FormData): Promise<CvUploadState> {
  const name = String(formData.get("name") ?? "").trim();
  const file = formData.get("file");

  if (!name) return { error: t("cvs.upload.errors.nameRequired") };
  if (!(file instanceof File) || file.size === 0) return { error: t("cvs.upload.errors.fileRequired") };

  try {
    const user = await requireCurrentUser();
    await createCvForUser({ userId: user.id, name, file });
  } catch (error) {
    return { error: error instanceof Error ? error.message : t("cvs.upload.errors.uploadFailed") };
  }

  revalidatePath("/cvs");
  return {};
}
