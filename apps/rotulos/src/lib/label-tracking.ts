import type { LabelRecord } from "@/lib/types";

const DIVIDER = "──────────────";

export type ShipmentTracking = {
  carrier: string;
  trackingNumber: string;
  trackingUrl?: string | null;
};

export function labelToShipmentTracking(label: LabelRecord | null | undefined): ShipmentTracking | null {
  if (!label?.trackingNumber) return null;
  return { carrier: label.carrier, trackingNumber: label.trackingNumber, trackingUrl: label.trackingUrl };
}

export function buildTrackingWhatsAppText(label: LabelRecord): string {
  const lines: string[] = [
    "*PURPLE SHOP* 💜",
    "_Guía de tu envío_ 📦",
    DIVIDER,
    `Transportadora: *${label.carrier || "-"}* 🚚`,
    `Número de guía: *${label.trackingNumber ?? ""}*`,
  ];
  if (label.trackingUrl) lines.push(`Rastréalo aquí: 🔗 ${label.trackingUrl}`);
  lines.push(DIVIDER, "_¡Gracias por tu compra!_ ✨");
  return lines.join("\n");
}
