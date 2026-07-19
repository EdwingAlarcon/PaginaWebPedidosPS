import type { CellValue, ParsedBlock, SheetParseResult, SheetRow } from "./types";

const COL_REF = 0;
const COL_CLIENTE = 1;
const COL_DESCRIPCION = 2;
const COL_CANTIDAD = 3;
const COL_PRECIO_TOTAL = 6;

function normCell(value: CellValue): string {
  return (value === null || value === undefined ? "" : String(value)).trim().toUpperCase();
}

function isRowEmpty(row: SheetRow): boolean {
  return row.every((cell) => cell === null || cell === undefined || String(cell).trim() === "");
}

function isHeaderRow(row: SheetRow): boolean {
  return (
    normCell(row[COL_REF]) === "REF" &&
    normCell(row[COL_CLIENTE]) === "CLIENTE" &&
    normCell(row[COL_DESCRIPCION]) === "DESCRIPCION" &&
    normCell(row[COL_CANTIDAD]) === "CANTIDAD"
  );
}

function toNumber(value: CellValue): number | null {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim() !== "" && !Number.isNaN(Number(value.trim()))) {
    return Number(value.trim());
  }
  return null;
}

function newBlock(sheetName: string, blockIndex: number, rowNumber: number): ParsedBlock {
  return {
    sheetName,
    blockIndex,
    clientName: "",
    startRow: rowNumber,
    endRow: rowNumber,
    items: [],
    subtotalDeclared: null,
    shippingDeclared: null,
    totalDeclared: null,
    shippingRowSeen: false,
    totalRowSeen: false,
    errors: [],
    warnings: [],
  };
}

export function parseSheetRows(sheetName: string, rows: SheetRow[]): SheetParseResult {
  const blocks: ParsedBlock[] = [];
  const unexpectedCells: SheetParseResult["unexpectedCells"] = [];
  let current: ParsedBlock | null = null;
  let phase: "items" | "closed" = "items";
  let blockIndex = 0;

  const closeCurrent = () => {
    if (!current) return;
    if (current.items.length === 0) {
      current.errors.push("Bloque sin ningún ítem");
    } else if (!current.clientName) {
      current.errors.push("Nombre de cliente vacío");
    }
    blocks.push(current);
    current = null;
  };

  const pushUnexpectedCellsFrom = (row: SheetRow, rowNumber: number, fromColumn: number) => {
    for (let columnIndex = fromColumn; columnIndex < row.length; columnIndex++) {
      const value = row[columnIndex];
      if (value !== null && value !== undefined && String(value).trim() !== "") {
        unexpectedCells.push({ rowNumber, columnIndex, value });
      }
    }
  };

  rows.forEach((row, index) => {
    const rowNumber = index + 1;

    if (isHeaderRow(row)) {
      closeCurrent();
      current = newBlock(sheetName, blockIndex++, rowNumber);
      phase = "items";
      return;
    }

    if (!current) return;
    if (isRowEmpty(row)) return;

    const cantidadCell = normCell(row[COL_CANTIDAD]);

    if (cantidadCell === "SUBTOTAL") {
      if (phase === "closed") {
        // El bloque ya tiene un SUBTOTAL declarado: esta fila es un dato
        // repetido/inesperado, no debe sobreescribir el valor ya guardado.
        pushUnexpectedCellsFrom(row, rowNumber, 0);
        return;
      }
      current.subtotalDeclared = toNumber(row[COL_PRECIO_TOTAL]);
      current.endRow = rowNumber;
      phase = "closed";
      pushUnexpectedCellsFrom(row, rowNumber, COL_PRECIO_TOTAL + 1);
      return;
    }
    if (cantidadCell === "ENVIO") {
      if (current.shippingRowSeen) {
        pushUnexpectedCellsFrom(row, rowNumber, 0);
        return;
      }
      current.shippingRowSeen = true;
      current.shippingDeclared = toNumber(row[COL_PRECIO_TOTAL]);
      current.endRow = rowNumber;
      pushUnexpectedCellsFrom(row, rowNumber, COL_PRECIO_TOTAL + 1);
      return;
    }
    if (cantidadCell === "TOTAL") {
      if (current.totalRowSeen) {
        pushUnexpectedCellsFrom(row, rowNumber, 0);
        return;
      }
      current.totalRowSeen = true;
      current.totalDeclared = toNumber(row[COL_PRECIO_TOTAL]);
      current.endRow = rowNumber;
      pushUnexpectedCellsFrom(row, rowNumber, COL_PRECIO_TOTAL + 1);
      return;
    }

    if (phase === "closed") {
      pushUnexpectedCellsFrom(row, rowNumber, 0);
      return;
    }

    const ref = String(row[COL_REF] ?? "").trim();
    const clientName = String(row[COL_CLIENTE] ?? "").trim().toUpperCase();
    const description = String(row[COL_DESCRIPCION] ?? "").trim();
    const quantity = toNumber(row[COL_CANTIDAD]);
    const lineTotal = toNumber(row[COL_PRECIO_TOTAL]);

    if (!current.clientName && clientName) current.clientName = clientName;
    if (clientName && clientName !== current.clientName) {
      current.errors.push(`Nombre de cliente inconsistente en fila ${rowNumber}: "${clientName}" vs "${current.clientName}"`);
    }

    if (!ref || !description || quantity === null || lineTotal === null) {
      current.errors.push(`Ítem inválido en fila ${rowNumber}: falta ref/descripción/cantidad/precio total`);
    } else {
      current.items.push({ rowNumber, ref, clientName, description, quantity, lineTotal });
    }
    current.endRow = rowNumber;

    pushUnexpectedCellsFrom(row, rowNumber, COL_PRECIO_TOTAL + 1);
  });

  closeCurrent();
  return { sheetName, blocks, unexpectedCells };
}
