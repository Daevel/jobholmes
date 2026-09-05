import { NewApplicationForm } from "@/app/applications/new/form";
import { AppShell, PageHeader } from "@/components/application-ui";
import { requireCurrentUser } from "@/lib/current-user";

export default async function NewApplicationPage() {
  const user = await requireCurrentUser();
  const today = new Date().toISOString().slice(0, 10);

  return (
    <AppShell accountLabel={user.name || user.email} currentPath="/applications/new">
      <PageHeader eyebrow="New application" subtitle="Capture the role details, match assessment, status, and notes in a structured form." title="Add application" />
      <NewApplicationForm today={today} />
    </AppShell>
  );
}
