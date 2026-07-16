import { OrderForm } from "@/components/order-form";

export default function NewOrderPage() {
  return (
    <main className="page-shell">
      <div className="page-heading">
        <p>Ventas</p>
        <h1>Nuevo pedido</h1>
      </div>
      <OrderForm />
    </main>
  );
}
