import { SettingsForm } from "@/components/settings-form";
import { PageHeading } from "@/components/ui/page-heading";

export default function SettingsPage() {
  return (
    <main className="page-shell">
      <PageHeading eyebrow="Preferencias" title="Configuracion" />
      <SettingsForm />
    </main>
  );
}
