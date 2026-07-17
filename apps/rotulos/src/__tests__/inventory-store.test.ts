import { beforeEach, describe, expect, it } from "vitest";
import { createLocalInventoryStore } from "@/lib/inventory-store";

describe("local inventory store", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("crea un producto con stock en cero y lo lista", async () => {
    const store = createLocalInventoryStore();
    const saved = await store.saveProduct({
      name: "Medias largas",
      category: "medias",
      sku: "MED-001",
      unitPrice: 15000,
      minStock: 5,
      maxStock: 200,
    });

    expect(saved.currentStock).toBe(0);
    expect(await store.listProducts()).toEqual([saved]);
  });

  it("aumenta el stock al registrar una entrada", async () => {
    const store = createLocalInventoryStore();
    const product = await store.saveProduct({
      name: "Perfume 100ml", category: "perfumes", sku: "PER-001",
      unitPrice: 60000, minStock: 3, maxStock: 50,
    });

    const movement = await store.recordMovement({
      productId: product.id, type: "entrada", quantity: 10, reason: "Compra a proveedor", supplier: "ACME",
    });

    expect(movement.quantity).toBe(10);
    const [updated] = await store.listProducts();
    expect(updated.currentStock).toBe(10);
    expect(updated.lastRestockDate).not.toBeNull();
  });

  it("disminuye el stock al registrar una salida y rechaza salidas sin stock suficiente", async () => {
    const store = createLocalInventoryStore();
    const product = await store.saveProduct({
      name: "Camiseta M", category: "camisetas", sku: "CAM-001",
      unitPrice: 35000, minStock: 2, maxStock: 100,
    });
    await store.recordMovement({ productId: product.id, type: "entrada", quantity: 5, reason: "Stock inicial", supplier: "" });

    await store.recordMovement({ productId: product.id, type: "salida", quantity: 3, reason: "Venta", supplier: "" });
    const [afterSale] = await store.listProducts();
    expect(afterSale.currentStock).toBe(2);

    await expect(
      store.recordMovement({ productId: product.id, type: "salida", quantity: 10, reason: "Venta grande", supplier: "" }),
    ).rejects.toThrow("stock_insuficiente");
  });

  it("aplica el delta de un ajuste, incluyendo ajustes negativos", async () => {
    const store = createLocalInventoryStore();
    const product = await store.saveProduct({
      name: "Accesorio X", category: "accesorios", sku: "ACC-001",
      unitPrice: 8000, minStock: 1, maxStock: 30,
    });
    await store.recordMovement({ productId: product.id, type: "entrada", quantity: 8, reason: "Stock inicial", supplier: "" });

    await store.recordMovement({ productId: product.id, type: "ajuste", quantity: -3, reason: "Conteo fisico", supplier: "" });

    const [updated] = await store.listProducts();
    expect(updated.currentStock).toBe(5);
  });

  it("rechaza un ajuste o transferencia que dejaria el stock en negativo", async () => {
    const store = createLocalInventoryStore();
    const product = await store.saveProduct({
      name: "Producto Y", category: "medias", sku: "PY-001", unitPrice: 5000, minStock: 1, maxStock: 50,
    });
    await store.recordMovement({ productId: product.id, type: "entrada", quantity: 5, reason: "Stock inicial", supplier: "" });

    await expect(
      store.recordMovement({ productId: product.id, type: "ajuste", quantity: -10, reason: "Ajuste invalido", supplier: "" }),
    ).rejects.toThrow("stock_insuficiente");

    const [unchanged] = await store.listProducts();
    expect(unchanged.currentStock).toBe(5);
  });

  it("calcula alertas de stock bajo, critico y exceso", async () => {
    const store = createLocalInventoryStore();
    const low = await store.saveProduct({ name: "Bajo", category: "medias", sku: "L1", unitPrice: 1000, minStock: 5, maxStock: 100 });
    const critical = await store.saveProduct({ name: "Critico", category: "medias", sku: "L2", unitPrice: 1000, minStock: 5, maxStock: 100 });
    const over = await store.saveProduct({ name: "Exceso", category: "medias", sku: "L3", unitPrice: 1000, minStock: 5, maxStock: 10 });
    await store.recordMovement({ productId: low.id, type: "entrada", quantity: 3, reason: "", supplier: "" });
    await store.recordMovement({ productId: over.id, type: "entrada", quantity: 20, reason: "", supplier: "" });

    const alerts = await store.getStockAlerts();

    expect(alerts.lowStock.map((p) => p.id)).toContain(low.id);
    expect(alerts.critical.map((p) => p.id)).toContain(critical.id);
    expect(alerts.overstocked.map((p) => p.id)).toContain(over.id);
  });

  it("lista movimientos filtrados por producto, mas recientes primero", async () => {
    const store = createLocalInventoryStore();
    const a = await store.saveProduct({ name: "A", category: "medias", sku: "A1", unitPrice: 1000, minStock: 1, maxStock: 10 });
    const b = await store.saveProduct({ name: "B", category: "medias", sku: "B1", unitPrice: 1000, minStock: 1, maxStock: 10 });
    await store.recordMovement({ productId: a.id, type: "entrada", quantity: 1, reason: "1", supplier: "" });
    await store.recordMovement({ productId: b.id, type: "entrada", quantity: 1, reason: "2", supplier: "" });
    await store.recordMovement({ productId: a.id, type: "entrada", quantity: 1, reason: "3", supplier: "" });

    const forA = await store.listMovements(a.id);

    expect(forA.map((m) => m.reason)).toEqual(["3", "1"]);
  });
});
