import { DashboardStats } from "@/components/dashboard-stats";
import { getLabelStore } from "@/lib/label-store";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const labels = await getLabelStore().listLabels();

  return (
    <main className="page-shell">
      <div className="page-heading">
        <p>Operacion diaria</p>
        <h1>PurpleShop</h1>
      </div>
      <DashboardStats labels={labels} />
    </main>
  );
}
