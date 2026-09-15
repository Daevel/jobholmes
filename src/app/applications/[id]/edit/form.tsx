"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { updateApplicationAction } from "@/app/applications/[id]/edit/actions";
import { initialUpdateApplicationFormState, type UpdateApplicationFormState } from "@/app/applications/[id]/edit/form-state";
import { Button, ButtonLink, formStyles } from "@/components/form-ui";
import { SourceField, type SourceFieldHandle } from "@/components/source-field";
import { determineCvRejectionPromptOptions } from "@/lib/applications/cv-rejection-prompt";
import { outcomeLabels, stageLabels } from "@/lib/applications/display";
import { shouldShowRejectionReason } from "@/lib/applications/rejection-reason";
import { t } from "@/lib/i18n/translate";

// Reuses the i18n-sourced labels from display.ts instead of duplicating this exact enum/label
// pairing a second time — order matches stageLabels/outcomeLabels (same order used for sorting).
const outcomeOptions = Object.entries(outcomeLabels).map(([value, label]) => ({ value, label }));
const stageOptions = Object.entries(stageLabels).map(([value, label]) => ({ value, label }));

type FieldName = NonNullable<UpdateApplicationFormState["values"]> extends Partial<Record<infer Key, string>> ? Key : never;
type CvOption = { id: string; name: string };
type EditDefaults = NonNullable<UpdateApplicationFormState["values"]> & { legacyCvVersion?: string };

export function EditApplicationForm({ applicationId, defaults, cvs, sources }: { applicationId: string; defaults: EditDefaults; cvs: CvOption[]; sources: string[] }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(updateApplicationAction.bind(null, applicationId), initialUpdateApplicationFormState);
  const values = state.values ?? defaults;
  const [outcome, setOutcome] = useState(values.outcome ?? "");
  const sourceFieldRef = useRef<SourceFieldHandle>(null);
  const [remoteOnly, setRemoteOnly] = useState(values.remoteOnly === "true" || values.remoteOnly === "on");

  const [cvPrompt, setCvPrompt] = useState<{ cvDocumentId: string; otherApplicationsUsingCv: number } | null>(null);
  const [cvPromptBusy, setCvPromptBusy] = useState(false);
  const [cvPromptError, setCvPromptError] = useState<string | null>(null);

  useEffect(() => {
    if (state.cvRejectionPrompt) setCvPrompt(state.cvRejectionPrompt);
  }, [state.cvRejectionPrompt]);

  useEffect(() => {
    if (!cvPrompt) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !cvPromptBusy) closeCvPrompt();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [cvPrompt, cvPromptBusy]);

  function closeCvPrompt() {
    setCvPrompt(null);
    setCvPromptError(null);
    router.push(`/applications/${applicationId}`);
  }

  async function handleUnlinkCv() {
    if (!cvPrompt || cvPromptBusy) return;
    setCvPromptBusy(true);
    setCvPromptError(null);

    try {
      const response = await fetch(`/api/applications/${applicationId}/unlink-cv`, { method: "POST" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(typeof data.error === "string" ? data.error : t("applications.edit.errors.unlinkCvFailed"));
      closeCvPrompt();
    } catch (unlinkError) {
      setCvPromptError(unlinkError instanceof Error ? unlinkError.message : t("applications.edit.errors.unlinkCvFailed"));
    } finally {
      setCvPromptBusy(false);
    }
  }

  async function handleDeleteCv() {
    if (!cvPrompt || cvPromptBusy) return;
    setCvPromptBusy(true);
    setCvPromptError(null);

    try {
      const response = await fetch(`/api/cvs/${cvPrompt.cvDocumentId}`, { method: "DELETE" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(typeof data.error === "string" ? data.error : t("applications.edit.errors.deleteCvFailed"));
      closeCvPrompt();
    } catch (deleteError) {
      setCvPromptError(deleteError instanceof Error ? deleteError.message : t("applications.edit.errors.deleteCvFailed"));
    } finally {
      setCvPromptBusy(false);
    }
  }

  return (
    <>
      <form action={formAction} className="space-y-5" id="application-form">
      {state.formError ? <p className={formStyles.formError}>{state.formError}</p> : null}

      <section className={formStyles.section}>
        <h2 className={formStyles.sectionTitle}>{t("applications.form.sections.basicInfo.title")}</h2>
        <p className={formStyles.sectionDescription}>{t("applications.edit.sections.basicInfo.description")}</p>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Field label={t("applications.form.company.label")} name="company" required state={state} values={values} />
          <Field label={t("applications.form.role.label")} name="role" required state={state} values={values} />
          <Field label={t("applications.form.appliedDate.label")} name="appliedAt" required state={state} type="date" values={values} />
          <RemoteOnlyField checked={remoteOnly} onChange={setRemoteOnly} />
          {!remoteOnly ? <Field label={t("applications.form.country.label")} name="country" required state={state} values={values} /> : null}
          {!remoteOnly ? <Field label={t("applications.form.city.label")} name="city" state={state} values={values} /> : null}
          {!remoteOnly ? <Field label={t("applications.form.workMode.label")} name="workMode" state={state} values={values} /> : null}
          <SourceField defaultValue={values.source} ref={sourceFieldRef} sources={sources} />
          <Field label={t("applications.form.vacancyUrl.label")} name="vacancyUrl" state={state} type="url" values={values} />
          <Field label={t("applications.form.roleCategory.label")} name="roleCategory" state={state} values={values} />
          <Field label={t("applications.form.seniority.label")} name="seniority" state={state} values={values} />
          <CvSelect cvs={cvs} values={values} state={state} />
        </div>
      </section>

      <section className={formStyles.section}>
        <h2 className={formStyles.sectionTitle}>{t("applications.form.sections.jobDescription.title")}</h2>
        <p className={formStyles.sectionDescription}>{t("applications.edit.sections.jobDescription.description")}</p>
        <div className="mt-5">
          <TextareaField label={t("applications.form.jobDescription.label")} name="jdText" state={state} values={values} />
          <EnrichmentButton
            onRemoteOnlySuggestion={() => {
              if (!remoteOnly) setRemoteOnly(true);
            }}
            remoteOnly={remoteOnly}
            sourceFieldRef={sourceFieldRef}
          />
        </div>
      </section>

      <section className={formStyles.section}>
        <h2 className={formStyles.sectionTitle}>{t("applications.form.sections.employmentDetails.title")}</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Field label={t("applications.form.workAuthorization.label")} name="workAuthorization" state={state} values={values} />
          <SponsorshipField state={state} values={values} />
          <Field label={t("applications.form.salaryMin.label")} name="salaryMin" state={state} type="number" values={values} />
          <Field label={t("applications.form.salaryMax.label")} name="salaryMax" state={state} type="number" values={values} />
          <Field label={t("applications.form.currency.label")} name="currency" state={state} values={values} />
        </div>
      </section>

      <section className={formStyles.section}>
        <h2 className={formStyles.sectionTitle}>{t("applications.edit.sections.applicationStatus.title")}</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <SelectField label={t("applications.form.outcome.label")} name="outcome" onChange={(event) => setOutcome(event.target.value)} options={outcomeOptions} state={state} values={values} />
          <SelectField label={t("applications.form.stage.label")} name="stage" options={stageOptions} state={state} values={values} />
          <Field label={t("applications.form.responseDate.label")} name="responseAt" state={state} type="date" values={values} />
          <TextareaField className="md:col-span-3" label={t("applications.form.stageContext.label")} name="stageContext" state={state} values={values} />
          {shouldShowRejectionReason(outcome) ? <TextareaField className="md:col-span-3" label={t("applications.form.rejectionReason.label")} name="rejectionReason" state={state} values={values} /> : null}
        </div>
      </section>

      <section className={formStyles.section}>
        <h2 className={formStyles.sectionTitle}>{t("applications.sections.notes.title")}</h2>
        <div className="mt-5">
          <TextareaField label={t("applications.sections.notes.title")} name="notes" state={state} values={values} />
        </div>
      </section>

      <section className={formStyles.section}>
        <h2 className={formStyles.sectionTitle}>{t("applications.form.coverLetter.label")}</h2>
        <div className="mt-5">
          <TextareaField label={t("applications.form.coverLetter.label")} name="coverLetter" state={state} values={values} />
        </div>
      </section>

      <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
        <ButtonLink href={`/applications/${applicationId}`} variant="secondary">{t("common.actions.cancel")}</ButtonLink>
        <Button disabled={pending} type="submit">{pending ? t("common.actions.saving") : t("applications.edit.submitButton")}</Button>
      </div>
    </form>

    {cvPrompt ? (
      <CvRejectionDialog
        busy={cvPromptBusy}
        error={cvPromptError}
        onDismiss={closeCvPrompt}
        onDelete={handleDeleteCv}
        onKeep={closeCvPrompt}
        onUnlink={handleUnlinkCv}
        options={determineCvRejectionPromptOptions({ otherApplicationsUsingCv: cvPrompt.otherApplicationsUsingCv })}
      />
    ) : null}
    </>
  );
}

function CvRejectionDialog({
  busy,
  error,
  onDismiss,
  onDelete,
  onKeep,
  onUnlink,
  options,
}: {
  busy: boolean;
  error: string | null;
  onDismiss: () => void;
  onDelete: () => void;
  onKeep: () => void;
  onUnlink: () => void;
  options: ReturnType<typeof determineCvRejectionPromptOptions>;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4"
      onClick={() => {
        if (!busy) onDismiss();
      }}
    >
      <div
        aria-labelledby="cv-rejection-title"
        aria-modal="true"
        className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-5 shadow-xl"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        <h2 className="text-base font-semibold text-slate-950" id="cv-rejection-title">{t("applications.edit.cvRejection.title")}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">{t("applications.edit.cvRejection.description")}</p>
        {error ? <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
        <div className="mt-5 flex flex-col gap-2">
          <button
            className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 outline-none transition hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={busy}
            onClick={onKeep}
            type="button"
          >
            {t("applications.edit.cvRejection.keep")}
          </button>
          <button
            className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 outline-none transition hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={busy}
            onClick={onUnlink}
            type="button"
          >
            {busy ? t("applications.edit.cvRejection.working") : t("applications.edit.cvRejection.unlink")}
          </button>
          <button
            className="inline-flex min-h-10 flex-col items-center justify-center gap-0.5 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white outline-none transition hover:bg-red-700 focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
            disabled={busy || !options.deletePermanently.available}
            onClick={onDelete}
            type="button"
          >
            <span>{busy ? t("applications.edit.cvRejection.working") : t("applications.edit.cvRejection.deletePermanently")}</span>
            {!options.deletePermanently.available && options.deletePermanently.disabledReason ? (
              <span className="text-xs font-normal">{options.deletePermanently.disabledReason}</span>
            ) : null}
          </button>
        </div>
      </div>
    </div>
  );
}

function CvSelect({ cvs, state, values }: { cvs: CvOption[]; state: UpdateApplicationFormState; values: EditDefaults }) {
  const error = getError(state, "cvDocumentId");

  return (
    <label className={formStyles.label}>
      {t("applications.form.cv.label")}
      <select className={formStyles.input} defaultValue={values.cvDocumentId ?? ""} name="cvDocumentId">
        <option value="">{t("applications.form.cv.noneOption")}</option>
        {cvs.map((cv) => <option key={cv.id} value={cv.id}>{cv.name}</option>)}
      </select>
      {values.legacyCvVersion ? <span className="mt-2 block text-xs text-slate-500">{t("applications.form.cv.legacyValuePrefix")} {values.legacyCvVersion}</span> : null}
      {cvs.length === 0 ? <span className="mt-2 block text-xs text-slate-500">{t("applications.form.cv.noCvsUploadedPrefix")} <a className="font-semibold text-indigo-600 hover:text-indigo-700" href="/cvs">{t("applications.form.cv.uploadCvLinkText")}</a> {t("applications.form.cv.uploadCvSuffix")}</span> : null}
      {error ? <span className={formStyles.error}>{error}</span> : null}
    </label>
  );
}

function SponsorshipField({ state, values }: { state: UpdateApplicationFormState; values: EditDefaults }) {
  const error = getError(state, "sponsorshipRequired");
  return <label className={formStyles.label}>{t("applications.form.sponsorship.label")}<select className={formStyles.input} defaultValue={values.sponsorshipRequired ?? "unknown"} name="sponsorshipRequired"><option value="unknown">{t("applications.form.sponsorship.options.unknown")}</option><option value="false">{t("applications.form.sponsorship.options.no")}</option><option value="true">{t("applications.form.sponsorship.options.yes")}</option></select>{error ? <span className={formStyles.error}>{error}</span> : null}</label>;
}

function RemoteOnlyField({ checked, onChange }: { checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 self-end pb-2.5 text-sm font-medium text-slate-700">
      <input
        checked={checked}
        className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus-visible:ring-2 focus-visible:ring-indigo-500"
        name="remoteOnly"
        onChange={(event) => onChange(event.target.checked)}
        type="checkbox"
      />
      {t("applications.form.remoteOnly.label")}
    </label>
  );
}

function EnrichmentButton({ sourceFieldRef, onRemoteOnlySuggestion, remoteOnly }: { sourceFieldRef: React.RefObject<SourceFieldHandle | null>; onRemoteOnlySuggestion: () => void; remoteOnly: boolean }) {
  async function extractDetails() {
    const form = document.getElementById("application-form");
    if (!(form instanceof HTMLFormElement)) return;
    const formData = new FormData(form);
    const response = await fetch("/api/ai/application-enrichment", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(formData.entries())) });
    if (!response.ok) return;
    const data = await response.json() as { suggestions: Record<string, string | number | boolean | null> };
    const becomesRemoteOnly = remoteOnly || data.suggestions.remoteOnly === true;
    for (const [name, value] of Object.entries(data.suggestions)) {
      if (value === null || value === undefined || value === "") continue;
      if (name === "source") {
        sourceFieldRef.current?.applySuggestion(String(value));
        continue;
      }
      if (name === "remoteOnly") {
        if (value === true) onRemoteOnlySuggestion();
        continue;
      }
      // Remote-only applications have no work mode - a suggestion for it is stale/inconsistent
      // with the same-response (or already-set) remoteOnly, so it's dropped rather than applied.
      if (name === "workMode" && becomesRemoteOnly) continue;
      const field = form.elements.namedItem(name);
      if (field instanceof HTMLInputElement || field instanceof HTMLSelectElement || field instanceof HTMLTextAreaElement) {
        if (field.value.trim() === "") field.value = String(value);
      }
    }
  }

  return <button className="mt-3 text-sm font-semibold text-indigo-600 outline-none hover:text-indigo-700 focus-visible:ring-2 focus-visible:ring-indigo-500" onClick={extractDetails} type="button">{t("applications.form.enrichment.buttonLabel")}</button>;
}

function Field({ state, values, label, name, ...props }: { state: UpdateApplicationFormState; values: NonNullable<UpdateApplicationFormState["values"]>; label: string; name: FieldName } & Omit<React.InputHTMLAttributes<HTMLInputElement>, "defaultValue" | "name">) {
  const error = getError(state, name);
  return <label className={formStyles.label}>{label}{props.required ? <span className="text-red-600"> *</span> : null}<input className={formStyles.input} defaultValue={values[name] ?? ""} name={name} {...props} />{error ? <span className={formStyles.error}>{error}</span> : null}</label>;
}

function SelectField({ state, values, label, name, options, onChange }: { state: UpdateApplicationFormState; values: NonNullable<UpdateApplicationFormState["values"]>; label: string; name: FieldName; options: readonly { value: string; label: string }[]; onChange?: React.ChangeEventHandler<HTMLSelectElement> }) {
  const error = getError(state, name);
  return <label className={formStyles.label}>{label}<select className={formStyles.input} defaultValue={values[name] ?? ""} name={name} onChange={onChange}><option value="">{t("applications.form.selectPlaceholder")}</option>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>{error ? <span className={formStyles.error}>{error}</span> : null}</label>;
}

function TextareaField({ state, values, label, name, className = "" }: { state: UpdateApplicationFormState; values: NonNullable<UpdateApplicationFormState["values"]>; label: string; name: FieldName; className?: string }) {
  const error = getError(state, name);
  return <label className={`${formStyles.label} ${className}`}>{label}<textarea className={formStyles.textarea} defaultValue={values[name] ?? ""} name={name} />{error ? <span className={formStyles.error}>{error}</span> : null}</label>;
}

function getError(state: UpdateApplicationFormState, name: FieldName) {
  return state.errors?.[name]?.[0];
}
