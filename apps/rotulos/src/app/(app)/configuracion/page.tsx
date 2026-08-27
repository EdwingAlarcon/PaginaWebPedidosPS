import { SettingsForm } from "@/components/settings-form";
import { DataExport } from "@/components/data-export";
import { AllowedUsersAdmin } from "@/components/allowed-users-admin";
import { ProductPhotoBulkUpload } from "@/components/product-photo-bulk-upload";
import { PageHeading } from "@/components/ui/page-heading";

export default function SettingsPage() {
  return (
    <main className="page-shell">
      <PageHeading eyebrow="Preferencias" title="Configuración" />
      <DataExport />
      <ProductPhotoBulkUpload />
      <AllowedUsersAdmin />
      <SettingsForm />
    </main>
  );
}
