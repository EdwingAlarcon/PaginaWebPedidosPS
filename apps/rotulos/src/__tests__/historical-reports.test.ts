import { describe, expect, it } from "vitest";
import { buildHistoricalReport } from "@/lib/historical-reports";
import type { OrderRecord } from "@/lib/business-types";

function order(overrides: Partial<OrderRecord> & { id: string; orderDate: string }): OrderRecord {
  const { id, orderDate, ...rest } = overrides;
  return {
    id,
    customerId: null,
    customer: {
      fullName: "CLIENTE",
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
    discount: 0,
    shippingCost: 0,
    subtotal: 100_000,
    total: 100_000,
    items: [
      {
        id: `${id}-item`,
        productId: null,
        productCode: "REF-1",
        productName: "CAMISETA",
        category: "ROPA",
        quantity: 2,
        unitPrice: 50_000,
        total: 100_000,
      },
    ],
    source: "excel_import",
    importBatchId: "batch",
    importRowKey: `${id}:row`,
    createdAt: `${orderDate}T00:00:00.000Z`,
    updatedAt: `${orderDate}T00:00:00.000Z`,
    ...rest,
  };
}

describe("buildHistoricalReport", () => {
  it("includes imported 2024/2025 orders and excludes cancelled sales", () => {
    const report = buildHistoricalReport([
      order({ id: "2024", orderDate: "2024-03-01", total: 120_000, customer: { fullName: "ZAIDA", phone: "", email: "", department: "", city: "", locality: "", address: "", neighborhood: "" } }),
      order({ id: "2025", orderDate: "2025-08-01", total: 200_000, customer: { fullName: "JOHANNA", phone: "", email: "", department: "", city: "", locality: "", address: "", neighborhood: "" } }),
      order({ id: "cancelled", orderDate: "2025-09-01", status: "cancelled", total: 999_000 }),
      order({ id: "app", orderDate: "2025-09-01", source: "app", total: 999_000 }),
      order({ id: "2026", orderDate: "2026-01-01", total: 999_000 }),
    ]);

    expect(report.totalsByYear).toEqual([
      { year: "2024", orders: 1, units: 2, total: 120_000 },
      { year: "2025", orders: 1, units: 2, total: 200_000 },
    ]);
    expect(report.topCustomers.map(({ customer, total }) => ({ customer, total }))).toEqual([
      { customer: "JOHANNA", total: 200_000 },
      { customer: "ZAIDA", total: 120_000 },
    ]);
  });

  it("sorts top products and reports historical or missing refs", () => {
    const report = buildHistoricalReport([
      order({
        id: "hist",
        orderDate: "2024-03-01",
        items: [
          { id: "hist-1", productId: null, productCode: "HIST_CAMISETA_MAR_2024", productName: "CAMISETA", category: "", quantity: 3, unitPrice: 10_000, total: 30_000 },
          { id: "hist-2", productId: null, productCode: "", productName: "SIN REF", category: "", quantity: 1, unitPrice: 5_000, total: 5_000 },
        ],
        subtotal: 35_000,
        total: 35_000,
      }),
      order({
        id: "regular",
        orderDate: "2025-02-01",
        items: [{ id: "regular-1", productId: null, productCode: "REF-2", productName: "ARETES", category: "", quantity: 5, unitPrice: 8_000, total: 40_000 }],
        subtotal: 40_000,
        total: 40_000,
      }),
    ]);

    expect(report.topProducts.map(({ productName, quantity }) => ({ productName, quantity }))).toEqual([
      { productName: "ARETES", quantity: 5 },
      { productName: "CAMISETA", quantity: 3 },
      { productName: "SIN REF", quantity: 1 },
    ]);
    expect(report.historicalRefItems.map((item) => item.productCode)).toEqual(["HIST_CAMISETA_MAR_2024"]);
    expect(report.missingRefItems.map((item) => item.productName)).toEqual(["SIN REF"]);
  });
});
