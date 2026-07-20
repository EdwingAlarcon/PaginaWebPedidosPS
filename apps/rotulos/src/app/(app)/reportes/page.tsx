"use client";

import { useEffect, useMemo, useState } from "react";
import { getInventoryStore } from "@/lib/inventory-store";
import { getBusinessStore } from "@/lib/business-store";
import { getLabelStore } from "@/lib/label-store";
import { formatCop } from "@/lib/format";
import type { Product, StockAlerts } from "@/lib/inventory-types";
import type { Customer, OrderRecord } from "@/lib/business-types";
import type { LabelRecord } from "@/lib/types";
import { MetricCard, Card, CardTitle } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import { FormField } from "@/components/ui/form-field";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeading } from "@/components/ui/page-heading";
import { DollarSign, Package, Receipt, Ticket, TriangleAlert, Users } from "lucide-react";

const emptyAlerts: StockAlerts = { lowStock: [], critical: [], overstocked: [] };

function daysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
}

const STATUS_LABEL: Record<OrderRecord["status"], string> = {
  pending: "Pendiente",
  completed: "Completado",
  cancelled: "Cancelado",
};

export function BarList({ items }: { items: { label: string; value: number; formattedValue: string }[] }) {
  const max = Math.max(1, ...items.map((item) => item.value));
  const barWidth = (value: number) => (value <= 0 ? 0 : Math.max(4, (value / max) * 100));
  return (
    <div className="flex flex-col gap-3">
      {items.map((item) => (
        <div key={item.label}>
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="text-foreground">{item.label}</span>
            <span className="font-medium text-foreground-muted">{item.formattedValue}</span>
          </div>
          <div className="h-2 rounded-full bg-surface-muted">
            <div
              className="h-2 rounded-full bg-primary"
              style={{ width: `${barWidth(item.value)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ReportsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [alerts, setAlerts] = useState<StockAlerts>(emptyAlerts);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [labels, setLabels] = useState<LabelRecord[]>([]);
  const [from, setFrom] = useState(daysAgo(30));
  const [to, setTo] = useState(daysAgo(0));

  useEffect(() => {
    const inventoryStore = getInventoryStore();
    inventoryStore.listProducts().then(setProducts).catch(() => setProducts([]));
    inventoryStore.getStockAlerts().then(setAlerts).catch(() => setAlerts(emptyAlerts));
    getBusinessStore().listOrders().then(setOrders).catch(() => setOrders([]));
    getBusinessStore().listCustomers().then(setCustomers).catch(() => setCustomers([]));
    getLabelStore().listLabels().then(setLabels).catch(() => setLabels([]));
  }, []);

  const rangeOrders = useMemo(
    () => orders.filter((order) => order.orderDate >= from && order.orderDate <= to),
    [orders, from, to],
  );
  const rangeCustomers = useMemo(
    () => customers.filter((c) => c.createdAt.slice(0, 10) >= from && c.createdAt.slice(0, 10) <= to),
    [customers, from, to],
  );
  const rangeLabels = useMemo(
    () => labels.filter((label) => label.date >= from && label.date <= to),
    [labels, from, to],
  );

  const totalSales = rangeOrders.reduce((sum, order) => sum + order.total, 0);
  const avgTicket = rangeOrders.length ? totalSales / rangeOrders.length : 0;
  const inventoryValue = products.reduce((sum, p) => sum + p.currentStock * p.unitPrice, 0);

  const topProducts = useMemo(() => {
    const totals = new Map<string, number>();
    for (const order of rangeOrders) {
      for (const item of order.items) {
        totals.set(item.productName, (totals.get(item.productName) ?? 0) + item.quantity);
      }
    }
    return [...totals.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([label, value]) => ({ label, value, formattedValue: `${value} uds` }));
  }, [rangeOrders]);

  const statusBreakdown = useMemo(() => {
    const counts: Record<OrderRecord["status"], number> = { pending: 0, completed: 0, cancelled: 0 };
    for (const order of rangeOrders) counts[order.status] += 1;
    return (Object.keys(counts) as OrderRecord["status"][]).map((status) => ({
      label: STATUS_LABEL[status],
      value: counts[status],
      formattedValue: String(counts[status]),
    }));
  }, [rangeOrders]);

  return (
    <main className="page-shell">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <PageHeading eyebrow="Analitica" title="Reportes" className="mb-0" />
        <div className="flex flex-wrap items-end gap-3">
          <FormField label="Desde">
            <DatePicker value={from} onChange={(event) => setFrom(event.target.value)} />
          </FormField>
          <FormField label="Hasta">
            <DatePicker value={to} onChange={(event) => setTo(event.target.value)} />
          </FormField>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard label="Ventas" value={formatCop(totalSales)} icon={DollarSign} />
        <MetricCard label="Pedidos" value={rangeOrders.length} icon={Receipt} />
        <MetricCard label="Ticket promedio" value={formatCop(avgTicket)} icon={Ticket} />
        <MetricCard label="Clientes nuevos" value={rangeCustomers.length} icon={Users} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardTitle>Productos mas vendidos</CardTitle>
          <div className="mt-4">
            {topProducts.length === 0 ? (
              <EmptyState title="Sin ventas en el rango" description="Ajusta las fechas para ver productos vendidos." />
            ) : (
              <BarList items={topProducts} />
            )}
          </div>
        </Card>
        <Card>
          <CardTitle>Pedidos por estado</CardTitle>
          <div className="mt-4">
            {rangeOrders.length === 0 ? (
              <EmptyState title="Sin pedidos en el rango" description="Ajusta las fechas para ver la distribucion." />
            ) : (
              <BarList items={statusBreakdown} />
            )}
          </div>
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard label="Inventario valorizado" value={formatCop(inventoryValue)} icon={Package} />
        <MetricCard
          label="Alertas de stock"
          value={alerts.lowStock.length + alerts.critical.length}
          icon={TriangleAlert}
        />
        <MetricCard label="Rotulos generados" value={rangeLabels.length} icon={Package} />
        <MetricCard label="Productos activos" value={products.length} icon={Package} />
      </div>
    </main>
  );
}
