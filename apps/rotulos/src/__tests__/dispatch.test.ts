import { describe, expect, it } from "vitest";
import { buildDispatchRows, getDispatchIssues } from "@/lib/dispatch";
import type { OrderRecord } from "@/lib/business-types";
import type { LabelRecord } from "@/lib/types";

function makeOrder(overrides: Partial<OrderRecord> = {}): OrderRecord {
  return {
    id: "order-1",
    customerId: "customer-1",
    customer: {
      fullName: "ANA PEREZ",
      phone: "3001234567",
      email: "",
      department: "CUNDINAMARCA",
      city: "BOGOTA",
      locality: "KENNEDY",
      address: "CALLE 1",
      neighborhood: "",
    },
    orderDate: "2026-08-14",
    status: "pending",
    notes: "",
    discount: 0,
    shippingCost: 0,
    subtotal: 50000,
    total: 50000,
    items: [{ id: "item-1", productId: null, productCode: "MED-1", productName: "MEDIAS", category: "MODA", quantity: 1, unitPrice: 50000, total: 50000 }],
    createdAt: "2026-08-14T10:00:00.000Z",
    updatedAt: "2026-08-14T10:00:00.000Z",
    ...overrides,
  };
}

function makeLabel(overrides: Partial<LabelRecord> = {}): LabelRecord {
  return {
    id: "label-1",
    orderId: "order-1",
    orderNumber: "PS-2026-000001",
    size: "14x12",
    date: "2026-08-14",
    sender: { name: "PurpleShop", phone: "", department: "", city: "", address: "" },
    recipient: { fullName: "ANA PEREZ", phone: "3001234567", department: "CUNDINAMARCA", city: "BOGOTA", locality: "KENNEDY", address: "CALLE 1", neighborhood: "", reference: "", notes: "" },
    carrier: "",
    paymentMethod: "pagado",
    codAmount: 0,
    packageCount: 1,
    status: "generado",
    pdfUrl: null,
    createdBy: null,
    createdAt: "2026-08-14T10:10:00.000Z",
    updatedAt: "2026-08-14T10:10:00.000Z",
    ...overrides,
  };
}

describe("dispatch helpers", () => {
  it("detects missing dispatch data", () => {
    const order = makeOrder({
      customer: { ...makeOrder().customer, phone: "", city: "", locality: "", address: "", neighborhood: "" },
      items: [],
      total: 0,
    });

    expect(getDispatchIssues(order).map((issue) => issue.key)).toEqual(["phone", "address", "city", "locality", "items", "total"]);
  });

  it("keeps pending orders even when their label is already printed", () => {
    const rows = buildDispatchRows([makeOrder()], [makeLabel({ status: "impreso" })], new Date("2026-08-15T12:00:00.000Z"));

    expect(rows).toHaveLength(1);
    expect(rows[0].label?.status).toBe("impreso");
  });

  it("includes recent completed orders only if label action is still pending", () => {
    const completed = makeOrder({ status: "completed" });
    const rows = buildDispatchRows([completed], [makeLabel({ status: "generado" })], new Date("2026-08-15T12:00:00.000Z"));
    const readyRows = buildDispatchRows([completed], [makeLabel({ status: "impreso" })], new Date("2026-08-15T12:00:00.000Z"));

    expect(rows).toHaveLength(1);
    expect(readyRows).toHaveLength(0);
  });
});
