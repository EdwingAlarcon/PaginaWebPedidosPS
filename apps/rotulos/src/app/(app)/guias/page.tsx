import { TrackingReceiptImport } from "@/components/tracking-receipt-import";
import { PageHeading } from "@/components/ui/page-heading";

// Destino del share_target del manifest: Android abre /guias?title=...&text=...&url=...
export default async function TrackingGuidesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const shared = ["title", "text", "url"]
    .map((key) => params[key])
    .flatMap((value) => (Array.isArray(value) ? value : value ? [value] : []))
    .join("\n");

  return (
    <main className="page-shell">
      <PageHeading eyebrow="Envíos" title="Asignar guías" />
      <TrackingReceiptImport initialText={shared} />
    </main>
  );
}
