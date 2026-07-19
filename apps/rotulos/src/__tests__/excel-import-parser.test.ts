import { describe, expect, it } from "vitest";
import { parseSheetRows } from "@/lib/excel-import/parser";
import type { SheetRow } from "@/lib/excel-import/types";

const HEADER: SheetRow = ["REF", "CLIENTE", "DESCRIPCION", "CANTIDAD", "TALLA", "PRECIO UNITARIO", "PRECIO TOTAL"];

describe("parseSheetRows", () => {
  it("parsea un bloque único con subtotal, ignorando columna extra pegada al último ítem", () => {
    const rows: SheetRow[] = [
      HEADER,
      ["Z1335", "ANDREA", "SET 3 ARETES BAILIN Y PERLA", 1, null, null, 13500],
      ["P778", "ANDREA", "PULSERA PERLAS Y DIJE", 1, null, null, 16500],
      ["ACC448", "ANDREA", "DECORADOR DE CABLES", 2, null, null, 5000, 100000],
      [null, null, null, "SUBTOTAL", null, null, 35000],
    ];

    const result = parseSheetRows("SEPT 2025", rows);

    expect(result.blocks).toHaveLength(1);
    const [block] = result.blocks;
    expect(block.clientName).toBe("ANDREA");
    expect(block.items).toHaveLength(3);
    expect(block.subtotalDeclared).toBe(35000);
    expect(block.errors).toEqual([]);
    expect(result.unexpectedCells).toEqual([{ rowNumber: 4, columnIndex: 7, value: 100000 }]);
  });

  it("parsea múltiples bloques en la misma hoja, con ENVIO vacío en uno de ellos", () => {
    const rows: SheetRow[] = [
      HEADER,
      ["J2334", "ZAIDA", "JUEGO HONGUITO Y CORAZON", 1, null, null, 18500],
      [null, null, null, "SUBTOTAL", null, null, 18500],
      [null, null, null, "ENVIO", null, null, 8500],
      [null, null, null, "TOTAL", null, null, 27000],
      HEADER,
      ["Z4133", "ANDREA", "CANDONGA BALINES", 1, null, null, 8500],
      [null, null, null, "SUBTOTAL", null, null, 8500],
      [null, null, null, "ENVIO", null, null, null],
      [null, null, null, "TOTAL", null, null, 8500],
    ];

    const result = parseSheetRows("JUNIO 2026", rows);

    expect(result.blocks).toHaveLength(2);
    expect(result.blocks[0].clientName).toBe("ZAIDA");
    expect(result.blocks[0].shippingDeclared).toBe(8500);
    expect(result.blocks[0].totalDeclared).toBe(27000);
    expect(result.blocks[1].clientName).toBe("ANDREA");
    expect(result.blocks[1].shippingRowSeen).toBe(true);
    expect(result.blocks[1].shippingDeclared).toBeNull();
  });

  it("marca error si el nombre de cliente cambia dentro del mismo bloque", () => {
    const rows: SheetRow[] = [
      HEADER,
      ["Z1335", "ANDREA", "SET 3 ARETES", 1, null, null, 13500],
      ["P778", "OTRA", "PULSERA PERLAS", 1, null, null, 16500],
      [null, null, null, "SUBTOTAL", null, null, 30000],
    ];

    const result = parseSheetRows("SEPT 2025", rows);

    expect(result.blocks[0].errors.some((e) => e.includes("inconsistente"))).toBe(true);
  });

  it("marca error 'sin ningún ítem' si el bloque no tiene ítems", () => {
    const rows: SheetRow[] = [HEADER, [null, null, null, "SUBTOTAL", null, null, 0]];

    const result = parseSheetRows("SEPT 2025", rows);

    expect(result.blocks[0].errors).toEqual(["Bloque sin ningún ítem"]);
  });

  it("marca error de ítem inválido cuando falta cantidad o precio total", () => {
    const rows: SheetRow[] = [
      HEADER,
      ["Z1335", "ANDREA", "SET 3 ARETES", null, null, null, null],
      [null, null, null, "SUBTOTAL", null, null, 0],
    ];

    const result = parseSheetRows("SEPT 2025", rows);

    expect(result.blocks[0].items).toHaveLength(0);
    expect(result.blocks[0].errors.some((e) => e.includes("Ítem inválido"))).toBe(true);
  });

  it("ignora filas completamente vacías sin cerrar el bloque", () => {
    const rows: SheetRow[] = [
      HEADER,
      ["Z1335", "ANDREA", "SET 3 ARETES", 1, null, null, 13500],
      [null, null, null, null, null, null, null],
      ["P778", "ANDREA", "PULSERA PERLAS", 1, null, null, 16500],
      [null, null, null, "SUBTOTAL", null, null, 30000],
    ];

    const result = parseSheetRows("SEPT 2025", rows);

    expect(result.blocks).toHaveLength(1);
    expect(result.blocks[0].items).toHaveLength(2);
  });

  it("un nuevo header cierra el bloque anterior aunque no haya SUBTOTAL", () => {
    const rows: SheetRow[] = [
      HEADER,
      ["Z1335", "ANDREA", "SET 3 ARETES", 1, null, null, 13500],
      HEADER,
      ["J1652", "CARO", "JUEGO GRANDE CORAZON", 1, null, null, 29000],
      [null, null, null, "SUBTOTAL", null, null, 29000],
    ];

    const result = parseSheetRows("JUNIO 2026", rows);

    expect(result.blocks).toHaveLength(2);
    expect(result.blocks[0].clientName).toBe("ANDREA");
    expect(result.blocks[0].subtotalDeclared).toBeNull();
    expect(result.blocks[1].clientName).toBe("CARO");
  });
});
