import { describe, expect, it } from "vitest";
import { collectAlternateContacts, isRelatedOrderToCustomer } from "@/lib/customer-orders";
import type { Customer, OrderRecord } from "@/lib/business-types";

function makeCustomer(overrides: Partial<Customer> = {}): Customer {
  return {
    id: "customer-1",
    fullName: "ANA PEREZ",
    phone: "3001111111",
    email: "",
    department: "",
    city: "MEDELLIN",
    address: "CALLE ACTUAL 1",
    neighborhood: "",
    createdAt: "2026-08-01T00:00:00.000Z",
    updatedAt: "2026-08-01T00:00:00.000Z",
    ...overrides,
  };
}

function makeOrder(overrides: Partial<OrderRecord> = {}): OrderRecord {
  return {
    id: "order-1",
    customerId: "customer-1",
    customer: {
      fullName: "ANA PEREZ",
      phone: "3001111111",
      email: "",
      department: "",
      city: "MEDELLIN",
      address: "CALLE ACTUAL 1",
      neighborhood: "",
    },
    orderDate: "2026-08-10",
    status: "completed",
    notes: "",
    discount: 0,
    shippingCost: 0,
    subtotal: 60000,
    total: 60000,
    items: [],
    createdAt: "2026-08-10T00:00:00.000Z",
    updatedAt: "2026-08-10T00:00:00.000Z",
    ...overrides,
    source: overrides.source ?? "app",
    importBatchId: overrides.importBatchId ?? null,
    importRowKey: overrides.importRowKey ?? null,
  };
}

describe("isRelatedOrderToCustomer", () => {
  it("matches by customerId", () => {
    expect(isRelatedOrderToCustomer(makeOrder({ customerId: "customer-1" }), makeCustomer())).toBe(true);
  });

  it("matches historical orders without customerId by normalized name", () => {
    const order = makeOrder({ customerId: null, customer: { ...makeOrder().customer, fullName: "ana perez" } });
    expect(isRelatedOrderToCustomer(order, makeCustomer())).toBe(true);
  });

  it("does not match an unrelated customer", () => {
    const order = makeOrder({ customerId: "other", customer: { ...makeOrder().customer, fullName: "OTRO CLIENTE" } });
    expect(isRelatedOrderToCustomer(order, makeCustomer())).toBe(false);
  });
});

describe("collectAlternateContacts", () => {
  it("ignores orders that match the current customer data", () => {
    const orders = [makeOrder()];
    expect(collectAlternateContacts(makeCustomer(), orders)).toEqual([]);
  });

  it("groups distinct historical phone/address combos with a usage count", () => {
    const oldAddressOrder = makeOrder({
      id: "order-1",
      customer: { ...makeOrder().customer, phone: "3009999999", address: "CALLE VIEJA 2" },
    });
    const sameOldAddressOrder = makeOrder({
      id: "order-2",
      customer: { ...makeOrder().customer, phone: "3009999999", address: "CALLE VIEJA 2" },
    });
    const currentOrder = makeOrder({ id: "order-3" });

    const result = collectAlternateContacts(makeCustomer(), [oldAddressOrder, sameOldAddressOrder, currentOrder]);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ phone: "3009999999", address: "CALLE VIEJA 2", count: 2 });
  });
});
