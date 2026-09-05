import Link from "next/link";
import { signOut } from "@/auth";
import { getApplicationStatsForUser, getRecentApplicationsForUser } from "@/lib/applications/service";
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

export default async function DashboardPage() {
  const user = await requireCurrentUser();
  const [stats, recentApplications] = await Promise.all([
    getApplicationStatsForUser(user.id),
    getRecentApplicationsForUser(user.id, 5),
  ]);
  const displayName = user.name || user.email;
  const statCards = [
    { label: "Applications", value: stats.total },
    { label: "Strong matches", value: stats.strongMatches },
    { label: "Stretch matches", value: stats.stretchMatches },
    { label: "Long-shot", value: stats.longShotMatches },
    { label: "Rejected", value: stats.rejected },
    { label: "In progress", value: stats.inProgress },
    { label: "Offers", value: stats.offers },
  ];

  return (
    <main className="min-h-screen bg-[#0b0d10] px-5 py-6 text-zinc-100 sm:px-8 lg:px-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-10">
        <header className="flex flex-col gap-4 border-b border-zinc-800 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <Link href="/" className="text-xl font-semibold tracking-tight">
                JobHolmes
              </Link>
              <span className="rounded-full border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-xs font-medium text-zinc-400">
                Alpha 0.1
              </span>
            </div>
            <p className="mt-2 text-sm text-zinc-500">Signed in as {user.email}</p>
          </div>
          <form
            action={async () => {
              "use server";
              await signOut();
            }}
          >
            <button className="rounded-lg border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-200 transition hover:border-zinc-500 hover:bg-zinc-900">
              Sign out
            </button>
          </form>
        </header>

        <section>
          <p className="text-sm uppercase tracking-[0.25em] text-zinc-500">Dashboard</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">Welcome back, {displayName}</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-400 sm:text-lg">
            Track your applications and understand where your job search is converting.
          </p>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-zinc-800 bg-zinc-900/55 p-5 shadow-sm shadow-black/20">
              <p className="text-sm text-zinc-400">{stat.label}</p>
              <p className="mt-3 text-3xl font-semibold tracking-tight text-zinc-50">{stat.value}</p>
            </div>
          ))}
        </section>

        {stats.total === 0 ? (
          <section className="rounded-3xl border border-dashed border-zinc-700 bg-zinc-900/35 p-8 text-center sm:p-12">
            <p className="text-xl font-semibold text-zinc-100">No applications yet</p>
            <p className="mx-auto mt-3 max-w-xl text-zinc-400">
              Start tracking your job search to understand where your funnel converts.
            </p>
            {/* TODO: link this to the application creation flow once it exists. */}
            <button className="mt-6 rounded-lg bg-zinc-100 px-5 py-2.5 text-sm font-semibold text-zinc-950 opacity-70" type="button">
              Add your first application
            </button>
          </section>
        ) : (
          <section className="rounded-3xl border border-zinc-800 bg-zinc-900/45 p-4 sm:p-6">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold tracking-tight">Recent applications</h2>
                <p className="mt-1 text-sm text-zinc-500">Latest 5 applications by applied date.</p>
              </div>
            </div>
            <div className="mt-5 overflow-hidden rounded-2xl border border-zinc-800">
              <div className="hidden grid-cols-[1.35fr_1.35fr_0.8fr_0.9fr_0.8fr_0.8fr_1fr] gap-4 bg-zinc-950/60 px-4 py-3 text-xs uppercase tracking-[0.18em] text-zinc-500 lg:grid">
                <span>Company</span>
                <span>Role</span>
                <span>Country</span>
                <span>Applied</span>
                <span>Match</span>
                <span>Outcome</span>
                <span>Stage</span>
              </div>
              <div className="divide-y divide-zinc-800">
                {recentApplications.map((application) => (
                  <article
                    key={application.id}
                    className="grid gap-3 px-4 py-4 text-sm text-zinc-300 lg:grid-cols-[1.35fr_1.35fr_0.8fr_0.9fr_0.8fr_0.8fr_1fr] lg:items-center lg:gap-4"
                  >
                    <div>
                      <p className="font-medium text-zinc-100 lg:hidden">{application.company}</p>
                      <p className="hidden font-medium text-zinc-100 lg:block">{application.company}</p>
                    </div>
                    <p>{application.role}</p>
                    <p className="text-zinc-400">{application.country || "-"}</p>
                    <p className="text-zinc-400">{dateFormatter.format(application.appliedAt)}</p>
                    <p>{application.userMatchClass ? matchLabels[application.userMatchClass] : "-"}</p>
                    <p>{outcomeLabels[application.outcome]}</p>
                    <p className="text-zinc-400">{stageLabels[application.stage]}</p>
                  </article>
                ))}
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
