"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { GitMerge, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { getBusinessStore } from "@/lib/business-store";
import type { Customer, OrderRecord } from "@/lib/business-types";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { Button, IconButton } from "@/components/ui/button";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { CustomerEditForm } from "@/components/customer-edit-form";
import { useToast } from "@/components/ui/toast";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { FormField } from "@/components/ui/form-field";
import { Alert } from "@/components/ui/alert";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

type DrawerMode = "edit" | "merge";

function normalizeForMatch(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function isRelatedOrderToCustomer(order: OrderRecord, customer: Customer): boolean {
  if (order.customerId === customer.id) return true;
  const orderName = normalizeForMatch(order.customer.fullName);
  const customerName = normalizeForMatch(customer.fullName);
  if (!orderName || !customerName) return false;
  if (orderName === customerName) return true;
  return orderName.length >= 4 && customerName.startsWith(`${orderName} `);
}

export function CustomersTable() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [drawerMode, setDrawerMode] = useState<DrawerMode>("edit");
  const [mergeTargetId, setMergeTargetId] = useState("");
  const [pendingDelete, setPendingDelete] = useState<Customer | null>(null);
  const [formDirty, setFormDirty] = useState(false);
  const [working, setWorking] = useState(false);
  const toast = useToast();

  useEffect(() => {
    refreshData().finally(() => setLoading(false));
  }, []);

  async function refreshData() {
    const store = getBusinessStore();
    const [nextCustomers, nextOrders] = await Promise.all([
      store.listCustomers(),
      store.listOrders().catch(() => []),
    ]);
    setCustomers(nextCustomers);
    setOrders(nextOrders);
  }

  function openEdit(customer: Customer) {
    setDrawerMode("edit");
    setMergeTargetId("");
    setSelectedCustomer(customer);
  }

  function openMerge(customer: Customer) {
    setDrawerMode("merge");
    setMergeTargetId("");
    setSelectedCustomer(customer);
    setFormDirty(false);
  }

  function closeDrawer() {
    setSelectedCustomer(null);
    setMergeTargetId("");
    setFormDirty(false);
  }

  function handleOpenChange(open: boolean) {
    if (open) return;
    if (drawerMode === "edit" && formDirty && !window.confirm("Hay cambios sin guardar. ¿Quieres cerrar sin guardar?")) return;
    closeDrawer();
  }

  function handleSaved(customer: Customer, affectedOrders = 0) {
    setCustomers((current) => current.map((item) => (item.id === customer.id ? customer : item)));
    setSelectedCustomer(customer);
    setFormDirty(false);
    toast.push({
      variant: "success",
      title: affectedOrders > 0 ? `Cliente actualizado y ${affectedOrders} pedido(s) relacionado(s) actualizado(s).` : "Cliente actualizado.",
    });
  }

  async function handleMerge() {
    if (!selectedCustomer || !mergeTargetId) return;
    const target = customers.find((customer) => customer.id === mergeTargetId);
    if (!target) return;
    const relatedOrders = orders.filter((order) => isRelatedOrderToCustomer(order, selectedCustomer)).length;
    const confirmed = window.confirm(
      `Se unificara ${selectedCustomer.fullName} con ${target.fullName}. ${relatedOrders} pedido(s) pasaran a mostrar los datos del cliente correcto. ¿Continuar?`,
    );
    if (!confirmed) return;

    setWorking(true);
    try {
      const result = await getBusinessStore().mergeCustomers(selectedCustomer.id, target.id);
      await refreshData();
      closeDrawer();
      toast.push({
        variant: "success",
        title: `Clientes unificados. ${result.updatedOrders} pedido(s) actualizado(s).`,
      });
    } catch {
      toast.push({ variant: "danger", title: "No se pudo unificar el cliente." });
    } finally {
      setWorking(false);
    }
  }

  async function handleDelete() {
    if (!pendingDelete) return;
    setWorking(true);
    try {
      await getBusinessStore().deleteCustomer(pendingDelete.id);
      await refreshData();
      if (selectedCustomer?.id === pendingDelete.id) closeDrawer();
      setPendingDelete(null);
      toast.push({ variant: "success", title: "Cliente eliminado. Los pedidos se conservaron." });
    } catch {
      toast.push({ variant: "danger", title: "No se pudo eliminar el cliente." });
    } finally {
      setWorking(false);
    }
  }

  const columns: DataTableColumn<Customer>[] = [
    { key: "name", header: "Cliente", render: (c) => c.fullName, sortValue: (c) => c.fullName },
    { key: "phone", header: "Telefono", render: (c) => c.phone || "-" },
    { key: "email", header: "Email", render: (c) => c.email || "-" },
    { key: "city", header: "Ciudad", render: (c) => c.city || "-", sortValue: (c) => c.city },
    { key: "address", header: "Direccion", render: (c) => c.address || "-" },
    {
      key: "actions",
      header: "Acciones",
      align: "right",
      render: (customer) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <IconButton label={`Acciones para ${customer.fullName}`} size="sm" onClick={(event) => event.stopPropagation()}>
              <MoreHorizontal className="size-4" aria-hidden="true" />
            </IconButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => openEdit(customer)}>
              <Pencil className="size-4" aria-hidden="true" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => openMerge(customer)} disabled={customers.length < 2}>
              <GitMerge className="size-4" aria-hidden="true" />
              Unificar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-danger" onSelect={() => setPendingDelete(customer)}>
              <Trash2 className="size-4" aria-hidden="true" />
              Eliminar cliente
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const mergeTargets = customers.filter((customer) => customer.id !== selectedCustomer?.id);
  const mergeOrderCount = selectedCustomer ? orders.filter((order) => isRelatedOrderToCustomer(order, selectedCustomer)).length : 0;

  return (
    <>
      <DataTable
        columns={columns}
        data={customers}
        getRowId={(customer) => customer.id}
        loading={loading}
        onRowClick={openEdit}
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
          title={drawerMode === "merge" ? "Unificar cliente" : "Editar cliente"}
          description={selectedCustomer?.fullName}
          className="max-w-2xl"
        >
          {selectedCustomer && drawerMode === "edit" ? (
            <CustomerEditForm
              key={`${selectedCustomer.id}-${selectedCustomer.updatedAt}`}
              customer={selectedCustomer}
              onSaved={handleSaved}
              onCancel={closeDrawer}
              onDirtyChange={setFormDirty}
            />
          ) : null}
          {selectedCustomer && drawerMode === "merge" ? (
            <div className="grid gap-4">
              <Alert title="Los pedidos quedan con el cliente correcto">
                Se actualizaran {mergeOrderCount} pedido(s) relacionados: el nombre, telefono, ciudad, direccion y demas datos del pedido pasaran al cliente que elijas.
              </Alert>
              <FormField label="Cliente correcto" required>
                <select
                  value={mergeTargetId}
                  onChange={(event) => setMergeTargetId(event.target.value)}
                  className="h-10 rounded-md border border-border bg-surface px-3 text-sm text-foreground outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                >
                  <option value="">Selecciona el cliente destino</option>
                  {mergeTargets.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.fullName} {customer.phone ? `- ${customer.phone}` : ""}
                    </option>
                  ))}
                </select>
              </FormField>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="secondary" onClick={closeDrawer}>
                  Cancelar
                </Button>
                <Button type="button" onClick={handleMerge} loading={working} disabled={!mergeTargetId}>
                  <GitMerge className="size-4" aria-hidden="true" />
                  Unificar clientes
                </Button>
              </div>
            </div>
          ) : null}
        </DrawerContent>
      </Drawer>

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
        title="Eliminar cliente"
        description={
          pendingDelete
            ? `Se eliminara ${pendingDelete.fullName}. Sus pedidos se conservaran y quedaran sin cliente relacionado.`
            : undefined
        }
        confirmLabel="Eliminar"
        variant="danger"
        loading={working}
        onConfirm={handleDelete}
      />
    </>
  );
}
