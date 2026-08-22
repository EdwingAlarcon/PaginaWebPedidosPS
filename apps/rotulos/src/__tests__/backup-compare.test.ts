import { describe, expect, it } from "vitest";
import { compareBackupSnapshots } from "@/lib/backup-compare";
import type { FullBackupPayload } from "@/lib/backup";

function snapshot(overrides: Partial<FullBackupPayload> = {}): FullBackupPayload {
  return {
    generatedAt: "2026-08-22T00:00:00.000Z",
    generatedBy: "test",
    customers: [],
    orders: [],
    orderItems: [],
    orderEdits: [],
    productCodes: [],
    products: [],
    stockMovements: [],
    labels: [],
    settings: [],
    ...overrides,
  };
}

describe("compareBackupSnapshots", () => {
  it("groups missing, extra and changed rows by table", () => {
    const report = compareBackupSnapshots(
      snapshot({
        customers: [{ id: "customer-1", full_name: "ANA" }, { id: "customer-2", full_name: "LUISA" }],
        orders: [{ id: "order-1", total: 100 }],
        settings: [{ key: "theme", value: "light" }],
      }),
      snapshot({
        customers: [{ id: "customer-1", full_name: "ANA MARIA" }, { id: "customer-3", full_name: "MARTA" }],
        orders: [{ id: "order-1", total: 100 }],
        settings: [{ key: "theme", value: "dark" }],
      }),
    );

    expect(report.tables.customers.summary).toEqual({ missing: 1, extra: 1, changed: 1, unchanged: 0 });
    expect(report.tables.customers.missing.map((row) => row.key)).toEqual(["customer-2"]);
    expect(report.tables.customers.extra.map((row) => row.key)).toEqual(["customer-3"]);
    expect(report.tables.customers.changed.map((row) => row.key)).toEqual(["customer-1"]);
    expect(report.tables.orders.summary).toEqual({ missing: 0, extra: 0, changed: 0, unchanged: 1 });
    expect(report.tables.settings.changed.map((row) => row.key)).toEqual(["theme"]);
  });

  it("ignores object key order when comparing rows", () => {
    const report = compareBackupSnapshots(
      snapshot({ products: [{ id: "product-1", name: "CAMISETA", stock: 1 }] }),
      snapshot({ products: [{ stock: 1, name: "CAMISETA", id: "product-1" }] }),
    );

    expect(report.tables.products.summary).toEqual({ missing: 0, extra: 0, changed: 0, unchanged: 1 });
  });
});
