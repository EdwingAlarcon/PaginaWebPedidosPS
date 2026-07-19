import type { CellValue, ParsedBlock, SheetParseResult, SheetRow } from "./types";

const COL_REF = 0;
const COL_CLIENTE = 1;
const COL_DESCRIPCION = 2;
const COL_CANTIDAD = 3;
const COL_PRECIO_TOTAL = 6;

const SHARED_TOTALS_WARNING =
  "SUBTOTAL/ENVIO/TOTAL de esta sección de la hoja son compartidos entre varios clientes; no se pudo atribuir un monto individual a este pedido";

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
  let pendingGroup: ParsedBlock[] = [];
  let phase: "items" | "closed" = "items";
  let closingGroupIsShared = false;
  let blockIndex = 0;

  const pushUnexpectedCellsFrom = (row: SheetRow, rowNumber: number, fromColumn: number) => {
    for (let columnIndex = fromColumn; columnIndex < row.length; columnIndex++) {
      const value = row[columnIndex];
      if (value !== null && value !== undefined && String(value).trim() !== "") {
        unexpectedCells.push({ rowNumber, columnIndex, value });
      }
    }
  };

  const finalizeBlock = (block: ParsedBlock) => {
    if (block.items.length === 0) {
      block.errors.push("Bloque sin ningún ítem");
    } else if (!block.clientName) {
      block.errors.push("Nombre de cliente vacío");
    }
    blocks.push(block);
  };

  const flushOpenBlocks = () => {
    for (const block of pendingGroup) finalizeBlock(block);
    pendingGroup = [];
    if (current) {
      finalizeBlock(current);
      current = null;
    }
  };

  rows.forEach((row, index) => {
    const rowNumber = index + 1;

    if (isHeaderRow(row)) {
      flushOpenBlocks();
      current = newBlock(sheetName, blockIndex++, rowNumber);
      phase = "items";
      closingGroupIsShared = false;
      return;
    }

    if (!current) return;
    if (isRowEmpty(row)) return;

    const cantidadCell = normCell(row[COL_CANTIDAD]);
    const isMarkerWord = cantidadCell === "SUBTOTAL" || cantidadCell === "ENVIO" || cantidadCell === "TOTAL";

    if (phase === "items" && cantidadCell === "SUBTOTAL") {
      const group = [...pendingGroup, current];
      pendingGroup = [];
      closingGroupIsShared = group.length > 1;
      if (closingGroupIsShared) {
        for (const block of group) block.warnings.push(SHARED_TOTALS_WARNING);
      } else {
        group[0].subtotalDeclared = toNumber(row[COL_PRECIO_TOTAL]);
      }
      for (const block of group) {
        if (block !== current) finalizeBlock(block);
      }
      pushUnexpectedCellsFrom(row, rowNumber, COL_PRECIO_TOTAL + 1);
      current.endRow = rowNumber;
      phase = "closed";
      return;
    }

    if (phase === "closed" && cantidadCell === "ENVIO") {
      if (closingGroupIsShared) {
        // ya explicado por SHARED_TOTALS_WARNING; el monto no es atribuible.
      } else if (!current.shippingRowSeen) {
        current.shippingRowSeen = true;
        current.shippingDeclared = toNumber(row[COL_PRECIO_TOTAL]);
        pushUnexpectedCellsFrom(row, rowNumber, COL_PRECIO_TOTAL + 1);
      } else {
        pushUnexpectedCellsFrom(row, rowNumber, 0);
      }
      current.endRow = rowNumber;
      return;
    }

    if (phase === "closed" && cantidadCell === "TOTAL") {
      if (closingGroupIsShared) {
        // ya explicado por SHARED_TOTALS_WARNING; el monto no es atribuible.
      } else if (!current.totalRowSeen) {
        current.totalRowSeen = true;
        current.totalDeclared = toNumber(row[COL_PRECIO_TOTAL]);
        pushUnexpectedCellsFrom(row, rowNumber, COL_PRECIO_TOTAL + 1);
      } else {
        pushUnexpectedCellsFrom(row, rowNumber, 0);
      }
      current.endRow = rowNumber;
      return;
    }

    if (isMarkerWord) {
      // palabra marcador en un estado que no la espera (ej. SUBTOTAL repetido
      // estando ya cerrado, o ENVIO/TOTAL mientras el bloque sigue abierto).
      pushUnexpectedCellsFrom(row, rowNumber, 0);
      current.endRow = rowNumber;
      return;
    }

    // fila de ítem
    const ref = String(row[COL_REF] ?? "").trim();
    const clientName = String(row[COL_CLIENTE] ?? "").trim().toUpperCase();
    const description = String(row[COL_DESCRIPCION] ?? "").trim();
    const quantity = toNumber(row[COL_CANTIDAD]);
    const lineTotal = toNumber(row[COL_PRECIO_TOTAL]);

    if (clientName && current.clientName && clientName !== current.clientName) {
      // cambio de cliente sin header ni SUBTOTAL de por medio: cierra el
      // bloque actual (o lo difiere a un grupo pendiente si aún no tenía su
      // propio SUBTOTAL) y abre uno nuevo para este ítem.
      if (phase === "closed") {
        finalizeBlock(current);
      } else {
        pendingGroup.push(current);
      }
      current = newBlock(sheetName, blockIndex++, rowNumber);
      phase = "items";
      closingGroupIsShared = false;
    }

    if (!current.clientName && clientName) current.clientName = clientName;

    if (!ref || !description || quantity === null || lineTotal === null) {
      current.errors.push(`Ítem inválido en fila ${rowNumber}: falta ref/descripción/cantidad/precio total`);
    } else {
      current.items.push({ rowNumber, ref, clientName, description, quantity, lineTotal });
    }
    current.endRow = rowNumber;

    pushUnexpectedCellsFrom(row, rowNumber, COL_PRECIO_TOTAL + 1);
  });

  flushOpenBlocks();
  return { sheetName, blocks, unexpectedCells };
}
