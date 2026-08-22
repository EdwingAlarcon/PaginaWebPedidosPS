"use client";

import { formatCop, formatDate } from "@/lib/format";
import type { Customer, OrderRecord } from "@/lib/business-types";
import type { ShipmentTracking } from "@/lib/label-tracking";

const WIDTH = 640;
const MARGIN = 32;
const HEADER_HEIGHT = 96;
const CONTENT_WIDTH = WIDTH - MARGIN * 2;
const EXPORT_SCALE = 2;

const COLORS = {
  purple900: "#4C1D95",
  purple800: "#5B21B6",
  purple700: "#6D28D9",
  purple600: "#7C3AED",
  purple100: "#EDE9FE",
  purple50: "#F5F3FF",
  border: "#E4DFF2",
  text: "#16121F",
  muted: "#635D72",
  white: "#FFFFFF",
};

const FONT_FAMILY = "-apple-system, 'Segoe UI', Roboto, Arial, sans-serif";
const boldFont = (size: number) => `700 ${size}px ${FONT_FAMILY}`;
const regularFont = (size: number) => `400 ${size}px ${FONT_FAMILY}`;
const italicFont = (size: number) => `italic 400 ${size}px ${FONT_FAMILY}`;

const QTY_X = WIDTH - MARGIN - 220;
const PRICE_X = WIDTH - MARGIN - 120;
const TOTAL_X = WIDTH - MARGIN;
const PRODUCT_MAX_WIDTH = QTY_X - MARGIN - 60;

type Op =
  | { kind: "rect"; x: number; y: number; w: number; h: number; color: string }
  | { kind: "line"; x1: number; y1: number; x2: number; y2: number; color: string }
  | { kind: "text"; x: number; y: number; text: string; font: string; color: string; align: CanvasTextAlign }
  | { kind: "logo"; x: number; y: number; size: number };

class ReceiptBuilder {
  ops: Op[] = [];
  y = 0;
  private measureCtx: CanvasRenderingContext2D | null;

  constructor() {
    this.measureCtx = document.createElement("canvas").getContext("2d");
  }

  measure(text: string, font: string): number {
    if (!this.measureCtx) return text.length * (parseInt(font, 10) || 10) * 0.55;
    this.measureCtx.font = font;
    return this.measureCtx.measureText(text).width;
  }

  truncate(text: string, font: string, maxWidth: number): string {
    if (this.measure(text, font) <= maxWidth) return text;
    let truncated = text;
    while (truncated.length > 0 && this.measure(`${truncated}...`, font) > maxWidth) {
      truncated = truncated.slice(0, -1);
    }
    return truncated ? `${truncated}...` : "";
  }

  rect(x: number, y: number, w: number, h: number, color: string) {
    this.ops.push({ kind: "rect", x, y, w, h, color });
  }

  line(x1: number, x2: number, color = COLORS.border) {
    this.ops.push({ kind: "line", x1, y1: this.y, x2, y2: this.y, color });
  }

  text(x: number, text: string, font: string, color: string, align: CanvasTextAlign = "left") {
    this.ops.push({ kind: "text", x, y: this.y, text, font, color, align });
  }

  logo(x: number, y: number, size: number) {
    this.ops.push({ kind: "logo", x, y, size });
  }
}

function drawHeader(b: ReceiptBuilder, title: string, subtitle: string): void {
  b.rect(0, 0, WIDTH, HEADER_HEIGHT, COLORS.purple600);
  const logoSize = 48;
  const logoY = HEADER_HEIGHT / 2 - logoSize / 2;
  b.logo(MARGIN, logoY, logoSize);
  const textX = MARGIN + logoSize + 14;
  b.y = HEADER_HEIGHT / 2 - 2;
  b.text(textX, title, boldFont(17), COLORS.white);
  b.y = HEADER_HEIGHT / 2 + 18;
  b.text(textX, subtitle.toUpperCase(), regularFont(9), COLORS.purple100);
  b.y = HEADER_HEIGHT + 32;
}

function drawMeta(b: ReceiptBuilder, fields: Array<[string, string]>): void {
  for (const [label, value] of fields) {
    if (!value) continue;
    const labelText = `${label}:`;
    b.text(MARGIN, labelText, boldFont(11), COLORS.muted);
    const labelWidth = b.measure(`${labelText} `, boldFont(11));
    b.text(MARGIN + labelWidth, value, regularFont(11), COLORS.text);
    b.y += 20;
  }
  b.y += 8;
}

function drawItemsTable(b: ReceiptBuilder, order: OrderRecord): void {
  b.text(MARGIN, "PRODUCTO", boldFont(9), COLORS.muted);
  b.text(QTY_X, "CANT.", boldFont(9), COLORS.muted, "right");
  b.text(PRICE_X, "PRECIO", boldFont(9), COLORS.muted, "right");
  b.text(TOTAL_X, "TOTAL", boldFont(9), COLORS.muted, "right");
  b.y += 10;
  b.line(MARGIN, WIDTH - MARGIN);
  b.y += 22;

  if (order.items.length === 0) {
    b.text(MARGIN, "Sin productos registrados.", regularFont(10), COLORS.muted);
    b.y += 20;
    return;
  }

  order.items.forEach((item, index) => {
    const hasCode = Boolean(item.productCode);
    const rowHeight = hasCode ? 32 : 22;
    if (index % 2 === 1) {
      b.rect(MARGIN - 8, b.y - rowHeight + 8, CONTENT_WIDTH + 16, rowHeight, COLORS.purple50);
    }
    const name = b.truncate(item.productName, boldFont(11), PRODUCT_MAX_WIDTH);
    b.text(MARGIN, name, boldFont(11), COLORS.text);
    b.text(QTY_X, String(item.quantity), regularFont(11), COLORS.text, "right");
    b.text(PRICE_X, formatCop(item.unitPrice), regularFont(11), COLORS.muted, "right");
    b.text(TOTAL_X, formatCop(item.total), boldFont(11), COLORS.text, "right");
    if (hasCode) {
      b.y += 15;
      b.text(MARGIN, item.productCode, regularFont(9.5), COLORS.muted);
    }
    b.y += rowHeight - (hasCode ? 15 : 0);
  });
}

function drawTotals(b: ReceiptBuilder, order: OrderRecord): void {
  b.line(MARGIN, WIDTH - MARGIN);
  b.y += 22;

  if (order.discount > 0) {
    b.text(MARGIN, "Descuento", regularFont(11), COLORS.muted);
    b.text(TOTAL_X, `-${formatCop(order.discount)}`, regularFont(11), COLORS.muted, "right");
    b.y += 22;
  }
  if (order.shippingCost > 0) {
    b.text(MARGIN, "Envio", regularFont(11), COLORS.muted);
    b.text(TOTAL_X, formatCop(order.shippingCost), regularFont(11), COLORS.muted, "right");
    b.y += 22;
  }

  const boxHeight = 42;
  b.rect(MARGIN, b.y - 8, CONTENT_WIDTH, boxHeight, COLORS.purple50);
  b.y += boxHeight / 2 - 12;
  b.text(MARGIN + 16, "TOTAL", boldFont(13), COLORS.purple800);
  b.text(TOTAL_X - 16, formatCop(order.total), boldFont(17), COLORS.purple900, "right");
  b.y += boxHeight / 2 + 28;
}

function drawShipment(b: ReceiptBuilder, tracking?: ShipmentTracking | null): void {
  if (!tracking) return;
  b.text(MARGIN, "Envio", boldFont(13), COLORS.purple800);
  b.y += 22;
  b.text(MARGIN, `Transportadora: ${tracking.carrier || "-"}`, regularFont(10.5), COLORS.muted);
  b.y += 18;
  b.text(MARGIN, `Guia: ${tracking.trackingNumber}`, boldFont(10.5), COLORS.text);
  b.y += 18;
  if (tracking.trackingUrl) {
    b.text(MARGIN, `Rastrealo aqui: ${tracking.trackingUrl}`, regularFont(10.5), COLORS.muted);
    b.y += 18;
  }
  b.y += 8;
}

function drawFooter(b: ReceiptBuilder): void {
  b.line(MARGIN, WIDTH - MARGIN);
  b.y += 26;
  b.text(WIDTH / 2, "Gracias por tu compra - Purple Shop", italicFont(11), COLORS.purple700, "center");
  b.y += 20;
}

function loadLogo(): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = "/purple-shop-logo.png";
  });
}

async function renderBuilder(b: ReceiptBuilder): Promise<Blob> {
  const height = Math.ceil(b.y);
  const canvas = document.createElement("canvas");
  canvas.width = WIDTH * EXPORT_SCALE;
  canvas.height = height * EXPORT_SCALE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas_unsupported");
  ctx.scale(EXPORT_SCALE, EXPORT_SCALE);
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = COLORS.white;
  ctx.fillRect(0, 0, WIDTH, height);

  const logo = await loadLogo();

  for (const op of b.ops) {
    if (op.kind === "rect") {
      ctx.fillStyle = op.color;
      ctx.fillRect(op.x, op.y, op.w, op.h);
    } else if (op.kind === "line") {
      ctx.strokeStyle = op.color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(op.x1, op.y1);
      ctx.lineTo(op.x2, op.y2);
      ctx.stroke();
    } else if (op.kind === "text") {
      ctx.fillStyle = op.color;
      ctx.font = op.font;
      ctx.textAlign = op.align;
      ctx.fillText(op.text, op.x, op.y);
    } else if (op.kind === "logo" && logo) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(op.x + op.size / 2, op.y + op.size / 2, op.size / 2, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(logo, op.x, op.y, op.size, op.size);
      ctx.restore();
    }
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("blob_failed"));
    }, "image/png");
  });
}

export async function renderOrderSummaryImage(order: OrderRecord, tracking?: ShipmentTracking | null): Promise<Blob> {
  const b = new ReceiptBuilder();
  drawHeader(b, "Resumen de tu pedido", "Purple Shop");
  drawMeta(b, [
    ["Fecha", formatDate(order.orderDate)],
    ["Cliente", order.customer.fullName],
    ["Teléfono", order.customer.phone],
  ]);
  drawItemsTable(b, order);
  drawTotals(b, order);
  drawShipment(b, tracking);
  drawFooter(b);
  return renderBuilder(b);
}

export async function renderCustomerHistoryImage(customer: Customer, orders: OrderRecord[]): Promise<Blob> {
  const sorted = [...orders].sort((a, b) => a.orderDate.localeCompare(b.orderDate));
  const b = new ReceiptBuilder();
  drawHeader(b, "Historial de compras", customer.fullName);
  drawMeta(b, [["Teléfono", customer.phone]]);

  let grandTotal = 0;
  for (const order of sorted) {
    grandTotal += order.total;
    b.rect(MARGIN, b.y - 12, 4, 16, COLORS.purple600);
    b.text(MARGIN + 14, `Pedido - ${formatDate(order.orderDate)}`, boldFont(13), COLORS.purple800);
    b.y += 24;
    drawItemsTable(b, order);
    drawTotals(b, order);
  }

  const boxHeight = 44;
  b.rect(MARGIN, b.y - 8, CONTENT_WIDTH, boxHeight, COLORS.purple900);
  b.y += boxHeight / 2 - 12;
  b.text(MARGIN + 16, "TOTAL COMPRADO", boldFont(13), COLORS.white);
  b.text(TOTAL_X - 16, formatCop(grandTotal), boldFont(17), COLORS.white, "right");
  b.y += boxHeight / 2 + 32;

  drawFooter(b);
  return renderBuilder(b);
}

export async function downloadBlob(blob: Blob, fileName: string): Promise<void> {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
