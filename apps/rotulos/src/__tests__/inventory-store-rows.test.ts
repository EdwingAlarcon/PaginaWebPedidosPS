import { describe, expect, it } from "vitest";
import { rowToProduct, rowToMovement } from "@/lib/inventory-store";
import type { ProductRow, StockMovementRow } from "@/lib/inventory-store";

describe("inventory-store row mappers", () => {
  it("coerces numeric-as-string Postgres columns to JS numbers in rowToProduct", () => {
    const row: ProductRow = {
      id: "p1",
      name: "Medias largas",
      category: "medias",
      sku: "MED-001",
      unit_price: "15000",
      current_stock: "10",
      min_stock: "5",
      max_stock: "100",
      last_restock_date: "2026-07-16T00:00:00.000Z",
      created_at: "2026-07-16T00:00:00.000Z",
      updated_at: "2026-07-16T00:00:00.000Z",
    };

    const product = rowToProduct(row);

    expect(product.unitPrice).toBe(15000);
    expect(product.currentStock).toBe(10);
    expect(product.minStock).toBe(5);
    expect(product.maxStock).toBe(100);
    expect(typeof product.unitPrice).toBe("number");
  });

  it("maps a null max_stock to null, not zero", () => {
    const row: ProductRow = {
      id: "p2",
      name: "Sin tope",
      category: "medias",
      sku: "",
      unit_price: 5000,
      current_stock: 0,
      min_stock: 0,
      max_stock: null,
      last_restock_date: null,
      created_at: "2026-07-16T00:00:00.000Z",
      updated_at: "2026-07-16T00:00:00.000Z",
    };

    const product = rowToProduct(row);

    expect(product.maxStock).toBeNull();
  });

  it("coerces numeric-as-string quantity in rowToMovement", () => {
    const row: StockMovementRow = {
      id: "m1",
      product_id: "p1",
      type: "entrada",
      quantity: "10",
      reason: "Compra",
      supplier: "ACME",
      created_at: "2026-07-16T00:00:00.000Z",
    };

    const movement = rowToMovement(row);

    expect(movement.quantity).toBe(10);
    expect(typeof movement.quantity).toBe("number");
  });
});
