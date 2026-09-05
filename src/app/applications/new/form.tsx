"use client";

import { useActionState } from "react";
import { createApplicationAction } from "@/app/applications/new/actions";
import { initialCreateApplicationFormState, type CreateApplicationFormState } from "@/app/applications/new/form-state";
import { Button, ButtonLink, formStyles } from "@/components/form-ui";

const matchOptions = [
  { value: "A_STRONG", label: "Strong" },
  { value: "B_STRETCH", label: "Stretch" },
  { value: "C_LONG_SHOT", label: "Long shot" },
] as const;

type FieldName = NonNullable<CreateApplicationFormState["values"]> extends Partial<Record<infer Key, string>> ? Key : never;
type CvOption = { id: string; name: string };

export function NewApplicationForm({ today, cvs }: { today: string; cvs: CvOption[] }) {
  const [state, formAction, pending] = useActionState(createApplicationAction, initialCreateApplicationFormState);

  return (
    <form action={formAction} className="space-y-5" id="application-form">
      {state.formError ? <p className={formStyles.formError}>{state.formError}</p> : null}

      <section className={formStyles.section}>
        <h2 className={formStyles.sectionTitle}>Basic information</h2>
        <p className={formStyles.sectionDescription}>The minimum details needed to identify this application.</p>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Field state={state} label="Company" name="company" required placeholder="Acme GmbH" />
          <Field state={state} label="Role" name="role" required placeholder="Senior Frontend Engineer" />
          <Field state={state} label="Applied date" name="appliedAt" required type="date" defaultValue={today} />
          <Field state={state} label="Country" name="country" placeholder="Germany" />
          <Field state={state} label="Work mode" name="workMode" placeholder="Remote" />
          <Field state={state} label="Source" name="source" placeholder="LinkedIn" />
          <Field state={state} label="Vacancy URL" name="vacancyUrl" placeholder="https://example.com/jobs/123" type="url" />
          <Field state={state} label="Role category" name="roleCategory" placeholder="Frontend" />
          <Field state={state} label="Seniority" name="seniority" placeholder="Senior" />
          <CvSelect cvs={cvs} state={state} />
        </div>
      </section>

      <section className={formStyles.section}>
        <h2 className={formStyles.sectionTitle}>Job description</h2>
        <p className={formStyles.sectionDescription}>Paste the job description so JobHolmes can extract role details and compare the position against your selected CV.</p>
        <div className="mt-5">
          <TextareaField label="Job description" name="jdText" placeholder="Paste the full job description here..." state={state} />
          <EnrichmentButton />
        </div>
      </section>

      <section className={formStyles.section}>
        <h2 className={formStyles.sectionTitle}>Match assessment</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <SelectField label="Match class" name="userMatchClass" options={matchOptions} state={state} />
          <Field state={state} label="Match percentage" max="100" min="0" name="userMatchPercentage" placeholder="75" type="number" />
          <TextareaField className="md:col-span-2" label="Requirements and gaps" name="requirementsAndGaps" placeholder="Key requirements, missing skills, concerns..." state={state} />
        </div>
      </section>

      <section className={formStyles.section}>
        <h2 className={formStyles.sectionTitle}>Employment details</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Field state={state} label="Work authorization" name="workAuthorization" placeholder="EU citizen" />
          <SponsorshipField state={state} />
          <Field state={state} label="Salary min" name="salaryMin" placeholder="70000" type="number" />
          <Field state={state} label="Salary max" name="salaryMax" placeholder="90000" type="number" />
          <Field state={state} label="Currency" name="currency" placeholder="EUR" />
        </div>
      </section>

      <section className={formStyles.section}>
        <h2 className={formStyles.sectionTitle}>Notes</h2>
        <div className="mt-5">
          <TextareaField label="Notes" name="notes" placeholder="Context, recruiter notes, next steps..." state={state} />
        </div>
      </section>

      <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
        <ButtonLink href="/applications" variant="secondary">Cancel</ButtonLink>
        <Button disabled={pending} type="submit">
          {pending ? "Saving..." : "Add application"}
        </Button>
      </div>
    </form>
  );
}

function CvSelect({ cvs, state }: { cvs: CvOption[]; state: CreateApplicationFormState }) {
  const error = getError(state, "cvDocumentId");

  return (
    <label className={formStyles.label}>
      CV used
      <select className={formStyles.input} defaultValue={state.values?.cvDocumentId ?? ""} name="cvDocumentId">
        <option value="">No CV selected</option>
        {cvs.map((cv) => <option key={cv.id} value={cv.id}>{cv.name}</option>)}
      </select>
      {cvs.length === 0 ? <span className="mt-2 block text-xs text-slate-500">No CVs uploaded yet. <a className="font-semibold text-indigo-600 hover:text-indigo-700" href="/cvs">Upload a CV</a> to enable AI Match.</span> : null}
      {error ? <span className={formStyles.error}>{error}</span> : null}
    </label>
  );
}

function SponsorshipField({ state }: { state: CreateApplicationFormState }) {
  const error = getError(state, "sponsorshipRequired");

  return (
    <label className={formStyles.label}>
      Sponsorship required
      <select className={formStyles.input} defaultValue={state.values?.sponsorshipRequired ?? "unknown"} name="sponsorshipRequired">
        <option value="unknown">Unknown</option>
        <option value="false">No</option>
        <option value="true">Yes</option>
      </select>
      {error ? <span className={formStyles.error}>{error}</span> : null}
    </label>
  );
}

function EnrichmentButton() {
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

function SelectField({
  state,
  label,
  name,
  options,
  defaultValue = "",
}: {
  state: CreateApplicationFormState;
  label: string;
  name: FieldName;
  options: readonly { value: string; label: string }[];
  defaultValue?: string;
}) {
  const error = getError(state, name);

  return (
    <label className={formStyles.label}>
      {label}
      <select className={formStyles.input} defaultValue={state.values?.[name] ?? defaultValue} name={name}>
        <option value="">Select...</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
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
