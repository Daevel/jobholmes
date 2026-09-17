import Link from "next/link";
import { notFound } from "next/navigation";
import { AiMatchBadge, AppShell, ButtonLink, DetailField, OutcomeBadge, SectionCard, StageBadge } from "@/components/application-ui";
import { JobFitAnalysis } from "@/components/job-fit-analysis";
import { parseRequirementsAndGaps, type ParsedRequirementsAndGaps } from "@/lib/ai/requirements-and-gaps";
import { formatApplicationLocation, formatDate, formatSalary, getDaysToResponse, stageLabels } from "@/lib/applications/display";
import { shouldShowRejectionReason } from "@/lib/applications/rejection-reason";
import { getApplicationForUser } from "@/lib/applications/service";
import { getEffectiveStageHistory, reachedStages } from "@/lib/applications/stage-history";
import { requireCurrentUser } from "@/lib/current-user";
import { t } from "@/lib/i18n/translate";
import { AiMatchButton } from "./ai-match-button";
import { CoverLetterSection } from "./cover-letter-section";

export default async function ApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireCurrentUser();
  const { id } = await params;
  const application = await getApplicationForUser(user.id, id);

  if (!application) notFound();

  const daysToResponse = getDaysToResponse(application);
  const requirementsAndGaps = parseRequirementsAndGaps(application.requirementsAndGaps);
  const legacyRequirementsAndGaps = requirementsAndGaps.kind === "legacy" ? requirementsAndGaps.text : null;
  const stageHistory = getEffectiveStageHistory(application);
  const stagesWithHistory = reachedStages(application.stage).filter((stage) => stageHistory[stage]);

  return (
    <AppShell accountLabel={user.name || user.email} currentPath="/applications">
      <Link className="w-fit text-sm font-semibold text-slate-500 outline-none transition hover:text-indigo-700 focus-visible:ring-2 focus-visible:ring-indigo-500" href="/applications">{t("applications.detail.backLink")}</Link>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="break-words text-2xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-3xl">{application.company}</h1>
              <AiMatchBadge percentage={application.aiMatchPercentage} value={application.aiMatchClass} />
            </div>
            <p className="mt-2 break-words text-base text-slate-600 sm:text-lg">{application.role}</p>
            <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
              <HeaderField label={t("applications.detail.header.location")} value={formatApplicationLocation(application)} />
              <HeaderField label={t("applications.detail.header.workMode")} value={application.workMode} />
              <HeaderField label={t("applications.detail.header.category")} value={application.roleCategory} />
              <HeaderField label={t("applications.detail.header.appliedOn")} value={formatDate(application.appliedAt)} />
            </dl>
          </div>
          <div className="flex shrink-0 flex-col gap-2 sm:flex-row lg:flex-col">
            <ButtonLink href={`/applications/${application.id}/edit`} variant="secondary">{t("applications.detail.editButton")}</ButtonLink>
          </div>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-2">
        <SectionCard className="p-5" title={t("applications.detail.sections.overview.title")}>
          <dl className="grid gap-5 sm:grid-cols-2">
            <DetailField label={t("applications.detail.overview.company")} value={application.company} />
            <DetailField label={t("applications.detail.overview.role")} value={application.role} />
            <DetailField label={t("applications.detail.overview.roleCategory")} value={application.roleCategory} />
            <DetailField label={t("applications.detail.overview.seniority")} value={application.seniority} />
            <DetailField label={t("applications.detail.overview.location")} value={formatApplicationLocation(application)} />
            <DetailField label={t("applications.detail.overview.workMode")} value={application.workMode} />
            <DetailField label={t("applications.detail.overview.source")} value={application.source} />
            <DetailField label={t("applications.detail.overview.cvUsed")} value={application.cvVersion} />
            <DetailField label={t("applications.detail.overview.appliedDate")} value={formatDate(application.appliedAt)} />
            <DetailField label={t("applications.detail.overview.vacancyUrl")} value={application.vacancyUrl} wide wrap />
          </dl>
        </SectionCard>

        <SectionCard className="p-5" title={t("applications.detail.sections.aiMatch.title")}>
          <div className="space-y-5">
            <dl className="grid gap-5 sm:grid-cols-2">
              <DetailField label={t("applications.detail.aiMatch.class")}><AiMatchBadge percentage={null} value={application.aiMatchClass} /></DetailField>
              <DetailField label={t("applications.detail.aiMatch.score")} value={application.aiMatchPercentage === null ? "-" : `${application.aiMatchPercentage}%`} />
              <DetailField label={t("applications.detail.aiMatch.confidence")} value={application.aiMatchConfidence === null ? "-" : `${application.aiMatchConfidence}%`} />
              <DetailField label={t("applications.detail.aiMatch.cv")} value={application.cvVersion} />
              <DetailField label={t("applications.detail.aiMatch.lastAnalyzed")} value={formatDate(application.jdVerifiedAt)} />
            </dl>
            <AiMatchAnalysis parsed={requirementsAndGaps} />
            {legacyRequirementsAndGaps ? <DetailField label={t("applications.detail.aiMatch.legacyNotes")} value={legacyRequirementsAndGaps} wide wrap /> : null}
            <AiMatchState application={application} />
          </div>
        </SectionCard>

        <SectionCard className="p-5" title={t("applications.detail.sections.funnel.title")}>
          <dl className="grid gap-5 sm:grid-cols-2">
            <DetailField label={t("applications.detail.funnel.currentStage")}><StageBadge value={application.stage} /></DetailField>
            <DetailField label={t("applications.detail.funnel.outcome")}><OutcomeBadge value={application.outcome} /></DetailField>
            <DetailField label={t("applications.detail.funnel.responseDate")} value={formatDate(application.responseAt)} />
            <DetailField label={t("applications.detail.funnel.daysToResponse")} value={daysToResponse === null ? "-" : String(daysToResponse)} />
            {stagesWithHistory.length === 0 ? (
              <DetailField label={t("applications.form.stageHistory.title")} value={t("applications.detail.funnel.stageHistoryEmpty")} wide />
            ) : (
              stagesWithHistory.map((stage) => (
                <DetailField key={stage} label={stageLabels[stage]} wide wrap>
                  <span className="block text-xs font-medium text-slate-500">{formatDate(new Date(stageHistory[stage]!.updatedAt))}</span>
                  <span className="mt-1 block">{stageHistory[stage]!.text}</span>
                </DetailField>
              ))
            )}
            {shouldShowRejectionReason(application.outcome) ? <DetailField label={t("applications.detail.funnel.rejectionReason")} value={application.rejectionReason} wide wrap /> : null}
          </dl>
        </SectionCard>

        <SectionCard className="p-5" title={t("applications.detail.sections.compensation.title")}>
          <dl className="grid gap-5 sm:grid-cols-2">
            <DetailField label={t("applications.detail.compensation.salaryRange")} value={formatSalary(application)} />
            <DetailField label={t("applications.detail.compensation.currency")} value={application.currency} />
            <DetailField label={t("applications.detail.compensation.workAuthorization")} value={application.workAuthorization} />
            <DetailField label={t("applications.detail.compensation.sponsorshipRequired")} value={application.sponsorshipRequired === null ? t("applications.form.sponsorship.options.unknown") : application.sponsorshipRequired ? t("applications.form.sponsorship.options.yes") : t("applications.form.sponsorship.options.no")} />
          </dl>
        </SectionCard>

        <SectionCard className="p-5 xl:col-span-2" title={t("applications.detail.sections.jobDescription.title")}>
          {application.jdText ? (
            <details className="group max-w-4xl">
              <summary className="cursor-pointer text-sm font-semibold text-indigo-600 outline-none hover:text-indigo-700 focus-visible:ring-2 focus-visible:ring-indigo-500">{t("applications.detail.jobDescriptionSection.showFull")}</summary>
              <div className="mt-4 max-h-[520px] overflow-y-auto whitespace-pre-wrap break-words rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm leading-7 text-slate-700">{application.jdText}</div>
            </details>
          ) : <p className="text-sm text-slate-500">{t("applications.detail.jobDescriptionSection.empty")}</p>}
        </SectionCard>

        <SectionCard className="p-5 xl:col-span-2" description={t("applications.detail.sections.coverLetter.description")} title={t("applications.detail.sections.coverLetter.title")}>
          <CoverLetterSection applicationId={application.id} company={application.company} initialCoverLetter={application.coverLetter} role={application.role} />
        </SectionCard>

        <SectionCard className="p-5 xl:col-span-2" title={t("applications.sections.notes.title")}>
          <div className="max-w-4xl whitespace-pre-wrap break-words text-sm leading-7 text-slate-700">{application.notes || "-"}</div>
        </SectionCard>
      </div>
    </AppShell>
  );
}

function AiMatchAnalysis({ parsed }: { parsed: ParsedRequirementsAndGaps }) {
  if (parsed.kind !== "structured") return null;

  return <JobFitAnalysis payload={parsed.payload} />;
}

function AiMatchState({ application }: { application: NonNullable<Awaited<ReturnType<typeof getApplicationForUser>>> }) {
  if (!application.jdText?.trim()) return <p className="text-sm text-slate-500">{t("applications.detail.aiMatch.addJdFirst")}</p>;
  if (!application.cvDocumentId) return <p className="text-sm text-slate-500">{t("applications.detail.aiMatch.selectCvFirst")}</p>;
  if (application.aiMatchClass && application.aiMatchPercentage !== null && application.jdVerifiedAt) return <AiMatchButton applicationId={application.id} label={t("applications.detail.aiMatch.reanalyzeButton")} />;
  return <div className="space-y-3"><p className="text-sm text-amber-700">{t("applications.detail.aiMatch.needsRecalculation")}</p><AiMatchButton applicationId={application.id} /></div>;
}

function HeaderField({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium uppercase tracking-[0.12em] text-slate-400">{label}</dt>
      <dd className="mt-1 truncate font-medium text-slate-800">{value || "-"}</dd>
    </div>
  );
}
