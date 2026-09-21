import type { OrderPayment, OrderRecord, PaymentMethod } from "@/lib/business-types";

export type PaymentStatus = "paid" | "partial" | "unpaid" | "legacy" | "cancelled";

export type PaymentSummary = {
  status: PaymentStatus;
  paid: number;
  balance: number;
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  efectivo: "Efectivo",
  transferencia: "Transferencia",
  nequi: "Nequi",
  daviplata: "Daviplata",
  otro: "Otro",
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  paid: "Pagado",
  partial: "Abonado",
  unpaid: "Sin pago",
  legacy: "Sin registro",
  cancelled: "Cancelado",
};

/**
 * Estado de pago de un pedido a partir de sus abonos registrados.
 *
 * Solo los pedidos importados de Excel sin ningun abono se consideran
 * "legacy": el sistema no sabe si se pagaron, pero no los cuenta como deuda
 * para no inventar cartera sobre ventas historicas (scripts/backfill-historical-payments
 * los registra como pagados). Un pedido creado en la app y completado sin pago
 * SIGUE siendo deuda: completarlo (despacho) no debe borrar el saldo por cobrar.
 */
export function summarizePayment(
  order: Pick<OrderRecord, "total" | "status" | "source">,
  payments: Pick<OrderPayment, "amount">[],
): PaymentSummary {
  const paid = payments.reduce((sum, payment) => sum + payment.amount, 0);
  if (order.status === "cancelled") return { status: "cancelled", paid, balance: 0 };
  if (paid <= 0 && order.source === "excel_import") {
    return { status: "legacy", paid: 0, balance: 0 };
  }
  if (order.total > 0 && paid >= order.total) return { status: "paid", paid, balance: 0 };
  if (paid > 0) return { status: "partial", paid, balance: Math.max(0, order.total - paid) };
  return { status: "unpaid", paid: 0, balance: order.total };
}

export function groupPaymentsByOrder(payments: OrderPayment[]): Map<string, OrderPayment[]> {
  const byOrder = new Map<string, OrderPayment[]>();
  for (const payment of payments) {
    const list = byOrder.get(payment.orderId);
    if (list) list.push(payment);
    else byOrder.set(payment.orderId, [payment]);
  }
  return byOrder;
}

export type Receivable = { order: OrderRecord; summary: PaymentSummary };

/** Pedidos con saldo pendiente, del mas antiguo al mas reciente. */
export function listReceivables(orders: OrderRecord[], payments: OrderPayment[]): Receivable[] {
  const byOrder = groupPaymentsByOrder(payments);
  return orders
    .map((order) => ({ order, summary: summarizePayment(order, byOrder.get(order.id) ?? []) }))
    .filter((entry) => entry.summary.balance > 0)
    .sort((a, b) => a.order.orderDate.localeCompare(b.order.orderDate));
}

export function totalReceivable(receivables: Receivable[]): number {
  return receivables.reduce((sum, entry) => sum + entry.summary.balance, 0);
}

/** Mensaje de WhatsApp para recordar un saldo pendiente. */
export function buildPaymentReminderText(receivable: Receivable, formatMoney: (value: number) => string): string {
  const { order, summary } = receivable;
  const name = order.customer.fullName.trim();
  return [
    `Hola${name ? ` ${name}` : ""}! Te escribimos de Purple Shop.`,
    `Tu pedido del ${order.orderDate} tiene un saldo pendiente de ${formatMoney(summary.balance)}` +
      (summary.paid > 0 ? ` (ya abonaste ${formatMoney(summary.paid)} de ${formatMoney(order.total)}).` : "."),
    "Cuando puedas, confirmanos el pago. Gracias!",
  ].join("\n");
}
