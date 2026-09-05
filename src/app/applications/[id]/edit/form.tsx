"use client";

import { useActionState } from "react";
import { updateApplicationAction } from "@/app/applications/[id]/edit/actions";
import { initialUpdateApplicationFormState, type UpdateApplicationFormState } from "@/app/applications/[id]/edit/form-state";

const matchOptions = [
  { value: "A_STRONG", label: "Strong" },
  { value: "B_STRETCH", label: "Stretch" },
  { value: "C_LONG_SHOT", label: "Long-shot" },
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

const inputClass =
  "mt-2 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-zinc-500";
const labelClass = "text-sm font-medium text-zinc-300";
const sectionClass = "rounded-2xl border border-zinc-800 bg-zinc-900/45 p-5";

type FieldName = NonNullable<UpdateApplicationFormState["values"]> extends Partial<Record<infer Key, string>> ? Key : never;

export function EditApplicationForm({ applicationId, defaults }: { applicationId: string; defaults: NonNullable<UpdateApplicationFormState["values"]> }) {
  const [state, formAction, pending] = useActionState(updateApplicationAction.bind(null, applicationId), initialUpdateApplicationFormState);
  const values = state.values ?? defaults;

  return (
    <form action={formAction} className="space-y-5">
      {state.formError ? <p className="rounded-xl border border-red-900/70 bg-red-950/30 px-4 py-3 text-sm text-red-200">{state.formError}</p> : null}

      <section className={sectionClass}>
        <h2 className="text-lg font-semibold tracking-tight">Core</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <Field label="Applied date" name="appliedAt" required state={state} type="date" values={values} />
          <Field label="Company" name="company" required state={state} values={values} />
          <Field label="Role" name="role" required state={state} values={values} />
        </div>
      </section>

      <section className={sectionClass}>
        <h2 className="text-lg font-semibold tracking-tight">Role Details</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-4">
          <Field label="Role category" name="roleCategory" state={state} values={values} />
          <Field label="Seniority" name="seniority" state={state} values={values} />
          <Field label="Country" name="country" state={state} values={values} />
          <Field label="Work mode" name="workMode" state={state} values={values} />
        </div>
      </section>

      <section className={sectionClass}>
        <h2 className="text-lg font-semibold tracking-tight">Application Source</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <Field label="Source" name="source" state={state} values={values} />
          <Field label="Vacancy URL" name="vacancyUrl" state={state} type="url" values={values} />
          <Field label="CV version" name="cvVersion" state={state} values={values} />
        </div>
      </section>

      <section className={sectionClass}>
        <h2 className="text-lg font-semibold tracking-tight">Match</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <SelectField label="Match class" name="userMatchClass" options={matchOptions} state={state} values={values} />
          <Field label="Match percentage" max="100" min="0" name="userMatchPercentage" state={state} type="number" values={values} />
        </div>
      </section>

      <section className={sectionClass}>
        <h2 className="text-lg font-semibold tracking-tight">Work Authorization</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
          <Field label="Work authorization" name="workAuthorization" state={state} values={values} />
          <label className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-300">
            <input className="h-4 w-4 accent-zinc-100" defaultChecked={values.sponsorshipRequired === "on" || values.sponsorshipRequired === "true"} name="sponsorshipRequired" type="checkbox" />
            Sponsorship required
          </label>
        </div>
      </section>

      <section className={sectionClass}>
        <h2 className="text-lg font-semibold tracking-tight">Compensation</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <Field label="Salary min" name="salaryMin" state={state} type="number" values={values} />
          <Field label="Salary max" name="salaryMax" state={state} type="number" values={values} />
          <Field label="Currency" name="currency" state={state} values={values} />
        </div>
      </section>

      <section className={sectionClass}>
        <h2 className="text-lg font-semibold tracking-tight">Lifecycle</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <SelectField label="Outcome" name="outcome" options={outcomeOptions} state={state} values={values} />
          <SelectField label="Stage" name="stage" options={stageOptions} state={state} values={values} />
          <Field label="Response date" name="responseAt" state={state} type="date" values={values} />
        </div>
        <div className="mt-4">
          <TextareaField label="Rejection reason" name="rejectionReason" state={state} values={values} />
        </div>
      </section>

      <section className={sectionClass}>
        <h2 className="text-lg font-semibold tracking-tight">Notes</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <TextareaField label="Requirements / gaps" name="requirementsAndGaps" state={state} values={values} />
          <TextareaField label="Notes" name="notes" state={state} values={values} />
        </div>
      </section>

      <div className="flex flex-col-reverse gap-3 border-t border-zinc-800 pt-5 sm:flex-row sm:justify-end">
        <button className="rounded-lg bg-zinc-100 px-5 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60" disabled={pending} type="submit">
          {pending ? "Saving..." : "Save changes"}
        </button>
      </div>
    </form>
  );
}

function Field({ state, values, label, name, ...props }: { state: UpdateApplicationFormState; values: NonNullable<UpdateApplicationFormState["values"]>; label: string; name: FieldName } & Omit<React.InputHTMLAttributes<HTMLInputElement>, "defaultValue" | "name">) {
  const error = getError(state, name);
  return <label className={labelClass}>{label}<input className={inputClass} defaultValue={values[name] ?? ""} name={name} {...props} />{error ? <span className="mt-2 block text-xs text-red-300">{error}</span> : null}</label>;
}

function SelectField({ state, values, label, name, options }: { state: UpdateApplicationFormState; values: NonNullable<UpdateApplicationFormState["values"]>; label: string; name: FieldName; options: readonly { value: string; label: string }[] }) {
  const error = getError(state, name);
  return <label className={labelClass}>{label}<select className={inputClass} defaultValue={values[name] ?? ""} name={name}><option value="">Select...</option>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>{error ? <span className="mt-2 block text-xs text-red-300">{error}</span> : null}</label>;
}

function TextareaField({ state, values, label, name }: { state: UpdateApplicationFormState; values: NonNullable<UpdateApplicationFormState["values"]>; label: string; name: FieldName }) {
  const error = getError(state, name);
  return <label className={labelClass}>{label}<textarea className={`${inputClass} min-h-32 resize-y`} defaultValue={values[name] ?? ""} name={name} />{error ? <span className="mt-2 block text-xs text-red-300">{error}</span> : null}</label>;
}

function getError(state: UpdateApplicationFormState, name: FieldName) {
  return state.errors?.[name]?.[0];
}
