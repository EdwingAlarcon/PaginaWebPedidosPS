"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { getBusinessStore } from "@/lib/business-store";
import type { Customer } from "@/lib/business-types";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";

const columns: DataTableColumn<Customer>[] = [
  { key: "name", header: "Cliente", render: (c) => c.fullName, sortValue: (c) => c.fullName },
  { key: "phone", header: "Telefono", render: (c) => c.phone || "-" },
  { key: "email", header: "Email", render: (c) => c.email || "-" },
  { key: "city", header: "Ciudad", render: (c) => c.city || "-", sortValue: (c) => c.city },
  { key: "address", header: "Direccion", render: (c) => c.address || "-" },
];

export function CustomersTable() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getBusinessStore()
      .listCustomers()
      .then(setCustomers)
      .finally(() => setLoading(false));
  }, []);

  return (
    <DataTable
      columns={columns}
      data={customers}
      getRowId={(customer) => customer.id}
      loading={loading}
      searchPlaceholder="Buscar por nombre, telefono o ciudad"
      searchPredicate={(customer, query) =>
        customer.fullName.toLowerCase().includes(query) ||
        customer.phone.includes(query) ||
        customer.city.toLowerCase().includes(query)
      }
      emptyTitle="No hay clientes todavia"
      emptyDescription="Los clientes se crean automaticamente al registrar un pedido."
      emptyAction={
        <Button size="sm" asChild>
          <Link href="/pedidos/nuevo">
            <Plus className="size-4" aria-hidden="true" />
            Crear pedido
          </Link>
        </Button>
      }
    />
  );
}
