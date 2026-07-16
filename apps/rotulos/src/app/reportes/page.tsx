import Link from "next/link";

export default function ReportsPage() {
  return (
    <main className="page-shell">
      <div className="page-heading">
        <p>Analitica</p>
        <h1>Reportes</h1>
      </div>
      <section className="panel">
        <div className="panel-title">Dashboard de reportes</div>
        <div className="quick-actions-grid">
          <Link className="primary-action" href="/pedidos">Pedidos</Link>
          <Link className="primary-action secondary" href="/clientes">Clientes</Link>
          <Link className="primary-action neutral" href="/historial">Rotulos</Link>
        </div>
      </section>
    </main>
  );
}
