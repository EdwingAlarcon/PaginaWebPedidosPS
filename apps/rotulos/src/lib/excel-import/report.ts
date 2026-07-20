import type { SheetParseResult } from "./types";
import type { ImportPlan } from "./map-to-db";

export function buildReportText(sheetResults: SheetParseResult[], plan: ImportPlan): string {
  const lines: string[] = [];
  let totalWarnings = 0;
  let totalErrors = 0;

  for (const sheet of sheetResults) {
    lines.push(`HOJA: ${sheet.sheetName}`);
    lines.push(`  Bloques detectados: ${sheet.blocks.length} (${sheet.blocks.map((b) => b.clientName || "SIN NOMBRE").join(", ")})`);

    const validBlocks = sheet.blocks.filter((b) => b.errors.length === 0);
    lines.push(`  Clientes nuevos a crear: ${new Set(validBlocks.map((b) => b.clientName)).size}`);

    const sheetItems = sheet.blocks.reduce((sum, b) => sum + b.items.length, 0);
    lines.push(`  Ítems detectados: ${sheetItems}`);

    for (const block of sheet.blocks) {
      const label = block.clientName || "SIN NOMBRE";
      for (const warning of block.warnings) {
        lines.push(`  ADVERTENCIA Bloque ${label} (fila ${block.startRow}): ${warning}`);
        totalWarnings++;
      }
      for (const error of block.errors) {
        lines.push(`  ERROR Bloque ${label} (fila ${block.startRow}): ${error}`);
        totalErrors++;
      }
    }

    for (const cell of sheet.unexpectedCells) {
      lines.push(`  ERROR Columna inesperada con dato en fila ${cell.rowNumber} (columna ${cell.columnIndex + 1}) — ignorada, revisar manualmente`);
      totalErrors++;
    }

    lines.push("");
  }

  const totalAmount = plan.orders.reduce((sum, order) => sum + order.total, 0);
  const totalItems = plan.orders.reduce((sum, order) => sum + order.items.length, 0);

  lines.push("RESUMEN GLOBAL");
  lines.push(`  Hojas leídas: ${sheetResults.length}`);
  lines.push(`  Clientes nuevos: ${plan.customers.length}`);
  lines.push(`  Pedidos a crear: ${plan.orders.length}`);
  lines.push(`  Ítems a crear: ${totalItems}`);
  lines.push(`  Advertencias: ${totalWarnings}`);
  lines.push(`  Errores (bloques excluidos): ${plan.skippedBlocks.length}`);
  lines.push(`  Total $ a importar: $${totalAmount}`);

  return lines.join("\n");
}
