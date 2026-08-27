// apps/rotulos/scripts/list-missing-photos.ts
// Lista product_codes sin image_url, ordenados por codigo.
import { createClient } from "@supabase/supabase-js";

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    console.error("Faltan NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY.");
    process.exit(1);
  }
  const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

  const { data, error } = await supabase
    .from("product_codes")
    .select("code, product_name")
    .is("image_url", null)
    .order("code");
  if (error) throw error;

  console.log(`Sin foto: ${data.length}`);
  for (const row of data) console.log(`${row.code}\t${row.product_name}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
