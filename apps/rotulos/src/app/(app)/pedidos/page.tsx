import { OrdersTable } from "@/components/orders-table";
import { PageHeading } from "@/components/ui/page-heading";

export default function OrdersPage() {
  return (
    <main className="page-shell">
      <PageHeading eyebrow="Operacion diaria" title="Pedidos" />
      <OrdersTable />
    </main>
  );
}
