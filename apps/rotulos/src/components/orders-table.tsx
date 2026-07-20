"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { getBusinessStore } from "@/lib/business-store";
import type { OrderRecord } from "@/lib/business-types";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { OrderDetailDrawer } from "@/components/order-detail-drawer";
import { OrderEditForm } from "@/components/order-edit-form";
import { useToast } from "@/components/ui/toast";

const columns: DataTableColumn<OrderRecord>[] = [
  { key: "date", header: "Fecha", render: (order) => order.orderDate, sortValue: (order) => order.orderDate },
  {
    key: "customer",
    header: "Cliente",
    render: (order) => order.customer.fullName,
    sortValue: (order) => order.customer.fullName,
  },
  { key: "phone", header: "Telefono", render: (order) => order.customer.phone || "-" },
  { key: "items", header: "Items", render: (order) => order.items.length, align: "center" },
  {
    key: "total",
    header: "Total",
    render: (order) => `$${Math.round(order.total).toLocaleString("es-CO")}`,
    sortValue: (order) => order.total,
    align: "right",
  },
  { key: "status", header: "Estado", render: (order) => <StatusBadge status={order.status} /> },
];

export function OrdersTable() {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<OrderRecord | null>(null);
  const [mode, setMode] = useState<"detail" | "edit">("detail");
  const [formDirty, setFormDirty] = useState(false);
  const toast = useToast();

  useEffect(() => {
    getBusinessStore()
      .listOrders()
      .then(setOrders)
      .finally(() => setLoading(false));
  }, []);

  function openOrder(order: OrderRecord) {
    setSelectedOrder(order);
    setMode("detail");
    setFormDirty(false);
  }

  function closeDrawer() {
    setSelectedOrder(null);
    setMode("detail");
    setFormDirty(false);
  }

  function handleOpenChange(open: boolean) {
    if (open) return;
    if (mode === "edit" && formDirty && !window.confirm("Hay cambios sin guardar. ¿Quieres cerrar sin guardar?")) return;
    closeDrawer();
  }

  function handleSaved(order: OrderRecord) {
    setOrders((current) => current.map((item) => (item.id === order.id ? order : item)));
    setSelectedOrder(order);
    setFormDirty(false);
    setMode("detail");
    toast.push({ variant: "success", title: "Pedido actualizado." });
  }

  return (
    <>
      <DataTable
        columns={columns}
        data={orders}
        getRowId={(order) => order.id}
        loading={loading}
        onRowClick={openOrder}
        searchPlaceholder="Buscar por cliente, telefono o producto"
        searchPredicate={(order, query) =>
          order.customer.fullName.toLowerCase().includes(query) ||
          order.customer.phone.includes(query) ||
          order.items.some((item) => item.productName.toLowerCase().includes(query))
        }
        emptyTitle="No hay pedidos todavia"
        emptyDescription="Crea tu primer pedido para comenzar a gestionar las ventas de PurpleShop."
        emptyAction={
          <Button size="sm" asChild>
            <Link href="/pedidos/nuevo">
              <Plus className="size-4" aria-hidden="true" />
              Crear pedido
            </Link>
          </Button>
        }
      />

      <Drawer open={selectedOrder !== null} onOpenChange={handleOpenChange}>
        <DrawerContent
          title={mode === "edit" ? "Editar pedido" : "Detalle del pedido"}
          description={selectedOrder?.customer.fullName}
          className="max-w-3xl"
        >
          {selectedOrder ? (
            mode === "edit" ? (
              <OrderEditForm
                key={`${selectedOrder.id}-${selectedOrder.updatedAt}`}
                order={selectedOrder}
                onSaved={handleSaved}
                onCancel={() => setMode("detail")}
                onDirtyChange={setFormDirty}
              />
            ) : (
              <OrderDetailDrawer order={selectedOrder} onEdit={() => setMode("edit")} />
            )
          ) : null}
        </DrawerContent>
      </Drawer>
    </>
  );
}
