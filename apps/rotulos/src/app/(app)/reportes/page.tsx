"use client";

import { useEffect, useMemo, useState } from "react";
import { getInventoryStore } from "@/lib/inventory-store";
import { getBusinessStore } from "@/lib/business-store";
import { getLabelStore } from "@/lib/label-store";
import { businessDaysAgo, businessToday } from "@/lib/date";
import { formatCop, formatDate } from "@/lib/format";
import { isRelatedOrderToCustomer } from "@/lib/customer-orders";
import { buildHistoricalReport } from "@/lib/historical-reports";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import type { Product, StockAlerts } from "@/lib/inventory-types";
import type { Customer, OrderRecord } from "@/lib/business-types";
import type { LabelRecord } from "@/lib/types";
import { MetricCard, Card, CardTitle } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeading } from "@/components/ui/page-heading";
import { Badge } from "@/components/ui/badge";
import { HistoricalReportPanel } from "@/components/historical-report-panel";
import { DollarSign, MessageCircle, Package, Receipt, Ticket, TriangleAlert, Users } from "lucide-react";

const emptyAlerts: StockAlerts = { lowStock: [], critical: [], overstocked: [] };

function daysAgo(days: number) {
  return businessDaysAgo(days);
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

type CustomerSales = {
  customer: string;
  orders: number;
  total: number;
};

type MonthlySales = {
  month: string;
  label: string;
  orders: number;
  total: number;
};

function monthLabel(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  return new Intl.DateTimeFormat("es-CO", { month: "short", year: "numeric" }).format(
    new Date(Date.UTC(year, monthNumber - 1, 1, 12)),
  );
}

export function getTopCustomersBySales(orders: OrderRecord[], limit = 5): CustomerSales[] {
  const totals = new Map<string, CustomerSales>();
  for (const order of orders) {
    if (order.status === "cancelled") continue;
    const customer = order.customer.fullName || "Cliente sin nombre";
    const current = totals.get(customer) ?? { customer, orders: 0, total: 0 };
    current.orders += 1;
    current.total += order.total;
    totals.set(customer, current);
  }
  return [...totals.values()]
    .sort((a, b) => b.total - a.total || b.orders - a.orders || a.customer.localeCompare(b.customer))
    .slice(0, limit);
}

export function getMonthlySales(orders: OrderRecord[], limit = 6): MonthlySales[] {
  const totals = new Map<string, MonthlySales>();
  for (const order of orders) {
    if (order.status === "cancelled") continue;
    const month = order.orderDate.slice(0, 7);
    const current = totals.get(month) ?? { month, label: monthLabel(month), orders: 0, total: 0 };
    current.orders += 1;
    current.total += order.total;
    totals.set(month, current);
  }
  return [...totals.values()]
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-limit);
}

export function getPendingOrders(orders: OrderRecord[], limit = 6): OrderRecord[] {
  return orders
    .filter((order) => order.status === "pending")
    .sort((a, b) => a.orderDate.localeCompare(b.orderDate) || a.createdAt.localeCompare(b.createdAt))
    .slice(0, limit);
}

export type InactiveCustomer = {
  customer: Customer;
  lastOrderDate: string;
  daysInactive: number;
};

function daysBetween(from: string, to: string): number {
  const fromMs = Date.parse(`${from}T00:00:00Z`);
  const toMs = Date.parse(`${to}T00:00:00Z`);
  return Math.floor((toMs - fromMs) / (24 * 60 * 60 * 1000));
}

export function getInactiveCustomers(
  customers: Customer[],
  orders: OrderRecord[],
  thresholdDays: number,
  today: string = businessToday(),
): InactiveCustomer[] {
  const result: InactiveCustomer[] = [];
  for (const customer of customers) {
    let lastOrderDate = "";
    for (const order of orders) {
      if (!isRelatedOrderToCustomer(order, customer)) continue;
      if (order.orderDate > lastOrderDate) lastOrderDate = order.orderDate;
    }
    if (!lastOrderDate) continue;
    const daysInactive = daysBetween(lastOrderDate, today);
    if (daysInactive >= thresholdDays) result.push({ customer, lastOrderDate, daysInactive });
  }
  return result.sort((a, b) => b.daysInactive - a.daysInactive);
}

export default function ReportsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [alerts, setAlerts] = useState<StockAlerts>(emptyAlerts);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [labels, setLabels] = useState<LabelRecord[]>([]);
  const [from, setFrom] = useState(daysAgo(30));
  const [to, setTo] = useState(daysAgo(0));
  const [inactiveThreshold, setInactiveThreshold] = useState(45);

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
  const rangeSalesOrders = useMemo(
    () => rangeOrders.filter((order) => order.status !== "cancelled"),
    [rangeOrders],
  );
  const rangeCustomers = useMemo(
    () => customers.filter((c) => c.createdAt.slice(0, 10) >= from && c.createdAt.slice(0, 10) <= to),
    [customers, from, to],
  );
  const rangeLabels = useMemo(
    () => labels.filter((label) => label.date >= from && label.date <= to),
    [labels, from, to],
  );

  const totalSales = rangeSalesOrders.reduce((sum, order) => sum + order.total, 0);
  const avgTicket = rangeSalesOrders.length ? totalSales / rangeSalesOrders.length : 0;
  const inventoryValue = products.reduce((sum, p) => sum + p.currentStock * p.unitPrice, 0);
  const pendingOrders = useMemo(() => getPendingOrders(orders), [orders]);
  const pendingTotal = orders.filter((order) => order.status === "pending").reduce((sum, order) => sum + order.total, 0);
  const inactiveCustomers = useMemo(
    () => getInactiveCustomers(customers, orders, inactiveThreshold),
    [customers, orders, inactiveThreshold],
  );
  const inactiveCustomersShown = inactiveCustomers.slice(0, 15);

  const topProducts = useMemo(() => {
    const totals = new Map<string, number>();
    for (const order of rangeSalesOrders) {
      for (const item of order.items) {
        totals.set(item.productName, (totals.get(item.productName) ?? 0) + item.quantity);
      }
    }
    return [...totals.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([label, value]) => ({ label, value, formattedValue: `${value} uds` }));
  }, [rangeSalesOrders]);

  const statusBreakdown = useMemo(() => {
    const counts: Record<OrderRecord["status"], number> = { pending: 0, completed: 0, cancelled: 0 };
    for (const order of rangeOrders) counts[order.status] += 1;
    return (Object.keys(counts) as OrderRecord["status"][]).map((status) => ({
      label: STATUS_LABEL[status],
      value: counts[status],
      formattedValue: String(counts[status]),
    }));
  }, [rangeOrders]);

  const topCustomers = useMemo(() => getTopCustomersBySales(rangeSalesOrders), [rangeSalesOrders]);
  const monthlySales = useMemo(() => getMonthlySales(orders), [orders]);
  const monthlySalesBars = useMemo(
    () => monthlySales.map((item) => ({ label: item.label, value: item.total, formattedValue: formatCop(item.total) })),
    [monthlySales],
  );
  const historicalReport = useMemo(() => buildHistoricalReport(orders), [orders]);

  return (
    <main className="page-shell">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <PageHeading eyebrow="Analítica" title="Reportes" className="mb-0" />
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
          <CardTitle>Ventas por cliente</CardTitle>
          <div className="mt-4">
            {topCustomers.length === 0 ? (
              <EmptyState title="Sin ventas por cliente" description="Ajusta las fechas para ver tus clientes principales." />
            ) : (
              <BarList
                items={topCustomers.map((item) => ({
                  label: item.customer,
                  value: item.total,
                  formattedValue: `${formatCop(item.total)} · ${item.orders} pedido(s)`,
                }))}
              />
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
        <Card>
          <CardTitle>Comparativo mensual</CardTitle>
          <div className="mt-4">
            {monthlySalesBars.length === 0 ? (
              <EmptyState title="Sin ventas mensuales" description="Aun no hay pedidos para comparar por mes." />
            ) : (
              <div className="flex flex-col gap-4">
                <BarList items={monthlySalesBars} />
                <div className="grid grid-cols-2 gap-2 text-sm text-foreground-muted">
                  {monthlySales.map((item) => (
                    <div key={item.month} className="rounded-md border border-border bg-surface-muted px-3 py-2">
                      <div className="font-medium text-foreground">{item.label}</div>
                      <div>{item.orders} pedido(s)</div>
                    </div>
                  ))}
                </div>
              </div>
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
        <MetricCard label="Rótulos generados" value={rangeLabels.length} icon={Package} />
        <MetricCard label="Productos activos" value={products.length} icon={Package} />
      </div>

      <HistoricalReportPanel report={historicalReport} />

      <Card className="mt-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle>Pedidos pendientes</CardTitle>
          <span className="text-sm font-medium text-foreground-muted">{formatCop(pendingTotal)} por despachar</span>
        </div>
        <div className="mt-4 overflow-x-auto rounded-lg border border-border">
          {pendingOrders.length === 0 ? (
            <EmptyState title="Sin pedidos pendientes" description="Todos los pedidos están completados o cancelados." className="rounded-none border-0" />
          ) : (
            <table className="w-full min-w-[720px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-muted">
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-foreground-muted">Fecha</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-foreground-muted">Cliente</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-foreground-muted">Ciudad</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-foreground-muted">Productos</th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-foreground-muted">Total</th>
                </tr>
              </thead>
              <tbody>
                {pendingOrders.map((order) => (
                  <tr key={order.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 text-foreground-muted">{formatDate(order.orderDate)}</td>
                    <td className="px-4 py-3 font-medium text-foreground">{order.customer.fullName}</td>
                    <td className="px-4 py-3 text-foreground-muted">{order.customer.city || "Sin ciudad"}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {order.items.slice(0, 2).map((item) => (
                          <Badge key={item.id}>{item.quantity}x {item.productName}</Badge>
                        ))}
                        {order.items.length > 2 ? <Badge>+{order.items.length - 2}</Badge> : null}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-foreground">{formatCop(order.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      <Card className="mt-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle>Clientes inactivos</CardTitle>
          <FormField label="Inactivo desde (días)" className="mb-0">
            <Input
              type="number"
              min={1}
              value={inactiveThreshold}
              onChange={(event) => setInactiveThreshold(Math.max(1, Number(event.target.value) || 1))}
              className="w-24"
            />
          </FormField>
        </div>
        <div className="mt-4 overflow-x-auto rounded-lg border border-border">
          {inactiveCustomers.length === 0 ? (
            <EmptyState
              title="Sin clientes inactivos"
              description={`Ningún cliente lleva ${inactiveThreshold}+ días sin comprar.`}
              className="rounded-none border-0"
            />
          ) : (
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-muted">
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-foreground-muted">Cliente</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-foreground-muted">Teléfono</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-foreground-muted">Última compra</th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-foreground-muted">Días inactivo</th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-foreground-muted">Acción</th>
                </tr>
              </thead>
              <tbody>
                {inactiveCustomersShown.map(({ customer, lastOrderDate, daysInactive }) => (
                  <tr key={customer.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-medium text-foreground">{customer.fullName}</td>
                    <td className="px-4 py-3 text-foreground-muted">{customer.phone || "-"}</td>
                    <td className="px-4 py-3 text-foreground-muted">{formatDate(lastOrderDate)}</td>
                    <td className="px-4 py-3 text-right text-foreground">{daysInactive}</td>
                    <td className="px-4 py-3 text-right">
                      {customer.phone ? (
                        <Button type="button" variant="secondary" size="sm" asChild>
                          <a href={buildWhatsAppLink(customer.phone, "")} target="_blank" rel="noopener noreferrer">
                            <MessageCircle className="size-4" aria-hidden="true" />
                            Escribirle
                          </a>
                        </Button>
                      ) : (
                        <span className="text-xs text-foreground-muted">Sin teléfono</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {inactiveCustomers.length > inactiveCustomersShown.length ? (
          <p className="mt-3 text-xs text-foreground-muted">
            Mostrando {inactiveCustomersShown.length} de {inactiveCustomers.length} clientes inactivos.
          </p>
        ) : null}
      </Card>
    </main>
  );
}
