import { describe, expect, it } from "vitest";
import type { OrderEdit, OrderPayment, OrderRecord } from "@/lib/business-types";
import type { LabelRecord } from "@/lib/types";
import { buildOrderTimeline } from "@/lib/order-timeline";

const order = { id: "o1", createdAt: "2026-09-01T10:00:00Z", source: "app" } as OrderRecord;

describe("buildOrderTimeline", () => {
  it("starts with the creation event and orders everything chronologically", () => {
    const payments = [
      { id: "p1", amount: 50000, method: "nequi", note: "abono", createdAt: "2026-09-03T10:00:00Z" },
    ] as OrderPayment[];
    const edits = [
      { id: "e1", changedAt: "2026-09-02T10:00:00Z", changes: { discount: {}, items: [{}, {}] }, reason: "cliente pidio rebaja" },
    ] as unknown as OrderEdit[];
    const label = {
      id: "l1",
      orderNumber: "PS-2026-000001",
      status: "impreso",
      createdAt: "2026-09-04T10:00:00Z",
      updatedAt: "2026-09-05T10:00:00Z",
      trackingNumber: "ABC123",
      carrier: "INTERRAPIDISIMO",
    } as LabelRecord;

    const timeline = buildOrderTimeline(order, edits, payments, label);

    expect(timeline.map((event) => event.kind)).toEqual(["created", "edit", "payment", "label", "tracking"]);
    expect(timeline[1].detail).toContain("descuento");
    expect(timeline[1].detail).toContain("2 linea(s)");
    expect(timeline[2].title).toContain("50");
  });

  it("labels imported orders and works with no extra events", () => {
    const timeline = buildOrderTimeline({ ...order, source: "excel_import" }, [], [], null);
    expect(timeline).toHaveLength(1);
    expect(timeline[0].title).toBe("Pedido importado desde Excel");
  });
});
