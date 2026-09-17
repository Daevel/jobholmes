"use client";

import { useRef, useState } from "react";
import { Button, formStyles } from "@/components/form-ui";
import { t } from "@/lib/i18n/translate";

/**
 * Uploads a CV to the shared library from inside another form (application create/edit) without
 * navigating away or disturbing that form's own state. Deliberately plain buttons + refs instead
 * of a nested <form>, since the browser forbids a <form> inside another <form> and this component
 * is always rendered inside the application form - same reasoning as EnrichmentButton in
 * new/form.tsx and edit/form.tsx, which reads/writes fields imperatively for the same reason.
 * The name/file inputs below carry no `name` attribute, so they're invisible to the parent
 * form's own FormData even though they share the DOM tree.
 */
export function CvUploadInline({ onUploaded }: { onUploaded: (cv: { id: string; name: string }) => void }) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function close() {
    setOpen(false);
    setError(null);
  }

  async function handleUpload() {
    if (pending) return;

    const name = nameRef.current?.value.trim() ?? "";
    const file = fileRef.current?.files?.[0];

    if (!name) {
      setError(t("cvs.upload.errors.nameRequired"));
      return;
    }
    if (!file) {
      setError(t("cvs.upload.errors.fileRequired"));
      return;
    }

    setPending(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.set("name", name);
      formData.set("file", file);

      const response = await fetch("/api/cvs", { method: "POST", body: formData });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(typeof data.error === "string" ? data.error : t("cvs.upload.errors.uploadFailed"));

      onUploaded(data.cv as { id: string; name: string });
      setOpen(false);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : t("cvs.upload.errors.uploadFailed"));
    } finally {
      setPending(false);
    }
  }

  if (!open) {
    return (
      <button className="mt-2 text-sm font-semibold text-indigo-600 outline-none hover:text-indigo-700 focus-visible:ring-2 focus-visible:ring-indigo-500" onClick={() => setOpen(true)} type="button">
        {t("applications.form.cv.uploadInline.openButton")}
      </button>
    );
  }

  return (
    <div className="mt-3 space-y-3 rounded-lg border border-slate-200 p-3">
      {error ? <p className={formStyles.formError}>{error}</p> : null}
      <label className={formStyles.label}>
        {t("cvs.upload.nameLabel")}
        <input className={formStyles.input} maxLength={255} placeholder={t("cvs.upload.namePlaceholder")} ref={nameRef} type="text" />
      </label>
      <label className={formStyles.label}>
        {t("cvs.upload.fileLabel")}
        <input accept="application/pdf,.pdf" className="mt-2 block h-11 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-slate-700" ref={fileRef} type="file" />
      </label>
      <div className="flex gap-2">
        <Button disabled={pending} onClick={handleUpload} type="button">
          {pending ? t("cvs.upload.submittingButton") : t("cvs.upload.submitButton")}
        </Button>
        <Button disabled={pending} onClick={close} type="button" variant="secondary">
          {t("common.actions.cancel")}
        </Button>
      </div>
    </div>
  );
}
