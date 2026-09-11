"use client";

import { useEffect, useRef, useState } from "react";
import { Button, formStyles } from "@/components/form-ui";

const SAVE_DEBOUNCE_MS = 500;
const COPY_FEEDBACK_MS = 2000;

export function CoverLetterSection({
  applicationId,
  company,
  role,
  initialCoverLetter,
  eligibility,
}: {
  applicationId: string;
  company: string;
  role: string;
  initialCoverLetter: string | null;
  eligibility: { eligible: true } | { eligible: false; reason: string };
}) {
  const [coverLetter, setCoverLetter] = useState(initialCoverLetter ?? "");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  const saveDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const copyFeedbackRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (saveDebounceRef.current) clearTimeout(saveDebounceRef.current);
    if (copyFeedbackRef.current) clearTimeout(copyFeedbackRef.current);
  }, []);

  async function generate() {
    if (isGenerating) return;
    setIsGenerating(true);
    setGenerateError(null);

    try {
      const response = await fetch(`/api/applications/${applicationId}/cover-letter`, { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(typeof data.error === "string" ? data.error : "JobHolmes could not generate the cover letter. Please try again.");

      setCoverLetter(data.coverLetter ?? "");
    } catch (error) {
      setGenerateError(error instanceof Error ? error.message : "JobHolmes could not generate the cover letter. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  }

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
        throw new Error(typeof data?.error === "string" ? data.error : "Could not save your changes. Please try again.");
      }
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Could not save your changes. Please try again.");
    }
  }

  async function copyToClipboard() {
    try {
      await navigator.clipboard.writeText(coverLetter);
      setIsCopied(true);
      if (copyFeedbackRef.current) clearTimeout(copyFeedbackRef.current);
      copyFeedbackRef.current = setTimeout(() => setIsCopied(false), COPY_FEEDBACK_MS);
    } catch {
      setSaveError("Could not copy to clipboard.");
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
      {!hasCoverLetter ? (
        <div className="space-y-2">
          <Button disabled={!eligibility.eligible || isGenerating} onClick={generate} type="button">
            {isGenerating ? "Generating..." : "Generate cover letter"}
          </Button>
          {!eligibility.eligible ? <p className="text-sm text-slate-500">{eligibility.reason}</p> : null}
        </div>
      ) : (
        <div className="space-y-3">
          <textarea
            className={formStyles.textarea}
            onChange={handleChange}
            rows={14}
            value={coverLetter}
          />
          <div className="flex flex-wrap items-center gap-2">
            <Button disabled={isGenerating} onClick={generate} type="button" variant="secondary">
              {isGenerating ? "Regenerating..." : "Regenerate"}
            </Button>
            <Button onClick={copyToClipboard} type="button" variant="secondary">
              {isCopied ? "Copied!" : "Copy"}
            </Button>
            <Button onClick={downloadAsTxt} type="button" variant="secondary">
              Download .txt
            </Button>
          </div>
        </div>
      )}

      {generateError ? <p className={formStyles.formError}>{generateError}</p> : null}
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
