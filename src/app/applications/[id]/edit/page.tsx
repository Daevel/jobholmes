import { notFound } from "next/navigation";
import { AppHeader, AppShell, PageHeading, SecondaryLink } from "@/components/application-ui";
import { EditApplicationForm } from "@/app/applications/[id]/edit/form";
import { formatDateInput } from "@/lib/applications/display";
import { getApplicationForUser } from "@/lib/applications/service";
import { requireCurrentUser } from "@/lib/current-user";

export default async function EditApplicationPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireCurrentUser();
  const { id } = await params;
  const application = await getApplicationForUser(user.id, id);

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
    cvVersion: application.cvVersion ?? "",
    userMatchClass: application.userMatchClass ?? "",
    userMatchPercentage: application.userMatchPercentage === null ? "" : String(application.userMatchPercentage),
    workAuthorization: application.workAuthorization ?? "",
    sponsorshipRequired: application.sponsorshipRequired ? "true" : "false",
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
    <AppShell>
      <AppHeader accountLabel={user.name || user.email} />
      <PageHeading
        action={<SecondaryLink href={`/applications/${application.id}`}>Back to application</SecondaryLink>}
        eyebrow="Edit application"
        subtitle="Update funnel status, role details, compensation, and notes."
        title={`${application.company} / ${application.role}`}
      />
      <EditApplicationForm applicationId={application.id} defaults={defaults} />
    </AppShell>
  );
}
