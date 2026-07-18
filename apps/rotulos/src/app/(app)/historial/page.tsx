import { HistoryTable } from "@/components/history-table";
import { getLabelStore } from "@/lib/label-store";
import { PageHeading } from "@/components/ui/page-heading";

export default async function HistoryPage() {
  const labels = await getLabelStore().listLabels();
  return (
    <main className="page-shell">
      <PageHeading eyebrow="Consulta y reutilizacion" title="Historial" />
      <HistoryTable labels={labels} />
    </main>
  );
}
