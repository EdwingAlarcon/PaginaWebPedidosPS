// apps/rotulos/scripts/import-product-photos.ts
//
// Sube fotos locales al bucket product-images de Supabase y actualiza
// product_codes.image_url. Cada archivo debe estar nombrado con el
// codigo exacto del producto (ej. PS-M-001.jpg, PS-H-020.png).
//
// Uso:
//   npx tsx scripts/import-product-photos.ts <carpeta>            (preview)
//   npx tsx scripts/import-product-photos.ts <carpeta> --commit    (sube y actualiza)
import { readdir, readFile } from "node:fs/promises";
import { extname, join, basename } from "node:path";
import { createClient } from "@supabase/supabase-js";

const ALLOWED_EXT: Record<string, string> = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png" };
const MAX_BYTES = 5 * 1024 * 1024;

async function main() {
  const args = process.argv.slice(2);
  const dir = args.find((a) => !a.startsWith("--"));
  const commit = args.includes("--commit");

  if (!dir) {
    console.error("Uso: npx tsx scripts/import-product-photos.ts <carpeta> [--commit]");
    process.exit(1);
  }

  const files = (await readdir(dir)).filter((f) => ALLOWED_EXT[extname(f).toLowerCase()]);
  const entries = files.map((file) => ({
    file,
    code: basename(file, extname(file)),
    ext: extname(file).toLowerCase(),
  }));

  console.log(`Fotos encontradas: ${entries.length}`);
  for (const e of entries) console.log(`  ${e.code}  <-  ${e.file}`);

  if (!commit) {
    console.log("\nModo preview (sin --commit). No se subió ni actualizó nada.");
    return;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    console.error("Faltan NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY en el entorno.");
    process.exit(1);
  }
  const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

  let uploaded = 0;
  let notFound = 0;
  let failed = 0;

  for (const e of entries) {
    const { data: product, error: lookupError } = await supabase
      .from("product_codes")
      .select("id")
      .eq("code", e.code)
      .maybeSingle();
    if (lookupError) throw lookupError;
    if (!product) {
      console.log(`  omitido (codigo no encontrado en product_codes): ${e.code}`);
      notFound++;
      continue;
    }

    const bytes = await readFile(join(dir, e.file));
    if (bytes.length > MAX_BYTES) {
      console.log(`  omitido (mas de 5MB): ${e.code}`);
      failed++;
      continue;
    }

    const contentType = ALLOWED_EXT[e.ext];
    const storagePath = `${product.id}-${Date.now()}.${e.ext.slice(1)}`;
    const { error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(storagePath, bytes, { upsert: true, contentType });
    if (uploadError) {
      console.log(`  error subiendo ${e.code}: ${uploadError.message}`);
      failed++;
      continue;
    }

    const { data: publicUrlData } = supabase.storage.from("product-images").getPublicUrl(storagePath);
    const { error: updateError } = await supabase
      .from("product_codes")
      .update({ image_url: publicUrlData.publicUrl })
      .eq("id", product.id);
    if (updateError) throw updateError;

    uploaded++;
  }

  console.log(`\nImport completado. Subidas: ${uploaded}. Codigo no encontrado: ${notFound}. Fallidas: ${failed}.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
