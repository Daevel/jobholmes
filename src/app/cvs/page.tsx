import { Download, FileText } from "lucide-react";
import { AppShell, EmptyState, PageHeader, SectionCard } from "@/components/application-ui";
import { listCvsForUser } from "@/lib/cvs/service";
import { requireCurrentUser } from "@/lib/current-user";
import { CvUploadForm } from "./upload-form";

const dateFormatter = new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" });

export default async function CvsPage() {
  const user = await requireCurrentUser();
  const cvs = await listCvsForUser(user.id);

  return (
    <AppShell accountLabel={user.name || user.email} currentPath="/cvs">
      <PageHeader subtitle="Store the CV versions you use for applications and AI Match." title="CVs" />
      <CvUploadForm />

      {cvs.length === 0 ? (
        <EmptyState description="Upload a text-based PDF CV to enable selected-CV application tracking and CV-vs-JD AI Match." title="No CVs uploaded yet" />
      ) : (
        <SectionCard title="CV Library" description="Your uploaded CV versions.">
          <div className="grid gap-3 p-3">
            {cvs.map((cv) => (
              <article key={cv.id} className="flex min-w-0 flex-col gap-4 rounded-lg border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-indigo-100 bg-indigo-50 text-indigo-700"><FileText aria-hidden="true" className="h-5 w-5" /></span>
                  <div className="min-w-0">
                    <h2 className="truncate font-semibold text-slate-950">{cv.name}</h2>
                    <p className="mt-1 truncate text-sm text-slate-500">{cv.originalFileName}</p>
                    <p className="mt-1 text-xs text-slate-400">Uploaded {dateFormatter.format(cv.createdAt)} · {formatBytes(cv.sizeBytes)}</p>
                  </div>
                </div>
                <a className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 outline-none transition hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 sm:w-auto" href={`/api/cvs/${cv.id}/download`}>
                  <Download aria-hidden="true" className="h-4 w-4" />
                  Download
                </a>
              </article>
            ))}
          </div>
        </SectionCard>
      )}
    </AppShell>
  );
}

function formatBytes(bytes: number) {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
