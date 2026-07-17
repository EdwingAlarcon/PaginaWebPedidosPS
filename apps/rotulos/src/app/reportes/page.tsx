"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getInventoryStore } from "@/lib/inventory-store";
import { formatCop } from "@/lib/format";
import type { Product, StockAlerts } from "@/lib/inventory-types";

const emptyAlerts: StockAlerts = { lowStock: [], critical: [], overstocked: [] };

export default function ReportsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [alerts, setAlerts] = useState<StockAlerts>(emptyAlerts);

  useEffect(() => {
    const store = getInventoryStore();
    store.listProducts().then(setProducts).catch(() => setProducts([]));
    store.getStockAlerts().then(setAlerts).catch(() => setAlerts(emptyAlerts));
  }, []);

  const totalValue = products.reduce((sum, product) => sum + product.currentStock * product.unitPrice, 0);

  return (
    <main className="page-shell">
      <div className="page-heading">
        <p>Analitica</p>
        <h1>Reportes</h1>
      </div>
      <section className="panel">
        <div className="panel-title">Inventario</div>
        <div className="summary-grid">
          <div><span>Productos activos</span><strong>{products.length}</strong></div>
          <div><span>Valor total en stock</span><strong>{formatCop(totalValue)}</strong></div>
          <div><span>Con stock bajo</span><strong>{alerts.lowStock.length}</strong></div>
          <div><span>Sin stock</span><strong>{alerts.critical.length}</strong></div>
          <div><span>Con exceso de stock</span><strong>{alerts.overstocked.length}</strong></div>
        </div>
      </section>
      <section className="panel">
        <div className="panel-title">Dashboard de reportes</div>
        <div className="quick-actions-grid">
          <Link className="primary-action" href="/pedidos">Pedidos</Link>
          <Link className="primary-action secondary" href="/clientes">Clientes</Link>
          <Link className="primary-action neutral" href="/inventario">Inventario</Link>
          <Link className="primary-action neutral" href="/historial">Rotulos</Link>
        </div>
      </section>
    </main>
  );
}
