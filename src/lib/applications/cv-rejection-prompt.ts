export type CvRejectionPromptOptions = {
  keep: { available: true };
  unlink: { available: true };
  deletePermanently: { available: boolean; disabledReason?: string };
};

export function determineCvRejectionPromptOptions({ otherApplicationsUsingCv }: { otherApplicationsUsingCv: number }): CvRejectionPromptOptions {
  if (otherApplicationsUsingCv > 0) {
    return {
      keep: { available: true },
      unlink: { available: true },
      deletePermanently: {
        available: false,
        disabledReason: `Also used by ${otherApplicationsUsingCv} other application${otherApplicationsUsingCv === 1 ? "" : "s"}.`,
      },
    };
  }

  return {
    keep: { available: true },
    unlink: { available: true },
    deletePermanently: { available: true },
  };
}
