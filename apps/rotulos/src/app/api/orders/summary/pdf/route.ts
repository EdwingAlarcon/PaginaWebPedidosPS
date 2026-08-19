import { NextRequest } from "next/server";
import { renderCustomerHistoryPdfBuffer, renderOrderSummaryPdfBuffer } from "@/lib/order-summary-pdf";
import { requireSession } from "@/lib/require-session";
import type { Customer, OrderRecord } from "@/lib/business-types";
import type { ShipmentTracking } from "@/lib/label-tracking";

export const runtime = "nodejs";

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function isValidOrder(value: unknown): value is OrderRecord {
  return isObject(value) && isObject(value.customer) && Array.isArray(value.items);
}

function isValidCustomer(value: unknown): value is Customer {
  return isObject(value) && typeof value.fullName === "string";
}

function isValidTracking(value: unknown): value is ShipmentTracking {
  return isObject(value) && typeof value.carrier === "string" && typeof value.trackingNumber === "string";
}

function slug(value: string): string {
  return (
    value
      .normalize("NFKD")
      .replace(/[^\x20-\x7E]/g, "")
      .replace(/[^a-z0-9._-]+/gi, "-")
      .replace(/^-+|-+$/g, "") || "purpleshop"
  );
}

function pdfResponse(buffer: Buffer, fileName: string): Response {
  const body = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;
  return new Response(body, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Cache-Control": "no-store",
    },
  });
}

export async function POST(request: NextRequest) {
  const session = await requireSession();
  if (!session) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const payload = await request.json().catch(() => null);
  if (!isObject(payload)) {
    return Response.json({ error: "invalid_payload" }, { status: 400 });
  }

  if (isValidOrder(payload.order)) {
    const order = payload.order;
    const tracking = isValidTracking(payload.tracking) ? payload.tracking : null;
    const pdf = await renderOrderSummaryPdfBuffer(order, tracking);
    return pdfResponse(pdf, `pedido-${slug(order.customer.fullName)}-${order.orderDate}.pdf`);
  }

  if (isValidCustomer(payload.customer) && Array.isArray(payload.orders) && payload.orders.every(isValidOrder)) {
    const customer = payload.customer;
    const orders = payload.orders as OrderRecord[];
    const pdf = await renderCustomerHistoryPdfBuffer(customer, orders);
    return pdfResponse(pdf, `historial-${slug(customer.fullName)}.pdf`);
  }

  return Response.json({ error: "invalid_payload" }, { status: 400 });
}
