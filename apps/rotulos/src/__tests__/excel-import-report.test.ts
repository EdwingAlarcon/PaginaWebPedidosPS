import { describe, expect, it } from "vitest";
import { buildReportText } from "@/lib/excel-import/report";
import { buildImportPlan } from "@/lib/excel-import/map-to-db";
import type { SheetParseResult } from "@/lib/excel-import/types";

const sheet: SheetParseResult = {
  sheetName: "SEPT 2025",
  unexpectedCells: [{ rowNumber: 4, columnIndex: 7, value: 100000 }],
  blocks: [
    {
      sheetName: "SEPT 2025",
      blockIndex: 0,
      clientName: "ANDREA",
      startRow: 1,
      endRow: 5,
      items: [{ rowNumber: 2, ref: "Z1335", clientName: "ANDREA", description: "SET 3 ARETES", quantity: 1, lineTotal: 13500 }],
      subtotalDeclared: 13500,
      shippingDeclared: 0,
      totalDeclared: 13500,
      shippingRowSeen: false,
      totalRowSeen: false,
      errors: [],
      warnings: ["SUBTOTAL no encontrado en la hoja, se usó la suma de ítems ($13500)"],
    },
    {
      sheetName: "SEPT 2025",
      blockIndex: 1,
      clientName: "",
      startRow: 6,
      endRow: 6,
      items: [],
      subtotalDeclared: 0,
      shippingDeclared: 0,
      totalDeclared: 0,
      shippingRowSeen: false,
      totalRowSeen: false,
      errors: ["Bloque sin ningún ítem"],
      warnings: [],
    },
  ],
};

describe("buildReportText", () => {
  it("incluye hoja, bloques, advertencias, errores y resumen global", () => {
    const plan = buildImportPlan([sheet], "run-1");
    const text = buildReportText([sheet], plan);

    expect(text).toContain("HOJA: SEPT 2025");
    expect(text).toContain("Bloques detectados: 2");
    expect(text).toContain("ADVERTENCIA Bloque ANDREA (fila 1): SUBTOTAL no encontrado");
    expect(text).toContain("ERROR Bloque SIN NOMBRE (fila 6): Bloque sin ningún ítem");
    expect(text).toContain("ERROR Columna inesperada con dato en fila 4 (columna 8)");
    expect(text).toContain("RESUMEN GLOBAL");
    expect(text).toContain("Pedidos a crear: 1");
    expect(text).toContain("Errores (bloques excluidos): 1");
    expect(text).toContain("Total $ a importar: $13500");
  });
});
