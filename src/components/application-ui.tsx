import Link from "next/link";
import { signOut } from "@/auth";
import type { applications } from "@/db/schema";
import { formatDate, matchLabels, outcomeLabels, stageLabels } from "@/lib/applications/display";

type Application = typeof applications.$inferSelect;
type BadgeTone = "neutral" | "green" | "amber" | "red" | "blue" | "purple" | "orange";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: DashboardIcon },
  { label: "Applications", href: "/applications", icon: ListIcon },
  { label: "Add application", href: "/applications/new", icon: PlusIcon },
];

const badgeClasses: Record<BadgeTone, string> = {
  neutral: "border-slate-200 bg-slate-50 text-slate-700",
  green: "border-emerald-200 bg-emerald-50 text-emerald-700",
  amber: "border-amber-200 bg-amber-50 text-amber-800",
  red: "border-red-200 bg-red-50 text-red-700",
  blue: "border-blue-200 bg-blue-50 text-blue-700",
  purple: "border-violet-200 bg-violet-50 text-violet-700",
  orange: "border-orange-200 bg-orange-50 text-orange-700",
};

const matchTones = {
  A_STRONG: "green",
  B_STRETCH: "purple",
  C_LONG_SHOT: "orange",
} as const;

const outcomeTones = {
  PENDING: "amber",
  IN_PROGRESS: "blue",
  REJECTED: "red",
  WITHDRAWN: "neutral",
  OFFER: "green",
} as const;

export function AppShell({ children, accountLabel, currentPath, contentSize = "normal" }: { children: React.ReactNode; accountLabel: string; currentPath: string; contentSize?: "normal" | "wide" }) {
  const contentWidth = contentSize === "wide" ? "max-w-[1320px]" : "max-w-[1180px]";

  return (
    <div className="min-h-screen bg-[#F7F8FA] text-slate-900">
      <DesktopSidebar accountLabel={accountLabel} currentPath={currentPath} />
      <MobileHeader accountLabel={accountLabel} />
      <main className="mx-auto w-full max-w-[1360px] px-4 pb-24 pt-5 sm:px-6 md:pt-8 lg:pl-[264px] lg:pr-8">
        <div className={`mx-auto flex w-full ${contentWidth} flex-col gap-6 sm:gap-8`}>{children}</div>
      </main>
      <MobileNavigation currentPath={currentPath} />
    </div>
  );
}

export function PageHeader({ title, subtitle, eyebrow, action, meta }: { title: string; subtitle?: string; eyebrow?: string; action?: React.ReactNode; meta?: React.ReactNode }) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow ? <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">{eyebrow}</p> : null}
        <h1 className="mt-2 break-words text-2xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-3xl">{title}</h1>
        {subtitle ? <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">{subtitle}</p> : null}
        {meta ? <div className="mt-3 text-sm text-slate-500">{meta}</div> : null}
      </div>
      {action ? <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center">{action}</div> : null}
    </header>
  );
}

export function SectionCard({ title, description, action, children, className = "" }: { title?: string; description?: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] ${className}`}>
      {title || description || action ? (
        <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-end sm:justify-between sm:px-5">
          <div>
            {title ? <h2 className="text-lg font-semibold tracking-[-0.02em] text-slate-950">{title}</h2> : null}
            {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function MetricCard({ label, value, tone = "blue", icon }: { label: string; value: number; tone?: BadgeTone; icon: React.ReactNode }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <span className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border ${badgeClasses[tone]}`}>{icon}</span>
      </div>
      <p className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-slate-950">{value}</p>
    </article>
  );
}

export function SecondaryMetric({ label, value, tone = "neutral" }: { label: string; value: number; tone?: BadgeTone }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 bg-white px-4 py-3">
      <span className="text-sm font-medium text-slate-500">{label}</span>
      <span className={`rounded-md border px-2 py-1 text-sm font-semibold ${badgeClasses[tone]}`}>{value}</span>
    </div>
  );
}

export function ButtonLink({ href, children, variant = "primary" }: { href: string; children: React.ReactNode; variant?: "primary" | "secondary" | "ghost" | "danger" }) {
  return (
    <Link className={buttonClasses(variant)} href={href}>
      {children}
    </Link>
  );
}

export function Button({ children, variant = "primary", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" | "danger" }) {
  return (
    <button className={buttonClasses(variant)} {...props}>
      {children}
    </button>
  );
}

export function EmptyState({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-dashed border-slate-300 bg-white px-5 py-10 text-center shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <h2 className="text-lg font-semibold tracking-[-0.02em] text-slate-950">{title}</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </section>
  );
}

export function Badge({ children, tone }: { children: React.ReactNode; tone: BadgeTone }) {
  return <span className={`inline-flex max-w-full items-center whitespace-nowrap rounded-md border px-2 py-1 text-xs font-medium leading-none ${badgeClasses[tone]}`}>{children}</span>;
}

export function MatchBadge({ value }: { value: Application["userMatchClass"] }) {
  if (!value) return <Badge tone="neutral">Not set</Badge>;
  return <Badge tone={matchTones[value]}>{matchLabels[value]}</Badge>;
}

export function OutcomeBadge({ value }: { value: Application["outcome"] }) {
  return <Badge tone={outcomeTones[value]}>{outcomeLabels[value]}</Badge>;
}

export function StageBadge({ value }: { value: Application["stage"] }) {
  return <Badge tone="blue">{stageLabels[value]}</Badge>;
}

export function ApplicationMobileCard({ application }: { application: Pick<Application, "id" | "company" | "role" | "country" | "appliedAt" | "userMatchClass" | "userMatchPercentage" | "outcome" | "stage"> }) {
  return (
    <Link className="block rounded-xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] outline-none transition hover:border-indigo-200 hover:bg-indigo-50/20 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2" href={`/applications/${application.id}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="break-words font-semibold text-slate-950">{application.company}</h3>
          <p className="mt-1 break-words text-sm leading-5 text-slate-500">{application.role}</p>
        </div>
        <OutcomeBadge value={application.outcome} />
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <MobileMetric label="Country" value={application.country || "-"} />
        <MobileMetric label="Applied" value={formatDate(application.appliedAt)} />
      </dl>
      <div className="mt-4 flex flex-wrap gap-2">
        <StageBadge value={application.stage} />
        <MatchBadge value={application.userMatchClass} />
        {application.userMatchPercentage !== null ? <Badge tone="neutral">{application.userMatchPercentage}%</Badge> : null}
      </div>
    </Link>
  );
}

export function DetailField({ label, value, children, wide = false, wrap = false }: { label: string; value?: string | null; children?: React.ReactNode; wide?: boolean; wrap?: boolean }) {
  return (
    <div className={`min-w-0 ${wide ? "sm:col-span-2" : ""}`}>
      <dt className="text-xs font-medium uppercase tracking-[0.12em] text-slate-400">{label}</dt>
      <dd className={`mt-2 text-sm text-slate-800 ${wrap ? "whitespace-pre-wrap break-words leading-6" : "truncate"}`}>{children ?? value ?? "-"}</dd>
    </div>
  );
}

export const formStyles = {
  section: "rounded-xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:p-5",
  sectionTitle: "text-lg font-semibold tracking-[-0.02em] text-slate-950",
  sectionDescription: "mt-1 text-sm leading-6 text-slate-500",
  label: "text-sm font-medium text-slate-700",
  input:
    "mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-3 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-50",
  textarea:
    "mt-2 min-h-32 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-3 focus:ring-indigo-100",
  error: "mt-2 block text-xs font-medium text-red-600",
  formError: "rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700",
};

function DesktopSidebar({ accountLabel, currentPath }: { accountLabel: string; currentPath: string }) {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 border-r border-slate-200 bg-white px-4 py-5 lg:flex lg:flex-col">
      <Link className="flex items-center gap-3 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2" href="/dashboard">
        <LogoMark />
        <div>
          <p className="font-semibold tracking-[-0.02em] text-slate-950">JobHolmes</p>
          <p className="text-xs text-slate-500">Track. Understand. Get hired.</p>
        </div>
      </Link>
      <nav className="mt-8 flex flex-1 flex-col gap-1" aria-label="Primary navigation">
        {navItems.map((item) => (
          <NavItem key={item.href} currentPath={currentPath} {...item} />
        ))}
      </nav>
      <div className="border-t border-slate-100 pt-4">
        <div className="flex min-w-0 items-center gap-3 rounded-lg bg-slate-50 px-3 py-2">
          <UserInitial accountLabel={accountLabel} />
          <p className="truncate text-sm text-slate-600">{accountLabel}</p>
        </div>
        <form
          action={async () => {
            "use server";
            await signOut();
          }}
          className="mt-3"
        >
          <Button variant="ghost" type="submit">Sign out</Button>
        </form>
      </div>
    </aside>
  );
}

function MobileHeader({ accountLabel }: { accountLabel: string }) {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur lg:hidden">
      <Link className="flex items-center gap-2 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2" href="/dashboard">
        <LogoMark />
        <span className="font-semibold tracking-[-0.02em] text-slate-950">JobHolmes</span>
      </Link>
      <UserInitial accountLabel={accountLabel} />
    </header>
  );
}

function MobileNavigation({ currentPath }: { currentPath: string }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-3 border-t border-slate-200 bg-white/95 px-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2 shadow-[0_-8px_24px_rgba(15,23,42,0.06)] backdrop-blur lg:hidden" aria-label="Mobile primary navigation">
      {navItems.map((item) => (
        <MobileNavItem key={item.href} currentPath={currentPath} {...item} />
      ))}
    </nav>
  );
}

function NavItem({ label, href, icon: Icon, currentPath }: { label: string; href: string; icon: typeof DashboardIcon; currentPath: string }) {
  const active = href === "/applications" ? currentPath === href || currentPath.startsWith("/applications/") : currentPath === href;
  return (
    <Link className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium outline-none transition focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 ${active ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"}`} href={href} aria-current={active ? "page" : undefined}>
      <Icon />
      {label}
    </Link>
  );
}

function MobileNavItem({ label, href, icon: Icon, currentPath }: { label: string; href: string; icon: typeof DashboardIcon; currentPath: string }) {
  const active = href === "/applications" ? currentPath === href || currentPath.startsWith("/applications/") : currentPath === href;
  const isAdd = href === "/applications/new";
  return (
    <Link className={`flex flex-col items-center justify-center gap-1 rounded-lg px-2 py-2 text-xs font-medium outline-none transition focus-visible:ring-2 focus-visible:ring-indigo-500 ${active ? "text-indigo-700" : "text-slate-500"}`} href={href} aria-current={active ? "page" : undefined}>
      <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${isAdd ? "bg-indigo-600 text-white" : active ? "bg-indigo-50" : ""}`}><Icon /></span>
      {label.replace(" application", "")}
    </Link>
  );
}

function buttonClasses(variant: "primary" | "secondary" | "ghost" | "danger") {
  const base = "inline-flex min-h-10 w-full items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold outline-none transition focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto";
  const variants = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-700 focus-visible:ring-indigo-500",
    secondary: "border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-indigo-500",
    ghost: "text-slate-600 hover:bg-slate-50 hover:text-slate-950 focus-visible:ring-indigo-500",
    danger: "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500",
  };
  return `${base} ${variants[variant]}`;
}

function MobileMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium uppercase tracking-[0.12em] text-slate-400">{label}</dt>
      <dd className="mt-1 truncate text-slate-700">{value}</dd>
    </div>
  );
}

function UserInitial({ accountLabel }: { accountLabel: string }) {
  return <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold uppercase text-white">{accountLabel.slice(0, 1)}</span>;
}

function LogoMark() {
  return <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">JH</span>;
}

function DashboardIcon() {
  return <svg className="h-4 w-4" width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M3 10.5 10 4l7 6.5V17a1 1 0 0 1-1 1h-4v-5H8v5H4a1 1 0 0 1-1-1v-6.5Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /></svg>;
}

function ListIcon() {
  return <svg className="h-4 w-4" width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M6 5h11M6 10h11M6 15h11M3 5h.01M3 10h.01M3 15h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>;
}

function PlusIcon() {
  return <svg className="h-4 w-4" width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>;
}
