"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AiMatchBadge } from "@/components/application-ui";
import { Button, formStyles } from "@/components/form-ui";
import { JobFitAnalysis } from "@/components/job-fit-analysis";
import { SourceField } from "@/components/source-field";
import { parseRequirementsAndGaps, type RequirementsAndGapsPayload } from "@/lib/ai/requirements-and-gaps";
import { t } from "@/lib/i18n/translate";

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

export function JobFitForm({ today, cvs, sources }: { today: string; cvs: CvOption[]; sources: string[] }) {
  const router = useRouter();
  const [jdText, setJdText] = useState("");
  const [cvDocumentId, setCvDocumentId] = useState("");
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [previewPending, setPreviewPending] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [confirmPending, setConfirmPending] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [remoteOnly, setRemoteOnly] = useState(false);

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
      if (!response.ok) throw new Error(data.error ?? t("jobFit.form.errors.previewFailed"));

      const parsed = parseRequirementsAndGaps(data.requirementsAndGapsJson);
      if (parsed.kind !== "structured") throw new Error(t("jobFit.form.errors.previewFailed"));

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
      setPreviewError(error instanceof Error ? error.message : t("jobFit.form.errors.previewFailed"));
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
      if (!response.ok) throw new Error(typeof data.error === "string" ? data.error : t("applications.new.errors.createFailed"));

      router.push(`/applications/${data.application.id}`);
    } catch (error) {
      setConfirmError(error instanceof Error ? error.message : t("applications.new.errors.createFailed"));
    } finally {
      setConfirmPending(false);
    }
  }

  return (
    <div className="space-y-5">
      <section className={formStyles.section}>
        <h2 className={formStyles.sectionTitle}>{t("applications.form.sections.jobDescription.title")}</h2>
        <p className={formStyles.sectionDescription}>{t("jobFit.form.jobDescriptionSection.description")}</p>
        <div className="mt-5 space-y-4">
          <label className={formStyles.label}>
            {t("applications.form.jobDescription.label")}
            <textarea className={formStyles.textarea} onChange={(event) => setJdText(event.target.value)} placeholder={t("applications.form.jobDescription.placeholder")} value={jdText} />
          </label>
          <label className={formStyles.label}>
            {t("jobFit.form.cvToCompareLabel")}
            <select className={formStyles.input} onChange={(event) => setCvDocumentId(event.target.value)} value={cvDocumentId}>
              <option value="">{t("jobFit.form.selectCvOption")}</option>
              {cvs.map((cv) => <option key={cv.id} value={cv.id}>{cv.name}</option>)}
            </select>
            {cvs.length === 0 ? <span className="mt-2 block text-xs text-slate-500">{t("applications.form.cv.noCvsUploadedPrefix")} <a className="font-semibold text-indigo-600 hover:text-indigo-700" href="/cvs">{t("applications.form.cv.uploadCvLinkText")}</a> {t("jobFit.form.noCvsUploadedSuffix")}</span> : null}
          </label>
          {previewError ? <p className={formStyles.formError}>{previewError}</p> : null}
          <Button disabled={previewPending || !jdText.trim() || !cvDocumentId} onClick={analyzeFit} type="button">
            {previewPending ? t("applications.detail.aiMatch.analyzingButton") : t("jobFit.form.analyzeButton")}
          </Button>
        </div>
      </section>

      {preview ? (
        <section className={formStyles.section}>
          <h2 className={formStyles.sectionTitle}>{t("jobFit.form.resultSection.title")}</h2>
          {isStale ? (
            <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">{t("jobFit.form.staleWarning")}</p>
          ) : (
            <div className="mt-5 space-y-5">
              <dl className="grid gap-5 sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-medium uppercase tracking-[0.12em] text-slate-400">{t("applications.detail.aiMatch.class")}</dt>
                  <dd className="mt-2"><AiMatchBadge percentage={preview.score} value={preview.matchClass} /></dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-[0.12em] text-slate-400">{t("applications.detail.aiMatch.confidence")}</dt>
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
            <h2 className={formStyles.sectionTitle}>{t("jobFit.form.createSection.title")}</h2>
            <p className={formStyles.sectionDescription}>{t("jobFit.form.createSection.description")}</p>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <TextField label={t("applications.form.company.label")} name="company" placeholder={t("applications.form.company.placeholder")} required />
              <TextField label={t("applications.form.role.label")} name="role" placeholder={t("applications.form.role.placeholder")} required />
              <TextField defaultValue={today} label={t("applications.form.appliedDate.label")} name="appliedAt" required type="date" />
              <RemoteOnlyField checked={remoteOnly} onChange={setRemoteOnly} />
              {!remoteOnly ? <TextField label={t("applications.form.country.label")} name="country" placeholder={t("applications.form.country.placeholder")} required /> : null}
              {!remoteOnly ? <TextField label={t("applications.form.city.label")} name="city" placeholder={t("applications.form.city.placeholder")} /> : null}
              <TextField label={t("applications.form.workMode.label")} name="workMode" placeholder={t("applications.form.workMode.placeholder")} />
              <SourceField sources={sources} />
              <TextField label={t("applications.form.vacancyUrl.label")} name="vacancyUrl" placeholder={t("applications.form.vacancyUrl.placeholder")} type="url" />
              <TextField label={t("applications.form.roleCategory.label")} name="roleCategory" placeholder={t("applications.form.roleCategory.placeholder")} />
              <TextField label={t("applications.form.seniority.label")} name="seniority" placeholder={t("applications.form.seniority.placeholder")} />
              <TextField label={t("applications.form.workAuthorization.label")} name="workAuthorization" placeholder={t("applications.form.workAuthorization.placeholder")} />
              <SponsorshipField />
              <TextField label={t("applications.form.salaryMin.label")} name="salaryMin" placeholder={t("applications.form.salaryMin.placeholder")} type="number" />
              <TextField label={t("applications.form.salaryMax.label")} name="salaryMax" placeholder={t("applications.form.salaryMax.placeholder")} type="number" />
              <TextField label={t("applications.form.currency.label")} name="currency" placeholder={t("applications.form.currency.placeholder")} />
            </div>
            <div className="mt-4">
              <TextareaField label={t("applications.form.stageContext.label")} name="stageContext" placeholder={t("applications.form.stageContext.placeholder")} />
            </div>
            <div className="mt-4">
              <TextareaField label={t("applications.sections.notes.title")} name="notes" placeholder={t("applications.form.notes.placeholder")} />
            </div>
          </section>

          {confirmError ? <p className={formStyles.formError}>{confirmError}</p> : null}

          <div className="flex justify-end">
            <Button disabled={confirmPending} type="submit">
              {confirmPending ? t("jobFit.form.creatingButton") : t("jobFit.form.createButton")}
            </Button>
          </div>
        </form>
      ) : null}
    </div>
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

function SponsorshipField() {
  return (
    <label className={formStyles.label}>
      {t("applications.form.sponsorship.label")}
      <select className={formStyles.input} defaultValue="unknown" name="sponsorshipRequired">
        <option value="unknown">{t("applications.form.sponsorship.options.unknown")}</option>
        <option value="false">{t("applications.form.sponsorship.options.no")}</option>
        <option value="true">{t("applications.form.sponsorship.options.yes")}</option>
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
