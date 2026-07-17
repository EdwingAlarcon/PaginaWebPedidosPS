import { CustomersTable } from "@/components/customers-table";

export default function CustomersPage() {
  return (
    <main className="page-shell">
      <div className="page-heading">
        <p>Base de datos</p>
        <h1>Clientes</h1>
      </div>
      <CustomersTable />
    </main>
  );
}
