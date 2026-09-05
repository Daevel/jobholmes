import Link from "next/link";
import { AppShell, ApplicationMobileCard, ButtonLink, EmptyState, MatchBadge, MetricCard, OutcomeBadge, PageHeader, SecondaryMetric, SectionCard, StageBadge } from "@/components/application-ui";
import { formatDate } from "@/lib/applications/display";
import { getApplicationStatsForUser, getRecentApplicationsForUser, type ApplicationStats, type RecentApplication } from "@/lib/applications/service";
import { requireCurrentUser } from "@/lib/current-user";

const currentDate = new Intl.DateTimeFormat("en", { weekday: "long", month: "short", day: "numeric" });

export default async function DashboardPage() {
  const user = await requireCurrentUser();
  const [stats, recentApplications] = await Promise.all([getApplicationStatsForUser(user.id), getRecentApplicationsForUser(user.id, 5)]);

  return (
    <AppShell accountLabel={user.name || user.email} currentPath="/dashboard">
      <PageHeader
        action={<ButtonLink href="/applications/new">+ Add application</ButtonLink>}
        meta={currentDate.format(new Date())}
        subtitle="Here's an overview of your job search."
        title="Job Search Overview"
      />

      <PrimaryMetrics stats={stats} />
      <SecondaryMetrics stats={stats} />

      {stats.total === 0 ? (
        <EmptyState action={<ButtonLink href="/applications/new">Add application</ButtonLink>} description="Start tracking your job search by adding your first application." title="No applications yet" />
      ) : (
        <RecentApplications applications={recentApplications} />
      )}
    </AppShell>
  );
}

function PrimaryMetrics({ stats }: { stats: ApplicationStats }) {
  const kpis = [
    { label: "Total applications", value: stats.total, tone: "blue", icon: <ChartIcon /> },
    { label: "In progress", value: stats.inProgress, tone: "blue", icon: <ProgressIcon /> },
    { label: "Strong matches", value: stats.strongMatches, tone: "green", icon: <MatchIcon /> },
    { label: "Rejected", value: stats.rejected, tone: "red", icon: <CloseIcon /> },
  ] as const;

  return (
    <section aria-label="Primary dashboard metrics" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {kpis.map((kpi) => <MetricCard key={kpi.label} {...kpi} />)}
    </section>
  );
}

function SecondaryMetrics({ stats }: { stats: ApplicationStats }) {
  return (
    <section aria-label="Secondary dashboard metrics" className="grid gap-3 sm:grid-cols-3">
      <SecondaryMetric label="Stretch matches" tone="purple" value={stats.stretchMatches} />
      <SecondaryMetric label="Long shot" tone="orange" value={stats.longShotMatches} />
      <SecondaryMetric label="Offers" tone="green" value={stats.offers} />
    </section>
  );
}

function RecentApplications({ applications }: { applications: RecentApplication[] }) {
  return (
    <SectionCard action={<Link className="text-sm font-semibold text-indigo-600 outline-none hover:text-indigo-700 focus-visible:ring-2 focus-visible:ring-indigo-500" href="/applications">View all &gt;</Link>} description="Latest applications by applied date." title="Recent applications">
      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full table-fixed border-collapse text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
            <tr>
              <th className="w-[24%] px-5 py-3">Company</th>
              <th className="w-[24%] px-5 py-3">Role</th>
              <th className="w-[13%] px-5 py-3">Applied</th>
              <th className="w-[15%] px-5 py-3">Stage</th>
              <th className="w-[12%] px-5 py-3">Outcome</th>
              <th className="w-[12%] px-5 py-3">Match</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {applications.map((application) => (
              <tr key={application.id} className="transition hover:bg-indigo-50/30">
                <td className="px-5 py-4"><Link className="block truncate font-semibold text-slate-950 outline-none hover:text-indigo-700 focus-visible:ring-2 focus-visible:ring-indigo-500" href={`/applications/${application.id}`}>{application.company}</Link></td>
                <td className="truncate px-5 py-4 text-slate-600">{application.role}</td>
                <td className="px-5 py-4 text-slate-500">{formatDate(application.appliedAt)}</td>
                <td className="px-5 py-4"><StageBadge value={application.stage} /></td>
                <td className="px-5 py-4"><OutcomeBadge value={application.outcome} /></td>
                <td className="px-5 py-4"><MatchBadge value={application.userMatchClass} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="grid gap-3 p-3 lg:hidden">
        {applications.map((application) => <ApplicationMobileCard key={application.id} application={{ ...application, userMatchPercentage: null }} />)}
      </div>
    </SectionCard>
  );
}

function ChartIcon() { return <svg className="h-4 w-4" width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M4 16V8m6 8V4m6 12v-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>; }
function ProgressIcon() { return <svg className="h-4 w-4" width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M10 3a7 7 0 1 1-6.3 10M10 3v7h7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>; }
function MatchIcon() { return <svg className="h-4 w-4" width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="m4 10 4 4 8-8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>; }
function CloseIcon() { return <svg className="h-4 w-4" width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="m6 6 8 8M14 6l-8 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>; }
