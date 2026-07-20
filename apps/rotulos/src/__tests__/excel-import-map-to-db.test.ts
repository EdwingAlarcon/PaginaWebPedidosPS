import { describe, expect, it } from "vitest";
import { buildImportPlan, computeImportRowKey } from "@/lib/excel-import/map-to-db";
import type { SheetParseResult } from "@/lib/excel-import/types";

function makeSheetResult(overrides: Partial<SheetParseResult> = {}): SheetParseResult {
  return {
    sheetName: "SEPT 2025",
    unexpectedCells: [],
    blocks: [
      {
        sheetName: "SEPT 2025",
        blockIndex: 0,
        clientName: "ANDREA",
        startRow: 1,
        endRow: 5,
        items: [
          { rowNumber: 2, ref: "z1335", clientName: "ANDREA", description: "set 3 aretes", quantity: 1, lineTotal: 13500 },
          { rowNumber: 3, ref: "p778", clientName: "ANDREA", description: "pulsera perlas", quantity: 2, lineTotal: 16000 },
        ],
        subtotalDeclared: 29500,
        shippingDeclared: 0,
        totalDeclared: 29500,
        shippingRowSeen: false,
        totalRowSeen: true,
        errors: [],
        warnings: [],
      },
    ],
    ...overrides,
  };
}

describe("computeImportRowKey", () => {
  it("es determinística para los mismos datos de entrada", () => {
    const a = computeImportRowKey("SEPT 2025", "ANDREA", 0, 29500);
    const b = computeImportRowKey("SEPT 2025", "ANDREA", 0, 29500);
    expect(a).toBe(b);
  });

  it("cambia si cambia cualquier componente", () => {
    const base = computeImportRowKey("SEPT 2025", "ANDREA", 0, 29500);
    expect(computeImportRowKey("OCT 2025", "ANDREA", 0, 29500)).not.toBe(base);
    expect(computeImportRowKey("SEPT 2025", "ZAIDA", 0, 29500)).not.toBe(base);
    expect(computeImportRowKey("SEPT 2025", "ANDREA", 1, 29500)).not.toBe(base);
    expect(computeImportRowKey("SEPT 2025", "ANDREA", 0, 1)).not.toBe(base);
  });
});

describe("buildImportPlan", () => {
  it("mapea un bloque válido a cliente + pedido + ítems, normalizando a mayúscula", () => {
    const plan = buildImportPlan([makeSheetResult()], "run-1");

    expect(plan.customers).toEqual([{ fullName: "ANDREA" }]);
    expect(plan.orders).toHaveLength(1);
    const [order] = plan.orders;
    expect(order.customerFullName).toBe("ANDREA");
    expect(order.orderDate).toBe("2025-09-01");
    expect(order.notes).toBe("HOJA: SEPT 2025");
    expect(order.subtotal).toBe(29500);
    expect(order.shippingCost).toBe(0);
    expect(order.total).toBe(29500);
    expect(order.items).toEqual([
      { productCode: "Z1335", productName: "SET 3 ARETES", quantity: 1, unitPrice: 13500, total: 13500 },
      { productCode: "P778", productName: "PULSERA PERLAS", quantity: 2, unitPrice: 8000, total: 16000 },
    ]);
    expect(plan.skippedBlocks).toEqual([]);
  });

  it("excluye bloques con errores y los reporta en skippedBlocks", () => {
    const sheet = makeSheetResult();
    sheet.blocks[0].errors = ["Bloque sin ningún ítem"];

    const plan = buildImportPlan([sheet], "run-1");

    expect(plan.orders).toEqual([]);
    expect(plan.customers).toEqual([]);
    expect(plan.skippedBlocks).toEqual([
      { sheetName: "SEPT 2025", blockIndex: 0, clientName: "ANDREA", errors: ["Bloque sin ningún ítem"] },
    ]);
  });

  it("deduplica clientes con el mismo nombre entre varios bloques", () => {
    const sheet1 = makeSheetResult();
    const sheet2 = makeSheetResult({ sheetName: "OCT 2025" });
    sheet2.blocks[0].sheetName = "OCT 2025";

    const plan = buildImportPlan([sheet1, sheet2], "run-1");

    expect(plan.customers).toEqual([{ fullName: "ANDREA" }]);
    expect(plan.orders).toHaveLength(2);
  });
});
