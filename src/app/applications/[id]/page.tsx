import { notFound } from "next/navigation";
import { AppHeader, AppShell, MatchBadge, OutcomeBadge, PageHeading, SecondaryLink, StageBadge } from "@/components/application-ui";
import { formatDate, formatSalary, getDaysToResponse } from "@/lib/applications/display";
import { getApplicationForUser } from "@/lib/applications/service";
import { requireCurrentUser } from "@/lib/current-user";

export default async function ApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireCurrentUser();
  const { id } = await params;
  const application = await getApplicationForUser(user.id, id);

  if (!application) notFound();

  const daysToResponse = getDaysToResponse(application);

  return (
    <AppShell>
      <AppHeader accountLabel={user.name || user.email} />
      <PageHeading
        action={<div className="flex flex-col gap-3 sm:flex-row"><SecondaryLink href="/applications">Back to applications</SecondaryLink><SecondaryLink href={`/applications/${application.id}/edit`}>Edit application</SecondaryLink></div>}
        eyebrow="Application"
        subtitle="Review the role, match, funnel status, compensation, and notes."
        title={`${application.company} / ${application.role}`}
      />

      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <DetailSection title="Overview">
          <DetailItem label="Company" value={application.company} />
          <DetailItem label="Role" value={application.role} />
          <DetailItem label="Role category" value={application.roleCategory} />
          <DetailItem label="Seniority" value={application.seniority} />
          <DetailItem label="Country" value={application.country} />
          <DetailItem label="Work mode" value={application.workMode} />
          <DetailItem label="Source" value={application.source} />
          <DetailItem label="Applied date" value={formatDate(application.appliedAt)} />
          <DetailItem label="CV version" value={application.cvVersion} />
          <DetailItem label="Vacancy URL" value={application.vacancyUrl} wrap />
        </DetailSection>

        <DetailSection title="Funnel">
          <BadgeItem label="Outcome"><OutcomeBadge value={application.outcome} /></BadgeItem>
          <BadgeItem label="Stage"><StageBadge value={application.stage} /></BadgeItem>
          <DetailItem label="Response date" value={formatDate(application.responseAt)} />
          <DetailItem label="Days to response" value={daysToResponse === null ? "-" : String(daysToResponse)} />
        </DetailSection>

        <DetailSection title="Match">
          <BadgeItem label="Match class"><MatchBadge value={application.userMatchClass} /></BadgeItem>
          <DetailItem label="Match percentage" value={application.userMatchPercentage === null ? "-" : `${application.userMatchPercentage}%`} />
          <DetailItem label="Requirements / gaps" value={application.requirementsAndGaps} wrap />
        </DetailSection>

        <DetailSection title="Compensation & Authorization">
          <DetailItem label="Salary" value={formatSalary(application)} />
          <DetailItem label="Work authorization" value={application.workAuthorization} />
          <DetailItem label="Sponsorship required" value={application.sponsorshipRequired ? "Yes" : "No"} />
        </DetailSection>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/45 p-5 lg:col-span-2">
          <h2 className="text-lg font-semibold tracking-tight text-zinc-50">Notes</h2>
          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <DetailItem label="Rejection reason" value={application.rejectionReason} wrap />
            <DetailItem label="Notes" value={application.notes} wrap />
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="rounded-2xl border border-zinc-800 bg-zinc-900/45 p-5"><h2 className="text-lg font-semibold tracking-tight text-zinc-50">{title}</h2><dl className="mt-5 grid gap-4 sm:grid-cols-2">{children}</dl></section>;
}

function DetailItem({ label, value, wrap = false }: { label: string; value: string | null; wrap?: boolean }) {
  return <div className="min-w-0"><dt className="text-sm text-zinc-500">{label}</dt><dd className={`mt-1 text-sm text-zinc-200 ${wrap ? "whitespace-pre-wrap break-words leading-6" : "truncate"}`}>{value || "-"}</dd></div>;
}

function BadgeItem({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><dt className="text-sm text-zinc-500">{label}</dt><dd className="mt-1">{children}</dd></div>;
}
