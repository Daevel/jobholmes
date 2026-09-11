import { JobFitForm } from "@/app/job-fit/job-fit-form";
import { AppShell, PageHeader } from "@/components/application-ui";
import { listSourcesForUser } from "@/lib/applications/sources-service";
import { listCvsForUser } from "@/lib/cvs/service";
import { requireCurrentUser } from "@/lib/current-user";

export default async function JobFitPage() {
  const user = await requireCurrentUser();
  const today = new Date().toISOString().slice(0, 10);
  const [cvs, sources] = await Promise.all([listCvsForUser(user.id), listSourcesForUser(user.id)]);

  return (
    <AppShell accountLabel={user.name || user.email} currentPath="/job-fit">
      <PageHeader eyebrow="Job Fit" subtitle="Paste a job description and compare it against one of your CVs before creating an application, using the same matching engine as AI Match." title="Preview a job fit" />
      <JobFitForm cvs={cvs.map((cv) => ({ id: cv.id, name: cv.name }))} sources={sources} today={today} />
    </AppShell>
  );
}
