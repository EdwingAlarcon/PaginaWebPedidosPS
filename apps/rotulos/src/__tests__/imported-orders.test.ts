import { describe, expect, it } from "vitest";
import { getImportedOrderSummary, getImportedOrders } from "@/lib/imported-orders";
import type { OrderRecord } from "@/lib/business-types";

function order(
  id: string,
  source: OrderRecord["source"],
  orderDate: string,
  customer: string,
  total = 100,
): OrderRecord {
  return {
    id,
    customerId: null,
    customer: {
      fullName: customer,
      phone: "",
      email: "",
      department: "",
      city: "",
      locality: "",
      address: "",
      neighborhood: "",
    },
    orderDate,
    status: "completed",
    notes: "",
    items: [
      {
        id: `${id}-item`,
        productId: null,
        productCode: "REF",
        productName: "Producto",
        category: "GENERAL",
        quantity: 2,
        unitPrice: total / 2,
        total,
      },
    ],
    subtotal: total,
    discount: 0,
    shippingCost: 0,
    total,
    source,
    importBatchId: source === "excel_import" ? "batch" : null,
    importRowKey: source === "excel_import" ? `${id}:row` : null,
    createdAt: `${orderDate}T00:00:00.000Z`,
    updatedAt: `${orderDate}T00:00:00.000Z`,
  };
}

describe("imported orders", () => {
  it("keeps only excel imports ordered newest first", () => {
    expect(getImportedOrders([
      order("a", "app", "2026-01-01", "ZAIDA"),
      order("b", "excel_import", "2024-03-01", "JOHANNA"),
      order("c", "excel_import", "2025-08-01", "LINA"),
    ]).map((item) => item.id)).toEqual(["c", "b"]);
  });

  it("summarizes imported orders", () => {
    expect(getImportedOrderSummary([
      order("b", "excel_import", "2024-03-01", "JOHANNA", 200),
      order("c", "excel_import", "2025-08-01", "LINA", 300),
    ])).toEqual({ orders: 2, items: 4, total: 500, customers: 2, years: ["2024", "2025"] });
  });
});
