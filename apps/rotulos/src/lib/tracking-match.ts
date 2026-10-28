import { businessDaysAgo } from "@/lib/date";
import type { ReceiptShipment } from "@/lib/interrapidisimo-receipt";
import type { LabelRecord } from "@/lib/types";

/** Solo un rotulo reciente puede asignarse automaticamente. */
export const RECENT_LABEL_DAYS = 30;

export type MatchConfidence = "alta" | "media" | "ninguna";

export type ShipmentMatch = {
  shipment: ReceiptShipment;
  /** Rotulo que ya tiene guardada esta misma guia. */
  assigned: LabelRecord | null;
  /** Rotulos sin guia cuyo destinatario coincide, el mas probable primero. */
  candidates: LabelRecord[];
  suggested: LabelRecord | null;
  confidence: MatchConfidence;
};

export function normalizeForMatch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function citiesMatch(labelCity: string, shipmentCity: string): boolean {
  const a = normalizeForMatch(labelCity);
  const b = normalizeForMatch(shipmentCity);
  return Boolean(a && b) && (a.startsWith(b) || b.startsWith(a));
}

type RecipientMatch = { name: boolean; city: boolean };

function matchRecipient(label: LabelRecord, shipment: ReceiptShipment): RecipientMatch {
  const labelName = normalizeForMatch(label.recipient.fullName);
  const shipmentName = normalizeForMatch(shipment.recipientName);
  if (!labelName || !shipmentName) return { name: false, city: false };

  if (shipment.city) {
    return { name: labelName === shipmentName, city: citiesMatch(label.recipient.city, shipment.city) };
  }
  // Texto sin separadores: "ZAIDA SUAREZBOGOTA" -> nombre + ciudad pegados.
  if (!shipmentName.replace(/ /g, "").startsWith(labelName.replace(/ /g, ""))) return { name: false, city: false };
  const rest = shipmentName.replace(/ /g, "").slice(labelName.replace(/ /g, "").length);
  return { name: true, city: rest ? citiesMatch(label.recipient.city.replace(/\s/g, ""), rest) : false };
}

export function isPendingTrackingLabel(label: LabelRecord): boolean {
  return !label.trackingNumber && label.status !== "anulado";
}

function byMostRecent(a: LabelRecord, b: LabelRecord): number {
  return b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt);
}

export function matchReceiptShipments(
  shipments: ReceiptShipment[],
  labels: LabelRecord[],
  cutoffDate = businessDaysAgo(RECENT_LABEL_DAYS),
): ShipmentMatch[] {
  const pending = labels.filter(isPendingTrackingLabel);

  const matches = shipments.map((shipment): ShipmentMatch => {
    const assigned = labels.find((label) => label.trackingNumber === shipment.trackingNumber) ?? null;
    const scored = pending
      .map((label) => ({ label, match: matchRecipient(label, shipment), recent: label.date >= cutoffDate }))
      .filter((entry) => entry.match.name)
      .sort(
        (a, b) =>
          Number(b.recent) - Number(a.recent) ||
          Number(b.match.city) - Number(a.match.city) ||
          byMostRecent(a.label, b.label),
      );
    const candidates = scored.map((entry) => entry.label);
    const strong = scored.filter((entry) => entry.recent && entry.match.city);

    if (assigned) return { shipment, assigned, candidates, suggested: assigned, confidence: "alta" };
    if (strong.length === 1) return { shipment, assigned, candidates, suggested: strong[0].label, confidence: "alta" };
    if (candidates.length > 0) return { shipment, assigned, candidates, suggested: candidates[0], confidence: "media" };
    return { shipment, assigned, candidates, suggested: null, confidence: "ninguna" };
  });

  // Dos guias del mismo comprobante no pueden ir automaticamente al mismo rotulo.
  const autoTargets = new Map<string, number>();
  for (const match of matches) {
    if (match.confidence === "alta" && !match.assigned && match.suggested) {
      autoTargets.set(match.suggested.id, (autoTargets.get(match.suggested.id) ?? 0) + 1);
    }
  }
  return matches.map((match) =>
    match.confidence === "alta" && !match.assigned && match.suggested && (autoTargets.get(match.suggested.id) ?? 0) > 1
      ? { ...match, confidence: "media" }
      : match,
  );
}

/** Rotulos recientes sin guia, para elegir a mano cuando no hay coincidencia. */
export function listRecentPendingLabels(labels: LabelRecord[], cutoffDate = businessDaysAgo(RECENT_LABEL_DAYS)) {
  return labels.filter((label) => isPendingTrackingLabel(label) && label.date >= cutoffDate).sort(byMostRecent);
}
