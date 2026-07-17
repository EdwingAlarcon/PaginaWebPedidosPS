import Link from "next/link";
import { getInventoryStore } from "@/lib/inventory-store";
import { formatCop } from "@/lib/format";

export default async function ReportsPage() {
  const store = getInventoryStore();
  const [products, alerts] = await Promise.all([store.listProducts(), store.getStockAlerts()]);
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
