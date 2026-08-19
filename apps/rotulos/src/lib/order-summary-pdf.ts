import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { formatCop, formatDate } from "@/lib/format";
import type { Customer, OrderRecord } from "@/lib/business-types";

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 48;
const TEXT_COLOR = rgb(0.102, 0.024, 0.188);
const MUTED_COLOR = rgb(0.4, 0.4, 0.45);

type PdfContext = {
  doc: PDFDocument;
  page: PDFPage;
  font: PDFFont;
  boldFont: PDFFont;
  y: number;
};

function sanitize(value: string): string {
  return value.normalize("NFKD").replace(/[^\x20-\x7E]/g, "");
}

function wrapText(font: PDFFont, text: string, size: number, maxWidth: number): string[] {
  const words = sanitize(text).split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(next, size) <= maxWidth) {
      current = next;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines.length ? lines : [""];
}

function ensureSpace(ctx: PdfContext, needed: number): PdfContext {
  if (ctx.y - needed >= MARGIN) return ctx;
  const page = ctx.doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  return { ...ctx, page, y: PAGE_HEIGHT - MARGIN };
}

function drawWrapped(
  ctx: PdfContext,
  text: string,
  options: { size?: number; bold?: boolean; muted?: boolean } = {},
): PdfContext {
  const size = options.size ?? 10;
  const font = options.bold ? ctx.boldFont : ctx.font;
  const color = options.muted ? MUTED_COLOR : TEXT_COLOR;
  const maxWidth = PAGE_WIDTH - MARGIN * 2;
  const lines = wrapText(font, text, size, maxWidth);
  let next = ctx;
  for (const line of lines) {
    next = ensureSpace(next, size + 4);
    next.page.drawText(line, { x: MARGIN, y: next.y - size, size, font, color });
    next = { ...next, y: next.y - size - 4 };
  }
  return next;
}

function drawOrderItems(ctx: PdfContext, order: OrderRecord): PdfContext {
  let next = ctx;
  if (order.items.length === 0) {
    next = drawWrapped(next, "Sin productos registrados.", { size: 9, muted: true });
  } else {
    for (const item of order.items) {
      const line = `${item.quantity}x ${item.productName} - ${formatCop(item.unitPrice)} c/u = ${formatCop(item.total)}`;
      next = drawWrapped(next, line, { size: 9 });
    }
  }
  next = drawWrapped(next, `Subtotal: ${formatCop(order.subtotal)}`, { size: 9, muted: true });
  if (order.discount > 0) next = drawWrapped(next, `Descuento: ${formatCop(order.discount)}`, { size: 9, muted: true });
  if (order.shippingCost > 0) next = drawWrapped(next, `Envio: ${formatCop(order.shippingCost)}`, { size: 9, muted: true });
  next = drawWrapped(next, `Total: ${formatCop(order.total)}`, { size: 10, bold: true });
  return next;
}

async function createContext(): Promise<Omit<PdfContext, "page" | "y">> {
  const doc = await PDFDocument.create();
  const [font, boldFont] = await Promise.all([
    doc.embedFont(StandardFonts.Helvetica),
    doc.embedFont(StandardFonts.HelveticaBold),
  ]);
  return { doc, font, boldFont };
}

export async function renderOrderSummaryPdfBuffer(order: OrderRecord): Promise<Buffer> {
  const base = await createContext();
  const page = base.doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let ctx: PdfContext = { ...base, page, y: PAGE_HEIGHT - MARGIN };

  ctx = drawWrapped(ctx, "Purple Shop - Resumen de pedido", { size: 14, bold: true });
  ctx = drawWrapped(ctx, `Fecha: ${formatDate(order.orderDate)}`, { size: 10, muted: true });
  ctx = drawWrapped(ctx, `Cliente: ${order.customer.fullName}`, { size: 10, muted: true });
  if (order.customer.phone) ctx = drawWrapped(ctx, `Telefono: ${order.customer.phone}`, { size: 10, muted: true });
  ctx = { ...ctx, y: ctx.y - 8 };
  ctx = drawOrderItems(ctx, order);

  const bytes = await ctx.doc.save();
  return Buffer.from(bytes);
}

export async function renderCustomerHistoryPdfBuffer(customer: Customer, orders: OrderRecord[]): Promise<Buffer> {
  const sorted = [...orders].sort((a, b) => a.orderDate.localeCompare(b.orderDate));
  const base = await createContext();
  const page = base.doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let ctx: PdfContext = { ...base, page, y: PAGE_HEIGHT - MARGIN };

  ctx = drawWrapped(ctx, "Purple Shop - Historial de compras", { size: 14, bold: true });
  ctx = drawWrapped(ctx, `Cliente: ${customer.fullName}`, { size: 10, muted: true });
  if (customer.phone) ctx = drawWrapped(ctx, `Telefono: ${customer.phone}`, { size: 10, muted: true });
  ctx = { ...ctx, y: ctx.y - 8 };

  let grandTotal = 0;
  for (const order of sorted) {
    grandTotal += order.total;
    ctx = drawWrapped(ctx, `Pedido - ${formatDate(order.orderDate)}`, { size: 11, bold: true });
    ctx = drawOrderItems(ctx, order);
    ctx = { ...ctx, y: ctx.y - 10 };
  }

  ctx = drawWrapped(ctx, `Total comprado: ${formatCop(grandTotal)}`, { size: 12, bold: true });

  const bytes = await ctx.doc.save();
  return Buffer.from(bytes);
}
