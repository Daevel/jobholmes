import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell, ButtonLink, DetailField, MatchBadge, OutcomeBadge, SectionCard, StageBadge } from "@/components/application-ui";
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
    <AppShell accountLabel={user.name || user.email} currentPath="/applications">
      <Link className="w-fit text-sm font-semibold text-slate-500 outline-none transition hover:text-indigo-700 focus-visible:ring-2 focus-visible:ring-indigo-500" href="/applications">&lt;- Back to applications</Link>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="break-words text-2xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-3xl">{application.company}</h1>
              <MatchBadge value={application.userMatchClass} />
            </div>
            <p className="mt-2 break-words text-base text-slate-600 sm:text-lg">{application.role}</p>
            <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
              <HeaderField label="Country" value={application.country} />
              <HeaderField label="Work mode" value={application.workMode} />
              <HeaderField label="Category" value={application.roleCategory} />
              <HeaderField label="Applied on" value={formatDate(application.appliedAt)} />
            </dl>
          </div>
          <div className="flex shrink-0 flex-col gap-2 sm:flex-row lg:flex-col">
            <ButtonLink href={`/applications/${application.id}/edit`} variant="secondary">Edit</ButtonLink>
          </div>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-2">
        <SectionCard className="p-5" title="Overview">
          <dl className="grid gap-5 sm:grid-cols-2">
            <DetailField label="Company" value={application.company} />
            <DetailField label="Role" value={application.role} />
            <DetailField label="Role category" value={application.roleCategory} />
            <DetailField label="Seniority" value={application.seniority} />
            <DetailField label="Country" value={application.country} />
            <DetailField label="Work mode" value={application.workMode} />
            <DetailField label="Source" value={application.source} />
            <DetailField label="CV version" value={application.cvVersion} />
            <DetailField label="Applied date" value={formatDate(application.appliedAt)} />
            <DetailField label="Vacancy URL" value={application.vacancyUrl} wide wrap />
          </dl>
        </SectionCard>

        <SectionCard className="p-5" title="Match">
          <dl className="grid gap-5 sm:grid-cols-2">
            <DetailField label="Match classification"><MatchBadge value={application.userMatchClass} /></DetailField>
            <DetailField label="Match percentage" value={application.userMatchPercentage === null ? "-" : `${application.userMatchPercentage}%`} />
            <DetailField label="Requirements / gaps" value={application.requirementsAndGaps} wide wrap />
          </dl>
        </SectionCard>

        <SectionCard className="p-5" title="Funnel">
          <dl className="grid gap-5 sm:grid-cols-2">
            <DetailField label="Current stage"><StageBadge value={application.stage} /></DetailField>
            <DetailField label="Outcome"><OutcomeBadge value={application.outcome} /></DetailField>
            <DetailField label="Response date" value={formatDate(application.responseAt)} />
            <DetailField label="Days to response" value={daysToResponse === null ? "-" : String(daysToResponse)} />
            <DetailField label="Rejection reason" value={application.rejectionReason} wide wrap />
          </dl>
        </SectionCard>

        <SectionCard className="p-5" title="Compensation">
          <dl className="grid gap-5 sm:grid-cols-2">
            <DetailField label="Salary range" value={formatSalary(application)} />
            <DetailField label="Currency" value={application.currency} />
            <DetailField label="Work authorization" value={application.workAuthorization} />
            <DetailField label="Sponsorship required" value={application.sponsorshipRequired ? "Yes" : "No"} />
          </dl>
        </SectionCard>

        <SectionCard className="p-5 xl:col-span-2" title="Notes">
          <div className="max-w-4xl whitespace-pre-wrap break-words text-sm leading-7 text-slate-700">{application.notes || "-"}</div>
        </SectionCard>
      </div>
    </AppShell>
  );
}

function HeaderField({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium uppercase tracking-[0.12em] text-slate-400">{label}</dt>
      <dd className="mt-1 truncate font-medium text-slate-800">{value || "-"}</dd>
    </div>
  );
}
