import { OrdersTable } from "@/components/orders-table";

export default function OrdersPage() {
  return (
    <main className="page-shell">
      <div className="page-heading">
        <p>Operacion diaria</p>
        <h1>Pedidos</h1>
      </div>
      <OrdersTable />
    </main>
  );
}
