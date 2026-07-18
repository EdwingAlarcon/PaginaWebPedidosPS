import Link from "next/link";
import { Plus } from "lucide-react";
import { DashboardStats } from "@/components/dashboard-stats";
import { getLabelStore } from "@/lib/label-store";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

const today = new Intl.DateTimeFormat("es-CO", { dateStyle: "full" });

export default async function DashboardPage() {
  const labels = await getLabelStore().listLabels();

  return (
    <main className="page-shell">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-page-title">Inicio</h1>
          <p className="mt-1 text-sm capitalize text-foreground-muted">{today.format(new Date())}</p>
        </div>
        <Button asChild>
          <Link href="/pedidos/nuevo">
            <Plus className="size-4" aria-hidden="true" />
            Nuevo pedido
          </Link>
        </Button>
      </div>
      <DashboardStats labels={labels} />
    </main>
  );
}
