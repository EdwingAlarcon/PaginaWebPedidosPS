import { describe, expect, it } from "vitest";
import { buildLabelDraftFromOrder } from "@/lib/label-from-order";
import { defaultSettings } from "@/lib/defaults";
import type { OrderRecord } from "@/lib/business-types";

function makeOrder(overrides: Partial<OrderRecord> = {}): OrderRecord {
  return {
    id: "order-123",
    customerId: "customer-1",
    customer: {
      fullName: "MARIA PEREZ",
      phone: "3001234567",
      email: "maria@example.com",
      department: "ANTIOQUIA",
      city: "MEDELLIN",
      locality: "",
      address: "CALLE 10 # 20-30",
      neighborhood: "LAURELES",
    },
    orderDate: "2026-07-20",
    status: "pending",
    notes: "ENTREGAR EN LA TARDE",
    discount: 0,
    shippingCost: 0,
    subtotal: 50000,
    total: 50000,
    items: [],
    createdAt: "2026-07-20T10:00:00.000Z",
    updatedAt: "2026-07-20T10:00:00.000Z",
    ...overrides,
    source: overrides.source ?? "app",
    importBatchId: overrides.importBatchId ?? null,
    importRowKey: overrides.importRowKey ?? null,
  };
}

describe("buildLabelDraftFromOrder", () => {
  it("prefills recipient from the order's customer data", () => {
    const order = makeOrder();

    const draft = buildLabelDraftFromOrder(order, defaultSettings.defaultSender);

    expect(draft.recipient.fullName).toBe("MARIA PEREZ");
    expect(draft.recipient.phone).toBe("3001234567");
    expect(draft.recipient.department).toBe("ANTIOQUIA");
    expect(draft.recipient.city).toBe("MEDELLIN");
    expect(draft.recipient.address).toBe("CALLE 10 # 20-30");
    expect(draft.recipient.neighborhood).toBe("LAURELES");
  });

  it("carries the order notes into the recipient notes", () => {
    const order = makeOrder({ notes: "ENTREGAR EN LA TARDE" });

    const draft = buildLabelDraftFromOrder(order, defaultSettings.defaultSender);

    expect(draft.recipient.notes).toBe("ENTREGAR EN LA TARDE");
  });

  it("links the draft to the real order id instead of a free-text number", () => {
    const order = makeOrder({ id: "order-abc-789" });

    const draft = buildLabelDraftFromOrder(order, defaultSettings.defaultSender);

    expect(draft.orderId).toBe("order-abc-789");
  });

  it("uses the given default sender, not the order's customer", () => {
    const order = makeOrder();

    const draft = buildLabelDraftFromOrder(order, defaultSettings.defaultSender);

    expect(draft.sender).toEqual(defaultSettings.defaultSender);
  });

  it("starts as a fresh unsaved draft in borrador status with no id", () => {
    const order = makeOrder();

    const draft = buildLabelDraftFromOrder(order, defaultSettings.defaultSender);

    expect(draft.id).toBeUndefined();
    expect(draft.status).toBe("borrador");
  });
});
