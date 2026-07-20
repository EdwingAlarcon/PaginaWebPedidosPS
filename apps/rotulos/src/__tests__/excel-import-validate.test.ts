import { describe, expect, it } from "vitest";
import { applyTotalValidation } from "@/lib/excel-import/validate";
import type { ParsedBlock } from "@/lib/excel-import/types";

function makeBlock(overrides: Partial<ParsedBlock> = {}): ParsedBlock {
  return {
    sheetName: "JUNIO 2026",
    blockIndex: 0,
    clientName: "ZAIDA",
    startRow: 1,
    endRow: 5,
    items: [
      { rowNumber: 2, ref: "J2334", clientName: "ZAIDA", description: "JUEGO HONGUITO", quantity: 1, lineTotal: 18500 },
      { rowNumber: 3, ref: "Z3908", clientName: "ZAIDA", description: "ARETE VAN CLEEF", quantity: 1, lineTotal: 9000 },
    ],
    subtotalDeclared: 27500,
    shippingDeclared: 8500,
    totalDeclared: 36000,
    shippingRowSeen: true,
    totalRowSeen: true,
    errors: [],
    warnings: [],
    ...overrides,
  };
}

describe("applyTotalValidation", () => {
  it("no agrega advertencias cuando todo cuadra", () => {
    const block = makeBlock();
    applyTotalValidation(block);
    expect(block.warnings).toEqual([]);
  });

  it("advierte si el SUBTOTAL declarado no coincide con la suma de ítems", () => {
    const block = makeBlock({ subtotalDeclared: 99999, totalDeclared: 108499 });
    applyTotalValidation(block);
    expect(block.warnings.some((w) => w.includes("SUBTOTAL declarado"))).toBe(true);
  });

  it("usa la suma de ítems y advierte si no hay fila SUBTOTAL", () => {
    const block = makeBlock({ subtotalDeclared: null, totalDeclared: null, shippingDeclared: null, shippingRowSeen: false, totalRowSeen: false });
    applyTotalValidation(block);
    expect(block.subtotalDeclared).toBe(27500);
    expect(block.warnings.some((w) => w.includes("SUBTOTAL no encontrado"))).toBe(true);
  });

  it("advierte y asume $0 si la fila ENVIO existe pero está vacía", () => {
    const block = makeBlock({ shippingRowSeen: true, shippingDeclared: null, totalDeclared: 27500 });
    applyTotalValidation(block);
    expect(block.shippingDeclared).toBe(0);
    expect(block.warnings.some((w) => w.includes("ENVIO vacío"))).toBe(true);
  });

  it("no advierte por ENVIO si la fila directamente no existe en el bloque", () => {
    const block = makeBlock({ shippingRowSeen: false, shippingDeclared: null, totalDeclared: 27500 });
    applyTotalValidation(block);
    expect(block.shippingDeclared).toBe(0);
    expect(block.warnings.some((w) => w.includes("ENVIO"))).toBe(false);
  });

  it("advierte si TOTAL declarado no coincide con SUBTOTAL + ENVIO", () => {
    const block = makeBlock({ totalDeclared: 999999 });
    applyTotalValidation(block);
    expect(block.warnings.some((w) => w.includes("TOTAL declarado"))).toBe(true);
  });

  it("calcula TOTAL si la fila TOTAL no existe", () => {
    const block = makeBlock({ totalDeclared: null, totalRowSeen: false });
    applyTotalValidation(block);
    expect(block.totalDeclared).toBe(36000);
  });
});
