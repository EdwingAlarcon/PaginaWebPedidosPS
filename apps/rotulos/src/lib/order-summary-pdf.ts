import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFImage, type PDFPage } from "pdf-lib";
import { formatCop, formatDate } from "@/lib/format";
import type { Customer, OrderRecord } from "@/lib/business-types";

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 48;
const HEADER_HEIGHT = 108;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

// Paleta de marca Purple Shop (apps/rotulos/src/app/globals.css)
const PURPLE_900 = rgb(0.298, 0.114, 0.584);
const PURPLE_800 = rgb(0.357, 0.129, 0.714);
const PURPLE_700 = rgb(0.427, 0.157, 0.851);
const PURPLE_600 = rgb(0.486, 0.227, 0.929);
const PURPLE_100 = rgb(0.929, 0.914, 0.996);
const PURPLE_50 = rgb(0.961, 0.953, 1);
const BORDER = rgb(0.894, 0.875, 0.949);
const TEXT_COLOR = rgb(0.086, 0.071, 0.122);
const MUTED_COLOR = rgb(0.388, 0.365, 0.447);
const WHITE = rgb(1, 1, 1);

type PdfContext = {
  doc: PDFDocument;
  page: PDFPage;
  font: PDFFont;
  boldFont: PDFFont;
  italicFont: PDFFont;
  logo: PDFImage | null;
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

function truncate(font: PDFFont, text: string, size: number, maxWidth: number): string {
  const clean = sanitize(text);
  if (font.widthOfTextAtSize(clean, size) <= maxWidth) return clean;
  let truncated = clean;
  while (truncated.length > 0 && font.widthOfTextAtSize(`${truncated}...`, size) > maxWidth) {
    truncated = truncated.slice(0, -1);
  }
  return truncated ? `${truncated}...` : "";
}

function drawText(page: PDFPage, text: string, x: number, y: number, options: { size: number; font: PDFFont; color: ReturnType<typeof rgb> }): void {
  page.drawText(text, { x, y, size: options.size, font: options.font, color: options.color });
}

function drawRightAligned(page: PDFPage, text: string, rightX: number, y: number, options: { size: number; font: PDFFont; color: ReturnType<typeof rgb> }): void {
  const width = options.font.widthOfTextAtSize(text, options.size);
  drawText(page, text, rightX - width, y, options);
}

function drawHeaderBand(ctx: PdfContext, title: string, subtitle: string): PdfContext {
  ctx.page.drawRectangle({ x: 0, y: PAGE_HEIGHT - HEADER_HEIGHT, width: PAGE_WIDTH, height: HEADER_HEIGHT, color: PURPLE_600 });

  const logoSize = 52;
  const logoY = PAGE_HEIGHT - HEADER_HEIGHT / 2 - logoSize / 2;
  if (ctx.logo) {
    ctx.page.drawImage(ctx.logo, { x: MARGIN, y: logoY, width: logoSize, height: logoSize });
  }

  const textX = MARGIN + (ctx.logo ? logoSize + 16 : 0);
  drawText(ctx.page, sanitize(title), textX, PAGE_HEIGHT - HEADER_HEIGHT / 2 + 2, { size: 18, font: ctx.boldFont, color: WHITE });
  drawText(ctx.page, sanitize(subtitle).toUpperCase(), textX, PAGE_HEIGHT - HEADER_HEIGHT / 2 - 16, { size: 9, font: ctx.font, color: PURPLE_100 });

  return { ...ctx, y: PAGE_HEIGHT - HEADER_HEIGHT - 28 };
}

function drawContinuationRule(ctx: PdfContext): PdfContext {
  ctx.page.drawRectangle({ x: 0, y: PAGE_HEIGHT - 6, width: PAGE_WIDTH, height: 6, color: PURPLE_600 });
  drawText(ctx.page, "PURPLE SHOP", MARGIN, PAGE_HEIGHT - 26, { size: 8, font: ctx.boldFont, color: PURPLE_700 });
  return { ...ctx, y: PAGE_HEIGHT - 48 };
}

function ensureSpace(ctx: PdfContext, needed: number): PdfContext {
  if (ctx.y - needed >= MARGIN) return ctx;
  const page = ctx.doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  return drawContinuationRule({ ...ctx, page, y: PAGE_HEIGHT });
}

function drawWrapped(ctx: PdfContext, text: string, options: { size?: number; bold?: boolean; muted?: boolean } = {}): PdfContext {
  const size = options.size ?? 10;
  const font = options.bold ? ctx.boldFont : ctx.font;
  const color = options.muted ? MUTED_COLOR : TEXT_COLOR;
  const lines = wrapText(font, text, size, CONTENT_WIDTH);
  let next = ctx;
  for (const line of lines) {
    next = ensureSpace(next, size + 5);
    drawText(next.page, line, MARGIN, next.y - size, { size, font, color });
    next = { ...next, y: next.y - size - 5 };
  }
  return next;
}

function drawDivider(ctx: PdfContext, gapAfter = 12): PdfContext {
  const next = ensureSpace(ctx, gapAfter + 1);
  next.page.drawLine({
    start: { x: MARGIN, y: next.y },
    end: { x: PAGE_WIDTH - MARGIN, y: next.y },
    thickness: 0.75,
    color: BORDER,
  });
  return { ...next, y: next.y - gapAfter };
}

const QTY_RIGHT = MARGIN + 340;
const PRICE_RIGHT = MARGIN + 430;
const TOTAL_RIGHT = PAGE_WIDTH - MARGIN;
const PRODUCT_MAX_WIDTH = QTY_RIGHT - MARGIN - 50;

function drawItemsTable(ctx: PdfContext, order: OrderRecord): PdfContext {
  let next = ensureSpace(ctx, 24);
  const headerY = next.y - 14;
  drawText(next.page, "PRODUCTO", MARGIN, headerY, { size: 8, font: next.boldFont, color: MUTED_COLOR });
  drawRightAligned(next.page, "CANT.", QTY_RIGHT, headerY, { size: 8, font: next.boldFont, color: MUTED_COLOR });
  drawRightAligned(next.page, "PRECIO", PRICE_RIGHT, headerY, { size: 8, font: next.boldFont, color: MUTED_COLOR });
  drawRightAligned(next.page, "TOTAL", TOTAL_RIGHT, headerY, { size: 8, font: next.boldFont, color: MUTED_COLOR });
  next = { ...next, y: next.y - 20 };
  next = drawDivider(next, 4);

  if (order.items.length === 0) {
    next = drawWrapped(next, "Sin productos registrados.", { size: 9, muted: true });
  } else {
    order.items.forEach((item, index) => {
      const rowHeight = item.productCode ? 30 : 20;
      next = ensureSpace(next, rowHeight);
      if (index % 2 === 1) {
        // El rectangulo cubre EXACTAMENTE el slot de esta fila (sin desborde
        // hacia arriba) para no invadir el texto de codigo de la fila anterior.
        next.page.drawRectangle({
          x: MARGIN - 6,
          y: next.y - rowHeight,
          width: CONTENT_WIDTH + 12,
          height: rowHeight,
          color: PURPLE_50,
        });
      }
      const rowY = next.y - 12;
      const name = truncate(next.boldFont, item.productName, 9.5, PRODUCT_MAX_WIDTH);
      drawText(next.page, name, MARGIN, rowY, { size: 9.5, font: next.boldFont, color: TEXT_COLOR });
      if (item.productCode) {
        drawText(next.page, sanitize(item.productCode), MARGIN, rowY - 11, { size: 8, font: next.font, color: MUTED_COLOR });
      }
      drawRightAligned(next.page, String(item.quantity), QTY_RIGHT, rowY, { size: 9.5, font: next.font, color: TEXT_COLOR });
      drawRightAligned(next.page, formatCop(item.unitPrice), PRICE_RIGHT, rowY, { size: 9.5, font: next.font, color: MUTED_COLOR });
      drawRightAligned(next.page, formatCop(item.total), TOTAL_RIGHT, rowY, { size: 9.5, font: next.boldFont, color: TEXT_COLOR });
      next = { ...next, y: next.y - rowHeight };
    });
  }

  return next;
}

function drawTotalsBlock(ctx: PdfContext, order: OrderRecord): PdfContext {
  let next = drawDivider(ctx, 6);

  if (order.discount > 0) {
    next = ensureSpace(next, 16);
    drawText(next.page, "Descuento", MARGIN, next.y - 11, { size: 9.5, font: next.font, color: MUTED_COLOR });
    drawRightAligned(next.page, `-${formatCop(order.discount)}`, TOTAL_RIGHT, next.y - 11, { size: 9.5, font: next.font, color: MUTED_COLOR });
    next = { ...next, y: next.y - 18 };
  }
  if (order.shippingCost > 0) {
    next = ensureSpace(next, 16);
    drawText(next.page, "Envio", MARGIN, next.y - 11, { size: 9.5, font: next.font, color: MUTED_COLOR });
    drawRightAligned(next.page, formatCop(order.shippingCost), TOTAL_RIGHT, next.y - 11, { size: 9.5, font: next.font, color: MUTED_COLOR });
    next = { ...next, y: next.y - 18 };
  }

  const boxHeight = 34;
  next = ensureSpace(next, boxHeight + 6);
  const boxTop = next.y;
  next.page.drawRectangle({
    x: MARGIN,
    y: boxTop - boxHeight,
    width: CONTENT_WIDTH,
    height: boxHeight,
    color: PURPLE_50,
    borderColor: PURPLE_100,
    borderWidth: 1,
  });
  const totalTextY = boxTop - boxHeight / 2 - 5;
  drawText(next.page, "TOTAL", MARGIN + 14, totalTextY, { size: 11, font: next.boldFont, color: PURPLE_800 });
  drawRightAligned(next.page, formatCop(order.total), TOTAL_RIGHT - 14, totalTextY, { size: 15, font: next.boldFont, color: PURPLE_900 });

  return { ...next, y: boxTop - boxHeight - 16 };
}

function drawFooter(ctx: PdfContext): void {
  const next = ensureSpace(ctx, 30);
  next.page.drawLine({
    start: { x: MARGIN, y: next.y },
    end: { x: PAGE_WIDTH - MARGIN, y: next.y },
    thickness: 0.75,
    color: BORDER,
  });
  const text = "Gracias por tu compra - Purple Shop";
  const size = 10;
  const width = next.italicFont.widthOfTextAtSize(text, size);
  drawText(next.page, text, MARGIN + (CONTENT_WIDTH - width) / 2, next.y - 20, { size, font: next.italicFont, color: PURPLE_700 });
}

async function createContext(): Promise<Pick<PdfContext, "doc" | "font" | "boldFont" | "italicFont" | "logo">> {
  const doc = await PDFDocument.create();
  const [font, boldFont, italicFont] = await Promise.all([
    doc.embedFont(StandardFonts.Helvetica),
    doc.embedFont(StandardFonts.HelveticaBold),
    doc.embedFont(StandardFonts.HelveticaOblique),
  ]);
  let logo: PDFImage | null = null;
  try {
    const bytes = await readFile(join(process.cwd(), "public", "purple-shop-logo.png"));
    logo = await doc.embedPng(bytes);
  } catch {
    logo = null;
  }
  return { doc, font, boldFont, italicFont, logo };
}

function drawCustomerMeta(ctx: PdfContext, fields: Array<[string, string]>): PdfContext {
  let next = ctx;
  for (const [label, value] of fields) {
    if (!value) continue;
    next = ensureSpace(next, 15);
    drawText(next.page, `${label}:`, MARGIN, next.y - 11, { size: 9.5, font: next.boldFont, color: MUTED_COLOR });
    const labelWidth = next.boldFont.widthOfTextAtSize(`${label}: `, 9.5);
    drawText(next.page, sanitize(value), MARGIN + labelWidth, next.y - 11, { size: 9.5, font: next.font, color: TEXT_COLOR });
    next = { ...next, y: next.y - 17 };
  }
  return { ...next, y: next.y - 6 };
}

export async function renderOrderSummaryPdfBuffer(order: OrderRecord): Promise<Buffer> {
  const base = await createContext();
  const page = base.doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let ctx: PdfContext = { ...base, page, y: PAGE_HEIGHT };
  ctx = drawHeaderBand(ctx, "Resumen de tu pedido", "Purple Shop");

  ctx = drawCustomerMeta(ctx, [
    ["Fecha", formatDate(order.orderDate)],
    ["Cliente", order.customer.fullName],
    ["Telefono", order.customer.phone],
  ]);

  ctx = drawItemsTable(ctx, order);
  ctx = drawTotalsBlock(ctx, order);
  drawFooter(ctx);

  const bytes = await ctx.doc.save();
  return Buffer.from(bytes);
}

export async function renderCustomerHistoryPdfBuffer(customer: Customer, orders: OrderRecord[]): Promise<Buffer> {
  const sorted = [...orders].sort((a, b) => a.orderDate.localeCompare(b.orderDate));
  const base = await createContext();
  const page = base.doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let ctx: PdfContext = { ...base, page, y: PAGE_HEIGHT };
  ctx = drawHeaderBand(ctx, "Historial de compras", customer.fullName);

  ctx = drawCustomerMeta(ctx, [["Telefono", customer.phone]]);

  let grandTotal = 0;
  for (const order of sorted) {
    grandTotal += order.total;
    ctx = ensureSpace(ctx, 22);
    ctx.page.drawRectangle({ x: MARGIN, y: ctx.y - 20, width: 4, height: 16, color: PURPLE_600 });
    drawText(ctx.page, `Pedido - ${sanitize(formatDate(order.orderDate))}`, MARGIN + 12, ctx.y - 16, { size: 11.5, font: ctx.boldFont, color: PURPLE_800 });
    ctx = { ...ctx, y: ctx.y - 24 };
    ctx = drawItemsTable(ctx, order);
    ctx = drawTotalsBlock(ctx, order);
  }

  ctx = ensureSpace(ctx, 40);
  ctx.page.drawRectangle({ x: MARGIN, y: ctx.y - 34, width: CONTENT_WIDTH, height: 34, color: PURPLE_900 });
  drawText(ctx.page, "TOTAL COMPRADO", MARGIN + 14, ctx.y - 22, { size: 11, font: ctx.boldFont, color: WHITE });
  drawRightAligned(ctx.page, formatCop(grandTotal), TOTAL_RIGHT - 14, ctx.y - 22, { size: 15, font: ctx.boldFont, color: WHITE });
  ctx = { ...ctx, y: ctx.y - 50 };

  drawFooter(ctx);

  const bytes = await ctx.doc.save();
  return Buffer.from(bytes);
}
