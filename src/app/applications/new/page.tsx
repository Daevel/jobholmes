import { NewApplicationForm } from "@/app/applications/new/form";
import { AppShell, PageHeader } from "@/components/application-ui";
import { listSourcesForUser } from "@/lib/applications/sources-service";
import { listCvsForUser } from "@/lib/cvs/service";
import { requireCurrentUser } from "@/lib/current-user";

export default async function NewApplicationPage() {
  const user = await requireCurrentUser();
  const today = new Date().toISOString().slice(0, 10);
  const [cvs, sources] = await Promise.all([listCvsForUser(user.id), listSourcesForUser(user.id)]);

  return (
    <AppShell accountLabel={user.name || user.email} currentPath="/applications/new">
      <PageHeader eyebrow="New application" subtitle="Capture the role details, selected CV, job description, match assessment, and notes." title="Add application" />
      <NewApplicationForm cvs={cvs.map((cv) => ({ id: cv.id, name: cv.name }))} sources={sources} today={today} />
    </AppShell>
  );
}
