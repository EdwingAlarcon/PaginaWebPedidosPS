import type { OrderPayment, OrderPaymentDraft, OrderRecord, PaymentMethod } from "@/lib/business-types";
import { summarizePayment } from "@/lib/payments";

export const COMPLETION_PAYMENT_NOTE = "PAGADO AL COMPLETAR";

export type CompletionOptions = {
  /** Registrar tambien el pago del saldo pendiente en la misma accion. */
  registerPayment: boolean;
  method: PaymentMethod;
  paidAt: string;
};

export type CompletionResult = {
  order: OrderRecord;
  payment: OrderPayment | null;
};

type CompletionStore = {
  updateOrder(id: string, patch: { status: OrderRecord["status"] }): Promise<OrderRecord>;
  addPayment(orderId: string, draft: OrderPaymentDraft): Promise<OrderPayment>;
};

/** Saldo que se pagaria al completar (0 si ya esta pagado, es historico o esta cancelado). */
export function completionBalance(order: OrderRecord, payments: OrderPayment[]): number {
  return summarizePayment(order, payments).balance;
}

/**
 * Completa un pedido y, si se pide, registra el pago de su saldo en la misma
 * accion, para no tener que actualizar Despacho y Pagos por separado.
 *
 * El pago va primero: si falla, el pedido NO se completa y se puede reintentar.
 * Si fallara el cambio de estado despues, queda "pagado pero pendiente", que es
 * un estado normal (prepago) y no pierde dinero ni deuda.
 */
export async function completeOrderWithPayment(
  store: CompletionStore,
  order: OrderRecord,
  payments: OrderPayment[],
  options: CompletionOptions,
): Promise<CompletionResult> {
  const balance = completionBalance(order, payments);
  let payment: OrderPayment | null = null;
  if (options.registerPayment && balance > 0) {
    payment = await store.addPayment(order.id, {
      amount: balance,
      method: options.method,
      paidAt: options.paidAt,
      note: COMPLETION_PAYMENT_NOTE,
    });
  }
  const updated = order.status === "completed" ? order : await store.updateOrder(order.id, { status: "completed" });
  return { order: updated, payment };
}
