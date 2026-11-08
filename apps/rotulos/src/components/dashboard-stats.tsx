"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import {
  ArrowRight,
  ClipboardList,
  DollarSign,
  MessageCircle,
  PackagePlus,
  TriangleAlert,
  Truck,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { buildDispatchRows } from "@/lib/dispatch";
import { getInactiveCustomers } from "@/lib/inactive-customers";
import { getBusinessStore } from "@/lib/business-store";
import { businessToday } from "@/lib/date";
import { getLabelStore } from "@/lib/label-store";
import { getInventoryStore } from "@/lib/inventory-store";
import type { Customer, OrderPayment, OrderRecord } from "@/lib/business-types";
import { listReceivables, totalReceivable } from "@/lib/payments";
import type { LabelRecord } from "@/lib/types";
import { MetricCard, Card, CardHeader, CardTitle, IconChip, type ChipTone } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";

function isToday(value: string): boolean {
  return value.slice(0, 10) === businessToday();
}

const currency = (value: number) => `$${Math.round(value).toLocaleString("es-CO")}`;

const INACTIVE_DAYS = 45;

function ActionCard({
  href,
  icon: Icon,
  tone = "lila",
  title,
  value,
  detail,
  attention = false,
  loading,
}: {
  href: string;
  icon: LucideIcon;
  tone?: ChipTone;
  title: string;
  value: ReactNode;
  detail: string;
  attention?: boolean;
  loading: boolean;
}) {
  return (
    <Link
      href={href}
      className="group block rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
    >
      <Card className={`h-full transition-colors group-hover:bg-surface-muted ${attention ? "border-[var(--warning)]" : ""}`}>
        {loading ? (
          <>
            <div className="h-4 w-28 animate-pulse rounded bg-surface-muted" />
            <div className="mt-3 h-8 w-16 animate-pulse rounded bg-surface-muted" />
            <div className="mt-3 h-4 w-40 animate-pulse rounded bg-surface-muted" />
          </>
        ) : (
          <>
            <div className="flex items-center justify-between gap-2 text-sm text-foreground-muted">
              <span>{title}</span>
              <IconChip icon={Icon} tone={tone} />
            </div>
            <p className="mt-2 font-display text-2xl font-semibold text-foreground">{value}</p>
            <p className="mt-1 flex items-center justify-between gap-2 text-sm text-foreground-muted">
              <span>{detail}</span>
              <ArrowRight className="size-4 shrink-0 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </p>
          </>
        )}
      </Card>
    </Link>
  );
}

export function DashboardStats() {
  const [dashboardLabels, setDashboardLabels] = useState<LabelRecord[]>([]);
  const [labelsFailed, setLabelsFailed] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [payments, setPayments] = useState<OrderPayment[]>([]);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [hasInventory, setHasInventory] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getLabelStore()
        .listLabels()
        .then((result) => ({ result, failed: false }))
        .catch((error: unknown) => {
          console.error("No se pudieron cargar los rotulos", error);
          return { result: [] as LabelRecord[], failed: true };
        }),
      getBusinessStore().listOrders().catch(() => []),
      getInventoryStore()
        .getStockAlerts()
        .then((alerts) => alerts.lowStock.length + alerts.critical.length)
        .catch(() => 0),
      getBusinessStore().listPayments().catch(() => []),
      getInventoryStore()
        .listProducts()
        .then((products) => products.length > 0)
        .catch(() => false),
      getBusinessStore().listCustomers().catch(() => []),
    ]).then(([labelsResult, ordersResult, lowStock, paymentsResult, inventoryPresent, customersResult]) => {
      setDashboardLabels(labelsResult.result);
      setLabelsFailed(labelsResult.failed);
      setCustomers(customersResult);
      setOrders(ordersResult);
      setLowStockCount(lowStock);
      setPayments(paymentsResult);
      setHasInventory(inventoryPresent);
      setLoading(false);
    });
  }, []);

  const todayOrders = orders.filter((order) => isToday(order.orderDate));
  const todayRevenue = todayOrders.reduce((sum, order) => sum + order.total, 0);
  const pendingOrders = orders.filter((order) => order.status === "pending");
  const latestOrders = [...orders]
    .sort((a, b) => b.orderDate.localeCompare(a.orderDate))
    .slice(0, 5);
  const latestLabels = dashboardLabels.slice(0, 5);
  const receivables = listReceivables(orders, payments);
  const receivableTotal = totalReceivable(receivables);

  const dispatchRows = buildDispatchRows(orders, dashboardLabels);
  const dispatchIncomplete = dispatchRows.filter((row) => row.issues.length > 0).length;
  const inactive = getInactiveCustomers(customers, orders, INACTIVE_DAYS);
  const inactiveReachable = inactive.filter(({ customer }) => customer.phone.trim()).length;
  const inactiveWithoutPhone = inactive.length - inactiveReachable;

  return (
    <div className="flex flex-col gap-6">
      <section aria-labelledby="que-hacer-hoy">
        <h2 id="que-hacer-hoy" className="mb-3 text-card-title">
          Qué hacer hoy
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          <ActionCard
            href="/despacho"
            icon={Truck}
            tone="limon"
            title="Por despachar"
            value={dispatchRows.length}
            detail={
              dispatchIncomplete > 0
                ? `${dispatchIncomplete} con datos incompletos`
                : dispatchRows.length > 0
                  ? "Listos para rotular"
                  : "Todo despachado"
            }
            attention={dispatchIncomplete > 0}
            loading={loading}
          />
          <ActionCard
            href="/reportes"
            icon={Wallet}
            tone="chicle"
            title="Por cobrar"
            value={currency(receivableTotal)}
            detail={
              receivables.length > 0
                ? `${receivables.length} ${receivables.length === 1 ? "pedido" : "pedidos"} con saldo`
                : "Sin saldos pendientes"
            }
            attention={receivableTotal > 0}
            loading={loading}
          />
          <ActionCard
            href="/reportes"
            icon={MessageCircle}
            tone="lila"
            title="Clientes por reactivar"
            value={inactiveReachable}
            detail={
              inactive.length === 0
                ? `Nadie lleva más de ${INACTIVE_DAYS} días sin comprar`
                : `Llevan más de ${INACTIVE_DAYS} días sin comprar${
                    inactiveWithoutPhone > 0 ? ` · ${inactiveWithoutPhone} sin teléfono` : ""
                  }`
            }
            loading={loading}
          />
        </div>
      </section>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard label="Pedidos hoy" value={todayOrders.length} icon={ClipboardList} tone="lila" loading={loading} />
        <MetricCard label="Ventas hoy" value={currency(todayRevenue)} icon={DollarSign} tone="limon" loading={loading} />
        <MetricCard
          label="Pedidos pendientes"
          value={pendingOrders.length}
          icon={PackagePlus}
          tone="chicle"
          loading={loading}
          className={pendingOrders.length > 0 ? "border-[var(--warning)]" : undefined}
        />
        {hasInventory ? (
          <MetricCard
            label="Bajo stock"
            value={lowStockCount}
            icon={TriangleAlert}
            loading={loading}
            className={lowStockCount > 0 ? "border-[var(--warning)]" : undefined}
          />
        ) : null}
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
            <CardTitle>Rótulos recientes</CardTitle>
            <Button variant="link" size="sm" asChild>
              <Link href="/historial">Ver todos</Link>
            </Button>
          </CardHeader>
          {labelsFailed ? (
            <EmptyState
              title="No se pudieron cargar los rótulos"
              description="Recarga la página. Si sigue igual, revisa la conexión o vuelve a iniciar sesión."
            />
          ) : latestLabels.length === 0 ? (
            <EmptyState
              title="Aún no hay rótulos"
              description="Genera un rótulo de envío para verlo aquí."
              action={
                <Button size="sm" asChild>
                  <Link href="/crear">Crear rótulo</Link>
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
