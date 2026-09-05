import Link from "next/link";
import { AiMatchBadge, AppShell, ApplicationMobileCard, ButtonLink, EmptyState, MatchBadge, OutcomeBadge, PageHeader, SectionCard, StageBadge } from "@/components/application-ui";
import { formatDate, matchLabels, outcomeLabels, stageLabels } from "@/lib/applications/display";
import { listApplicationsForUser } from "@/lib/applications/service";
import { requireCurrentUser } from "@/lib/current-user";

const filterOptions = [
  { label: "All", href: "/applications", value: null },
  { label: "In progress", href: "/applications?outcome=IN_PROGRESS", value: "IN_PROGRESS" },
  { label: "Rejected", href: "/applications?outcome=REJECTED", value: "REJECTED" },
  { label: "Offer", href: "/applications?outcome=OFFER", value: "OFFER" },
] as const;

export default async function ApplicationsPage({ searchParams }: { searchParams?: Promise<{ outcome?: string; q?: string; stage?: string; match?: string }> }) {
  const user = await requireCurrentUser();
  const params = await searchParams;
  const applications = await listApplicationsForUser(user.id);
  const selectedOutcome = filterOptions.find((option) => option.value === params?.outcome)?.value ?? null;
  const selectedStage = params?.stage && params.stage in stageLabels ? params.stage : "";
  const selectedMatch = params?.match && params.match in matchLabels ? params.match : "";
  const query = params?.q?.trim().toLowerCase() ?? "";
  const visibleApplications = applications.filter((application) => {
    if (selectedOutcome && application.outcome !== selectedOutcome) return false;
    if (selectedStage && application.stage !== selectedStage) return false;
    if (selectedMatch && application.userMatchClass !== selectedMatch) return false;
    if (query && !`${application.company} ${application.role}`.toLowerCase().includes(query)) return false;
    return true;
  });

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

      <form className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] md:grid-cols-[1fr_180px_180px_auto]" action="/applications">
        {selectedOutcome ? <input name="outcome" type="hidden" value={selectedOutcome} /> : null}
        <label className="text-sm font-medium text-slate-700">
          Search company or role
          <input className="mt-2 h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-3 focus:ring-indigo-100" defaultValue={params?.q ?? ""} name="q" placeholder="Company or role" type="search" />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Stage
          <select className="mt-2 h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-3 focus:ring-indigo-100" defaultValue={selectedStage} name="stage">
            <option value="">Any stage</option>
            {Object.entries(stageLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <label className="text-sm font-medium text-slate-700">
          Match
          <select className="mt-2 h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-3 focus:ring-indigo-100" defaultValue={selectedMatch} name="match">
            <option value="">Any match</option>
            {Object.entries(matchLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <div className="flex items-end gap-2">
          <button className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white outline-none transition hover:bg-indigo-700 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 md:w-auto" type="submit">Filter</button>
        </div>
      </form>

      {visibleApplications.length === 0 ? (
        <EmptyState action={<ButtonLink href="/applications/new">Add application</ButtonLink>} description="Add a new application or switch filters to see more tracked roles." title="No applications found" />
      ) : (
        <ApplicationsTable applications={visibleApplications} />
      )}
    </AppShell>
  );
}

function ApplicationsTable({ applications }: { applications: Awaited<ReturnType<typeof listApplicationsForUser>> }) {
  return (
    <SectionCard>
      <div className="hidden xl:block">
        <table className="w-full table-fixed border-collapse text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
            <tr>
              <th className="w-[24%] px-3 py-3">Company</th>
              <th className="w-[12%] px-3 py-3">Country</th>
              <th className="w-[12%] px-3 py-3">Applied</th>
              <th className="w-[13%] px-3 py-3">Stage</th>
              <th className="w-[11%] px-3 py-3">Outcome</th>
              <th className="w-[12%] px-3 py-3">Your Match</th>
              <th className="w-[10%] px-3 py-3">AI Match</th>
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
                <td className="px-3 py-4"><div className="flex flex-wrap items-center gap-2"><MatchBadge value={application.userMatchClass} />{application.userMatchPercentage !== null ? <span className="text-xs font-medium text-slate-500">{application.userMatchPercentage}%</span> : null}</div></td>
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
