import { SettingsForm } from "@/components/settings-form";
import { DataExport } from "@/components/data-export";
import { AllowedUsersAdmin } from "@/components/allowed-users-admin";
import { PageHeading } from "@/components/ui/page-heading";

export default function SettingsPage() {
  return (
    <main className="page-shell">
      <PageHeading eyebrow="Preferencias" title="Configuración" />
      <DataExport />
      <AllowedUsersAdmin />
      <SettingsForm />
    </main>
  );
}
