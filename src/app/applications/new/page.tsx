import Link from "next/link";
import { signOut } from "@/auth";
import { NewApplicationForm } from "@/app/applications/new/form";
import { requireCurrentUser } from "@/lib/current-user";

export default async function NewApplicationPage() {
  const user = await requireCurrentUser();
  const today = new Date().toISOString().slice(0, 10);

  return (
    <main className="min-h-screen bg-[#0b0d10] px-5 py-6 text-zinc-100 sm:px-8 lg:px-10">
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
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
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link className="rounded-lg border border-zinc-700 px-4 py-2 text-center text-sm font-medium text-zinc-200 transition hover:border-zinc-500 hover:bg-zinc-900" href="/dashboard">
              Back to dashboard
            </Link>
            <form
              action={async () => {
                "use server";
                await signOut();
              }}
            >
              <button className="w-full rounded-lg border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-200 transition hover:border-zinc-500 hover:bg-zinc-900 sm:w-auto">
                Sign out
              </button>
            </form>
          </div>
        </header>

        <section>
          <p className="text-sm uppercase tracking-[0.25em] text-zinc-500">New application</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">Add application</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-400">
            Capture the core details now. You can add deeper funnel analysis later as the alpha evolves.
          </p>
        </section>

        <NewApplicationForm today={today} />
      </div>
    </main>
  );
}
