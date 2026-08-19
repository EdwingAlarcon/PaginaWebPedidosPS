import { describe, expect, it } from "vitest";
import { renderCustomerHistoryPdfBuffer, renderOrderSummaryPdfBuffer } from "@/lib/order-summary-pdf";
import type { Customer, OrderRecord } from "@/lib/business-types";

function makeOrder(overrides: Partial<OrderRecord> = {}): OrderRecord {
  return {
    id: "order-1",
    customerId: "customer-1",
    customer: {
      fullName: "ANA PEREZ",
      phone: "3001111111",
      email: "",
      department: "",
      city: "",
      address: "",
      neighborhood: "",
    },
    orderDate: "2026-08-10",
    status: "completed",
    notes: "",
    discount: 0,
    shippingCost: 0,
    subtotal: 60000,
    total: 60000,
    items: [
      { id: "item-1", productCode: "COD1", productName: "CAMISETA ROSA", category: "ROPA", quantity: 2, unitPrice: 30000, total: 60000 },
    ],
    createdAt: "2026-08-10T00:00:00.000Z",
    updatedAt: "2026-08-10T00:00:00.000Z",
    ...overrides,
  };
}

function makeCustomer(overrides: Partial<Customer> = {}): Customer {
  return {
    id: "customer-1",
    fullName: "ANA PEREZ",
    phone: "3001111111",
    email: "",
    department: "",
    city: "",
    address: "",
    neighborhood: "",
    createdAt: "2026-08-01T00:00:00.000Z",
    updatedAt: "2026-08-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("renderOrderSummaryPdfBuffer", () => {
  it("produces a valid single-page PDF buffer", async () => {
    const buffer = await renderOrderSummaryPdfBuffer(makeOrder());

    expect(buffer.subarray(0, 5).toString("latin1")).toBe("%PDF-");
  });

  it("does not throw with many coded items (regression: zebra-row overlap over product codes)", async () => {
    const items = Array.from({ length: 13 }, (_, i) => ({
      id: `item-${i}`,
      productCode: `COD${i}`,
      productName: `PRODUCTO ${i}`,
      category: "",
      quantity: 1,
      unitPrice: 10000,
      total: 10000,
    }));
    const buffer = await renderOrderSummaryPdfBuffer(makeOrder({ items, subtotal: 130000, total: 130000 }));

    expect(buffer.subarray(0, 5).toString("latin1")).toBe("%PDF-");
  });
});

describe("renderCustomerHistoryPdfBuffer", () => {
  it("produces a valid PDF buffer covering multiple orders", async () => {
    const orders = [makeOrder({ id: "order-1" }), makeOrder({ id: "order-2", orderDate: "2026-08-15", total: 90000 })];

    const buffer = await renderCustomerHistoryPdfBuffer(makeCustomer(), orders);

    expect(buffer.subarray(0, 5).toString("latin1")).toBe("%PDF-");
  });

  it("does not throw when the customer has no orders", async () => {
    await expect(renderCustomerHistoryPdfBuffer(makeCustomer(), [])).resolves.toBeInstanceOf(Buffer);
  });
});
