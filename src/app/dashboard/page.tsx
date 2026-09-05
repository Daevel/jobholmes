import Link from "next/link";
import { signOut } from "@/auth";
import {
  getApplicationStatsForUser,
  getRecentApplicationsForUser,
  type ApplicationStats,
  type RecentApplication,
} from "@/lib/applications/service";
import { requireCurrentUser } from "@/lib/current-user";

const matchLabels = {
  A_STRONG: "Strong",
  B_STRETCH: "Stretch",
  C_LONG_SHOT: "Long-shot",
} as const;

const outcomeLabels = {
  PENDING: "Pending",
  IN_PROGRESS: "In progress",
  REJECTED: "Rejected",
  WITHDRAWN: "Withdrawn",
  OFFER: "Offer",
} as const;

const stageLabels = {
  APPLICATION: "Application",
  RECRUITER_SCREENING: "Recruiter screening",
  HIRING_MANAGER: "Hiring manager",
  TECHNICAL: "Technical",
  CHALLENGE: "Challenge",
  FINAL: "Final",
  OFFER: "Offer",
} as const;

const dateFormatter = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

type BadgeTone = "neutral" | "green" | "amber" | "red" | "blue" | "purple";

const badgeClasses: Record<BadgeTone, string> = {
  neutral: "border-zinc-700 bg-zinc-900 text-zinc-300",
  green: "border-emerald-900/70 bg-emerald-950/40 text-emerald-300",
  amber: "border-amber-900/70 bg-amber-950/35 text-amber-300",
  red: "border-red-900/70 bg-red-950/35 text-red-300",
  blue: "border-sky-900/70 bg-sky-950/35 text-sky-300",
  purple: "border-violet-900/70 bg-violet-950/35 text-violet-300",
};

const matchTones = {
  A_STRONG: "green",
  B_STRETCH: "amber",
  C_LONG_SHOT: "neutral",
} as const;

const outcomeTones = {
  PENDING: "neutral",
  IN_PROGRESS: "blue",
  REJECTED: "red",
  WITHDRAWN: "neutral",
  OFFER: "green",
} as const;

export default async function DashboardPage() {
  const user = await requireCurrentUser();
  const [stats, recentApplications] = await Promise.all([
    getApplicationStatsForUser(user.id),
    getRecentApplicationsForUser(user.id, 5),
  ]);
  const accountLabel = user.name || user.email;

  return (
    <main className="min-h-screen bg-[#0b0d10] px-4 py-5 text-zinc-100 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <AppHeader accountLabel={accountLabel} />
        <DashboardHeading />
        <PrimaryKpis stats={stats} />
        <SecondaryFunnel stats={stats} />

        {stats.total === 0 ? (
          <EmptyState />
        ) : (
          <RecentApplications applications={recentApplications} />
        )}
      </div>
    </main>
  );
}

function AppHeader({ accountLabel }: { accountLabel: string }) {
  return (
    <header className="flex flex-col gap-4 border-b border-zinc-800/80 pb-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <Link className="rounded-md text-lg font-semibold tracking-tight text-zinc-50 outline-none transition hover:text-white focus-visible:ring-2 focus-visible:ring-zinc-500" href="/">
          JobHolmes
        </Link>
        <span className="rounded-full border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-xs font-medium text-zinc-400">Alpha 0.1</span>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <p className="max-w-72 truncate text-sm text-zinc-400 sm:text-right">{accountLabel}</p>
        <form
          action={async () => {
            "use server";
            await signOut();
          }}
        >
          <button className="w-full rounded-lg border border-zinc-700 px-3.5 py-2 text-sm font-medium text-zinc-300 outline-none transition hover:border-zinc-500 hover:bg-zinc-900 focus-visible:ring-2 focus-visible:ring-zinc-500 sm:w-auto">
            Sign out
          </button>
        </form>
      </div>
    </header>
  );
}

function DashboardHeading() {
  return (
    <section className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
      <div>
        <p className="text-sm font-medium uppercase tracking-[0.22em] text-zinc-500">Dashboard</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-50 sm:text-4xl">Job Search Overview</h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-zinc-400">
          Track your applications and understand where your job search is converting.
        </p>
      </div>
      <Link
        className="inline-flex items-center justify-center rounded-lg bg-zinc-100 px-4 py-2.5 text-sm font-semibold text-zinc-950 outline-none transition hover:bg-white focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0d10]"
        href="/applications/new"
      >
        + Add application
      </Link>
    </section>
  );
}

function PrimaryKpis({ stats }: { stats: ApplicationStats }) {
  const kpis = [
    { label: "Applications", value: stats.total, description: "Total tracked roles" },
    { label: "Strong matches", value: stats.strongMatches, description: "Best-fit opportunities" },
    { label: "In progress", value: stats.inProgress, description: "Active pipeline" },
    { label: "Rejected", value: stats.rejected, description: "Closed as no" },
  ];

  return (
    <section aria-label="Primary dashboard metrics" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {kpis.map((kpi) => (
        <KpiCard key={kpi.label} {...kpi} />
      ))}
    </section>
  );
}

function KpiCard({ label, value, description }: { label: string; value: number; description: string }) {
  return (
    <article className="rounded-2xl border border-zinc-800 bg-zinc-900/55 p-5 shadow-[0_1px_0_rgba(255,255,255,0.03)]">
      <p className="text-sm font-medium text-zinc-400">{label}</p>
      <p className="mt-3 text-4xl font-semibold tracking-tight text-zinc-50">{value}</p>
      <p className="mt-2 text-sm text-zinc-500">{description}</p>
    </article>
  );
}

function SecondaryFunnel({ stats }: { stats: ApplicationStats }) {
  const metrics = [
    { label: "Stretch matches", value: stats.stretchMatches },
    { label: "Long-shot", value: stats.longShotMatches },
    { label: "Offers", value: stats.offers },
  ];

  return (
    <section aria-label="Secondary funnel metrics" className="rounded-2xl border border-zinc-800 bg-zinc-950/35 px-4 py-3">
      <div className="flex flex-col gap-2 text-sm text-zinc-400 sm:flex-row sm:flex-wrap sm:items-center">
        {metrics.map((metric, index) => (
          <div key={metric.label} className="flex items-center gap-2">
            {index > 0 ? <span className="hidden text-zinc-700 sm:inline">/</span> : null}
            <span>{metric.label}</span>
            <span className="rounded-md border border-zinc-800 bg-zinc-900 px-2 py-0.5 font-medium text-zinc-100">{metric.value}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function EmptyState() {
  return (
    <section className="rounded-2xl border border-dashed border-zinc-700 bg-zinc-900/35 p-8 text-center sm:p-10">
      <h2 className="text-xl font-semibold text-zinc-100">No applications yet</h2>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-zinc-400">Start tracking your job search by adding your first application.</p>
      <Link
        className="mt-6 inline-flex rounded-lg bg-zinc-100 px-5 py-2.5 text-sm font-semibold text-zinc-950 outline-none transition hover:bg-white focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0d10]"
        href="/applications/new"
      >
        Add your first application
      </Link>
    </section>
  );
}

function RecentApplications({ applications }: { applications: RecentApplication[] }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/45 shadow-[0_1px_0_rgba(255,255,255,0.03)]">
      <div className="border-b border-zinc-800 px-5 py-4 sm:px-6">
        <h2 className="text-lg font-semibold tracking-tight text-zinc-50">Recent applications</h2>
        <p className="mt-1 text-sm text-zinc-500">Latest 5 applications by applied date.</p>
      </div>
      <ApplicationsTable applications={applications} />
      <ApplicationsMobileList applications={applications} />
    </section>
  );
}

function ApplicationsTable({ applications }: { applications: RecentApplication[] }) {
  return (
    <div className="hidden overflow-x-auto lg:block">
      <table className="w-full table-fixed border-collapse text-left text-sm">
        <thead className="bg-zinc-950/55 text-xs uppercase tracking-[0.16em] text-zinc-500">
          <tr>
            <th className="w-[21%] px-5 py-3 font-medium">Company</th>
            <th className="w-[23%] px-5 py-3 font-medium">Role</th>
            <th className="w-[12%] px-5 py-3 font-medium">Country</th>
            <th className="w-[12%] px-5 py-3 font-medium">Applied</th>
            <th className="w-[10%] px-5 py-3 font-medium">Match</th>
            <th className="w-[11%] px-5 py-3 font-medium">Outcome</th>
            <th className="w-[11%] px-5 py-3 font-medium">Stage</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800">
          {applications.map((application) => (
            <tr key={application.id} className="transition hover:bg-zinc-900/70">
              <td className="px-5 py-4 font-medium text-zinc-100">{application.company}</td>
              <td className="px-5 py-4 text-zinc-300">{application.role}</td>
              <td className="px-5 py-4 text-zinc-400">{application.country || "-"}</td>
              <td className="px-5 py-4 text-zinc-400">{dateFormatter.format(application.appliedAt)}</td>
              <td className="px-5 py-4"><MatchBadge value={application.userMatchClass} /></td>
              <td className="px-5 py-4"><OutcomeBadge value={application.outcome} /></td>
              <td className="px-5 py-4"><StageBadge value={application.stage} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ApplicationsMobileList({ applications }: { applications: RecentApplication[] }) {
  return (
    <div className="divide-y divide-zinc-800 lg:hidden">
      {applications.map((application) => (
        <article key={application.id} className="px-5 py-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-medium text-zinc-100">{application.company}</h3>
              <p className="mt-1 text-sm text-zinc-400">{application.role}</p>
            </div>
            <OutcomeBadge value={application.outcome} />
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <MobileMetric label="Country" value={application.country || "-"} />
            <MobileMetric label="Applied" value={dateFormatter.format(application.appliedAt)} />
            <div>
              <dt className="text-zinc-500">Match</dt>
              <dd className="mt-1"><MatchBadge value={application.userMatchClass} /></dd>
            </div>
            <div>
              <dt className="text-zinc-500">Stage</dt>
              <dd className="mt-1"><StageBadge value={application.stage} /></dd>
            </div>
          </dl>
        </article>
      ))}
    </div>
  );
}

function MobileMetric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-zinc-500">{label}</dt>
      <dd className="mt-1 text-zinc-300">{value}</dd>
    </div>
  );
}

function MatchBadge({ value }: { value: RecentApplication["userMatchClass"] }) {
  if (!value) return <Badge tone="neutral">-</Badge>;
  return <Badge tone={matchTones[value]}>{matchLabels[value]}</Badge>;
}

function OutcomeBadge({ value }: { value: RecentApplication["outcome"] }) {
  return <Badge tone={outcomeTones[value]}>{outcomeLabels[value]}</Badge>;
}

function StageBadge({ value }: { value: RecentApplication["stage"] }) {
  return <Badge tone="purple">{stageLabels[value]}</Badge>;
}

function Badge({ children, tone }: { children: React.ReactNode; tone: BadgeTone }) {
  return <span className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-medium ${badgeClasses[tone]}`}>{children}</span>;
}
