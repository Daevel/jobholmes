import { JobFitForm } from "@/app/job-fit/job-fit-form";
import { AppShell, PageHeader } from "@/components/application-ui";
import { listSourcesForUser } from "@/lib/applications/sources-service";
import { listCvsForUser } from "@/lib/cvs/service";
import { requireCurrentUser } from "@/lib/current-user";
import { t } from "@/lib/i18n/translate";

export default async function JobFitPage() {
  const user = await requireCurrentUser();
  const today = new Date().toISOString().slice(0, 10);
  const [cvs, sources] = await Promise.all([listCvsForUser(user.id), listSourcesForUser(user.id)]);

  return (
    <AppShell accountLabel={user.name || user.email} currentPath="/job-fit">
      <PageHeader eyebrow={t("jobFit.pageEyebrow")} subtitle={t("jobFit.pageSubtitle")} title={t("jobFit.pageTitle")} />
      <JobFitForm cvs={cvs.map((cv) => ({ id: cv.id, name: cv.name }))} sources={sources} today={today} />
    </AppShell>
  );
}
