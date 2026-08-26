// apps/rotulos/scripts/import-perfumes-catalog.ts
//
// Importa a product_codes el catalogo de perfumes transcrito a mano en
// scripts/data/joshua-perfumes-2024.ts (ver ese archivo para el porque de
// la transcripcion manual en vez de un parser de PDF).
//
// Uso:
//   npx tsx scripts/import-perfumes-catalog.ts            (preview, no escribe nada)
//   npx tsx scripts/import-perfumes-catalog.ts --commit    (escribe en Supabase)
import { createClient } from "@supabase/supabase-js";
import { JOSHUA_PERFUMES_2024 } from "./data/joshua-perfumes-2024";
import { calculatePricingTiers } from "../src/lib/pricing";

const CODE_PREFIX = "JOS";
// product_codes.created_by es not null default auth.uid(); el service role
// no trae auth.uid(), asi que hay que fijarlo a mano (mismo patron que
// IMPORT_SYSTEM_USER_ID en import-excel.ts). No tiene FK a auth.users.
const IMPORT_SYSTEM_USER_ID = "00000000-0000-0000-0000-000000000000";

function buildCode(index: number): string {
  return `${CODE_PREFIX}-${String(index + 1).padStart(3, "0")}`;
}

async function main() {
  const commit = process.argv.includes("--commit");

  const rows = JOSHUA_PERFUMES_2024.map((entry, index) => {
    const pricing = calculatePricingTiers(entry.supplierPrice);
    return {
      code: buildCode(index),
      product_name: entry.productName,
      category: entry.category,
      supplier_price: entry.supplierPrice,
      unit_price: pricing.tiers[1].salePrice,
      created_by: IMPORT_SYSTEM_USER_ID,
    };
  });

  console.log(`Productos a importar: ${rows.length}`);
  console.log(`  MUJER: ${rows.filter((r) => r.category === "MUJER").length}`);
  console.log(`  HOMBRE: ${rows.filter((r) => r.category === "HOMBRE").length}`);
  console.log("\nPrimeros 5 (preview):");
  for (const row of rows.slice(0, 5)) {
    console.log(`  ${row.code} | ${row.category} | ${row.product_name} | proveedor $${row.supplier_price.toLocaleString("es-CO")} -> venta $${row.unit_price.toLocaleString("es-CO")}`);
  }

  if (!commit) {
    console.log("\nModo preview (sin --commit). No se escribió nada en Supabase.");
    return;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    console.error("Faltan NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY en el entorno.");
    process.exit(1);
  }
  const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

  const { data: existing, error: existingError } = await supabase
    .from("product_codes")
    .select("code")
    .like("code", `${CODE_PREFIX}-%`);
  if (existingError) throw existingError;
  const existingCodes = new Set((existing ?? []).map((row) => row.code as string));

  let created = 0;
  let skipped = 0;
  for (const row of rows) {
    if (existingCodes.has(row.code)) {
      skipped++;
      continue;
    }
    const { error } = await supabase.from("product_codes").insert(row);
    if (error) throw error;
    created++;
  }

  console.log(`\nImportación completada. Creados: ${created}. Ya existentes (omitidos): ${skipped}.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
