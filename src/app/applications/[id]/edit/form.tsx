"use client";

import { useActionState } from "react";
import { updateApplicationAction } from "@/app/applications/[id]/edit/actions";
import { initialUpdateApplicationFormState, type UpdateApplicationFormState } from "@/app/applications/[id]/edit/form-state";
import { Button, ButtonLink, formStyles } from "@/components/form-ui";

const matchOptions = [
  { value: "A_STRONG", label: "Strong" },
  { value: "B_STRETCH", label: "Stretch" },
  { value: "C_LONG_SHOT", label: "Long shot" },
] as const;

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

export function EditApplicationForm({ applicationId, defaults, cvs }: { applicationId: string; defaults: EditDefaults; cvs: CvOption[] }) {
  const [state, formAction, pending] = useActionState(updateApplicationAction.bind(null, applicationId), initialUpdateApplicationFormState);
  const values = state.values ?? defaults;

  return (
    <form action={formAction} className="space-y-5" id="application-form">
      {state.formError ? <p className={formStyles.formError}>{state.formError}</p> : null}

      <section className={formStyles.section}>
        <h2 className={formStyles.sectionTitle}>Basic information</h2>
        <p className={formStyles.sectionDescription}>Keep the core role information accurate and easy to scan.</p>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Field label="Company" name="company" required state={state} values={values} />
          <Field label="Role" name="role" required state={state} values={values} />
          <Field label="Applied date" name="appliedAt" required state={state} type="date" values={values} />
          <Field label="Country" name="country" state={state} values={values} />
          <Field label="Work mode" name="workMode" state={state} values={values} />
          <Field label="Source" name="source" state={state} values={values} />
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
          <EnrichmentButton />
        </div>
      </section>

      <section className={formStyles.section}>
        <h2 className={formStyles.sectionTitle}>Match assessment</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <SelectField label="Match class" name="userMatchClass" options={matchOptions} state={state} values={values} />
          <Field label="Match percentage" max="100" min="0" name="userMatchPercentage" state={state} type="number" values={values} />
          <TextareaField className="md:col-span-2" label="Requirements and gaps" name="requirementsAndGaps" state={state} values={values} />
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
          <SelectField label="Outcome" name="outcome" options={outcomeOptions} state={state} values={values} />
          <SelectField label="Stage" name="stage" options={stageOptions} state={state} values={values} />
          <Field label="Response date" name="responseAt" state={state} type="date" values={values} />
          <TextareaField className="md:col-span-3" label="Rejection reason" name="rejectionReason" state={state} values={values} />
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

function EnrichmentButton() {
  async function extractDetails() {
    const form = document.getElementById("application-form");
    if (!(form instanceof HTMLFormElement)) return;
    const formData = new FormData(form);
    const response = await fetch("/api/ai/application-enrichment", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(formData.entries())) });
    if (!response.ok) return;
    const data = await response.json() as { suggestions: Record<string, string | number | null> };
    for (const [name, value] of Object.entries(data.suggestions)) {
      if (value === null || value === undefined || value === "") continue;
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

function SelectField({ state, values, label, name, options }: { state: UpdateApplicationFormState; values: NonNullable<UpdateApplicationFormState["values"]>; label: string; name: FieldName; options: readonly { value: string; label: string }[] }) {
  const error = getError(state, name);
  return <label className={formStyles.label}>{label}<select className={formStyles.input} defaultValue={values[name] ?? ""} name={name}><option value="">Select...</option>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>{error ? <span className={formStyles.error}>{error}</span> : null}</label>;
}

function TextareaField({ state, values, label, name, className = "" }: { state: UpdateApplicationFormState; values: NonNullable<UpdateApplicationFormState["values"]>; label: string; name: FieldName; className?: string }) {
  const error = getError(state, name);
  return <label className={`${formStyles.label} ${className}`}>{label}<textarea className={formStyles.textarea} defaultValue={values[name] ?? ""} name={name} />{error ? <span className={formStyles.error}>{error}</span> : null}</label>;
}

function getError(state: UpdateApplicationFormState, name: FieldName) {
  return state.errors?.[name]?.[0];
}
