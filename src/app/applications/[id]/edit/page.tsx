import { notFound } from "next/navigation";
import { AppShell, ButtonLink, PageHeader } from "@/components/application-ui";
import { EditApplicationForm } from "@/app/applications/[id]/edit/form";
import { formatDateInput } from "@/lib/applications/display";
import { getApplicationForUser } from "@/lib/applications/service";
import { listCvsForUser } from "@/lib/cvs/service";
import { requireCurrentUser } from "@/lib/current-user";

export default async function EditApplicationPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireCurrentUser();
  const { id } = await params;
  const [application, cvs] = await Promise.all([getApplicationForUser(user.id, id), listCvsForUser(user.id)]);

  if (!application) notFound();

  const defaults = {
    appliedAt: formatDateInput(application.appliedAt),
    company: application.company,
    role: application.role,
    roleCategory: application.roleCategory ?? "",
    seniority: application.seniority ?? "",
    country: application.country ?? "",
    workMode: application.workMode ?? "",
    source: application.source ?? "",
    vacancyUrl: application.vacancyUrl ?? "",
    cvDocumentId: application.cvDocumentId ?? "",
    legacyCvVersion: application.cvDocumentId ? "" : application.cvVersion ?? "",
    jdText: application.jdText ?? "",
    userMatchClass: application.userMatchClass ?? "",
    userMatchPercentage: application.userMatchPercentage === null ? "" : String(application.userMatchPercentage),
    workAuthorization: application.workAuthorization ?? "",
    sponsorshipRequired: application.sponsorshipRequired === null ? "unknown" : application.sponsorshipRequired ? "true" : "false",
    salaryMin: application.salaryMin === null ? "" : String(application.salaryMin),
    salaryMax: application.salaryMax === null ? "" : String(application.salaryMax),
    currency: application.currency ?? "",
    outcome: application.outcome,
    stage: application.stage,
    responseAt: formatDateInput(application.responseAt),
    rejectionReason: application.rejectionReason ?? "",
    requirementsAndGaps: application.requirementsAndGaps ?? "",
    notes: application.notes ?? "",
  };

  return (
    <AppShell accountLabel={user.name || user.email} currentPath="/applications">
      <PageHeader action={<ButtonLink href={`/applications/${application.id}`} variant="secondary">Cancel</ButtonLink>} eyebrow="Edit application" subtitle={`${application.company} • ${application.role}`} title="Edit application" />
      <EditApplicationForm applicationId={application.id} cvs={cvs.map((cv) => ({ id: cv.id, name: cv.name }))} defaults={defaults} />
    </AppShell>
  );
}
