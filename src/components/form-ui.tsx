import Link from "next/link";

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

export function Button({ children, variant = "primary", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" | "danger" }) {
  return (
    <button className={buttonClasses(variant)} {...props}>
      {children}
    </button>
  );
}

export function ButtonLink({ href, children, variant = "primary" }: { href: string; children: React.ReactNode; variant?: "primary" | "secondary" | "ghost" | "danger" }) {
  return (
    <Link className={buttonClasses(variant)} href={href}>
      {children}
    </Link>
  );
}

function buttonClasses(variant: "primary" | "secondary" | "ghost" | "danger") {
  const base = "inline-flex min-h-10 w-full items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold outline-none transition focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto";
  const variants = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-700 focus-visible:ring-indigo-500",
    secondary: "border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-indigo-500",
    ghost: "text-slate-600 hover:bg-slate-50 hover:text-slate-950 focus-visible:ring-indigo-500",
    danger: "border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 focus-visible:ring-red-500",
  };
  return `${base} ${variants[variant]}`;
}
