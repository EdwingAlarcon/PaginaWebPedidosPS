import type { OrderPayment, OrderRecord } from "@/lib/business-types";
import { summarizePayment } from "@/lib/payments";

export type OrderLockReason = "completed" | "paid";

export type OrderLock = {
  locked: boolean;
  reason: OrderLockReason | null;
};

/**
 * Un pedido completado o pagado esta "cerrado": no se edita (cliente, lineas,
 * precios, descuento, envio) para no descuadrar lo que ya se despacho o cobro.
 * Es un bloqueo de interfaz: los cambios de sistema (estado, sincronizar el
 * snapshot del cliente) siguen usando updateOrder.
 * Para corregirlo: reabrir el pedido (si esta completado) o quitar el pago (si esta pagado).
 */
export function getOrderLock(
  order: Pick<OrderRecord, "total" | "status" | "source">,
  payments: Pick<OrderPayment, "amount">[],
): OrderLock {
  if (order.status === "completed") return { locked: true, reason: "completed" };
  if (summarizePayment(order, payments).status === "paid") return { locked: true, reason: "paid" };
  return { locked: false, reason: null };
}

export const ORDER_LOCK_MESSAGES: Record<OrderLockReason, string> = {
  completed: "Pedido completado: no se puede editar. Si hay un error, reábrelo para corregirlo.",
  paid: "Pedido pagado: no se puede editar. Si hay un error, elimina el pago para corregirlo.",
};
