export type CellValue = string | number | null;
export type SheetRow = CellValue[];

export interface ParsedItem {
  rowNumber: number;
  ref: string;
  clientName: string;
  description: string;
  quantity: number;
  lineTotal: number;
}

export interface UnexpectedCell {
  rowNumber: number;
  columnIndex: number;
  value: CellValue;
}

export interface ParsedBlock {
  sheetName: string;
  blockIndex: number;
  clientName: string;
  startRow: number;
  endRow: number;
  items: ParsedItem[];
  subtotalDeclared: number | null;
  shippingDeclared: number | null;
  totalDeclared: number | null;
  shippingRowSeen: boolean;
  totalRowSeen: boolean;
  errors: string[];
  warnings: string[];
}

export interface SheetParseResult {
  sheetName: string;
  blocks: ParsedBlock[];
  unexpectedCells: UnexpectedCell[];
}
