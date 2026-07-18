"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { getBusinessStore } from "@/lib/business-store";
import type { OrderRecord } from "@/lib/business-types";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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

  useEffect(() => {
    getBusinessStore()
      .listOrders()
      .then(setOrders)
      .finally(() => setLoading(false));
  }, []);

  return (
    <DataTable
      columns={columns}
      data={orders}
      getRowId={(order) => order.id}
      loading={loading}
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
  );
}
