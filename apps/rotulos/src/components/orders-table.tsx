"use client";

import { useEffect, useMemo, useState } from "react";
import { getBusinessStore } from "@/lib/business-store";
import type { OrderRecord } from "@/lib/business-types";

export function OrdersTable() {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("Cargando pedidos...");

  useEffect(() => {
    getBusinessStore().listOrders()
      .then((items) => {
        setOrders(items);
        setStatus(items.length ? "" : "No hay pedidos guardados todavia.");
      })
      .catch(() => setStatus("No se pudieron cargar los pedidos."));
  }, []);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return orders;
    return orders.filter((order) =>
      order.customer.fullName.toLowerCase().includes(needle) ||
      order.customer.phone.includes(needle) ||
      order.items.some((item) => item.productName.toLowerCase().includes(needle)),
    );
  }, [orders, query]);

  return (
    <section className="panel">
      <label className="field">
        <span>Buscar pedido</span>
        <input value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <p role="status">{status}</p>
      <div className="history-table">
        <div className="business-row business-head">
          <span>Fecha</span><span>Cliente</span><span>Telefono</span><span>Items</span><span>Total</span><span>Estado</span>
        </div>
        {filtered.map((order) => (
          <div className="business-row" key={order.id}>
            <span>{order.orderDate}</span>
            <span>{order.customer.fullName}</span>
            <span>{order.customer.phone}</span>
            <span>{order.items.length}</span>
            <span>${Math.round(order.total).toLocaleString("es-CO")}</span>
            <span>{order.status}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
