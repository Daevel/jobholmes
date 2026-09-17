import { notFound } from "next/navigation";
import { AppShell, ButtonLink, PageHeader } from "@/components/application-ui";
import { parseRequirementsAndGaps } from "@/lib/ai/requirements-and-gaps";
import { EditApplicationForm } from "@/app/applications/[id]/edit/form";
import { formatDateInput } from "@/lib/applications/display";
import { getApplicationForUser } from "@/lib/applications/service";
import { getEffectiveStageHistory } from "@/lib/applications/stage-history";
import { listSourcesForUser } from "@/lib/applications/sources-service";
import { listCvsForUser } from "@/lib/cvs/service";
import { requireCurrentUser } from "@/lib/current-user";
import { t } from "@/lib/i18n/translate";

export default async function EditApplicationPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireCurrentUser();
  const { id } = await params;
  const [application, cvs, sources] = await Promise.all([getApplicationForUser(user.id, id), listCvsForUser(user.id), listSourcesForUser(user.id)]);

  if (!application) notFound();

  const requirementsAndGaps = parseRequirementsAndGaps(application.requirementsAndGaps);

  const defaults = {
    appliedAt: formatDateInput(application.appliedAt),
    company: application.company,
    role: application.role,
    roleCategory: application.roleCategory ?? "",
    seniority: application.seniority ?? "",
    country: application.country ?? "",
    city: application.city ?? "",
    remoteOnly: application.remoteOnly ? "true" : "false",
    workMode: application.workMode ?? "",
    source: application.source ?? "",
    vacancyUrl: application.vacancyUrl ?? "",
    cvDocumentId: application.cvDocumentId ?? "",
    legacyCvVersion: application.cvDocumentId ? "" : application.cvVersion ?? "",
    jdText: application.jdText ?? "",
    workAuthorization: application.workAuthorization ?? "",
    sponsorshipRequired: application.sponsorshipRequired === null ? "unknown" : application.sponsorshipRequired ? "true" : "false",
    salaryMin: application.salaryMin === null ? "" : String(application.salaryMin),
    salaryMax: application.salaryMax === null ? "" : String(application.salaryMax),
    currency: application.currency ?? "",
    outcome: application.outcome,
    stage: application.stage,
    responseAt: formatDateInput(application.responseAt),
    stageHistory: JSON.stringify(getEffectiveStageHistory(application)),
    rejectionReason: application.rejectionReason ?? "",
    requirementsAndGaps: requirementsAndGaps.kind === "legacy" ? requirementsAndGaps.text : "",
    notes: application.notes ?? "",
  };

  return (
    <AppShell accountLabel={user.name || user.email} currentPath="/applications">
      <PageHeader action={<ButtonLink href={`/applications/${application.id}`} variant="secondary">{t("applications.edit.cancelButton")}</ButtonLink>} eyebrow={t("applications.edit.pageEyebrow")} subtitle={`${application.company} • ${application.role}`} title={t("applications.edit.pageTitle")} />
      <EditApplicationForm applicationId={application.id} cvs={cvs.map((cv) => ({ id: cv.id, name: cv.name }))} defaults={defaults} sources={sources} />
    </AppShell>
  );
}
