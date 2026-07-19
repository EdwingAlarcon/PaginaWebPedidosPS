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

  it("detecta un bloque nuevo por cambio de cliente sin header repetido, cuando cada uno tiene su propio SUBTOTAL (formato OCT 2025)", () => {
    const rows: SheetRow[] = [
      HEADER,
      ["Z2903", "ANDREA", "TOPO CORAZON ANIMAL PRINT", 1, null, null, 16000],
      ["J1415-2", "ANDREA", "ANILLO PERLA Y CORAZON", 1, null, null, 16000],
      [null, null, null, "SUBTOTAL", null, null, 32000],
      ["Z1464", "ZAIDA", "EARCUFF DECORADO 3 COLORES", 1, null, null, 10000],
      [null, null, null, "SUBTOTAL", null, null, 10000],
    ];

    const result = parseSheetRows("OCT 2025", rows);

    expect(result.blocks).toHaveLength(2);
    expect(result.blocks[0].clientName).toBe("ANDREA");
    expect(result.blocks[0].items).toHaveLength(2);
    expect(result.blocks[0].subtotalDeclared).toBe(32000);
    expect(result.blocks[0].warnings).toEqual([]);
    expect(result.blocks[1].clientName).toBe("ZAIDA");
    expect(result.blocks[1].items).toHaveLength(1);
    expect(result.blocks[1].subtotalDeclared).toBe(10000);
    expect(result.blocks[1].warnings).toEqual([]);
  });

  it("divide por cliente y marca SUBTOTAL/ENVIO/TOTAL como no atribuibles cuando varios clientes comparten un cierre (formato FEB 2026)", () => {
    const rows: SheetRow[] = [
      HEADER,
      ["ACC1624", "ANDREA", "KIT DIADEMA", 1, null, null, 20000],
      ["A744", "ZAIDA", "ANILLO CORAZON ZIRCONES", 1, null, null, 13000],
      ["A227", "ZAIDA", "ANILLO PIEDRA VERDE", 1, null, null, 13000],
      ["ACC1740", "CAROLINA", "AUDIFONOS DEPORTIVOS", 1, null, null, 10000],
      [null, null, null, "SUBTOTAL", null, null, 56000],
      [null, null, null, "ENVIO", null, null, 8500],
      [null, null, null, "TOTAL", null, null, 64500],
    ];

    const result = parseSheetRows("FEB 2026", rows);

    expect(result.blocks).toHaveLength(3);
    expect(result.blocks.map((b) => b.clientName)).toEqual(["ANDREA", "ZAIDA", "CAROLINA"]);
    for (const block of result.blocks) {
      expect(block.subtotalDeclared).toBeNull();
      expect(block.shippingDeclared).toBeNull();
      expect(block.totalDeclared).toBeNull();
      expect(block.warnings).toContain(
        "SUBTOTAL/ENVIO/TOTAL de esta sección de la hoja son compartidos entre varios clientes; no se pudo atribuir un monto individual a este pedido",
      );
      expect(block.errors).toEqual([]);
    }
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

  it("registra unexpectedCells en columna extra de una fila SUBTOTAL", () => {
    const rows: SheetRow[] = [
      HEADER,
      ["Z1335", "ANDREA", "SET 3 ARETES", 1, null, null, 13500],
      [null, null, null, "SUBTOTAL", null, null, 13500, "DATO SUELTO"],
    ];

    const result = parseSheetRows("SEPT 2025", rows);

    expect(result.unexpectedCells).toEqual([{ rowNumber: 3, columnIndex: 7, value: "DATO SUELTO" }]);
  });

  it("trata una fila SUBTOTAL duplicada tras cerrar el bloque como dato inesperado, sin sobreescribir el valor ya declarado", () => {
    const rows: SheetRow[] = [
      HEADER,
      ["Z1335", "ANDREA", "SET 3 ARETES", 1, null, null, 13500],
      [null, null, null, "SUBTOTAL", null, null, 13500],
      [null, null, null, "SUBTOTAL", null, null, 99999],
    ];

    const result = parseSheetRows("SEPT 2025", rows);

    expect(result.blocks[0].subtotalDeclared).toBe(13500);
    expect(result.unexpectedCells).toEqual([{ rowNumber: 4, columnIndex: 3, value: "SUBTOTAL" }, { rowNumber: 4, columnIndex: 6, value: 99999 }]);
  });
});
