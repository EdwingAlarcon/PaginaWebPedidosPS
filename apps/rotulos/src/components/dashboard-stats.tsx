"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ClipboardList, DollarSign, PackagePlus, TriangleAlert } from "lucide-react";
import { getBusinessStore } from "@/lib/business-store";
import { getLabelStore } from "@/lib/label-store";
import { getInventoryStore } from "@/lib/inventory-store";
import type { OrderRecord } from "@/lib/business-types";
import type { LabelRecord } from "@/lib/types";
import { MetricCard, Card, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";

function isToday(value: string): boolean {
  return value.slice(0, 10) === new Date().toISOString().slice(0, 10);
}

const currency = (value: number) => `$${Math.round(value).toLocaleString("es-CO")}`;

export function DashboardStats({ labels }: { labels: LabelRecord[] }) {
  const [dashboardLabels, setDashboardLabels] = useState(labels);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getLabelStore().listLabels().catch(() => labels),
      getBusinessStore().listOrders().catch(() => []),
      getInventoryStore()
        .getStockAlerts()
        .then((alerts) => alerts.lowStock.length + alerts.critical.length)
        .catch(() => 0),
    ]).then(([labelsResult, ordersResult, lowStock]) => {
      setDashboardLabels(labelsResult);
      setOrders(ordersResult);
      setLowStockCount(lowStock);
      setLoading(false);
    });
  }, [labels]);

  const todayOrders = orders.filter((order) => isToday(order.orderDate));
  const todayRevenue = todayOrders.reduce((sum, order) => sum + order.total, 0);
  const pendingOrders = orders.filter((order) => order.status === "pending");
  const latestOrders = [...orders]
    .sort((a, b) => b.orderDate.localeCompare(a.orderDate))
    .slice(0, 5);
  const latestLabels = dashboardLabels.slice(0, 5);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard label="Pedidos hoy" value={todayOrders.length} icon={ClipboardList} loading={loading} />
        <MetricCard label="Ventas hoy" value={currency(todayRevenue)} icon={DollarSign} loading={loading} />
        <MetricCard label="Pedidos pendientes" value={pendingOrders.length} icon={PackagePlus} loading={loading} />
        <MetricCard
          label="Bajo stock"
          value={lowStockCount}
          icon={TriangleAlert}
          loading={loading}
          className={lowStockCount > 0 ? "border-[var(--warning)]" : undefined}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Pedidos recientes</CardTitle>
            <Button variant="link" size="sm" asChild>
              <Link href="/pedidos">Ver todos</Link>
            </Button>
          </CardHeader>
          {latestOrders.length === 0 ? (
            <EmptyState
              title="Aun no hay pedidos"
              description="Los pedidos que registres apareceran aqui."
              action={
                <Button size="sm" asChild>
                  <Link href="/pedidos/nuevo">Crear pedido</Link>
                </Button>
              }
            />
          ) : (
            <ul className="divide-y divide-border">
              {latestOrders.map((order) => (
                <li key={order.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <span className="truncate text-foreground">{order.customer.fullName}</span>
                  <span className="shrink-0 font-medium text-foreground">{currency(order.total)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Rotulos recientes</CardTitle>
            <Button variant="link" size="sm" asChild>
              <Link href="/historial">Ver todos</Link>
            </Button>
          </CardHeader>
          {latestLabels.length === 0 ? (
            <EmptyState
              title="Aun no hay rotulos"
              description="Genera un rotulo de envio para verlo aqui."
              action={
                <Button size="sm" asChild>
                  <Link href="/crear">Crear rotulo</Link>
                </Button>
              }
            />
          ) : (
            <ul className="divide-y divide-border">
              {latestLabels.map((label) => (
                <li key={label.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <span className="truncate text-foreground">{label.recipient.fullName}</span>
                  <Link href={`/crear?id=${label.id}`} className="shrink-0 font-medium text-primary hover:underline">
                    {label.orderNumber}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button variant="secondary" size="sm" asChild>
          <Link href="/inventario">Ver inventario</Link>
        </Button>
        <Button variant="secondary" size="sm" asChild>
          <Link href="/clientes">Ver clientes</Link>
        </Button>
        <Button variant="secondary" size="sm" asChild>
          <Link href="/reportes">Ver reportes</Link>
        </Button>
      </div>
    </div>
  );
}
