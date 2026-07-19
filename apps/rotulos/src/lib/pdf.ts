import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { formatCop, formatDate } from "@/lib/format";
import { LABEL_SIZES } from "@/lib/types";
import type { LabelDraft, LabelRecord, LabelSettings } from "@/lib/types";

type PdfHtmlOptions = {
  origin?: string;
};

type PdfRenderOptions = PdfHtmlOptions & {
  timeoutMs?: number;
};

const CM_TO_POINTS = 28.3464567;
const PDF_TEXT_COLOR = rgb(0.102, 0.024, 0.188);

type PdfFieldOptions = {
  topPct: number;
  leftPct: number;
  widthPct: number;
  fontSizePct: number;
  align?: "left" | "center";
  maxLines?: number;
};

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function assetUrl(value: string, origin?: string): string {
  const trimmed = value.trim();
  if (!/^\/[a-zA-Z0-9/_\-.]+$/.test(trimmed)) return "";
  if (!origin) return trimmed;
  return new URL(trimmed, origin).toString();
}

export function renderLabelPdfHtml(label: LabelDraft | LabelRecord, settings: LabelSettings, options: PdfHtmlOptions = {}): string {
  const size = LABEL_SIZES[label.size] ?? LABEL_SIZES["14x12"];
  const widthCm = size.widthCm;
  const heightCm = size.heightCm;
  const isCod = label.paymentMethod === "contraentrega";
  const bgUrl = assetUrl("/label-template-bg.png", options.origin);

  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>Rotulo ${escapeHtml(label.orderNumber)}</title>
  <style>
    @page { size: ${widthCm}cm ${heightCm}cm; margin: 0; }
    * { box-sizing: border-box; }
    html, body { margin: 0; width: ${widthCm}cm; height: ${heightCm}cm; }
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .label-canvas {
      position: relative;
      width: ${widthCm}cm;
      height: ${heightCm}cm;
      overflow: hidden;
      color: #1a0630;
      font-family: Arial, Helvetica, sans-serif;
      container-type: inline-size;
      background-image: url("${escapeHtml(bgUrl)}");
      background-size: 100% 100%;
      background-repeat: no-repeat;
      background-color: #ffffff;
    }
    .lbl-f {
      position: absolute;
      font-weight: 700;
      line-height: 1.15;
      font-size: 2.7cqw;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .lbl-f.lbl-multiline {
      white-space: normal;
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 2;
    }
    .lbl-sender-name { top: 40.8%; left: 8.8%; width: 31%; font-size: 3cqw; }
    .lbl-sender-phone { top: 47.4%; left: 8.8%; width: 31%; }
    .lbl-sender-city { top: 54%; left: 8.8%; width: 31%; }
    .lbl-sender-department { top: 60.6%; left: 8.8%; width: 31%; }
    .lbl-sender-address { top: 67%; left: 8.8%; width: 31%; height: 9%; }
    .lbl-recipient-name { top: 40.2%; left: 52.3%; width: 43.5%; font-size: 3cqw; }
    .lbl-recipient-phone { top: 45.2%; left: 52.3%; width: 43.5%; }
    .lbl-recipient-department { top: 50.4%; left: 52.3%; width: 19%; }
    .lbl-recipient-city { top: 50.4%; left: 78.6%; width: 17%; }
    .lbl-recipient-address { top: 55.5%; left: 52.3%; width: 43.5%; height: 9%; }
    .lbl-recipient-neighborhood { top: 63%; left: 52.3%; width: 43.5%; }
    .lbl-recipient-reference { top: 67.6%; left: 52.3%; width: 43.5%; }
    .lbl-recipient-notes { top: 72.1%; left: 52.3%; width: 43.5%; }
    .lbl-order-number { top: 85.4%; left: 5%; width: 13%; font-size: 1.9cqw; }
    .lbl-date { top: 85.4%; left: 23%; width: 10%; font-size: 1.9cqw; }
    .lbl-carrier { top: 85.4%; left: 38.5%; width: 13.7%; font-size: 1.6cqw; }
    .lbl-value { top: 85.4%; left: 74%; width: 7%; font-size: 1.9cqw; }
    .lbl-packages { top: 85.4%; left: 88%; width: 9%; font-size: 1.9cqw; text-align: center; }
    .lbl-check-paid, .lbl-check-cod { top: 86.8%; font-size: 2.2cqw; width: 3%; }
    .lbl-check-paid { left: 55.2%; }
    .lbl-check-cod { left: 62.3%; }
  </style>
</head>
<body>
  <main class="label-canvas">
    <span class="lbl-f lbl-sender-name">${escapeHtml(label.sender.name)}</span>
    <span class="lbl-f lbl-sender-phone">${escapeHtml(label.sender.phone)}</span>
    <span class="lbl-f lbl-sender-city">${escapeHtml(label.sender.city)}</span>
    <span class="lbl-f lbl-sender-department">${escapeHtml(label.sender.department)}</span>
    <span class="lbl-f lbl-multiline lbl-sender-address">${escapeHtml(label.sender.address)}</span>
    <span class="lbl-f lbl-recipient-name">${escapeHtml(label.recipient.fullName)}</span>
    <span class="lbl-f lbl-recipient-phone">${escapeHtml(label.recipient.phone)}</span>
    <span class="lbl-f lbl-recipient-department">${escapeHtml(label.recipient.department)}</span>
    <span class="lbl-f lbl-recipient-city">${escapeHtml(label.recipient.city)}</span>
    <span class="lbl-f lbl-multiline lbl-recipient-address">${escapeHtml(label.recipient.address)}</span>
    <span class="lbl-f lbl-recipient-neighborhood">${escapeHtml(label.recipient.neighborhood)}</span>
    <span class="lbl-f lbl-recipient-reference">${escapeHtml(label.recipient.reference)}</span>
    <span class="lbl-f lbl-recipient-notes">${escapeHtml(label.recipient.notes)}</span>
    <span class="lbl-f lbl-order-number">${escapeHtml(label.orderNumber)}</span>
    <span class="lbl-f lbl-date">${escapeHtml(formatDate(label.date))}</span>
    <span class="lbl-f lbl-carrier">${escapeHtml(label.carrier)}</span>
    <span class="lbl-f lbl-value">${isCod ? escapeHtml(formatCop(label.codAmount)) : ""}</span>
    <span class="lbl-f lbl-packages">${label.packageCount}</span>
    <span class="lbl-f ${isCod ? "lbl-check-cod" : "lbl-check-paid"}">&#10003;</span>
  </main>
</body>
</html>`;
}

export async function renderLabelPdfBuffer(label: LabelDraft | LabelRecord, settings: LabelSettings, options: PdfRenderOptions = {}): Promise<Buffer> {
  void settings;
  void options;

  const size = LABEL_SIZES[label.size] ?? LABEL_SIZES["14x12"];
  const pageWidth = size.widthCm * CM_TO_POINTS;
  const pageHeight = size.heightCm * CM_TO_POINTS;
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([pageWidth, pageHeight]);
  const [font, boldFont] = await Promise.all([
    pdfDoc.embedFont(StandardFonts.Helvetica),
    pdfDoc.embedFont(StandardFonts.HelveticaBold),
  ]);
  const template = await readFile(join(process.cwd(), "public", "label-template-bg.png"));
  const background = await pdfDoc.embedPng(template);
  page.drawImage(background, { x: 0, y: 0, width: pageWidth, height: pageHeight });

  const isCod = label.paymentMethod === "contraentrega";
  const draw = (value: unknown, field: PdfFieldOptions) => drawPdfField(page, boldFont, String(value ?? ""), field);

  draw(label.sender.name, { topPct: 40.8, leftPct: 8.8, widthPct: 31, fontSizePct: 3 });
  draw(label.sender.phone, { topPct: 47.4, leftPct: 8.8, widthPct: 31, fontSizePct: 2.7 });
  draw(label.sender.city, { topPct: 54, leftPct: 8.8, widthPct: 31, fontSizePct: 2.7 });
  draw(label.sender.department, { topPct: 60.6, leftPct: 8.8, widthPct: 31, fontSizePct: 2.7 });
  draw(label.sender.address, { topPct: 67, leftPct: 8.8, widthPct: 31, fontSizePct: 2.7, maxLines: 2 });
  draw(label.recipient.fullName, { topPct: 40.2, leftPct: 52.3, widthPct: 43.5, fontSizePct: 3 });
  draw(label.recipient.phone, { topPct: 45.2, leftPct: 52.3, widthPct: 43.5, fontSizePct: 2.7 });
  draw(label.recipient.department, { topPct: 50.4, leftPct: 52.3, widthPct: 19, fontSizePct: 2.7 });
  draw(label.recipient.city, { topPct: 50.4, leftPct: 78.6, widthPct: 17, fontSizePct: 2.7 });
  draw(label.recipient.address, { topPct: 55.5, leftPct: 52.3, widthPct: 43.5, fontSizePct: 2.7, maxLines: 2 });
  draw(label.recipient.neighborhood, { topPct: 63, leftPct: 52.3, widthPct: 43.5, fontSizePct: 2.7 });
  draw(label.recipient.reference, { topPct: 67.6, leftPct: 52.3, widthPct: 43.5, fontSizePct: 2.7 });
  draw(label.recipient.notes, { topPct: 72.1, leftPct: 52.3, widthPct: 43.5, fontSizePct: 2.7 });
  draw(label.orderNumber, { topPct: 85.4, leftPct: 5, widthPct: 13, fontSizePct: 1.9 });
  draw(formatDate(label.date), { topPct: 85.4, leftPct: 23, widthPct: 10, fontSizePct: 1.9 });
  draw(label.carrier, { topPct: 85.4, leftPct: 38.5, widthPct: 13.7, fontSizePct: 1.6 });
  draw(isCod ? formatCop(label.codAmount) : "", { topPct: 85.4, leftPct: 74, widthPct: 7, fontSizePct: 1.9 });
  draw(label.packageCount, { topPct: 85.4, leftPct: 88, widthPct: 9, fontSizePct: 1.9, align: "center" });
  drawPdfCheck(page, isCod ? 62.3 : 55.2, 86.8, pageWidth, pageHeight);

  const bytes = await pdfDoc.save();
  return Buffer.from(bytes);
}

function sanitizePdfText(value: string): string {
  return value.normalize("NFKD").replace(/[^\x20-\x7E]/g, "").trim();
}

function truncatePdfText(font: PDFFont, text: string, fontSize: number, maxWidth: number): string {
  const clean = sanitizePdfText(text);
  if (font.widthOfTextAtSize(clean, fontSize) <= maxWidth) return clean;
  let truncated = clean;
  while (truncated.length > 0 && font.widthOfTextAtSize(`${truncated}...`, fontSize) > maxWidth) {
    truncated = truncated.slice(0, -1);
  }
  return truncated ? `${truncated}...` : "";
}

function drawPdfField(page: PDFPage, font: PDFFont, value: string, options: PdfFieldOptions): void {
  const { width, height } = page.getSize();
  const fontSize = width * (options.fontSizePct / 100);
  const x = width * (options.leftPct / 100);
  const maxWidth = width * (options.widthPct / 100);
  const lineHeight = fontSize * 1.15;
  const lines = wrapPdfText(font, value, fontSize, maxWidth, options.maxLines ?? 1);

  lines.forEach((line, index) => {
    const textWidth = font.widthOfTextAtSize(line, fontSize);
    page.drawText(line, {
      x: options.align === "center" ? x + (maxWidth - textWidth) / 2 : x,
      y: height - (height * (options.topPct / 100)) - fontSize - index * lineHeight,
      size: fontSize,
      font,
      color: PDF_TEXT_COLOR,
    });
  });
}

function wrapPdfText(font: PDFFont, value: string, fontSize: number, maxWidth: number, maxLines: number): string[] {
  const clean = sanitizePdfText(value);
  if (maxLines <= 1) return [truncatePdfText(font, clean, fontSize, maxWidth)];
  const words = clean.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(next, fontSize) <= maxWidth) {
      current = next;
      continue;
    }
    if (current) lines.push(current);
    current = word;
    if (lines.length === maxLines - 1) break;
  }
  if (current && lines.length < maxLines) lines.push(current);
  if (lines.length === maxLines) {
    lines[maxLines - 1] = truncatePdfText(font, lines[maxLines - 1], fontSize, maxWidth);
  }
  return lines;
}

function drawPdfCheck(page: PDFPage, leftPct: number, topPct: number, width: number, height: number): void {
  const x = width * (leftPct / 100);
  const y = height - height * (topPct / 100);
  page.drawLine({ start: { x, y }, end: { x: x + width * 0.008, y: y - height * 0.012 }, thickness: 1.4, color: PDF_TEXT_COLOR });
  page.drawLine({ start: { x: x + width * 0.008, y: y - height * 0.012 }, end: { x: x + width * 0.026, y: y + height * 0.018 }, thickness: 1.4, color: PDF_TEXT_COLOR });
}
