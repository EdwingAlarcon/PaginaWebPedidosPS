"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { getBusinessStore } from "@/lib/business-store";
import type { Customer } from "@/lib/business-types";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { CustomerEditForm } from "@/components/customer-edit-form";
import { useToast } from "@/components/ui/toast";

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
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [formDirty, setFormDirty] = useState(false);
  const toast = useToast();

  useEffect(() => {
    getBusinessStore()
      .listCustomers()
      .then(setCustomers)
      .finally(() => setLoading(false));
  }, []);

  function closeDrawer() {
    setSelectedCustomer(null);
    setFormDirty(false);
  }

  function handleOpenChange(open: boolean) {
    if (open) return;
    if (formDirty && !window.confirm("Hay cambios sin guardar. ¿Quieres cerrar sin guardar?")) return;
    closeDrawer();
  }

  function handleSaved(customer: Customer) {
    setCustomers((current) => current.map((item) => (item.id === customer.id ? customer : item)));
    setSelectedCustomer(customer);
    setFormDirty(false);
    toast.push({ variant: "success", title: "Cliente actualizado." });
  }

  return (
    <>
      <DataTable
        columns={columns}
        data={customers}
        getRowId={(customer) => customer.id}
        loading={loading}
        onRowClick={setSelectedCustomer}
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

      <Drawer open={selectedCustomer !== null} onOpenChange={handleOpenChange}>
        <DrawerContent
          title="Editar cliente"
          description={selectedCustomer?.fullName}
          className="max-w-2xl"
        >
          {selectedCustomer ? (
            <CustomerEditForm
              key={`${selectedCustomer.id}-${selectedCustomer.updatedAt}`}
              customer={selectedCustomer}
              onSaved={handleSaved}
              onCancel={closeDrawer}
              onDirtyChange={setFormDirty}
            />
          ) : null}
        </DrawerContent>
      </Drawer>
    </>
  );
}
