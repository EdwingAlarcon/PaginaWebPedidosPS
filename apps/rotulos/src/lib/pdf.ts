import { formatCop, formatDate } from "@/lib/format";
import type { LabelDraft, LabelRecord, LabelSettings } from "@/lib/types";

type PdfHtmlOptions = {
  origin?: string;
};

type PdfRenderOptions = PdfHtmlOptions & {
  timeoutMs?: number;
};

const fallbackText = {
  orderNumber: "PS-2026-000001",
  carrier: "Transportadora",
  senderName: "PurpleShop",
  senderPhone: "300 000 0000",
  senderCity: "Ciudad",
  senderDepartment: "Departamento",
  senderAddress: "Direccion del remitente",
  recipientName: "Nombre del cliente",
  recipientPhone: "310 000 0000",
  recipientCity: "Ciudad",
  recipientDepartment: "Departamento",
  recipientAddress: "Direccion completa del destinatario",
  recipientNeighborhood: "Sector",
  recipientReference: "Indicaciones de entrega",
  recipientNotes: "Gracias por comprar en PurpleShop",
};

const PDF_SIZE_CM = {
  width: 14,
  height: 11,
} as const;

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function sanitizeColor(value: string, fallback: string): string {
  return /^#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/.test(value) ? value : fallback;
}

function assetUrl(value: string, origin?: string): string {
  const trimmed = value.trim();
  if (!/^\/[a-zA-Z0-9/_\-.]+$/.test(trimmed)) return "";
  if (!origin) return trimmed;
  return new URL(trimmed, origin).toString();
}

function safeAssetUrl(value: string, fallback: string, origin?: string): string {
  return assetUrl(value, origin) || assetUrl(fallback, origin);
}

function text(value: string, fallback: string): string {
  const trimmed = value.trim();
  return escapeHtml(trimmed || fallback);
}

export function renderLabelPdfHtml(label: LabelDraft | LabelRecord, settings: LabelSettings, options: PdfHtmlOptions = {}): string {
  const widthCm = PDF_SIZE_CM.width;
  const heightCm = PDF_SIZE_CM.height;
  const primary = sanitizeColor(settings.brandColors.primary, "#6B1FA2");
  const dark = sanitizeColor(settings.brandColors.dark, "#3B0A57");
  const light = sanitizeColor(settings.brandColors.light, "#B57EDC");
  const paper = sanitizeColor(settings.brandColors.paper, "#F5F5F7");
  const ink = sanitizeColor(settings.brandColors.ink, "#111111");
  const payment = label.paymentMethod === "contraentrega" ? `Contraentrega ${formatCop(label.codAmount)}` : "Pagado";
  const packages = `${label.packageCount} paquete${label.packageCount === 1 ? "" : "s"}`;

  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>Rotulo ${text(label.orderNumber, fallbackText.orderNumber)}</title>
  <style>
    @page { size: ${widthCm}cm ${heightCm}cm; margin: 0; }
    * { box-sizing: border-box; }
    html, body { margin: 0; width: ${widthCm}cm; height: ${heightCm}cm; background: ${paper}; color: ${ink}; font-family: Arial, Helvetica, sans-serif; }
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .label { width: ${widthCm}cm; height: ${heightCm}cm; padding: 0.42cm; display: flex; flex-direction: column; gap: 0.24cm; overflow: hidden; border: 0.06cm solid ${dark}; background: #fff; }
    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 0.05cm solid ${light}; padding-bottom: 0.2cm; }
    .brand, .social { display: flex; align-items: center; gap: 0.18cm; }
    .brand img { width: 1.55cm; height: 1.55cm; object-fit: contain; }
    .social img { width: 1.42cm; height: 1.42cm; object-fit: contain; }
    .brand strong { display: block; color: ${primary}; font-size: 16pt; line-height: 1; }
    .brand span, .social span { display: block; font-size: 7.5pt; color: ${dark}; }
    .meta { display: grid; grid-template-columns: 1.4fr 0.8fr 1fr 0.8fr; gap: 0.12cm; align-items: center; font-size: 8pt; }
    .meta strong { color: ${dark}; font-size: 13pt; }
    .grid { flex: 1; min-height: 0; display: grid; grid-template-columns: 1fr 1.45fr; gap: 0.22cm; }
    .block { border: 0.035cm solid ${light}; border-radius: 0.12cm; padding: 0.18cm; overflow: hidden; }
    .block h2 { margin: 0 0 0.12cm; color: ${primary}; font-size: 8pt; text-transform: uppercase; letter-spacing: 0; }
    .block p { margin: 0 0 0.08cm; font-size: 8.2pt; line-height: 1.18; overflow-wrap: anywhere; }
    .person { font-weight: 700; font-size: 10pt !important; color: ${dark}; }
    .address { font-weight: 700; font-size: 9pt !important; }
    .footer { display: flex; align-items: center; gap: 0.18cm; border-top: 0.05cm solid ${light}; padding-top: 0.16cm; }
    .badge { flex: 0 0 auto; border-radius: 0.12cm; padding: 0.11cm 0.2cm; color: #fff; background: ${label.paymentMethod === "contraentrega" ? dark : primary}; font-weight: 700; font-size: 9pt; }
    .notes { font-size: 8pt; line-height: 1.15; overflow-wrap: anywhere; }
  </style>
</head>
<body>
  <main class="label">
    <header class="header">
      <div class="brand">
        <img src="${escapeHtml(safeAssetUrl(settings.logoUrl, "/purple-shop-logo.png", options.origin))}" alt="Logo PurpleShop" />
        <div><strong>PurpleShop</strong><span>${text(settings.brandPhrase, "")}</span></div>
      </div>
      <div class="social">
        <img src="${escapeHtml(safeAssetUrl(settings.qrUrl, "/purple-shop-qr.png", options.origin))}" alt="QR de Instagram PurpleShop" />
        <span>${text(settings.instagramUser, "@PURPLESHOP.ONLINE")}</span>
      </div>
    </header>
    <section class="meta">
      <strong>${text(label.orderNumber, fallbackText.orderNumber)}</strong>
      <span>${escapeHtml(formatDate(label.date))}</span>
      <span>${text(label.carrier, fallbackText.carrier)}</span>
      <span>${escapeHtml(packages)}</span>
    </section>
    <section class="grid">
      <section class="block">
        <h2>Remitente</h2>
        <p class="person">${text(label.sender.name, fallbackText.senderName)}</p>
        <p>Tel: ${text(label.sender.phone, fallbackText.senderPhone)}</p>
        <p>${text(label.sender.city, fallbackText.senderCity)}, ${text(label.sender.department, fallbackText.senderDepartment)}</p>
        <p>${text(label.sender.address, fallbackText.senderAddress)}</p>
      </section>
      <section class="block">
        <h2>Destinatario</h2>
        <p class="person">${text(label.recipient.fullName, fallbackText.recipientName)}</p>
        <p>Tel: ${text(label.recipient.phone, fallbackText.recipientPhone)}</p>
        <p>${text(label.recipient.city, fallbackText.recipientCity)}, ${text(label.recipient.department, fallbackText.recipientDepartment)}</p>
        <p class="address">${text(label.recipient.address, fallbackText.recipientAddress)}</p>
        <p>Barrio: ${text(label.recipient.neighborhood, fallbackText.recipientNeighborhood)}</p>
        <p>Ref: ${text(label.recipient.reference, fallbackText.recipientReference)}</p>
      </section>
    </section>
    <footer class="footer">
      <span class="badge">${escapeHtml(payment)}</span>
      <span class="notes">${text(label.recipient.notes, fallbackText.recipientNotes)}</span>
    </footer>
  </main>
</body>
</html>`;
}

export async function renderLabelPdfBuffer(label: LabelDraft | LabelRecord, settings: LabelSettings, options: PdfRenderOptions = {}): Promise<Buffer> {
  const { chromium } = await import("playwright");
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 529, height: 416 } });
    await page.setContent(renderLabelPdfHtml(label, settings, options), {
      waitUntil: "networkidle",
      timeout: options.timeoutMs ?? 15_000,
    });
    return await page.pdf({
      width: `${PDF_SIZE_CM.width}cm`,
      height: `${PDF_SIZE_CM.height}cm`,
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
      printBackground: true,
      preferCSSPageSize: true,
    });
  } finally {
    await browser.close();
  }
}
