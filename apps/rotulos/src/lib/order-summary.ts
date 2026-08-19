import { formatCop, formatDate } from "@/lib/format";
import type { Customer, OrderRecord } from "@/lib/business-types";

function itemLine(item: OrderRecord["items"][number]): string {
  return `- ${item.quantity}x ${item.productName} - ${formatCop(item.unitPrice)} c/u = ${formatCop(item.total)}`;
}

function orderItemLines(order: OrderRecord): string[] {
  if (order.items.length === 0) return ["- (sin productos registrados)"];
  return order.items.map(itemLine);
}

export function buildOrderSummaryText(order: OrderRecord): string {
  const lines: string[] = [
    "Resumen de tu pedido - Purple Shop",
    `Fecha: ${formatDate(order.orderDate)}`,
    `Cliente: ${order.customer.fullName}`,
    "",
    "Productos:",
    ...orderItemLines(order),
    "",
    `Subtotal: ${formatCop(order.subtotal)}`,
  ];
  if (order.discount > 0) lines.push(`Descuento: ${formatCop(order.discount)}`);
  if (order.shippingCost > 0) lines.push(`Envio: ${formatCop(order.shippingCost)}`);
  lines.push(`Total: ${formatCop(order.total)}`, "", "Gracias por tu compra!");
  return lines.join("\n");
}

export function buildCustomerHistoryText(customer: Customer, orders: OrderRecord[]): string {
  const sorted = [...orders].sort((a, b) => a.orderDate.localeCompare(b.orderDate));
  const lines: string[] = [`Historial de compras - ${customer.fullName}`, "Purple Shop", ""];
  let grandTotal = 0;
  sorted.forEach((order, index) => {
    grandTotal += order.total;
    lines.push(`Pedido ${index + 1} - ${formatDate(order.orderDate)}`, ...orderItemLines(order), `Total pedido: ${formatCop(order.total)}`, "");
  });
  lines.push(`Total comprado: ${formatCop(grandTotal)}`);
  return lines.join("\n").trim();
}

export function normalizePhoneForWhatsApp(phone: string): string {
  const digits = phone.replace(/\D+/g, "");
  if (!digits) return "";
  if (digits.startsWith("57")) return digits;
  if (digits.length === 10) return `57${digits}`;
  return digits;
}

export function buildWhatsAppLink(phone: string, text: string): string {
  const normalized = normalizePhoneForWhatsApp(phone);
  const encoded = encodeURIComponent(text);
  return normalized ? `https://wa.me/${normalized}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
}

type OrderSummaryPdfPayload = { order: OrderRecord } | { customer: Customer; orders: OrderRecord[] };

export async function downloadOrderSummaryPdf(payload: OrderSummaryPdfPayload, fallbackFileName: string): Promise<void> {
  const response = await fetch("/api/orders/summary/pdf", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error("pdf_failed");
  const blob = await response.blob();
  const disposition = response.headers.get("Content-Disposition") ?? "";
  const fileName = disposition.match(/filename="([^"]+)"/)?.[1] ?? fallbackFileName;
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
