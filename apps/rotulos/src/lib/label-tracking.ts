import type { LabelRecord } from "@/lib/types";

const DIVIDER = "──────────────";

export function buildTrackingWhatsAppText(label: LabelRecord): string {
  const lines: string[] = [
    "*PURPLE SHOP*",
    "_Guia de tu envio_",
    DIVIDER,
    `Transportadora: *${label.carrier || "-"}*`,
    `Numero de guia: *${label.trackingNumber ?? ""}*`,
  ];
  if (label.trackingUrl) lines.push(`Rastrealo aqui: ${label.trackingUrl}`);
  lines.push(DIVIDER, "_Gracias por tu compra!_");
  return lines.join("\n");
}
