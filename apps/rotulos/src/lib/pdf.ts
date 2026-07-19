import { formatCop, formatDate } from "@/lib/format";
import { LABEL_SIZES } from "@/lib/types";
import type { LabelDraft, LabelRecord, LabelSettings } from "@/lib/types";

type PdfHtmlOptions = {
  origin?: string;
};

type PdfRenderOptions = PdfHtmlOptions & {
  timeoutMs?: number;
};

type PlaywrightChromium = typeof import("playwright").chromium;
type ChromiumLaunchOptions = Parameters<PlaywrightChromium["launch"]>[0];

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

function shouldUseServerlessChromium(): boolean {
  return process.env.VERCEL === "1" || Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.AWS_EXECUTION_ENV);
}

async function launchPdfBrowser() {
  const { chromium: playwrightChromium } = await import("playwright");
  const launchOptions: ChromiumLaunchOptions = { headless: true };

  if (shouldUseServerlessChromium()) {
    const { default: chromium } = await import("@sparticuz/chromium");
    launchOptions.args = chromium.args;
    launchOptions.executablePath = await chromium.executablePath();
  }

  return playwrightChromium.launch(launchOptions);
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
    .lbl-order-number { top: 87.6%; left: 5%; width: 13%; font-size: 1.9cqw; }
    .lbl-date { top: 87.6%; left: 23%; width: 10%; font-size: 1.9cqw; }
    .lbl-carrier { top: 87.6%; left: 38.5%; width: 13.7%; font-size: 1.6cqw; }
    .lbl-value { top: 87.6%; left: 74%; width: 7%; font-size: 1.9cqw; }
    .lbl-packages { top: 87.6%; left: 88%; width: 9%; font-size: 1.9cqw; text-align: center; }
    .lbl-check-paid, .lbl-check-cod { top: 88.8%; font-size: 2.2cqw; width: 3%; }
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
  const browser = await launchPdfBrowser();
  try {
    const size = LABEL_SIZES[label.size] ?? LABEL_SIZES["14x12"];
    const page = await browser.newPage({
      viewport: { width: Math.round(size.widthCm * 37.8), height: Math.round(size.heightCm * 37.8) },
    });
    await page.setContent(renderLabelPdfHtml(label, settings, options), {
      waitUntil: "networkidle",
      timeout: options.timeoutMs ?? 15_000,
    });
    return await page.pdf({
      width: `${size.widthCm}cm`,
      height: `${size.heightCm}cm`,
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
      printBackground: true,
      preferCSSPageSize: true,
    });
  } finally {
    await browser.close();
  }
}
