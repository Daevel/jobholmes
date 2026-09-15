"use client";

import { useActionState, useRef, useState } from "react";
import { createApplicationAction } from "@/app/applications/new/actions";
import { initialCreateApplicationFormState, type CreateApplicationFormState } from "@/app/applications/new/form-state";
import { Button, ButtonLink, formStyles } from "@/components/form-ui";
import { SourceField, type SourceFieldHandle } from "@/components/source-field";
import { t } from "@/lib/i18n/translate";

type FieldName = NonNullable<CreateApplicationFormState["values"]> extends Partial<Record<infer Key, string>> ? Key : never;
type CvOption = { id: string; name: string };

export function NewApplicationForm({ today, cvs, sources }: { today: string; cvs: CvOption[]; sources: string[] }) {
  const [state, formAction, pending] = useActionState(createApplicationAction, initialCreateApplicationFormState);
  const sourceFieldRef = useRef<SourceFieldHandle>(null);
  const [remoteOnly, setRemoteOnly] = useState(false);

  return (
    <form action={formAction} className="space-y-5" id="application-form">
      {state.formError ? <p className={formStyles.formError}>{state.formError}</p> : null}

      <section className={formStyles.section}>
        <h2 className={formStyles.sectionTitle}>{t("applications.form.sections.basicInfo.title")}</h2>
        <p className={formStyles.sectionDescription}>{t("applications.new.sections.basicInfo.description")}</p>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Field state={state} label={t("applications.form.company.label")} name="company" required placeholder={t("applications.form.company.placeholder")} />
          <Field state={state} label={t("applications.form.role.label")} name="role" required placeholder={t("applications.form.role.placeholder")} />
          <Field state={state} label={t("applications.form.appliedDate.label")} name="appliedAt" required type="date" defaultValue={today} />
          <RemoteOnlyField checked={remoteOnly} onChange={setRemoteOnly} />
          {!remoteOnly ? <Field state={state} label={t("applications.form.country.label")} name="country" required placeholder={t("applications.form.country.placeholder")} /> : null}
          {!remoteOnly ? <Field state={state} label={t("applications.form.city.label")} name="city" placeholder={t("applications.form.city.placeholder")} /> : null}
          {!remoteOnly ? <Field state={state} label={t("applications.form.workMode.label")} name="workMode" placeholder={t("applications.form.workMode.placeholder")} /> : null}
          <SourceField defaultValue={state.values?.source} ref={sourceFieldRef} sources={sources} />
          <Field state={state} label={t("applications.form.vacancyUrl.label")} name="vacancyUrl" placeholder={t("applications.form.vacancyUrl.placeholder")} type="url" />
          <Field state={state} label={t("applications.form.roleCategory.label")} name="roleCategory" placeholder={t("applications.form.roleCategory.placeholder")} />
          <Field state={state} label={t("applications.form.seniority.label")} name="seniority" placeholder={t("applications.form.seniority.placeholder")} />
          <CvSelect cvs={cvs} state={state} />
        </div>
      </section>

      <section className={formStyles.section}>
        <h2 className={formStyles.sectionTitle}>{t("applications.form.sections.jobDescription.title")}</h2>
        <p className={formStyles.sectionDescription}>{t("applications.new.sections.jobDescription.description")}</p>
        <div className="mt-5">
          <TextareaField label={t("applications.form.jobDescription.label")} name="jdText" placeholder={t("applications.form.jobDescription.placeholder")} state={state} />
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
          <Field state={state} label={t("applications.form.workAuthorization.label")} name="workAuthorization" placeholder={t("applications.form.workAuthorization.placeholder")} />
          <SponsorshipField state={state} />
          <Field state={state} label={t("applications.form.salaryMin.label")} name="salaryMin" placeholder={t("applications.form.salaryMin.placeholder")} type="number" />
          <Field state={state} label={t("applications.form.salaryMax.label")} name="salaryMax" placeholder={t("applications.form.salaryMax.placeholder")} type="number" />
          <Field state={state} label={t("applications.form.currency.label")} name="currency" placeholder={t("applications.form.currency.placeholder")} />
        </div>
      </section>

      <section className={formStyles.section}>
        <h2 className={formStyles.sectionTitle}>{t("applications.new.sections.applicationContext.title")}</h2>
        <p className={formStyles.sectionDescription}>{t("applications.new.sections.applicationContext.description")}</p>
        <div className="mt-5">
          <TextareaField label={t("applications.form.stageContext.label")} name="stageContext" placeholder={t("applications.form.stageContext.placeholder")} state={state} />
        </div>
      </section>

      <section className={formStyles.section}>
        <h2 className={formStyles.sectionTitle}>{t("applications.sections.notes.title")}</h2>
        <div className="mt-5">
          <TextareaField label={t("applications.sections.notes.title")} name="notes" placeholder={t("applications.form.notes.placeholder")} state={state} />
        </div>
      </section>

      <section className={formStyles.section}>
        <h2 className={formStyles.sectionTitle}>{t("applications.form.coverLetter.label")}</h2>
        <div className="mt-5">
          <TextareaField label={t("applications.form.coverLetter.label")} name="coverLetter" placeholder={t("applications.form.coverLetter.placeholder")} state={state} />
        </div>
      </section>

      <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
        <ButtonLink href="/applications" variant="secondary">{t("common.actions.cancel")}</ButtonLink>
        <Button disabled={pending} type="submit">
          {pending ? t("common.actions.saving") : t("applications.new.submitButton")}
        </Button>
      </div>
    </form>
  );
}

function CvSelect({ cvs, state }: { cvs: CvOption[]; state: CreateApplicationFormState }) {
  const error = getError(state, "cvDocumentId");

  return (
    <label className={formStyles.label}>
      {t("applications.form.cv.label")}
      <select className={formStyles.input} defaultValue={state.values?.cvDocumentId ?? ""} name="cvDocumentId">
        <option value="">{t("applications.form.cv.noneOption")}</option>
        {cvs.map((cv) => <option key={cv.id} value={cv.id}>{cv.name}</option>)}
      </select>
      {cvs.length === 0 ? <span className="mt-2 block text-xs text-slate-500">{t("applications.form.cv.noCvsUploadedPrefix")} <a className="font-semibold text-indigo-600 hover:text-indigo-700" href="/cvs">{t("applications.form.cv.uploadCvLinkText")}</a> {t("applications.form.cv.uploadCvSuffix")}</span> : null}
      {error ? <span className={formStyles.error}>{error}</span> : null}
    </label>
  );
}

function SponsorshipField({ state }: { state: CreateApplicationFormState }) {
  const error = getError(state, "sponsorshipRequired");

  return (
    <label className={formStyles.label}>
      {t("applications.form.sponsorship.label")}
      <select className={formStyles.input} defaultValue={state.values?.sponsorshipRequired ?? "unknown"} name="sponsorshipRequired">
        <option value="unknown">{t("applications.form.sponsorship.options.unknown")}</option>
        <option value="false">{t("applications.form.sponsorship.options.no")}</option>
        <option value="true">{t("applications.form.sponsorship.options.yes")}</option>
      </select>
      {error ? <span className={formStyles.error}>{error}</span> : null}
    </label>
  );
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
    const response = await fetch("/api/ai/application-enrichment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(formData.entries())),
    });
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

function Field({
  state,
  label,
  name,
  defaultValue = "",
  ...props
}: {
  state: CreateApplicationFormState;
  label: string;
  name: FieldName;
  defaultValue?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "defaultValue" | "name">) {
  const error = getError(state, name);

  return (
    <label className={formStyles.label}>
      {label}{props.required ? <span className="text-red-600"> *</span> : null}
      <input className={formStyles.input} defaultValue={state.values?.[name] ?? defaultValue} name={name} {...props} />
      {error ? <span className={formStyles.error}>{error}</span> : null}
    </label>
  );
}

function TextareaField({ state, label, name, placeholder, className = "" }: { state: CreateApplicationFormState; label: string; name: FieldName; placeholder: string; className?: string }) {
  const error = getError(state, name);

  return (
    <label className={`${formStyles.label} ${className}`}>
      {label}
      <textarea className={formStyles.textarea} defaultValue={state.values?.[name] ?? ""} name={name} placeholder={placeholder} />
      {error ? <span className={formStyles.error}>{error}</span> : null}
    </label>
  );
}

function getError(state: CreateApplicationFormState, name: FieldName) {
  return state.errors?.[name]?.[0];
}
