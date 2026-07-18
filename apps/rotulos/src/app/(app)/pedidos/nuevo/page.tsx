import { OrderForm } from "@/components/order-form";
import { PageHeading } from "@/components/ui/page-heading";

export default function NewOrderPage() {
  return (
    <main className="page-shell">
      <PageHeading eyebrow="Ventas" title="Nuevo pedido" />
      <OrderForm />
    </main>
  );
}
