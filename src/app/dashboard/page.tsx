import Link from "next/link";
import { Check, CircleGauge, CircleX, TrendingUp } from "lucide-react";
import { AiMatchBadge, AppShell, ApplicationMobileCard, ButtonLink, EmptyState, MetricCard, OutcomeBadge, PageHeader, SecondaryMetric, SectionCard, StageBadge } from "@/components/application-ui";
import { formatDate } from "@/lib/applications/display";
import { getApplicationStatsForUser, getRecentApplicationsForUser, type ApplicationStats, type RecentApplication } from "@/lib/applications/service";
import { requireCurrentUser } from "@/lib/current-user";
import { t } from "@/lib/i18n/translate";

const currentDate = new Intl.DateTimeFormat("en", { weekday: "long", month: "short", day: "numeric" });

export default async function DashboardPage() {
  const user = await requireCurrentUser();
  const [stats, recentApplications] = await Promise.all([getApplicationStatsForUser(user.id), getRecentApplicationsForUser(user.id, 5)]);

  return (
    <AppShell accountLabel={user.name || user.email} currentPath="/dashboard">
      <PageHeader
        action={<ButtonLink href="/applications/new">{t("applications.list.addApplicationCta")}</ButtonLink>}
        meta={currentDate.format(new Date())}
        subtitle={t("dashboard.pageSubtitle")}
        title={t("dashboard.pageTitle")}
      />

      <PrimaryMetrics stats={stats} />
      <SecondaryMetrics stats={stats} />

      {stats.total === 0 ? (
        <EmptyState action={<ButtonLink href="/applications/new">{t("applications.list.emptyState.action")}</ButtonLink>} description={t("dashboard.emptyState.description")} title={t("dashboard.emptyState.title")} />
      ) : (
        <RecentApplications applications={recentApplications} />
      )}
    </AppShell>
  );
}

function PrimaryMetrics({ stats }: { stats: ApplicationStats }) {
  const kpis = [
    { label: t("dashboard.metrics.totalApplications"), value: stats.total, tone: "blue", icon: <TrendingUp aria-hidden="true" className="h-4 w-4" /> },
    { label: t("dashboard.metrics.inProgress"), value: stats.inProgress, tone: "blue", icon: <CircleGauge aria-hidden="true" className="h-4 w-4" /> },
    { label: t("metrics.strongAiMatches"), value: stats.strongMatches, tone: "green", icon: <Check aria-hidden="true" className="h-4 w-4" /> },
    { label: t("metrics.rejected"), value: stats.rejected, tone: "red", icon: <CircleX aria-hidden="true" className="h-4 w-4" /> },
  ] as const;

  return (
    <section aria-label={t("dashboard.primaryMetricsAriaLabel")} className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {kpis.map((kpi) => <MetricCard key={kpi.label} {...kpi} />)}
    </section>
  );
}

function SecondaryMetrics({ stats }: { stats: ApplicationStats }) {
  return (
    <section aria-label={t("dashboard.secondaryMetricsAriaLabel")} className="grid gap-3 sm:grid-cols-3">
      <SecondaryMetric label={t("dashboard.metrics.stretchAiMatches")} tone="purple" value={stats.stretchMatches} />
      <SecondaryMetric label={t("dashboard.metrics.aiLongShots")} tone="orange" value={stats.longShotMatches} />
      <SecondaryMetric label={t("metrics.offers")} tone="green" value={stats.offers} />
    </section>
  );
}

function RecentApplications({ applications }: { applications: RecentApplication[] }) {
  return (
    <SectionCard action={<Link className="text-sm font-semibold text-indigo-600 outline-none hover:text-indigo-700 focus-visible:ring-2 focus-visible:ring-indigo-500" href="/applications">{t("dashboard.recentApplications.viewAllLink")}</Link>} description={t("dashboard.recentApplications.description")} title={t("dashboard.recentApplications.title")}>
      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full table-fixed border-collapse text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
            <tr>
              <th className="w-[24%] px-5 py-3">{t("applications.table.headers.company")}</th>
              <th className="w-[24%] px-5 py-3">{t("dashboard.table.headers.role")}</th>
              <th className="w-[13%] px-5 py-3">{t("applications.table.headers.applied")}</th>
              <th className="w-[15%] px-5 py-3">{t("applications.table.headers.stage")}</th>
              <th className="w-[12%] px-5 py-3">{t("applications.table.headers.outcome")}</th>
              <th className="w-[12%] px-5 py-3">{t("applications.table.headers.aiMatch")}</th>
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
                <td className="px-5 py-4"><AiMatchBadge percentage={application.aiMatchPercentage} value={application.aiMatchClass} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="grid gap-3 p-3 lg:hidden">
        {applications.map((application) => <ApplicationMobileCard key={application.id} application={application} />)}
      </div>
    </SectionCard>
  );
}
