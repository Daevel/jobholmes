import { Badge } from "@/components/application-ui";
import type { RequirementsAndGapsPayload } from "@/lib/ai/requirements-and-gaps";
import { t } from "@/lib/i18n/translate";

type AssessmentStatus = RequirementsAndGapsPayload["assessments"][number]["status"];

// Reuses the same tone palette as AiMatchBadge/OutcomeBadge in application-ui.tsx (green/amber/
// red/neutral) instead of inventing new colors - "not covered" mirrors the REJECTED outcome tone.
const assessmentCardTones: Record<AssessmentStatus, { card: string; badge: "green" | "amber" | "red" | "neutral" }> = {
  covered: { card: "border-emerald-200 bg-emerald-50", badge: "green" },
  partial: { card: "border-amber-200 bg-amber-50", badge: "amber" },
  not_covered: { card: "border-red-200 bg-red-50", badge: "red" },
  unknown: { card: "border-slate-200 bg-slate-50", badge: "neutral" },
};

const analysisListItemClasses: Record<"neutral" | "red", string> = {
  neutral: "border-slate-200 bg-slate-50 text-slate-700",
  red: "border-red-200 bg-red-50 text-red-900",
};

export function JobFitAnalysis({ payload }: { payload: RequirementsAndGapsPayload }) {
  return (
    <div className="space-y-4">
      {payload.provisional ? <ProvisionalWarning reasons={payload.provisionalReasons} /> : null}
      <div className="grid gap-4 lg:grid-cols-2">
        <AnalysisList title={t("jobFitAnalysis.requirementsTitle")} items={payload.requirements.map((requirement, index) => `${index + 1}. ${requirement.text} (${formatPriority(requirement.priority)})`)} />
        <AnalysisList title={t("jobFitAnalysis.gapsTitle")} items={payload.gaps.map((gap) => `${gap.requirementIndex + 1}. ${gap.requirementText} (${gap.type === "partial" ? t("jobFitAnalysis.gapType.partial") : t("jobFitAnalysis.gapType.missing")})`)} empty={t("jobFitAnalysis.gapsEmpty")} tone="red" />
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

          const tone = assessmentCardTones[assessment.status];

          return (
            <div key={assessment.requirementIndex} className={`rounded-lg border px-3 py-2 text-sm text-slate-700 ${tone.card}`}>
              <p className="font-medium text-slate-900">{assessment.requirementIndex + 1}. {requirement.text}</p>
              <div className="mt-1"><Badge tone={tone.badge}>{formatStatus(assessment.status)}</Badge></div>
              {assessment.evidence.length > 0 ? <p className="mt-2 whitespace-pre-wrap break-words text-slate-600">{t("jobFitAnalysis.evidencePrefix")} {assessment.evidence.map((evidence) => evidence.sourceText).join("; ")}</p> : <p className="mt-2 text-slate-500">{t("jobFitAnalysis.noEvidence")}</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AnalysisList({ title, items, empty = t("jobFitAnalysis.defaultEmpty"), tone = "neutral" }: { title: string; items: string[]; empty?: string; tone?: "neutral" | "red" }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-950">{title}</h3>
      {items.length > 0 ? (
        <ul className="mt-2 space-y-2 text-sm">
          {items.map((item) => <li key={item} className={`rounded-lg border px-3 py-2 ${analysisListItemClasses[tone]}`}>{item}</li>)}
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
