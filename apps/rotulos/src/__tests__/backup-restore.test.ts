import { describe, expect, it } from "vitest";
import type { FullBackupPayload } from "@/lib/backup";
import {
  buildRestorePlan,
  normalizeRestoreSelection,
  RESTORE_TABLE_ORDER,
  validateFullBackupPayload,
} from "@/lib/backup-restore";

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

describe("backup restore helpers", () => {
  it("rejects incomplete backup payloads", () => {
    const result = validateFullBackupPayload({ generatedAt: "2026-08-22T00:00:00.000Z", generatedBy: "test" });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("customers");
  });

  it("builds a safe restore plan only for supported low-risk tables", () => {
    const plan = buildRestorePlan(
      snapshot({
        customers: [{ id: "customer-1", full_name: "ANA" }],
        orders: [{ id: "order-1", total: 100 }],
        settings: [{ key: "theme", value: "dark" }],
      }),
      snapshot({
        settings: [{ key: "theme", value: "light" }],
      }),
    );

    expect(plan.restorableTables).toEqual(["customers", "labels", "settings"]);
    expect(plan.unsupportedTables).toContain("orders");
    expect(plan.report.tables.customers.missing).toEqual([{ key: "customer-1" }]);
    expect(plan.report.tables.settings.changed).toEqual([{ key: "theme" }]);
  });

  it("normalizes selected changes and sorts them by restore order", () => {
    const plan = buildRestorePlan(
      snapshot({
        customers: [{ id: "customer-1", full_name: "ANA" }],
        labels: [{ id: "label-1", recipient: "ANA" }],
      }),
      snapshot(),
    );

    const result = normalizeRestoreSelection(plan.report, [
      { table: "labels", key: "label-1", action: "insert_missing" },
      { table: "customers", key: "customer-1", action: "insert_missing" },
      { table: "orders", key: "order-1", action: "insert_missing" },
    ]);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.selection.map((item) => item.table)).toEqual(["customers", "labels"]);
      expect(RESTORE_TABLE_ORDER.indexOf("customers")).toBeLessThan(RESTORE_TABLE_ORDER.indexOf("labels"));
    }
  });
});
