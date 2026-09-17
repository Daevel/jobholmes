"use client";

import { useRef, useState } from "react";
import { Button, formStyles } from "@/components/form-ui";
import { t } from "@/lib/i18n/translate";

/**
 * Extracts text from a .txt/.pdf/.docx file to populate a cover letter field - the file itself is
 * never persisted, only the extracted text is handed back. Same "plain buttons, no nested <form>,
 * no name attribute on the file input" reasoning as CvUploadInline, since this is always rendered
 * inside another <form>.
 *
 * Deliberately dumb about the target field: it only knows how to produce text, not how (or
 * whether) to overwrite what's already there - each of its three call sites decides that for
 * itself, since "is there existing text" means something different for an uncontrolled form field
 * (new/edit application forms) than for controlled React state (job-fit-form.tsx).
 */
export function CoverLetterFileUpload({ onExtracted }: { onExtracted: (text: string) => void }) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function close() {
    setOpen(false);
    setError(null);
  }

  async function handleExtract() {
    if (pending) return;

    const file = fileRef.current?.files?.[0];
    if (!file) {
      setError(t("documents.textExtraction.errors.fileRequired"));
      return;
    }

    setPending(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.set("file", file);

      const response = await fetch("/api/cover-letter/extract-text", { method: "POST", body: formData });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(typeof data.error === "string" ? data.error : t("documents.textExtraction.errors.extractFailed"));

      onExtracted(typeof data.text === "string" ? data.text : "");
      setOpen(false);
      if (fileRef.current) fileRef.current.value = "";
    } catch (extractError) {
      setError(extractError instanceof Error ? extractError.message : t("documents.textExtraction.errors.extractFailed"));
    } finally {
      setPending(false);
    }
  }

  if (!open) {
    return (
      <button className="mt-2 text-sm font-semibold text-indigo-600 outline-none hover:text-indigo-700 focus-visible:ring-2 focus-visible:ring-indigo-500" onClick={() => setOpen(true)} type="button">
        {t("documents.textExtraction.uploadButton")}
      </button>
    );
  }

  return (
    <div className="mt-3 space-y-3 rounded-lg border border-slate-200 p-3">
      {error ? <p className={formStyles.formError}>{error}</p> : null}
      <label className={formStyles.label}>
        {t("documents.textExtraction.fileLabel")}
        <input accept=".txt,.pdf,.docx" className="mt-2 block h-11 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-slate-700" ref={fileRef} type="file" />
      </label>
      <div className="flex gap-2">
        <Button disabled={pending} onClick={handleExtract} type="button">
          {pending ? t("documents.textExtraction.extractingButton") : t("documents.textExtraction.extractButton")}
        </Button>
        <Button disabled={pending} onClick={close} type="button" variant="secondary">
          {t("common.actions.cancel")}
        </Button>
      </div>
    </div>
  );
}
