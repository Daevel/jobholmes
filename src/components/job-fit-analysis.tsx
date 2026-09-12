import type { RequirementsAndGapsPayload } from "@/lib/ai/requirements-and-gaps";
import { t } from "@/lib/i18n/translate";

export function JobFitAnalysis({ payload }: { payload: RequirementsAndGapsPayload }) {
  return (
    <div className="space-y-4">
      {payload.provisional ? <ProvisionalWarning reasons={payload.provisionalReasons} /> : null}
      <div className="grid gap-4 lg:grid-cols-2">
        <AnalysisList title={t("jobFitAnalysis.requirementsTitle")} items={payload.requirements.map((requirement, index) => `${index + 1}. ${requirement.text} (${formatPriority(requirement.priority)})`)} />
        <AnalysisList title={t("jobFitAnalysis.gapsTitle")} items={payload.gaps.map((gap) => `${gap.requirementIndex + 1}. ${gap.requirementText} (${gap.type === "partial" ? t("jobFitAnalysis.gapType.partial") : t("jobFitAnalysis.gapType.missing")})`)} empty={t("jobFitAnalysis.gapsEmpty")} />
      </div>
      <AssessmentList payload={payload} />
      {payload.unverifiedRequirements.length > 0 ? <AnalysisList title={t("jobFitAnalysis.unverifiedRequirementsTitle")} items={payload.unverifiedRequirements.map((requirement) => `${requirement.requirementIndex + 1}. ${requirement.requirementText}`)} /> : null}
    </div>
  );
}

function ProvisionalWarning({ reasons }: { reasons: string[] }) {
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      <p className="font-semibold">{t("jobFitAnalysis.provisionalWarning")}</p>
      <ul className="mt-2 list-disc space-y-1 pl-5">
        {reasons.map((reason) => <li key={reason}>{reason}</li>)}
      </ul>
    </div>
  );
}

function AssessmentList({ payload }: { payload: RequirementsAndGapsPayload }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-950">{t("jobFitAnalysis.requirementEvidenceTitle")}</h3>
      <div className="mt-2 space-y-2">
        {payload.assessments.map((assessment) => {
          const requirement = payload.requirements[assessment.requirementIndex];
          if (!requirement) return null;

          return (
            <div key={assessment.requirementIndex} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
              <p className="font-medium text-slate-900">{assessment.requirementIndex + 1}. {requirement.text}</p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{formatStatus(assessment.status)}</p>
              {assessment.evidence.length > 0 ? <p className="mt-2 whitespace-pre-wrap break-words text-slate-600">{t("jobFitAnalysis.evidencePrefix")} {assessment.evidence.map((evidence) => evidence.sourceText).join("; ")}</p> : <p className="mt-2 text-slate-500">{t("jobFitAnalysis.noEvidence")}</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AnalysisList({ title, items, empty = t("jobFitAnalysis.defaultEmpty") }: { title: string; items: string[]; empty?: string }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-950">{title}</h3>
      {items.length > 0 ? (
        <ul className="mt-2 space-y-2 text-sm text-slate-700">
          {items.map((item) => <li key={item} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">{item}</li>)}
        </ul>
      ) : <p className="mt-2 text-sm text-slate-500">{empty}</p>}
    </div>
  );
}

function formatPriority(priority: RequirementsAndGapsPayload["requirements"][number]["priority"]) {
  if (priority === "must_have") return t("jobFitAnalysis.priority.mustHave");
  if (priority === "nice_to_have") return t("jobFitAnalysis.priority.niceToHave");
  return t("jobFitAnalysis.priority.unknown");
}

function formatStatus(status: RequirementsAndGapsPayload["assessments"][number]["status"]) {
  if (status === "covered") return t("jobFitAnalysis.status.covered");
  if (status === "partial") return t("jobFitAnalysis.status.partial");
  if (status === "not_covered") return t("jobFitAnalysis.status.notCovered");
  return t("jobFitAnalysis.status.unknown");
}
