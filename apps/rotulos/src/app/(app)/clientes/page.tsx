import { CustomersTable } from "@/components/customers-table";
import { PageHeading } from "@/components/ui/page-heading";

export default function CustomersPage() {
  return (
    <main className="page-shell">
      <PageHeading eyebrow="Base de datos" title="Clientes" />
      <CustomersTable />
    </main>
  );
}
