"use client";

import { useMemo, useState } from "react";
import { getImportedOrders } from "@/lib/imported-orders";
import { formatCop, formatDate } from "@/lib/format";
import type { OrderRecord } from "@/lib/business-types";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/badge";
import { Select } from "@/components/ui/input";

const columns: DataTableColumn<OrderRecord>[] = [
  { key: "date", header: "Fecha", render: (order) => formatDate(order.orderDate), sortValue: (order) => order.orderDate },
  { key: "customer", header: "Cliente", render: (order) => order.customer.fullName, sortValue: (order) => order.customer.fullName },
  { key: "status", header: "Estado", render: (order) => <StatusBadge status={order.status} /> },
  {
    key: "items",
    header: "Unidades",
    render: (order) => order.items.reduce((sum, item) => sum + item.quantity, 0),
    sortValue: (order) => order.items.reduce((sum, item) => sum + item.quantity, 0),
    align: "center",
  },
  {
    key: "total",
    header: "Total",
    render: (order) => formatCop(order.total),
    sortValue: (order) => order.total,
    align: "right",
  },
  { key: "row", header: "Fila importada", render: (order) => order.importRowKey ?? "-", sortValue: (order) => order.importRowKey ?? "" },
];

export function ImportedOrdersTable({ orders, loading = false }: { orders: OrderRecord[]; loading?: boolean }) {
  const importedOrders = useMemo(() => getImportedOrders(orders), [orders]);
  const years = useMemo(
    () => [...new Set(importedOrders.map((order) => order.orderDate.slice(0, 4)).filter(Boolean))].sort().reverse(),
    [importedOrders],
  );
  const [year, setYear] = useState("all");
  const [status, setStatus] = useState<"all" | OrderRecord["status"]>("all");

  const filtered = useMemo(
    () => importedOrders.filter((order) =>
      (year === "all" || order.orderDate.startsWith(year)) &&
      (status === "all" || order.status === status),
    ),
    [importedOrders, status, year],
  );

  return (
    <DataTable
      columns={columns}
      data={filtered}
      getRowId={(order) => order.id}
      loading={loading}
      searchPlaceholder="Buscar importados"
      searchPredicate={(order, query) =>
        order.customer.fullName.toLowerCase().includes(query) ||
        order.items.some((item) =>
          item.productName.toLowerCase().includes(query) ||
          item.productCode.toLowerCase().includes(query),
        ) ||
        (order.importRowKey ?? "").toLowerCase().includes(query)
      }
      toolbar={
        <div className="flex flex-wrap gap-2">
          <Select value={year} onChange={(event) => setYear(event.target.value)} aria-label="Filtrar por año">
            <option value="all">Todos los años</option>
            {years.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </Select>
          <Select value={status} onChange={(event) => setStatus(event.target.value as "all" | OrderRecord["status"])} aria-label="Filtrar por estado">
            <option value="all">Todos los estados</option>
            <option value="pending">Pendiente</option>
            <option value="completed">Completado</option>
            <option value="cancelled">Cancelado</option>
          </Select>
        </div>
      }
      emptyTitle="No hay pedidos importados"
      emptyDescription="Los pedidos con origen Excel aparecerán aquí para auditoría histórica."
      pageSize={12}
    />
  );
}
