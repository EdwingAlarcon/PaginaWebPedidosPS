export default function InventoryPage() {
  return (
    <main className="page-shell">
      <div className="page-heading">
        <p>Control de stock</p>
        <h1>Inventario</h1>
      </div>
      <section className="panel">
        <div className="panel-title">Inventario de productos</div>
        <p className="empty-copy">
          Esta seccion queda preparada para migrar el inventario completo de productos y movimientos.
          Los pedidos, clientes y rotulos ya estan conectados a Supabase.
        </p>
      </section>
    </main>
  );
}
