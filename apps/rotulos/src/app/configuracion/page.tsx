import { SettingsForm } from "@/components/settings-form";

export default function SettingsPage() {
  return (
    <main className="page-shell">
      <div className="page-heading">
        <p>Preferencias</p>
        <h1>Configuracion</h1>
      </div>
      <SettingsForm />
    </main>
  );
}
