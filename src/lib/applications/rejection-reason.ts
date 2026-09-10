export function shouldShowRejectionReason(outcome: string) {
  return outcome === "REJECTED";
}

export function getNextRejectionReason({ outcome, submittedValue, previousValue }: { outcome: string; submittedValue?: string; previousValue: string | null }) {
  if (!shouldShowRejectionReason(outcome)) return previousValue;
  return submittedValue ?? null;
}
