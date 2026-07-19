// apps/rotulos/scripts/import-excel.ts
import path from "node:path";
import crypto from "node:crypto";
import { writeFile } from "node:fs/promises";
import ExcelJS from "exceljs";
import { createClient } from "@supabase/supabase-js";
import { parseSheetRows } from "../src/lib/excel-import/parser";
import { applyTotalValidation } from "../src/lib/excel-import/validate";
import { buildImportPlan } from "../src/lib/excel-import/map-to-db";
import { buildReportText } from "../src/lib/excel-import/report";
import type { CellValue, SheetParseResult } from "../src/lib/excel-import/types";
import type { ImportPlan } from "../src/lib/excel-import/map-to-db";

// created_by no tiene FK a auth.users; el service role no trae auth.uid(),
// así que hay que fijarlo a mano para satisfacer el not null de orders.created_by.
const IMPORT_SYSTEM_USER_ID = "00000000-0000-0000-0000-000000000000";
const EXISTING_KEYS_PAGE_SIZE = 1000;

async function commitImportPlan(plan: ImportPlan): Promise<void> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    console.error("Faltan NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY en el entorno.");
    process.exit(1);
  }
  const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

  const existingKeys = new Set<string>();
  for (let from = 0; ; from += EXISTING_KEYS_PAGE_SIZE) {
    const { data: existingRows, error: existingError } = await supabase
      .from("orders")
      .select("import_row_key")
      .eq("source", "excel_import")
      .range(from, from + EXISTING_KEYS_PAGE_SIZE - 1);
    if (existingError) throw existingError;
    for (const row of existingRows ?? []) existingKeys.add(row.import_row_key as string);
    if (!existingRows || existingRows.length < EXISTING_KEYS_PAGE_SIZE) break;
  }

  const customerIdByName = new Map<string, string>();
  let createdOrders = 0;
  let skippedExisting = 0;

  for (const order of plan.orders) {
    if (existingKeys.has(order.importRowKey)) {
      skippedExisting++;
      continue;
    }

    let customerId = customerIdByName.get(order.customerFullName);
    if (!customerId) {
      const { data: existingCustomer, error: lookupError } = await supabase
        .from("customers")
        .select("id")
        .eq("full_name", order.customerFullName)
        .eq("phone", "")
        .maybeSingle();
      if (lookupError) throw lookupError;

      if (existingCustomer) {
        customerId = existingCustomer.id as string;
      } else {
        const { data: newCustomer, error: insertError } = await supabase
          .from("customers")
          .insert({ full_name: order.customerFullName, phone: "" })
          .select("id")
          .single();
        if (insertError) throw insertError;
        customerId = newCustomer.id as string;
      }
      customerIdByName.set(order.customerFullName, customerId);
    }

    const { data: newOrder, error: orderError } = await supabase
      .from("orders")
      .insert({
        customer_id: customerId,
        customer_snapshot: { fullName: order.customerFullName },
        order_date: order.orderDate,
        status: "completed",
        notes: order.notes,
        subtotal: order.subtotal,
        shipping_cost: order.shippingCost,
        total: order.total,
        source: "excel_import",
        import_batch_id: plan.runId,
        import_row_key: order.importRowKey,
        created_by: IMPORT_SYSTEM_USER_ID,
      })
      .select("id")
      .single();
    if (orderError) throw orderError;

    const { error: itemsError } = await supabase.from("order_items").insert(
      order.items.map((item) => ({
        order_id: newOrder.id,
        product_code: item.productCode,
        product_name: item.productName,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        total: item.total,
      })),
    );
    if (itemsError) {
      // evita dejar un pedido huérfano sin ítems que luego bloquee reintentos
      // (import_row_key ya quedaría "existente" para siempre si no se borra).
      await supabase.from("orders").delete().eq("id", newOrder.id);
      throw itemsError;
    }

    createdOrders++;
  }

  console.log(`\nImportación completada. Pedidos creados: ${createdOrders}. Ya existentes (omitidos): ${skippedExisting}.`);
}

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

  await commitImportPlan(plan);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
