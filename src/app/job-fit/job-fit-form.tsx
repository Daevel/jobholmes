"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AiMatchBadge } from "@/components/application-ui";
import { Button, formStyles } from "@/components/form-ui";
import { JobFitAnalysis } from "@/components/job-fit-analysis";
import { parseRequirementsAndGaps, type RequirementsAndGapsPayload } from "@/lib/ai/requirements-and-gaps";

type CvOption = { id: string; name: string };
type MatchClass = "A_STRONG" | "B_STRETCH" | "C_LONG_SHOT";

type PreviewResponse = {
  score: number | null;
  matchClass: MatchClass | null;
  confidence: number | null;
  cvDocumentId: string;
  requirementsAndGapsJson: string;
  signature: string;
  expiresAt: number;
  error?: string;
};

type PreviewResult = {
  jdText: string;
  cvDocumentId: string;
  score: number | null;
  matchClass: MatchClass | null;
  confidence: number | null;
  requirementsAndGapsJson: string;
  signature: string;
  expiresAt: number;
  payload: RequirementsAndGapsPayload;
};

export function JobFitForm({ today, cvs }: { today: string; cvs: CvOption[] }) {
  const router = useRouter();
  const [jdText, setJdText] = useState("");
  const [cvDocumentId, setCvDocumentId] = useState("");
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [previewPending, setPreviewPending] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [confirmPending, setConfirmPending] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  const isStale = preview !== null && (preview.jdText !== jdText || preview.cvDocumentId !== cvDocumentId);

  async function analyzeFit() {
    if (previewPending || !jdText.trim() || !cvDocumentId) return;
    setPreviewPending(true);
    setPreviewError(null);

    try {
      const response = await fetch("/api/job-fit/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jdText, cvDocumentId }),
      });
      const data = (await response.json()) as PreviewResponse;
      if (!response.ok) throw new Error(data.error ?? "JobHolmes could not analyze this job fit. Please try again.");

      const parsed = parseRequirementsAndGaps(data.requirementsAndGapsJson);
      if (parsed.kind !== "structured") throw new Error("JobHolmes could not analyze this job fit. Please try again.");

      setPreview({
        jdText,
        cvDocumentId,
        score: data.score,
        matchClass: data.matchClass,
        confidence: data.confidence,
        requirementsAndGapsJson: data.requirementsAndGapsJson,
        signature: data.signature,
        expiresAt: data.expiresAt,
        payload: parsed.payload,
      });
    } catch (error) {
      setPreview(null);
      setPreviewError(error instanceof Error ? error.message : "JobHolmes could not analyze this job fit. Please try again.");
    } finally {
      setPreviewPending(false);
    }
  }

  async function createApplication(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!preview || isStale || confirmPending) return;
    setConfirmPending(true);
    setConfirmError(null);

    try {
      const baseFields = Object.fromEntries(new FormData(event.currentTarget).entries());
      const response = await fetch("/api/job-fit/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...baseFields,
          jobFit: {
            jdText: preview.jdText,
            cvDocumentId: preview.cvDocumentId,
            score: preview.score,
            matchClass: preview.matchClass,
            confidence: preview.confidence,
            requirementsAndGapsJson: preview.requirementsAndGapsJson,
            signature: preview.signature,
            expiresAt: preview.expiresAt,
          },
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(typeof data.error === "string" ? data.error : "Could not create application. Please try again.");

      router.push(`/applications/${data.application.id}`);
    } catch (error) {
      setConfirmError(error instanceof Error ? error.message : "Could not create application. Please try again.");
    } finally {
      setConfirmPending(false);
    }
  }

  return (
    <div className="space-y-5">
      <section className={formStyles.section}>
        <h2 className={formStyles.sectionTitle}>Job description</h2>
        <p className={formStyles.sectionDescription}>Paste the job description and select the CV to compare it against. JobHolmes uses the same matching engine as AI Match on existing applications.</p>
        <div className="mt-5 space-y-4">
          <label className={formStyles.label}>
            Job description
            <textarea className={formStyles.textarea} onChange={(event) => setJdText(event.target.value)} placeholder="Paste the full job description here..." value={jdText} />
          </label>
          <label className={formStyles.label}>
            CV to compare
            <select className={formStyles.input} onChange={(event) => setCvDocumentId(event.target.value)} value={cvDocumentId}>
              <option value="">Select a CV</option>
              {cvs.map((cv) => <option key={cv.id} value={cv.id}>{cv.name}</option>)}
            </select>
            {cvs.length === 0 ? <span className="mt-2 block text-xs text-slate-500">No CVs uploaded yet. <a className="font-semibold text-indigo-600 hover:text-indigo-700" href="/cvs">Upload a CV</a> to use Job Fit.</span> : null}
          </label>
          {previewError ? <p className={formStyles.formError}>{previewError}</p> : null}
          <Button disabled={previewPending || !jdText.trim() || !cvDocumentId} onClick={analyzeFit} type="button">
            {previewPending ? "Analyzing..." : "Analyze fit"}
          </Button>
        </div>
      </section>

      {preview ? (
        <section className={formStyles.section}>
          <h2 className={formStyles.sectionTitle}>Result</h2>
          {isStale ? (
            <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">The job description or selected CV changed since this result was calculated. Analyze fit again before creating an application.</p>
          ) : (
            <div className="mt-5 space-y-5">
              <dl className="grid gap-5 sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-medium uppercase tracking-[0.12em] text-slate-400">AI match class</dt>
                  <dd className="mt-2"><AiMatchBadge percentage={preview.score} value={preview.matchClass} /></dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-[0.12em] text-slate-400">Confidence</dt>
                  <dd className="mt-2 text-sm text-slate-800">{preview.confidence === null ? "-" : `${preview.confidence}%`}</dd>
                </div>
              </dl>
              <JobFitAnalysis payload={preview.payload} />
            </div>
          )}
        </section>
      ) : null}

      {preview && !isStale ? (
        <form className="space-y-5" onSubmit={createApplication}>
          <section className={formStyles.section}>
            <h2 className={formStyles.sectionTitle}>Create application from result</h2>
            <p className={formStyles.sectionDescription}>Fill in the remaining application details. The Job Fit result above is saved with the new application without running the analysis again.</p>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <TextField label="Company" name="company" placeholder="Acme GmbH" required />
              <TextField label="Role" name="role" placeholder="Senior Frontend Engineer" required />
              <TextField defaultValue={today} label="Applied date" name="appliedAt" required type="date" />
              <TextField label="Country" name="country" placeholder="Germany" />
              <TextField label="Work mode" name="workMode" placeholder="Remote" />
              <TextField label="Source" name="source" placeholder="LinkedIn" />
              <TextField label="Vacancy URL" name="vacancyUrl" placeholder="https://example.com/jobs/123" type="url" />
              <TextField label="Role category" name="roleCategory" placeholder="Frontend" />
              <TextField label="Seniority" name="seniority" placeholder="Senior" />
              <TextField label="Work authorization" name="workAuthorization" placeholder="EU citizen" />
              <SponsorshipField />
              <TextField label="Salary min" name="salaryMin" placeholder="70000" type="number" />
              <TextField label="Salary max" name="salaryMax" placeholder="90000" type="number" />
              <TextField label="Currency" name="currency" placeholder="EUR" />
            </div>
            <div className="mt-4">
              <TextareaField label="Stage context" name="stageContext" placeholder="Submission details, recruiter feedback, or next steps..." />
            </div>
            <div className="mt-4">
              <TextareaField label="Notes" name="notes" placeholder="Context, recruiter notes, next steps..." />
            </div>
          </section>

          {confirmError ? <p className={formStyles.formError}>{confirmError}</p> : null}

          <div className="flex justify-end">
            <Button disabled={confirmPending} type="submit">
              {confirmPending ? "Creating..." : "Create application from result"}
            </Button>
          </div>
        </form>
      ) : null}
    </div>
  );
}

function SponsorshipField() {
  return (
    <label className={formStyles.label}>
      Sponsorship required
      <select className={formStyles.input} defaultValue="unknown" name="sponsorshipRequired">
        <option value="unknown">Unknown</option>
        <option value="false">No</option>
        <option value="true">Yes</option>
      </select>
    </label>
  );
}

function TextField({ label, name, defaultValue = "", ...props }: { label: string; name: string; defaultValue?: string } & Omit<React.InputHTMLAttributes<HTMLInputElement>, "defaultValue" | "name">) {
  return (
    <label className={formStyles.label}>
      {label}{props.required ? <span className="text-red-600"> *</span> : null}
      <input className={formStyles.input} defaultValue={defaultValue} name={name} {...props} />
    </label>
  );
}

function TextareaField({ label, name, placeholder }: { label: string; name: string; placeholder: string }) {
  return (
    <label className={formStyles.label}>
      {label}
      <textarea className={formStyles.textarea} name={name} placeholder={placeholder} />
    </label>
  );
}
