import { describe, expect, it } from "vitest";
import {
  buildCustomerHistoryText,
  buildOrderSummaryText,
  buildWhatsAppLink,
  normalizePhoneForWhatsApp,
} from "@/lib/order-summary";
import { formatDate } from "@/lib/format";
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
    discount: 5000,
    shippingCost: 8000,
    subtotal: 60000,
    total: 63000,
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

describe("buildOrderSummaryText", () => {
  it("includes customer, items and totals", () => {
    const text = buildOrderSummaryText(makeOrder());

    expect(text).toContain("ANA PEREZ");
    expect(text).toContain("2x CAMISETA ROSA");
    expect(text).toMatch(/Subtotal: \$\s?60\.000/);
    expect(text).toMatch(/Descuento: \$\s?5\.000/);
    expect(text).toMatch(/Envio: \$\s?8\.000/);
    expect(text).toMatch(/Total: \$\s?63\.000/);
  });

  it("omits discount and shipping lines when they are zero", () => {
    const text = buildOrderSummaryText(makeOrder({ discount: 0, shippingCost: 0 }));

    expect(text).not.toContain("Descuento:");
    expect(text).not.toContain("Envio:");
  });

  it("shows a placeholder when there are no items", () => {
    const text = buildOrderSummaryText(makeOrder({ items: [] }));

    expect(text).toContain("(sin productos registrados)");
  });
});

describe("buildCustomerHistoryText", () => {
  it("lists every order in chronological order with a grand total", () => {
    const older = makeOrder({ id: "order-1", orderDate: "2026-08-01", total: 30000 });
    const newer = makeOrder({ id: "order-2", orderDate: "2026-08-15", total: 63000 });
    const text = buildCustomerHistoryText(makeCustomer(), [newer, older]);

    expect(text.indexOf(formatDate("2026-08-01"))).toBeLessThan(text.indexOf(formatDate("2026-08-15")));
    expect(text).toMatch(/Total comprado: \$\s?93\.000/);
  });
});

describe("normalizePhoneForWhatsApp", () => {
  it("adds the Colombia country code to a 10-digit local number", () => {
    expect(normalizePhoneForWhatsApp("300 111 1111")).toBe("573001111111");
  });

  it("keeps a number that already has the country code", () => {
    expect(normalizePhoneForWhatsApp("+57 300 111 1111")).toBe("573001111111");
  });

  it("returns an empty string for an empty phone", () => {
    expect(normalizePhoneForWhatsApp("")).toBe("");
  });
});

describe("buildWhatsAppLink", () => {
  it("builds a wa.me link with the normalized phone and encoded text", () => {
    const link = buildWhatsAppLink("3001111111", "Hola & gracias");

    expect(link).toBe("https://wa.me/573001111111?text=Hola%20%26%20gracias");
  });

  it("falls back to a link without a phone when there is none", () => {
    const link = buildWhatsAppLink("", "Hola");

    expect(link).toBe("https://wa.me/?text=Hola");
  });
});
