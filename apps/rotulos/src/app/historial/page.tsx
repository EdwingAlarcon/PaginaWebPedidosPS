import { HistoryTable } from "@/components/history-table";
import { getLabelStore } from "@/lib/label-store";

export default async function HistoryPage() {
  const labels = await getLabelStore().listLabels();
  return (
    <main className="page-shell">
      <div className="page-heading">
        <p>Consulta y reutilizacion</p>
        <h1>Historial</h1>
      </div>
      <HistoryTable labels={labels} />
    </main>
  );
}
