import type { OrderEdit, OrderPayment, OrderRecord } from "@/lib/business-types";
import type { LabelRecord } from "@/lib/types";
import { PAYMENT_METHOD_LABELS } from "@/lib/payments";
import { formatCop } from "@/lib/format";

const FIELD_LABELS: Record<string, string> = {
  customer: "cliente",
  orderDate: "fecha",
  status: "estado",
  notes: "notas",
  discount: "descuento",
  shippingCost: "envío",
  subtotal: "subtotal",
  total: "total",
};

export type TimelineEventKind = "created" | "payment" | "edit" | "label" | "tracking";

export type TimelineEvent = {
  id: string;
  kind: TimelineEventKind;
  at: string;
  title: string;
  detail?: string;
};

/**
 * Une en una sola linea de tiempo lo que le paso a un pedido: creacion,
 * pagos, ediciones y rotulo. Orden cronologico ascendente (lo mas viejo
 * arriba), estable para eventos con la misma marca de tiempo.
 */
export function buildOrderTimeline(
  order: Pick<OrderRecord, "id" | "createdAt" | "source">,
  edits: OrderEdit[],
  payments: OrderPayment[],
  label: LabelRecord | null,
): TimelineEvent[] {
  const events: TimelineEvent[] = [
    {
      id: `created-${order.id}`,
      kind: "created",
      at: order.createdAt,
      title: order.source === "excel_import" ? "Pedido importado desde Excel" : "Pedido creado",
    },
  ];

  for (const payment of payments) {
    events.push({
      id: `payment-${payment.id}`,
      kind: "payment",
      at: payment.createdAt,
      title: `Pago de ${formatCop(payment.amount)}`,
      detail: `${PAYMENT_METHOD_LABELS[payment.method]}${payment.note ? ` · ${payment.note}` : ""}`,
    });
  }

  for (const edit of edits) {
    const fields = Object.keys(edit.changes).filter((key) => key !== "items");
    const itemCount = Array.isArray(edit.changes.items) ? edit.changes.items.length : 0;
    const parts = [...fields.map((field) => FIELD_LABELS[field] ?? field), ...(itemCount > 0 ? [`${itemCount} linea(s)`] : [])];
    events.push({
      id: `edit-${edit.id}`,
      kind: "edit",
      at: edit.changedAt,
      title: "Pedido editado",
      detail: parts.join(", ") || undefined,
    });
  }

  if (label) {
    events.push({
      id: `label-${label.id}`,
      kind: "label",
      at: label.createdAt,
      title: `Rótulo ${label.orderNumber}`,
      detail: label.status,
    });
    if (label.trackingNumber) {
      events.push({
        id: `tracking-${label.id}`,
        kind: "tracking",
        at: label.updatedAt ?? label.createdAt,
        title: `Guía ${label.trackingNumber}`,
        detail: label.carrier || undefined,
      });
    }
  }

  return events
    .map((event, index) => ({ event, index }))
    .sort((a, b) => a.event.at.localeCompare(b.event.at) || a.index - b.index)
    .map(({ event }) => event);
}
