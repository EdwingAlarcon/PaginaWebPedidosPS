"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getBusinessStore } from "@/lib/business-store";
import { getLabelStore } from "@/lib/label-store";
import type { OrderRecord } from "@/lib/business-types";
import type { LabelRecord } from "@/lib/types";

function isToday(value: string): boolean {
  return value.slice(0, 10) === new Date().toISOString().slice(0, 10);
}

export function DashboardStats({ labels }: { labels: LabelRecord[] }) {
  const [dashboardLabels, setDashboardLabels] = useState(labels);
  const [orders, setOrders] = useState<OrderRecord[]>([]);

  useEffect(() => {
    getLabelStore().listLabels().then(setDashboardLabels).catch(() => setDashboardLabels(labels));
    getBusinessStore().listOrders().then(setOrders).catch(() => setOrders([]));
  }, [labels]);

  const todayCount = dashboardLabels.filter((label) => isToday(label.createdAt)).length;
  const todayOrders = orders.filter((order) => order.orderDate === new Date().toISOString().slice(0, 10)).length;
  const revenue = orders.reduce((sum, order) => sum + order.total, 0);
  const latest = dashboardLabels.slice(0, 5);

  return (
    <div className="dashboard-stack">
      <div className="kpi-grid">
        <div className="metric-card"><span>Total pedidos</span><strong>{orders.length}</strong></div>
        <div className="metric-card"><span>Pedidos hoy</span><strong>{todayOrders}</strong></div>
        <div className="metric-card"><span>Ventas registradas</span><strong>${Math.round(revenue).toLocaleString("es-CO")}</strong></div>
        <div className="metric-card"><span>Total rotulos</span><strong>{dashboardLabels.length}</strong></div>
      </div>
      <div className="quick-actions-grid">
        <Link className="primary-action" href="/pedidos/nuevo">Nuevo Pedido</Link>
        <Link className="primary-action secondary" href="/crear">Crear Rotulo</Link>
        <Link className="primary-action neutral" href="/clientes">Ver Clientes</Link>
      </div>
      <section className="panel">
        <div className="panel-title">Actividad reciente</div>
        <div className="activity-grid">
          <div>
            <h3>Ultimos pedidos</h3>
            {orders.slice(0, 5).length === 0 ? (
              <p className="empty-copy">Aun no hay pedidos guardados.</p>
            ) : orders.slice(0, 5).map((order) => (
              <div className="activity-row" key={order.id}>
                <span>{order.customer.fullName}</span>
                <strong>${Math.round(order.total).toLocaleString("es-CO")}</strong>
              </div>
            ))}
          </div>
          <div>
            <h3>Ultimos rotulos</h3>
            {latest.length === 0 ? (
              <p className="empty-copy">Aun no hay rotulos guardados.</p>
            ) : latest.map((label) => (
              <div className="activity-row" key={label.id}>
                <span>{label.recipient.fullName}</span>
                <Link href={`/crear?id=${label.id}`}>{label.orderNumber}</Link>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="panel">
        <div className="panel-title">Resumen general de tu negocio</div>
        <div className="summary-grid">
          <div>
            <span>Clientes activos</span>
            <strong>{new Set(orders.map((order) => order.customer.phone || order.customer.fullName)).size}</strong>
          </div>
          <div>
            <span>Rotulos generados hoy</span>
            <strong>{todayCount}</strong>
          </div>
          <div>
            <span>Estado</span>
            <strong>Conectado a Supabase</strong>
          </div>
        </div>
      </section>
    </div>
  );
}
