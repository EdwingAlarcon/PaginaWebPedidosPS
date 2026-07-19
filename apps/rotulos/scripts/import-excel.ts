// apps/rotulos/scripts/import-excel.ts
import path from "node:path";
import crypto from "node:crypto";
import { writeFile } from "node:fs/promises";
import ExcelJS from "exceljs";
import { parseSheetRows } from "../src/lib/excel-import/parser";
import { applyTotalValidation } from "../src/lib/excel-import/validate";
import { buildImportPlan } from "../src/lib/excel-import/map-to-db";
import { buildReportText } from "../src/lib/excel-import/report";
import type { CellValue, SheetParseResult } from "../src/lib/excel-import/types";

async function readWorkbookRows(filePath: string): Promise<{ sheetName: string; rows: CellValue[][] }[]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  return workbook.worksheets.map((worksheet) => {
    const rows: CellValue[][] = [];
    worksheet.eachRow({ includeEmpty: true }, (row) => {
      const values: CellValue[] = [];
      for (let col = 1; col <= worksheet.columnCount; col++) {
        const raw = row.getCell(col).value;
        const value =
          raw !== null && typeof raw === "object" && "result" in (raw as unknown as Record<string, unknown>)
            ? ((raw as unknown as { result: CellValue }).result ?? null)
            : ((raw as CellValue) ?? null);
        values.push(value);
      }
      rows.push(values);
    });
    return { sheetName: worksheet.name, rows };
  });
}

async function main() {
  const args = process.argv.slice(2);
  const filePath = args.find((arg) => !arg.startsWith("--"));
  const commit = args.includes("--commit");

  if (!filePath) {
    console.error("Uso: npm run import:excel -- <ruta-al-excel.xlsx> [--commit]");
    process.exit(1);
  }

  const sheets = await readWorkbookRows(path.resolve(filePath));
  const sheetResults: SheetParseResult[] = sheets.map(({ sheetName, rows }) => parseSheetRows(sheetName, rows));
  sheetResults.forEach((sheet) => sheet.blocks.forEach(applyTotalValidation));

  const runId = crypto.randomUUID();
  const plan = buildImportPlan(sheetResults, runId);

  console.log(buildReportText(sheetResults, plan));

  const previewPath = path.resolve(__dirname, ".import-preview.json");
  await writeFile(previewPath, JSON.stringify({ runId, sheetResults, plan }, null, 2), "utf-8");
  console.log(`\nPreview escrito en ${previewPath}`);

  if (!commit) {
    console.log("\nModo preview (sin --commit). No se escribió nada en Supabase.");
    return;
  }

  console.log("\n--commit todavía no está implementado en esta versión del script.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
