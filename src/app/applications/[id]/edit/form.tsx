"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { updateApplicationAction } from "@/app/applications/[id]/edit/actions";
import { initialUpdateApplicationFormState, type UpdateApplicationFormState } from "@/app/applications/[id]/edit/form-state";
import { Button, ButtonLink, formStyles } from "@/components/form-ui";
import { SourceField, type SourceFieldHandle } from "@/components/source-field";
import { determineCvRejectionPromptOptions } from "@/lib/applications/cv-rejection-prompt";
import { shouldShowRejectionReason } from "@/lib/applications/rejection-reason";

const outcomeOptions = [
  { value: "PENDING", label: "Pending" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "REJECTED", label: "Rejected" },
  { value: "WITHDRAWN", label: "Withdrawn" },
  { value: "OFFER", label: "Offer" },
] as const;

const stageOptions = [
  { value: "APPLICATION", label: "Application" },
  { value: "RECRUITER_SCREENING", label: "Recruiter screening" },
  { value: "HIRING_MANAGER", label: "Hiring manager" },
  { value: "TECHNICAL", label: "Technical" },
  { value: "CHALLENGE", label: "Challenge" },
  { value: "FINAL", label: "Final" },
  { value: "OFFER", label: "Offer" },
] as const;

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
      if (!response.ok) throw new Error(typeof data.error === "string" ? data.error : "Could not unlink the CV. Please try again.");
      closeCvPrompt();
    } catch (unlinkError) {
      setCvPromptError(unlinkError instanceof Error ? unlinkError.message : "Could not unlink the CV. Please try again.");
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
      if (!response.ok) throw new Error(typeof data.error === "string" ? data.error : "Could not delete the CV. Please try again.");
      closeCvPrompt();
    } catch (deleteError) {
      setCvPromptError(deleteError instanceof Error ? deleteError.message : "Could not delete the CV. Please try again.");
    } finally {
      setCvPromptBusy(false);
    }
  }

  return (
    <>
      <form action={formAction} className="space-y-5" id="application-form">
      {state.formError ? <p className={formStyles.formError}>{state.formError}</p> : null}

      <section className={formStyles.section}>
        <h2 className={formStyles.sectionTitle}>Basic information</h2>
        <p className={formStyles.sectionDescription}>Keep the core role information accurate and easy to scan.</p>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Field label="Company" name="company" required state={state} values={values} />
          <Field label="Role" name="role" required state={state} values={values} />
          <Field label="Applied date" name="appliedAt" required state={state} type="date" values={values} />
          <RemoteOnlyField checked={remoteOnly} onChange={setRemoteOnly} />
          {!remoteOnly ? <Field label="Country" name="country" required state={state} values={values} /> : null}
          {!remoteOnly ? <Field label="City" name="city" state={state} values={values} /> : null}
          <Field label="Work mode" name="workMode" state={state} values={values} />
          <SourceField defaultValue={values.source} ref={sourceFieldRef} sources={sources} />
          <Field label="Vacancy URL" name="vacancyUrl" state={state} type="url" values={values} />
          <Field label="Role category" name="roleCategory" state={state} values={values} />
          <Field label="Seniority" name="seniority" state={state} values={values} />
          <CvSelect cvs={cvs} values={values} state={state} />
        </div>
      </section>

      <section className={formStyles.section}>
        <h2 className={formStyles.sectionTitle}>Job description</h2>
        <p className={formStyles.sectionDescription}>Add or correct the job description used for AI Match. Changing the JD requires re-analysis.</p>
        <div className="mt-5">
          <TextareaField label="Job description" name="jdText" state={state} values={values} />
          <EnrichmentButton
            onRemoteOnlySuggestion={() => {
              if (!remoteOnly) setRemoteOnly(true);
            }}
            sourceFieldRef={sourceFieldRef}
          />
        </div>
      </section>

      <section className={formStyles.section}>
        <h2 className={formStyles.sectionTitle}>Employment details</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Field label="Work authorization" name="workAuthorization" state={state} values={values} />
          <SponsorshipField state={state} values={values} />
          <Field label="Salary min" name="salaryMin" state={state} type="number" values={values} />
          <Field label="Salary max" name="salaryMax" state={state} type="number" values={values} />
          <Field label="Currency" name="currency" state={state} values={values} />
        </div>
      </section>

      <section className={formStyles.section}>
        <h2 className={formStyles.sectionTitle}>Application status</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <SelectField label="Outcome" name="outcome" onChange={(event) => setOutcome(event.target.value)} options={outcomeOptions} state={state} values={values} />
          <SelectField label="Stage" name="stage" options={stageOptions} state={state} values={values} />
          <Field label="Response date" name="responseAt" state={state} type="date" values={values} />
          <TextareaField className="md:col-span-3" label="Stage context" name="stageContext" state={state} values={values} />
          {shouldShowRejectionReason(outcome) ? <TextareaField className="md:col-span-3" label="Rejection reason" name="rejectionReason" state={state} values={values} /> : null}
        </div>
      </section>

      <section className={formStyles.section}>
        <h2 className={formStyles.sectionTitle}>Notes</h2>
        <div className="mt-5">
          <TextareaField label="Notes" name="notes" state={state} values={values} />
        </div>
      </section>

      <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
        <ButtonLink href={`/applications/${applicationId}`} variant="secondary">Cancel</ButtonLink>
        <Button disabled={pending} type="submit">{pending ? "Saving..." : "Save changes"}</Button>
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
        <h2 className="text-base font-semibold text-slate-950" id="cv-rejection-title">This application was marked Rejected</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">What should happen to the CV attached to it?</p>
        {error ? <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
        <div className="mt-5 flex flex-col gap-2">
          <button
            className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 outline-none transition hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={busy}
            onClick={onKeep}
            type="button"
          >
            Keep the CV
          </button>
          <button
            className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 outline-none transition hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={busy}
            onClick={onUnlink}
            type="button"
          >
            {busy ? "Working..." : "Unlink from this application"}
          </button>
          <button
            className="inline-flex min-h-10 flex-col items-center justify-center gap-0.5 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white outline-none transition hover:bg-red-700 focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
            disabled={busy || !options.deletePermanently.available}
            onClick={onDelete}
            type="button"
          >
            <span>{busy ? "Working..." : "Delete permanently"}</span>
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
      CV used
      <select className={formStyles.input} defaultValue={values.cvDocumentId ?? ""} name="cvDocumentId">
        <option value="">No CV selected</option>
        {cvs.map((cv) => <option key={cv.id} value={cv.id}>{cv.name}</option>)}
      </select>
      {values.legacyCvVersion ? <span className="mt-2 block text-xs text-slate-500">Legacy CV value: {values.legacyCvVersion}</span> : null}
      {cvs.length === 0 ? <span className="mt-2 block text-xs text-slate-500">No CVs uploaded yet. <a className="font-semibold text-indigo-600 hover:text-indigo-700" href="/cvs">Upload a CV</a> to enable AI Match.</span> : null}
      {error ? <span className={formStyles.error}>{error}</span> : null}
    </label>
  );
}

function SponsorshipField({ state, values }: { state: UpdateApplicationFormState; values: EditDefaults }) {
  const error = getError(state, "sponsorshipRequired");
  return <label className={formStyles.label}>Sponsorship required<select className={formStyles.input} defaultValue={values.sponsorshipRequired ?? "unknown"} name="sponsorshipRequired"><option value="unknown">Unknown</option><option value="false">No</option><option value="true">Yes</option></select>{error ? <span className={formStyles.error}>{error}</span> : null}</label>;
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
      Remote only
    </label>
  );
}

function EnrichmentButton({ sourceFieldRef, onRemoteOnlySuggestion }: { sourceFieldRef: React.RefObject<SourceFieldHandle | null>; onRemoteOnlySuggestion: () => void }) {
  async function extractDetails() {
    const form = document.getElementById("application-form");
    if (!(form instanceof HTMLFormElement)) return;
    const formData = new FormData(form);
    const response = await fetch("/api/ai/application-enrichment", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(formData.entries())) });
    if (!response.ok) return;
    const data = await response.json() as { suggestions: Record<string, string | number | boolean | null> };
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
      const field = form.elements.namedItem(name);
      if (field instanceof HTMLInputElement || field instanceof HTMLSelectElement || field instanceof HTMLTextAreaElement) {
        if (field.value.trim() === "") field.value = String(value);
      }
    }
  }

  return <button className="mt-3 text-sm font-semibold text-indigo-600 outline-none hover:text-indigo-700 focus-visible:ring-2 focus-visible:ring-indigo-500" onClick={extractDetails} type="button">Extract details from JD</button>;
}

function Field({ state, values, label, name, ...props }: { state: UpdateApplicationFormState; values: NonNullable<UpdateApplicationFormState["values"]>; label: string; name: FieldName } & Omit<React.InputHTMLAttributes<HTMLInputElement>, "defaultValue" | "name">) {
  const error = getError(state, name);
  return <label className={formStyles.label}>{label}{props.required ? <span className="text-red-600"> *</span> : null}<input className={formStyles.input} defaultValue={values[name] ?? ""} name={name} {...props} />{error ? <span className={formStyles.error}>{error}</span> : null}</label>;
}

function SelectField({ state, values, label, name, options, onChange }: { state: UpdateApplicationFormState; values: NonNullable<UpdateApplicationFormState["values"]>; label: string; name: FieldName; options: readonly { value: string; label: string }[]; onChange?: React.ChangeEventHandler<HTMLSelectElement> }) {
  const error = getError(state, name);
  return <label className={formStyles.label}>{label}<select className={formStyles.input} defaultValue={values[name] ?? ""} name={name} onChange={onChange}><option value="">Select...</option>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>{error ? <span className={formStyles.error}>{error}</span> : null}</label>;
}

function TextareaField({ state, values, label, name, className = "" }: { state: UpdateApplicationFormState; values: NonNullable<UpdateApplicationFormState["values"]>; label: string; name: FieldName; className?: string }) {
  const error = getError(state, name);
  return <label className={`${formStyles.label} ${className}`}>{label}<textarea className={formStyles.textarea} defaultValue={values[name] ?? ""} name={name} />{error ? <span className={formStyles.error}>{error}</span> : null}</label>;
}

function getError(state: UpdateApplicationFormState, name: FieldName) {
  return state.errors?.[name]?.[0];
}
