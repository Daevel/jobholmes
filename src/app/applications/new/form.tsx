"use client";

import { useActionState } from "react";
import {
  createApplicationAction,
  initialCreateApplicationFormState,
  type CreateApplicationFormState,
} from "@/app/applications/new/actions";

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

type FieldName = NonNullable<CreateApplicationFormState["values"]> extends Partial<Record<infer Key, string>> ? Key : never;

export function NewApplicationForm({ today }: { today: string }) {
  const [state, formAction, pending] = useActionState(createApplicationAction, initialCreateApplicationFormState);

  return (
    <form action={formAction} className="space-y-5">
      {state.formError ? <p className="rounded-xl border border-red-900/70 bg-red-950/30 px-4 py-3 text-sm text-red-200">{state.formError}</p> : null}

      <section className={sectionClass}>
        <h2 className="text-lg font-semibold tracking-tight">Core</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <Field state={state} label="Applied date" name="appliedAt" required type="date" defaultValue={today} />
          <Field state={state} label="Company" name="company" required placeholder="Acme GmbH" />
          <Field state={state} label="Role" name="role" required placeholder="Senior Frontend Engineer" />
        </div>
      </section>

      <section className={sectionClass}>
        <h2 className="text-lg font-semibold tracking-tight">Role Details</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-4">
          <Field state={state} label="Role category" name="roleCategory" placeholder="Frontend" />
          <Field state={state} label="Seniority" name="seniority" placeholder="Senior" />
          <Field state={state} label="Country" name="country" placeholder="Germany" />
          <Field state={state} label="Work mode" name="workMode" placeholder="Remote" />
        </div>
      </section>

      <section className={sectionClass}>
        <h2 className="text-lg font-semibold tracking-tight">Application Source</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <Field state={state} label="Source" name="source" placeholder="LinkedIn" />
          <Field state={state} label="Vacancy URL" name="vacancyUrl" placeholder="https://example.com/jobs/123" type="url" />
          <Field state={state} label="CV version" name="cvVersion" placeholder="frontend-2026-v1" />
        </div>
      </section>

      <section className={sectionClass}>
        <h2 className="text-lg font-semibold tracking-tight">Match</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <SelectField label="Match class" name="userMatchClass" options={matchOptions} state={state} />
          <Field state={state} label="Match percentage" max="100" min="0" name="userMatchPercentage" placeholder="75" type="number" />
        </div>
      </section>

      <section className={sectionClass}>
        <h2 className="text-lg font-semibold tracking-tight">Work Authorization</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
          <Field state={state} label="Work authorization" name="workAuthorization" placeholder="EU citizen" />
          <label className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-300">
            <input
              className="h-4 w-4 accent-zinc-100"
              defaultChecked={state.values?.sponsorshipRequired === "on" || state.values?.sponsorshipRequired === "true"}
              name="sponsorshipRequired"
              type="checkbox"
            />
            Sponsorship required
          </label>
        </div>
      </section>

      <section className={sectionClass}>
        <h2 className="text-lg font-semibold tracking-tight">Compensation</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <Field state={state} label="Salary min" name="salaryMin" placeholder="70000" type="number" />
          <Field state={state} label="Salary max" name="salaryMax" placeholder="90000" type="number" />
          <Field state={state} label="Currency" name="currency" placeholder="EUR" />
        </div>
      </section>

      <section className={sectionClass}>
        <h2 className="text-lg font-semibold tracking-tight">Status</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <SelectField defaultValue="PENDING" label="Outcome" name="outcome" options={outcomeOptions} state={state} />
          <SelectField defaultValue="APPLICATION" label="Stage" name="stage" options={stageOptions} state={state} />
        </div>
      </section>

      <section className={sectionClass}>
        <h2 className="text-lg font-semibold tracking-tight">Notes</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <TextareaField label="Requirements / gaps" name="requirementsAndGaps" placeholder="Key requirements, missing skills, concerns..." state={state} />
          <TextareaField label="Notes" name="notes" placeholder="Context, recruiter notes, next steps..." state={state} />
        </div>
      </section>

      <div className="flex flex-col-reverse gap-3 border-t border-zinc-800 pt-5 sm:flex-row sm:justify-end">
        <button
          className="rounded-lg bg-zinc-100 px-5 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
          disabled={pending}
          type="submit"
        >
          {pending ? "Saving..." : "Add application"}
        </button>
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
    <label className={labelClass}>
      {label}
      <input className={inputClass} defaultValue={state.values?.[name] ?? defaultValue} name={name} {...props} />
      {error ? <span className="mt-2 block text-xs text-red-300">{error}</span> : null}
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
    <label className={labelClass}>
      {label}
      <select className={inputClass} defaultValue={state.values?.[name] ?? defaultValue} name={name}>
        <option value="">Select...</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error ? <span className="mt-2 block text-xs text-red-300">{error}</span> : null}
    </label>
  );
}

function TextareaField({ state, label, name, placeholder }: { state: CreateApplicationFormState; label: string; name: FieldName; placeholder: string }) {
  const error = getError(state, name);

  return (
    <label className={labelClass}>
      {label}
      <textarea className={`${inputClass} min-h-32 resize-y`} defaultValue={state.values?.[name] ?? ""} name={name} placeholder={placeholder} />
      {error ? <span className="mt-2 block text-xs text-red-300">{error}</span> : null}
    </label>
  );
}

function getError(state: CreateApplicationFormState, name: FieldName) {
  return state.errors?.[name]?.[0];
}
