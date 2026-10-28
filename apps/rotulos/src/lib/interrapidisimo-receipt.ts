// Lee el comprobante de Interrapidisimo ("Ver detalles" del WhatsApp de la
// transportadora) a partir del texto que el usuario comparte o pega. No
// consulta la API de Interrapidisimo: solo usa lo que la pagina ya muestra.

export const INTERRAPIDISIMO_CARRIER = "INTERRAPIDISIMO";

const RECEIPT_BASE_URL = "https://www3.interrapidisimo.com/ListaFacturaPreEnvios/Consolidada?Comprobante=";
const RECEIPT_URL_PATTERN = /https?:\/\/\S*ListaFacturaPreEnvios\S*?[?&]Comprobante=([^\s&#]+)/i;
const RECEIPT_NUMBER_PATTERN = /Comprobante\s*(?:No\.?|N[°º]\.?|#)?\s*:?\s*(\d{5,})/i;
// Fila de la tabla: guia, destinatario, ciudad\departamento\pais (ej. BOGOTA\CUND\COL).
const SHIPMENT_PATTERN = /(\d{9,15})([^\\\d]+?)\\([^\\\n\t]+?)\\([A-Z]{3})/g;
const CELL_SEPARATOR = /\s*(?:\t|\r?\n| {2,}|\|)\s*/;

export type ReceiptShipment = {
  trackingNumber: string;
  /** Si la ciudad no se pudo separar (texto pegado sin separadores), incluye la ciudad al final. */
  recipientName: string;
  city: string;
  department: string;
};

export type ParsedReceipt = {
  receiptNumber: string | null;
  receiptUrl: string | null;
  shipments: ReceiptShipment[];
};

function decodeBase64(value: string): string | null {
  try {
    return atob(decodeURIComponent(value));
  } catch {
    return null;
  }
}

export function buildReceiptUrl(receiptNumber: string): string {
  return `${RECEIPT_BASE_URL}${btoa(receiptNumber)}`;
}

function parseShipment(trackingNumber: string, middle: string, department: string): ReceiptShipment {
  const parts = middle.trim().split(CELL_SEPARATOR).filter(Boolean);
  if (parts.length >= 2) {
    return {
      trackingNumber,
      recipientName: parts.slice(0, -1).join(" ").toUpperCase(),
      city: parts[parts.length - 1].toUpperCase(),
      department: department.trim().toUpperCase(),
    };
  }
  return {
    trackingNumber,
    recipientName: middle.trim().replace(/\s+/g, " ").toUpperCase(),
    city: "",
    department: department.trim().toUpperCase(),
  };
}

export function parseInterrapidisimoReceipt(text: string): ParsedReceipt {
  let receiptUrl: string | null = null;
  let receiptNumber: string | null = null;

  const urlMatch = text.match(RECEIPT_URL_PATTERN);
  if (urlMatch) {
    receiptUrl = urlMatch[0];
    const decoded = decodeBase64(urlMatch[1]);
    if (decoded && /^\d+$/.test(decoded)) receiptNumber = decoded;
  }
  if (!receiptNumber) {
    const numberMatch = text.match(RECEIPT_NUMBER_PATTERN);
    if (numberMatch) receiptNumber = numberMatch[1];
  }
  if (!receiptUrl && receiptNumber) receiptUrl = buildReceiptUrl(receiptNumber);

  const shipments: ReceiptShipment[] = [];
  const seen = new Set<string>();
  for (const match of text.matchAll(SHIPMENT_PATTERN)) {
    const [, trackingNumber, middle, department] = match;
    if (trackingNumber === receiptNumber || seen.has(trackingNumber)) continue;
    seen.add(trackingNumber);
    shipments.push(parseShipment(trackingNumber, middle, department));
  }

  return { receiptNumber, receiptUrl, shipments };
}
