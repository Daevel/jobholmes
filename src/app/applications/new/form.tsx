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

type FieldName = NonNullable<CreateApplicationFormState["values"]> extends Partial<Record<infer Key, string>> ? Key : never;

export function NewApplicationForm({ today }: { today: string }) {
  const [state, formAction, pending] = useActionState(createApplicationAction, initialCreateApplicationFormState);

  return (
    <form action={formAction} className="space-y-5">
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
          <Field state={state} label="CV version" name="cvVersion" placeholder="frontend-2026-v1" />
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
          <label className="mt-7 flex h-11 items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700">
            <input
              className="h-4 w-4 accent-indigo-600"
              defaultChecked={state.values?.sponsorshipRequired === "on" || state.values?.sponsorshipRequired === "true"}
              name="sponsorshipRequired"
              type="checkbox"
            />
            Sponsorship required
          </label>
          <Field state={state} label="Salary min" name="salaryMin" placeholder="70000" type="number" />
          <Field state={state} label="Salary max" name="salaryMax" placeholder="90000" type="number" />
          <Field state={state} label="Currency" name="currency" placeholder="EUR" />
        </div>
      </section>

      <section className={formStyles.section}>
        <h2 className={formStyles.sectionTitle}>Application status</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <SelectField defaultValue="PENDING" label="Outcome" name="outcome" options={outcomeOptions} state={state} />
          <SelectField defaultValue="APPLICATION" label="Stage" name="stage" options={stageOptions} state={state} />
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
