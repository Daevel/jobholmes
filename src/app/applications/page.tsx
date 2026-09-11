import Link from "next/link";
import { AiMatchBadge, AppShell, ApplicationMobileCard, ButtonLink, EmptyState, OutcomeBadge, PageHeader, SectionCard, StageBadge } from "@/components/application-ui";
import { SortableHeader } from "@/components/sortable-header";
import { formatDate, matchLabels, outcomeLabels, stageLabels } from "@/lib/applications/display";
import { AI_MATCH_UNANALYZED, matchesAiMatchFilter, type AiMatchFilter } from "@/lib/applications/ai-match";
import { listApplicationsForUser } from "@/lib/applications/service";
import { isSortDirection, isSortField, type SortDirection, type SortField } from "@/lib/applications/sort-order";
import { requireCurrentUser } from "@/lib/current-user";
import { ApplicationsFilters } from "@/app/applications/applications-filters";

const filterOptions = [
  { label: "All", href: "/applications", value: null },
  { label: "In progress", href: "/applications?outcome=IN_PROGRESS", value: "IN_PROGRESS" },
  { label: "Rejected", href: "/applications?outcome=REJECTED", value: "REJECTED" },
  { label: "Offer", href: "/applications?outcome=OFFER", value: "OFFER" },
] as const;

export default async function ApplicationsPage({ searchParams }: { searchParams?: Promise<{ outcome?: string; q?: string; stage?: string; match?: string; sort?: string; dir?: string }> }) {
  const user = await requireCurrentUser();
  const params = await searchParams;
  const sortField: SortField = isSortField(params?.sort) ? params.sort : "appliedAt";
  const sortDirection: SortDirection = isSortDirection(params?.dir) ? params.dir : "desc";
  const applications = await listApplicationsForUser(user.id, { field: sortField, direction: sortDirection });
  const selectedOutcome = filterOptions.find((option) => option.value === params?.outcome)?.value ?? null;
  const selectedStage = params?.stage && params.stage in stageLabels ? params.stage : "";
  const selectedMatch: AiMatchFilter = params?.match === AI_MATCH_UNANALYZED || (params?.match && params.match in matchLabels) ? params.match as AiMatchFilter : "";
  const query = params?.q?.trim().toLowerCase() ?? "";
  const visibleApplications = applications.filter((application) => {
    if (selectedOutcome && application.outcome !== selectedOutcome) return false;
    if (selectedStage && application.stage !== selectedStage) return false;
    if (!matchesAiMatchFilter(application, selectedMatch)) return false;
    if (query && !`${application.company} ${application.role}`.toLowerCase().includes(query)) return false;
    return true;
  });
  const preservedParams = { q: params?.q || undefined, stage: selectedStage || undefined, match: selectedMatch || undefined, outcome: selectedOutcome || undefined };

  return (
    <AppShell accountLabel={user.name || user.email} contentSize="wide" currentPath="/applications">
      <PageHeader action={<ButtonLink href="/applications/new">+ Add application</ButtonLink>} subtitle="All your job applications in one place." title="Applications" />

      <section className="flex flex-wrap gap-2" aria-label="Application status filters">
        {filterOptions.map((option) => (
          <Link key={option.label} className={`rounded-lg border px-3 py-2 text-sm font-semibold outline-none transition focus-visible:ring-2 focus-visible:ring-indigo-500 ${selectedOutcome === option.value ? "border-indigo-200 bg-indigo-50 text-indigo-700" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-950"}`} href={option.href}>
            {option.label}
          </Link>
        ))}
      </section>

      <ApplicationsFilters>
        {visibleApplications.length === 0 ? (
          <EmptyState action={<ButtonLink href="/applications/new">Add application</ButtonLink>} description="Add a new application or switch filters to see more tracked roles." title="No applications found" />
        ) : (
          <ApplicationsTable applications={visibleApplications} preservedParams={preservedParams} sortDirection={sortDirection} sortField={sortField} />
        )}
      </ApplicationsFilters>
    </AppShell>
  );
}

function ApplicationsTable({
  applications,
  sortField,
  sortDirection,
  preservedParams,
}: {
  applications: Awaited<ReturnType<typeof listApplicationsForUser>>;
  sortField: SortField;
  sortDirection: SortDirection;
  preservedParams: { q?: string; stage?: string; match?: string; outcome?: string };
}) {
  return (
    <SectionCard>
      <div className="hidden xl:block">
        <table className="w-full table-fixed border-collapse text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
            <tr>
              <SortableHeader className="w-[27%] px-3 py-3" currentDirection={sortDirection} currentField={sortField} field="company" label="Company" preservedParams={preservedParams} />
              <th className="w-[12%] px-3 py-3">Country</th>
              <SortableHeader className="w-[12%] px-3 py-3" currentDirection={sortDirection} currentField={sortField} field="appliedAt" label="Applied" preservedParams={preservedParams} />
              <SortableHeader className="w-[13%] px-3 py-3" currentDirection={sortDirection} currentField={sortField} field="stage" label="Stage" preservedParams={preservedParams} />
              <SortableHeader className="w-[11%] px-3 py-3" currentDirection={sortDirection} currentField={sortField} field="outcome" label="Outcome" preservedParams={preservedParams} />
              <SortableHeader className="w-[13%] px-3 py-3" currentDirection={sortDirection} currentField={sortField} field="aiMatch" label="AI Match" preservedParams={preservedParams} />
              <th className="w-[6%] px-3 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {applications.map((application) => (
              <tr key={application.id} className="transition hover:bg-indigo-50/30">
                <td className="px-3 py-4 xl:px-4">
                  <Link className="block min-w-0 rounded outline-none focus-visible:ring-2 focus-visible:ring-indigo-500" href={`/applications/${application.id}`}>
                    <span className="block truncate font-semibold text-slate-950">{application.company}</span>
                    <span className="mt-1 block truncate text-sm text-slate-500">{application.role}</span>
                  </Link>
                </td>
                <td className="truncate px-3 py-4 text-slate-500">{application.country || "-"}</td>
                <td className="whitespace-nowrap px-3 py-4 text-slate-500">{formatDate(application.appliedAt)}</td>
                <td className="px-3 py-4"><StageBadge value={application.stage} /></td>
                <td className="px-3 py-4"><OutcomeBadge value={application.outcome} /></td>
                <td className="px-3 py-4"><AiMatchBadge percentage={application.aiMatchPercentage} value={application.aiMatchClass} /></td>
                <td className="px-3 py-4"><Link className="text-sm font-semibold text-indigo-600 outline-none hover:text-indigo-700 focus-visible:ring-2 focus-visible:ring-indigo-500" href={`/applications/${application.id}`}>View</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="grid gap-3 p-3 xl:hidden">
        {applications.map((application) => <ApplicationMobileCard key={application.id} application={application} />)}
      </div>
    </SectionCard>
  );
}
