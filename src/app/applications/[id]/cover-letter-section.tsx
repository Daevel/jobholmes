"use client";

import { useEffect, useRef, useState } from "react";
import { Button, formStyles } from "@/components/form-ui";
import { t } from "@/lib/i18n/translate";

const SAVE_DEBOUNCE_MS = 500;
const COPY_FEEDBACK_MS = 2000;

export function CoverLetterSection({
  applicationId,
  company,
  role,
  initialCoverLetter,
}: {
  applicationId: string;
  company: string;
  role: string;
  initialCoverLetter: string | null;
}) {
  const [coverLetter, setCoverLetter] = useState(initialCoverLetter ?? "");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  const saveDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const copyFeedbackRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (saveDebounceRef.current) clearTimeout(saveDebounceRef.current);
    if (copyFeedbackRef.current) clearTimeout(copyFeedbackRef.current);
  }, []);

  function handleChange(event: React.ChangeEvent<HTMLTextAreaElement>) {
    const value = event.target.value;
    setCoverLetter(value);
    setSaveError(null);

    if (saveDebounceRef.current) clearTimeout(saveDebounceRef.current);
    saveDebounceRef.current = setTimeout(() => saveCoverLetter(value), SAVE_DEBOUNCE_MS);
  }

  async function saveCoverLetter(value: string) {
    try {
      const response = await fetch(`/api/applications/${applicationId}/cover-letter`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coverLetter: value }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(typeof data?.error === "string" ? data.error : t("applications.coverLetter.errors.saveFailed"));
      }
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : t("applications.coverLetter.errors.saveFailed"));
    }
  }

  async function copyToClipboard() {
    try {
      await navigator.clipboard.writeText(coverLetter);
      setIsCopied(true);
      if (copyFeedbackRef.current) clearTimeout(copyFeedbackRef.current);
      copyFeedbackRef.current = setTimeout(() => setIsCopied(false), COPY_FEEDBACK_MS);
    } catch {
      setSaveError(t("applications.coverLetter.errors.copyFailed"));
    }
  }

  function downloadAsTxt() {
    const blob = new Blob([coverLetter], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `cover-letter-${sanitizeFileNamePart(company)}-${sanitizeFileNamePart(role)}.txt`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  const hasCoverLetter = coverLetter.trim().length > 0;

  return (
    <div className="space-y-4">
      <textarea
        className={formStyles.textarea}
        onChange={handleChange}
        placeholder={t("applications.form.coverLetter.placeholder")}
        rows={14}
        value={coverLetter}
      />
      {hasCoverLetter ? (
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={copyToClipboard} type="button" variant="secondary">
            {isCopied ? t("applications.coverLetter.copiedButton") : t("applications.coverLetter.copyButton")}
          </Button>
          <Button onClick={downloadAsTxt} type="button" variant="secondary">
            {t("applications.coverLetter.downloadButton")}
          </Button>
        </div>
      ) : null}

      {saveError ? <p className={formStyles.formError}>{saveError}</p> : null}
    </div>
  );
}

function sanitizeFileNamePart(value: string) {
  return value
    .trim()
    .replace(/[^a-zA-Z0-9-_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase() || "untitled";
}
