import Link from "next/link";
import { auth, signIn, signOut } from "@/auth";
import { Button } from "@/components/application-ui";

export default async function Home() {
  const session = await auth();

  return (
    <main className="min-h-screen bg-[#F7F8FA] px-4 py-8 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-5xl flex-col">
        <header className="flex items-center justify-between border-b border-slate-200 pb-5">
          <Link className="flex items-center gap-3 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2" href="/">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">JH</span>
            <span className="font-semibold tracking-[-0.02em]">JobHolmes</span>
          </Link>
          {session?.user ? <Link className="text-sm font-semibold text-indigo-600 outline-none hover:text-indigo-700 focus-visible:ring-2 focus-visible:ring-indigo-500" href="/dashboard">Dashboard</Link> : null}
        </header>

        <section className="flex flex-1 items-center py-16">
          <div className="grid w-full gap-8 lg:grid-cols-[1fr_380px] lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-600">Personal job search dashboard</p>
              <h1 className="mt-4 max-w-2xl text-4xl font-semibold tracking-[-0.05em] text-slate-950 sm:text-5xl">Understand your job search.</h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-slate-600">Track applications, monitor your funnel and understand what is actually working.</p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:p-6">
              {session?.user ? (
                <>
                  <p className="text-sm text-slate-500">Signed in as</p>
                  <p className="mt-1 truncate font-semibold text-slate-950">{session.user.email}</p>
                  <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                    <Link className="inline-flex min-h-10 items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white outline-none transition hover:bg-indigo-700 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2" href="/dashboard">Go to dashboard</Link>
                    <form
                      action={async () => {
                        "use server";
                        await signOut();
                      }}
                    >
                      <Button variant="secondary" type="submit">Sign out</Button>
                    </form>
                  </div>
                </>
              ) : (
                <>
                  <h2 className="text-lg font-semibold tracking-[-0.02em] text-slate-950">Sign in to continue</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-500">Load the same JobHolmes account from every device.</p>
                  <form
                    className="mt-6"
                    action={async () => {
                      "use server";
                      await signIn("github");
                    }}
                  >
                    <Button type="submit">Sign in with GitHub</Button>
                  </form>
                </>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
