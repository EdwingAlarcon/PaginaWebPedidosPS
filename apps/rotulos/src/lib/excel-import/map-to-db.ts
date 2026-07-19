import { createHash } from "node:crypto";
import { parseSheetPeriod } from "./period";
import type { ParsedBlock, SheetParseResult } from "./types";

export interface ImportCustomer {
  fullName: string;
}

export interface ImportOrderItem {
  productCode: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface ImportOrder {
  importRowKey: string;
  customerFullName: string;
  orderDate: string;
  notes: string;
  subtotal: number;
  shippingCost: number;
  total: number;
  items: ImportOrderItem[];
  sheetName: string;
  blockIndex: number;
}

export interface SkippedBlock {
  sheetName: string;
  blockIndex: number;
  clientName: string;
  errors: string[];
}

export interface ImportPlan {
  runId: string;
  customers: ImportCustomer[];
  orders: ImportOrder[];
  skippedBlocks: SkippedBlock[];
}

export function computeImportRowKey(sheetName: string, clientName: string, blockIndex: number, subtotal: number): string {
  const raw = `${sheetName}|${clientName}|${blockIndex}|${subtotal}`;
  return createHash("sha256").update(raw).digest("hex");
}

function blockToOrder(block: ParsedBlock): ImportOrder {
  const subtotal = block.subtotalDeclared ?? 0;
  const shippingCost = block.shippingDeclared ?? 0;
  const total = block.totalDeclared ?? subtotal + shippingCost;

  return {
    importRowKey: computeImportRowKey(block.sheetName, block.clientName, block.blockIndex, subtotal),
    customerFullName: block.clientName,
    orderDate: parseSheetPeriod(block.sheetName),
    notes: `HOJA: ${block.sheetName}`,
    subtotal,
    shippingCost,
    total,
    items: block.items.map((item) => ({
      productCode: item.ref.trim().toUpperCase(),
      productName: item.description.trim().toUpperCase(),
      quantity: item.quantity,
      unitPrice: item.lineTotal / item.quantity,
      total: item.lineTotal,
    })),
    sheetName: block.sheetName,
    blockIndex: block.blockIndex,
  };
}

export function buildImportPlan(sheetResults: SheetParseResult[], runId: string): ImportPlan {
  const customerNames = new Set<string>();
  const orders: ImportOrder[] = [];
  const skippedBlocks: SkippedBlock[] = [];

  for (const sheet of sheetResults) {
    for (const block of sheet.blocks) {
      if (block.errors.length > 0) {
        skippedBlocks.push({
          sheetName: block.sheetName,
          blockIndex: block.blockIndex,
          clientName: block.clientName,
          errors: block.errors,
        });
        continue;
      }
      customerNames.add(block.clientName);
      orders.push(blockToOrder(block));
    }
  }

  return {
    runId,
    customers: Array.from(customerNames).map((fullName) => ({ fullName })),
    orders,
    skippedBlocks,
  };
}
