// apps/rotulos/scripts/rename-perfume-codes.ts
//
// Renombra los codigos JOS-xxx ya cargados en produccion (import de
// scripts/import-perfumes-catalog.ts) al esquema nuevo PS-M-xxx / PS-H-xxx.
// El mapeo es determinista: JOSHUA_PERFUMES_2024 ya viene agrupado por
// categoria (151 MUJER seguidas de 168 HOMBRE), asi que JOS-001..JOS-151
// eran MUJER en orden y JOS-152..JOS-319 eran HOMBRE en orden.
//
// Si un producto ya fue renombrado a mano (ej. los 4 casos ambiguos
// CH/LEAU/BLACK XS/LE MALE), su codigo JOS-xxx original ya no existe en la
// base -- el script lo salta sin fallar (update afecta 0 filas).
//
// Uso:
//   npx tsx scripts/rename-perfume-codes.ts            (preview, no escribe nada)
//   npx tsx scripts/rename-perfume-codes.ts --commit    (escribe en Supabase)
import { createClient } from "@supabase/supabase-js";
import { JOSHUA_PERFUMES_2024 } from "./data/joshua-perfumes-2024";

const OLD_PREFIX = "JOS";
const NEW_PREFIX = "PS";
const GENDER_SEGMENT: Record<string, string> = { MUJER: "M", HOMBRE: "H" };

function buildOldCode(globalIndex: number): string {
  return `${OLD_PREFIX}-${String(globalIndex + 1).padStart(3, "0")}`;
}

function buildNewCode(category: string, indexInCategory: number): string {
  const segment = GENDER_SEGMENT[category] ?? "X";
  return `${NEW_PREFIX}-${segment}-${String(indexInCategory + 1).padStart(3, "0")}`;
}

async function main() {
  const commit = process.argv.includes("--commit");

  const categoryCounters = new Map<string, number>();
  const renames = JOSHUA_PERFUMES_2024.map((entry, globalIndex) => {
    const indexInCategory = categoryCounters.get(entry.category) ?? 0;
    categoryCounters.set(entry.category, indexInCategory + 1);
    return {
      oldCode: buildOldCode(globalIndex),
      newCode: buildNewCode(entry.category, indexInCategory),
      productName: entry.productName,
    };
  });

  console.log(`Renombres a aplicar: ${renames.length}`);
  console.log("\nPrimeros 5 (preview):");
  for (const r of renames.slice(0, 5)) {
    console.log(`  ${r.oldCode} -> ${r.newCode}  (${r.productName})`);
  }
  console.log("...");
  for (const r of renames.slice(-3)) {
    console.log(`  ${r.oldCode} -> ${r.newCode}  (${r.productName})`);
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

  let renamed = 0;
  let skipped = 0;
  for (const r of renames) {
    const { data, error } = await supabase
      .from("product_codes")
      .update({ code: r.newCode })
      .eq("code", r.oldCode)
      .select("id");
    if (error) throw error;
    if ((data ?? []).length > 0) {
      renamed++;
    } else {
      skipped++;
      console.log(`  omitido (no encontrado, probablemente ya renombrado a mano): ${r.oldCode}`);
    }
  }

  console.log(`\nRenombrado completado. Renombrados: ${renamed}. Omitidos: ${skipped}.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
