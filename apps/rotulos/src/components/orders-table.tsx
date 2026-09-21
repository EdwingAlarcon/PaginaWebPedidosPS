"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { getBusinessStore } from "@/lib/business-store";
import type { Customer, OrderPayment, OrderRecord } from "@/lib/business-types";
import { groupPaymentsByOrder, summarizePayment, type PaymentStatus } from "@/lib/payments";
import { completeOrderWithPayment, completionBalance, type CompletionOptions } from "@/lib/order-completion";
import { getOrderLock } from "@/lib/order-lock";
import { CompleteOrdersDialog, type CompletionTarget } from "@/components/complete-orders-dialog";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { PaymentBadge, StatusBadge } from "@/components/ui/badge";
import { DatePicker } from "@/components/ui/date-picker";
import { Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { OrderDetailDrawer } from "@/components/order-detail-drawer";
import { OrderEditForm } from "@/components/order-edit-form";
import { useToast } from "@/components/ui/toast";

type OrderTableRow = OrderRecord & {
  displayCustomerName: string;
  displayPhone: string;
  paymentStatus: PaymentStatus;
  paymentBalance: number;
};

type StatusFilter = "all" | OrderRecord["status"];
type PaymentFilter = "all" | "receivable" | "paid" | "unrecorded";

function normalizeName(value: string): string {
  return value.trim().replace(/\s+/g, " ").toUpperCase();
}

function isShortNameOf(shortName: string, fullName: string): boolean {
  const short = normalizeName(shortName);
  const full = normalizeName(fullName);
  return Boolean(short) && short !== full && full.startsWith(`${short} `);
}

function relatedCustomer(order: OrderRecord, customers: Customer[]): Customer | undefined {
  const linkedCustomer = order.customerId ? customers.find((customer) => customer.id === order.customerId) : undefined;
  if (linkedCustomer) return linkedCustomer;
  return customers.find((customer) =>
    normalizeName(order.customer.fullName) === normalizeName(customer.fullName) ||
    isShortNameOf(order.customer.fullName, customer.fullName),
  );
}

function customerSnapshot(customer: Customer): OrderRecord["customer"] {
  return {
    fullName: customer.fullName,
    phone: customer.phone,
    email: customer.email,
    department: customer.department,
    city: customer.city,
    locality: customer.locality ?? "",
    address: customer.address,
    neighborhood: customer.neighborhood,
  };
}

function needsCustomerSnapshotSync(order: OrderRecord, customer: Customer): boolean {
  const snapshot = customerSnapshot(customer);
  return (
    order.customer.fullName !== snapshot.fullName ||
    order.customer.phone !== snapshot.phone ||
    order.customer.email !== snapshot.email ||
    order.customer.department !== snapshot.department ||
    order.customer.city !== snapshot.city ||
    (order.customer.locality ?? "") !== snapshot.locality ||
    order.customer.address !== snapshot.address ||
    order.customer.neighborhood !== snapshot.neighborhood
  );
}

function orderToRow(order: OrderRecord, customers: Customer[], payments: OrderPayment[]): OrderTableRow {
  const customer = relatedCustomer(order, customers);
  const syncedCustomer = customer && order.customerId === customer.id ? customerSnapshot(customer) : order.customer;
  const displayCustomerName =
    customer && (order.customerId === customer.id || !order.customer.fullName.trim() || isShortNameOf(order.customer.fullName, customer.fullName))
      ? customer?.fullName ?? order.customer.fullName
      : order.customer.fullName;
  const displayPhone = customer && order.customerId === customer.id ? customer.phone : order.customer.phone || customer?.phone || "";
  const paymentSummary = summarizePayment(order, payments);
  return {
    ...order,
    customer: {
      ...syncedCustomer,
      fullName: displayCustomerName,
      phone: displayPhone,
    },
    displayCustomerName,
    displayPhone,
    paymentStatus: paymentSummary.status,
    paymentBalance: paymentSummary.balance,
  };
}

const columns: DataTableColumn<OrderTableRow>[] = [
  { key: "date", header: "Fecha", render: (order) => order.orderDate, sortValue: (order) => order.orderDate },
  {
    key: "customer",
    header: "Cliente",
    render: (order) => order.displayCustomerName,
    sortValue: (order) => order.displayCustomerName,
  },
  { key: "phone", header: "Teléfono", render: (order) => order.displayPhone || "-" },
  { key: "items", header: "Items", render: (order) => order.items.length, align: "center" },
  {
    key: "total",
    header: "Total",
    render: (order) => `$${Math.round(order.total).toLocaleString("es-CO")}`,
    sortValue: (order) => order.total,
    align: "right",
  },
  { key: "status", header: "Estado", render: (order) => <StatusBadge status={order.status} /> },
  {
    key: "payment",
    header: "Pago",
    render: (order) => (
      <div className="flex flex-col items-start gap-0.5">
        <PaymentBadge status={order.paymentStatus} />
        {order.paymentBalance > 0 ? (
          <span className="text-xs text-foreground-muted">Debe ${Math.round(order.paymentBalance).toLocaleString("es-CO")}</span>
        ) : null}
      </div>
    ),
    sortValue: (order) => order.paymentBalance,
  },
];

function matchesPaymentFilter(row: OrderTableRow, filter: PaymentFilter): boolean {
  if (filter === "all") return true;
  if (filter === "receivable") return row.paymentBalance > 0;
  if (filter === "paid") return row.paymentStatus === "paid";
  return row.paymentStatus === "legacy";
}

export function OrdersTable() {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [payments, setPayments] = useState<OrderPayment[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<OrderRecord | null>(null);
  const [mode, setMode] = useState<"detail" | "edit">("detail");
  const [formDirty, setFormDirty] = useState(false);
  const [completeTargets, setCompleteTargets] = useState<CompletionTarget[]>([]);
  const [completing, setCompleting] = useState(false);
  const toast = useToast();

  async function syncLinkedOrderSnapshots(ordersToSync: OrderRecord[], customersToSync: Customer[]) {
    const store = getBusinessStore();
    const customerById = new Map(customersToSync.map((customer) => [customer.id, customer]));
    const updates = ordersToSync
      .map((order) => {
        const customer = order.customerId ? customerById.get(order.customerId) : undefined;
        return customer && needsCustomerSnapshotSync(order, customer) ? { order, customer } : null;
      })
      .filter((item): item is { order: OrderRecord; customer: Customer } => Boolean(item));
    if (updates.length === 0) return;

    try {
      const updatedOrders = await Promise.all(
        updates.map(({ order, customer }) => store.updateOrder(order.id, { customer: customerSnapshot(customer) })),
      );
      const updatedById = new Map(updatedOrders.map((order) => [order.id, order]));
      setOrders((current) => current.map((order) => updatedById.get(order.id) ?? order));
    } catch {
      // La tabla sigue mostrando el cliente actual aunque la sincronizacion silenciosa falle.
    }
  }

  useEffect(() => {
    const store = getBusinessStore();
    Promise.all([
      store.listOrders(),
      store.listCustomers().catch(() => []),
      store.listPayments().catch(() => []),
    ])
      .then(([ordersResult, customersResult, paymentsResult]) => {
        setOrders(ordersResult);
        setCustomers(customersResult);
        setPayments(paymentsResult);
        void syncLinkedOrderSnapshots(ordersResult, customersResult);
      })
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

  const rows = useMemo(() => {
    const byOrder = groupPaymentsByOrder(payments);
    return orders
      .map((order) => orderToRow(order, customers, byOrder.get(order.id) ?? []))
      .filter(
        (row) =>
          (statusFilter === "all" || row.status === statusFilter) &&
          matchesPaymentFilter(row, paymentFilter) &&
          (!dateFrom || row.orderDate >= dateFrom) &&
          (!dateTo || row.orderDate <= dateTo),
      );
  }, [orders, customers, payments, statusFilter, paymentFilter, dateFrom, dateTo]);

  const hasFilters = statusFilter !== "all" || paymentFilter !== "all" || dateFrom !== "" || dateTo !== "";

  function clearFilters() {
    setStatusFilter("all");
    setPaymentFilter("all");
    setDateFrom("");
    setDateTo("");
  }

  const selectedPayments = selectedOrder ? payments.filter((payment) => payment.orderId === selectedOrder.id) : [];
  const selectedLock = selectedOrder ? getOrderLock(selectedOrder, selectedPayments) : null;

  function requestComplete() {
    if (!selectedOrder) return;
    setCompleteTargets([{ order: selectedOrder, balance: completionBalance(selectedOrder, selectedPayments) }]);
  }

  async function confirmComplete(options: CompletionOptions) {
    const target = completeTargets[0];
    if (!target) return;
    setCompleting(true);
    try {
      const result = await completeOrderWithPayment(getBusinessStore(), target.order, selectedPayments, options);
      setOrders((current) => current.map((item) => (item.id === result.order.id ? result.order : item)));
      const newPayment = result.payment;
      if (newPayment) setPayments((current) => [...current, newPayment]);
      setSelectedOrder(result.order);
      setCompleteTargets([]);
      toast.push({ variant: "success", title: newPayment ? "Pedido completado y pago registrado." : "Pedido completado." });
    } catch {
      toast.push({ variant: "danger", title: "No se pudo completar el pedido." });
    } finally {
      setCompleting(false);
    }
  }

  async function handleReopen() {
    if (!selectedOrder) return;
    if (!window.confirm("¿Reabrir el pedido? Volverá a Pendiente y podrás editarlo.")) return;
    try {
      const reopened = await getBusinessStore().updateOrder(selectedOrder.id, { status: "pending" });
      setOrders((current) => current.map((item) => (item.id === reopened.id ? reopened : item)));
      setSelectedOrder(reopened);
      toast.push({ variant: "success", title: "Pedido reabierto." });
    } catch {
      toast.push({ variant: "danger", title: "No se pudo reabrir el pedido." });
    }
  }

  return (
    <>
      <DataTable
        columns={columns}
        data={rows}
        initialSort={{ key: "date", direction: "desc" }}
        toolbar={
          <div className="flex flex-wrap items-center gap-2">
            <Select
              aria-label="Filtrar por estado"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
              className="w-auto"
            >
              <option value="all">Todos los estados</option>
              <option value="pending">Pendiente</option>
              <option value="completed">Completado</option>
              <option value="cancelled">Cancelado</option>
            </Select>
            <Select
              aria-label="Filtrar por pago"
              value={paymentFilter}
              onChange={(event) => setPaymentFilter(event.target.value as PaymentFilter)}
              className="w-auto"
            >
              <option value="all">Todos los pagos</option>
              <option value="receivable">Por cobrar</option>
              <option value="paid">Pagados</option>
              <option value="unrecorded">Sin registro de pago</option>
            </Select>
            <div className="w-40">
              <DatePicker aria-label="Desde" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
            </div>
            <div className="w-40">
              <DatePicker aria-label="Hasta" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
            </div>
            {hasFilters ? (
              <Button type="button" variant="ghost" size="sm" onClick={clearFilters}>
                Limpiar filtros
              </Button>
            ) : null}
          </div>
        }
        getRowId={(order) => order.id}
        loading={loading}
        onRowClick={openOrder}
        searchPlaceholder="Buscar por cliente, teléfono o producto"
        searchPredicate={(order, query) =>
          order.displayCustomerName.toLowerCase().includes(query) ||
          order.displayPhone.includes(query) ||
          order.items.some((item) => item.productName.toLowerCase().includes(query))
        }
        emptyTitle="No hay pedidos todavía"
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
          title={mode === "edit" && !selectedLock?.locked ? "Editar pedido" : "Detalle del pedido"}
          description={selectedOrder?.customer.fullName}
          className="max-w-3xl"
        >
          {selectedOrder ? (
            mode === "edit" && !selectedLock?.locked ? (
              <OrderEditForm
                key={`${selectedOrder.id}-${selectedOrder.updatedAt}`}
                order={selectedOrder}
                onSaved={handleSaved}
                onCancel={() => setMode("detail")}
                onDirtyChange={setFormDirty}
              />
            ) : (
              <OrderDetailDrawer
                order={selectedOrder}
                payments={selectedPayments}
                onEdit={() => setMode("edit")}
                onComplete={requestComplete}
                onReopen={handleReopen}
                onPaymentAdded={(payment) => setPayments((current) => [...current, payment])}
                onPaymentDeleted={(paymentId) => setPayments((current) => current.filter((payment) => payment.id !== paymentId))}
              />
            )
          ) : null}
        </DrawerContent>
      </Drawer>

      <CompleteOrdersDialog
        key={completeTargets.map((target) => target.order.id).join(",")}
        targets={completeTargets}
        loading={completing}
        onCancel={() => setCompleteTargets([])}
        onConfirm={confirmComplete}
      />
    </>
  );
}
