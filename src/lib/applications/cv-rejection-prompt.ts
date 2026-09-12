import { t } from "@/lib/i18n/translate";

export type CvRejectionPromptOptions = {
  keep: { available: true };
  unlink: { available: true };
  deletePermanently: { available: boolean; disabledReason?: string };
};

export function determineCvRejectionPromptOptions({ otherApplicationsUsingCv }: { otherApplicationsUsingCv: number }): CvRejectionPromptOptions {
  if (otherApplicationsUsingCv > 0) {
    // {count} is a plain string substitution, not part of translate.ts's t() itself — see the
    // comment on the corresponding catalog keys in src/lib/i18n/locales/en.ts.
    const template = otherApplicationsUsingCv === 1
      ? t("applications.edit.cvRejection.deletePermanentlyDisabledOne")
      : t("applications.edit.cvRejection.deletePermanentlyDisabledOther");

    return {
      keep: { available: true },
      unlink: { available: true },
      deletePermanently: {
        available: false,
        disabledReason: template.replace("{count}", String(otherApplicationsUsingCv)),
      },
    };
  }

  return {
    keep: { available: true },
    unlink: { available: true },
    deletePermanently: { available: true },
  };
}
