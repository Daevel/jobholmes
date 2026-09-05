import Link from "next/link";
import { AppHeader, AppShell, ApplicationSummaryCard, MatchBadge, OutcomeBadge, PageHeading, PrimaryLink, StageBadge } from "@/components/application-ui";
import { formatDate } from "@/lib/applications/display";
import { listApplicationsForUser } from "@/lib/applications/service";
import { requireCurrentUser } from "@/lib/current-user";

const filterOptions = [
  { label: "All", href: "/applications", value: null },
  { label: "In progress", href: "/applications?outcome=IN_PROGRESS", value: "IN_PROGRESS" },
  { label: "Rejected", href: "/applications?outcome=REJECTED", value: "REJECTED" },
  { label: "Offer", href: "/applications?outcome=OFFER", value: "OFFER" },
] as const;

export default async function ApplicationsPage({ searchParams }: { searchParams?: Promise<{ outcome?: string }> }) {
  const user = await requireCurrentUser();
  const params = await searchParams;
  const applications = await listApplicationsForUser(user.id);
  const selectedOutcome = filterOptions.find((option) => option.value === params?.outcome)?.value ?? null;
  const visibleApplications = selectedOutcome ? applications.filter((application) => application.outcome === selectedOutcome) : applications;

  return (
    <AppShell>
      <AppHeader accountLabel={user.name || user.email} />
      <PageHeading
        action={<PrimaryLink href="/applications/new">+ Add application</PrimaryLink>}
        eyebrow="Applications"
        subtitle="Browse every tracked role and keep your funnel status current."
        title="Applications"
      />

      <section className="flex flex-wrap gap-2" aria-label="Application filters">
        {filterOptions.map((option) => (
          <Link
            key={option.label}
            className={`rounded-full border px-3 py-1.5 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-zinc-500 ${selectedOutcome === option.value ? "border-zinc-500 bg-zinc-100 text-zinc-950" : "border-zinc-800 bg-zinc-900/55 text-zinc-300 hover:border-zinc-600"}`}
            href={option.href}
          >
            {option.label}
          </Link>
        ))}
      </section>

      {visibleApplications.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-zinc-700 bg-zinc-900/35 p-8 text-center">
          <h2 className="text-xl font-semibold text-zinc-100">No applications found</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-zinc-400">Add a new application or switch filters to see more tracked roles.</p>
          <div className="mt-6"><PrimaryLink href="/applications/new">Add application</PrimaryLink></div>
        </section>
      ) : (
        <section className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/45">
          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full table-fixed border-collapse text-left text-sm">
              <thead className="bg-zinc-950/55 text-xs uppercase tracking-[0.16em] text-zinc-500">
                <tr>
                  <th className="w-[21%] px-5 py-3 font-medium">Company</th>
                  <th className="w-[23%] px-5 py-3 font-medium">Role</th>
                  <th className="w-[12%] px-5 py-3 font-medium">Country</th>
                  <th className="w-[12%] px-5 py-3 font-medium">Applied</th>
                  <th className="w-[12%] px-5 py-3 font-medium">Match</th>
                  <th className="w-[10%] px-5 py-3 font-medium">Outcome</th>
                  <th className="w-[10%] px-5 py-3 font-medium">Stage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {visibleApplications.map((application) => (
                  <tr key={application.id} className="transition hover:bg-zinc-900/70">
                    <td className="px-5 py-4"><Link className="font-medium text-zinc-100 outline-none hover:text-white focus-visible:ring-2 focus-visible:ring-zinc-500" href={`/applications/${application.id}`}>{application.company}</Link></td>
                    <td className="px-5 py-4 text-zinc-300">{application.role}</td>
                    <td className="px-5 py-4 text-zinc-400">{application.country || "-"}</td>
                    <td className="px-5 py-4 text-zinc-400">{formatDate(application.appliedAt)}</td>
                    <td className="px-5 py-4"><div className="flex items-center gap-2"><MatchBadge value={application.userMatchClass} />{application.userMatchPercentage !== null ? <span className="text-zinc-400">{application.userMatchPercentage}%</span> : null}</div></td>
                    <td className="px-5 py-4"><OutcomeBadge value={application.outcome} /></td>
                    <td className="px-5 py-4"><StageBadge value={application.stage} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="grid gap-3 p-3 lg:hidden">
            {visibleApplications.map((application) => <ApplicationSummaryCard key={application.id} application={application} />)}
          </div>
        </section>
      )}
    </AppShell>
  );
}
