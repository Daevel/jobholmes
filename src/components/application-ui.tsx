import Link from "next/link";
import { signOut } from "@/auth";
import type { applications } from "@/db/schema";
import { matchLabels, outcomeLabels, stageLabels, formatDate } from "@/lib/applications/display";

type Application = typeof applications.$inferSelect;
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

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-[#0b0d10] px-4 py-5 text-zinc-100 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">{children}</div>
    </main>
  );
}

export function AppHeader({ accountLabel }: { accountLabel: string }) {
  return (
    <header className="flex flex-col gap-4 border-b border-zinc-800/80 pb-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-3">
        <Link className="rounded-md text-lg font-semibold tracking-tight text-zinc-50 outline-none transition hover:text-white focus-visible:ring-2 focus-visible:ring-zinc-500" href="/dashboard">
          JobHolmes
        </Link>
        <span className="rounded-full border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-xs font-medium text-zinc-400">Alpha 0.1</span>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <p className="max-w-72 truncate text-sm text-zinc-400 sm:text-right">{accountLabel}</p>
        <nav className="flex items-center gap-2 text-sm" aria-label="Primary navigation">
          <Link className="rounded-lg px-3 py-2 text-zinc-300 outline-none transition hover:bg-zinc-900 hover:text-zinc-100 focus-visible:ring-2 focus-visible:ring-zinc-500" href="/dashboard">
            Dashboard
          </Link>
          <Link className="rounded-lg px-3 py-2 text-zinc-300 outline-none transition hover:bg-zinc-900 hover:text-zinc-100 focus-visible:ring-2 focus-visible:ring-zinc-500" href="/applications">
            Applications
          </Link>
        </nav>
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

export function PageHeading({ title, subtitle, eyebrow, action }: { title: string; subtitle: string; eyebrow?: string; action?: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        {eyebrow ? <p className="text-sm font-medium uppercase tracking-[0.22em] text-zinc-500">{eyebrow}</p> : null}
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-50 sm:text-4xl">{title}</h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-zinc-400">{subtitle}</p>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </section>
  );
}

export function PrimaryLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link className="inline-flex items-center justify-center rounded-lg bg-zinc-100 px-4 py-2.5 text-sm font-semibold text-zinc-950 outline-none transition hover:bg-white focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0d10]" href={href}>
      {children}
    </Link>
  );
}

export function SecondaryLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link className="inline-flex items-center justify-center rounded-lg border border-zinc-700 px-4 py-2.5 text-sm font-medium text-zinc-200 outline-none transition hover:border-zinc-500 hover:bg-zinc-900 focus-visible:ring-2 focus-visible:ring-zinc-500" href={href}>
      {children}
    </Link>
  );
}

export function Badge({ children, tone }: { children: React.ReactNode; tone: BadgeTone }) {
  return <span className={`inline-flex max-w-full whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-medium ${badgeClasses[tone]}`}>{children}</span>;
}

export function MatchBadge({ value }: { value: Application["userMatchClass"] }) {
  if (!value) return <Badge tone="neutral">-</Badge>;
  return <Badge tone={matchTones[value]}>{matchLabels[value]}</Badge>;
}

export function OutcomeBadge({ value }: { value: Application["outcome"] }) {
  return <Badge tone={outcomeTones[value]}>{outcomeLabels[value]}</Badge>;
}

export function StageBadge({ value }: { value: Application["stage"] }) {
  return <Badge tone="purple">{stageLabels[value]}</Badge>;
}

export function ApplicationSummaryCard({ application }: { application: Pick<Application, "id" | "company" | "role" | "country" | "appliedAt" | "userMatchClass" | "userMatchPercentage" | "outcome" | "stage"> }) {
  return (
    <Link className="block rounded-2xl border border-zinc-800 bg-zinc-900/45 p-4 outline-none transition hover:border-zinc-700 hover:bg-zinc-900/70 focus-visible:ring-2 focus-visible:ring-zinc-500" href={`/applications/${application.id}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="truncate font-medium text-zinc-100">{application.company}</h3>
          <p className="mt-1 line-clamp-2 text-sm text-zinc-400">{application.role}</p>
        </div>
        <OutcomeBadge value={application.outcome} />
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <MobileMetric label="Country" value={application.country || "-"} />
        <MobileMetric label="Applied" value={formatDate(application.appliedAt)} />
        <div>
          <dt className="text-zinc-500">Match</dt>
          <dd className="mt-1 flex items-center gap-2"><MatchBadge value={application.userMatchClass} />{application.userMatchPercentage !== null ? <span className="text-zinc-400">{application.userMatchPercentage}%</span> : null}</dd>
        </div>
        <div>
          <dt className="text-zinc-500">Stage</dt>
          <dd className="mt-1"><StageBadge value={application.stage} /></dd>
        </div>
      </dl>
    </Link>
  );
}

export function MobileMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-zinc-500">{label}</dt>
      <dd className="mt-1 truncate text-zinc-300">{value}</dd>
    </div>
  );
}
