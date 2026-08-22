"use client";

import { useEffect, useMemo, useState } from "react";
import { Archive, CalendarDays, Package, Receipt, Users } from "lucide-react";
import { getBusinessStore } from "@/lib/business-store";
import { getImportedOrderSummary, getImportedOrders } from "@/lib/imported-orders";
import { formatCop } from "@/lib/format";
import type { OrderRecord } from "@/lib/business-types";
import { ImportedOrdersTable } from "@/components/imported-orders-table";
import { MetricCard } from "@/components/ui/card";
import { PageHeading } from "@/components/ui/page-heading";

export default function ImportedOrdersPage() {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getBusinessStore()
      .listOrders()
      .then(setOrders)
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  const importedOrders = useMemo(() => getImportedOrders(orders), [orders]);
  const summary = useMemo(() => getImportedOrderSummary(importedOrders), [importedOrders]);

  return (
    <main className="page-shell">
      <PageHeading eyebrow="Auditoria historica" title="Pedidos importados" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <MetricCard label="Pedidos" value={summary.orders} icon={Receipt} loading={loading} />
        <MetricCard label="Unidades" value={summary.items} icon={Package} loading={loading} />
        <MetricCard label="Ventas" value={formatCop(summary.total)} icon={Archive} loading={loading} />
        <MetricCard label="Clientes" value={summary.customers} icon={Users} loading={loading} />
        <MetricCard label="Anios" value={summary.years.join(", ") || "-"} icon={CalendarDays} loading={loading} />
      </div>
      <div className="mt-4">
        <ImportedOrdersTable orders={orders} loading={loading} />
      </div>
    </main>
  );
}
