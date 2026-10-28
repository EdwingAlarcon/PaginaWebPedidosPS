import { describe, expect, it } from "vitest";
import { createBlankLabelDraft } from "@/lib/defaults";
import type { ReceiptShipment } from "@/lib/interrapidisimo-receipt";
import { listRecentPendingLabels, matchReceiptShipments } from "@/lib/tracking-match";
import type { LabelRecord } from "@/lib/types";

const CUTOFF = "2026-10-01";

function makeLabel(id: string, overrides: Partial<LabelRecord> & { name?: string; city?: string } = {}): LabelRecord {
  const { name = "ZAIDA SUAREZ", city = "BOGOTÁ, D.C.", ...rest } = overrides;
  const blank = createBlankLabelDraft();
  return {
    ...blank,
    id,
    orderNumber: `PS-${id}`,
    date: "2026-10-27",
    status: "impreso",
    recipient: { ...blank.recipient, fullName: name, city, phone: "3001111111" },
    createdAt: "2026-10-27T15:00:00.000Z",
    updatedAt: "2026-10-27T15:00:00.000Z",
    pdfUrl: null,
    createdBy: null,
    ...rest,
  };
}

const shipment: ReceiptShipment = {
  trackingNumber: "700209981331",
  recipientName: "ZAIDA SUAREZ",
  city: "BOGOTA",
  department: "CUND",
};

describe("matchReceiptShipments", () => {
  it("auto-assigns a single recent label with matching name and city", () => {
    const [match] = matchReceiptShipments([shipment], [makeLabel("1"), makeLabel("2", { name: "LINA GONZALEZ" })], CUTOFF);
    expect(match.confidence).toBe("alta");
    expect(match.suggested?.id).toBe("1");
  });

  it("matches glued name+city text from the receipt page", () => {
    const glued = { ...shipment, recipientName: "ZAIDA SUAREZBOGOTA", city: "" };
    const [match] = matchReceiptShipments([glued], [makeLabel("1")], CUTOFF);
    expect(match.confidence).toBe("alta");
    expect(match.suggested?.id).toBe("1");
  });

  it("ignores old labels without tracking when choosing automatically", () => {
    const labels = [makeLabel("old", { date: "2025-03-01" }), makeLabel("new")];
    const [match] = matchReceiptShipments([shipment], labels, CUTOFF);
    expect(match.confidence).toBe("alta");
    expect(match.suggested?.id).toBe("new");
    expect(match.candidates.map((label) => label.id)).toEqual(["new", "old"]);
  });

  it("asks for confirmation when the same customer has two recent pending labels", () => {
    const labels = [makeLabel("a", { date: "2026-10-20" }), makeLabel("b", { date: "2026-10-27" })];
    const [match] = matchReceiptShipments([shipment], labels, CUTOFF);
    expect(match.confidence).toBe("media");
    expect(match.suggested?.id).toBe("b");
  });

  it("asks for confirmation when only the name matches", () => {
    const [match] = matchReceiptShipments([shipment], [makeLabel("1", { city: "MEDELLÍN" })], CUTOFF);
    expect(match.confidence).toBe("media");
  });

  it("reports labels that already have the same tracking number", () => {
    const labels = [makeLabel("1", { trackingNumber: "700209981331" })];
    const [match] = matchReceiptShipments([shipment], labels, CUTOFF);
    expect(match.assigned?.id).toBe("1");
  });

  it("never suggests annulled labels or labels with another tracking number", () => {
    const labels = [makeLabel("1", { status: "anulado" }), makeLabel("2", { trackingNumber: "999" })];
    const [match] = matchReceiptShipments([shipment], labels, CUTOFF);
    expect(match.confidence).toBe("ninguna");
    expect(match.suggested).toBeNull();
  });

  it("does not auto-assign two shipments to the same label", () => {
    const second = { ...shipment, trackingNumber: "700209981342" };
    const matches = matchReceiptShipments([shipment, second], [makeLabel("1")], CUTOFF);
    expect(matches.map((match) => match.confidence)).toEqual(["media", "media"]);
  });
});

describe("listRecentPendingLabels", () => {
  it("lists recent labels without tracking, newest first", () => {
    const labels = [
      makeLabel("old", { date: "2025-01-01" }),
      makeLabel("a", { date: "2026-10-20" }),
      makeLabel("b", { date: "2026-10-27" }),
      makeLabel("done", { trackingNumber: "1" }),
    ];
    expect(listRecentPendingLabels(labels, CUTOFF).map((label) => label.id)).toEqual(["b", "a"]);
  });
});
