import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const MIGRATIONS_DIR = join(process.cwd(), "supabase", "migrations");

function latestUpdateOrderDefinition(): { file: string; sql: string } {
  const files = readdirSync(MIGRATIONS_DIR)
    .filter((name) => name.endsWith(".sql"))
    .sort();
  const definers = files.filter((name) =>
    /create or replace function public\.update_order\(/i.test(
      readFileSync(join(MIGRATIONS_DIR, name), "utf8"),
    ),
  );
  const file = definers[definers.length - 1];
  return { file, sql: readFileSync(join(MIGRATIONS_DIR, file), "utf8") };
}

// Cada migracion que redefine update_order reemplaza la funcion entera. La de
// 2026-09-22 se escribio sobre una base vieja y borro en produccion el alta de
// lineas nuevas, los movimientos de stock y la auditoria. Este test falla si
// la definicion vigente pierde alguna de esas capacidades.
describe("definicion vigente de update_order", () => {
  const { file, sql } = latestUpdateOrderDefinition();

  it.each([
    ["inserta lineas nuevas al editar", /insert into public\.order_items/i],
    ["registra movimientos de stock", /insert into public\.stock_movements/i],
    ["audita cambios en order_edits", /insert into public\.order_edits/i],
    ["restituye stock al cancelar", /Cancelacion pedido/],
    ["exige motivo en pedidos cerrados", /adjustment_reason_required/],
  ])("%s (%s)", (_label, pattern) => {
    expect(sql, `migracion ${file}`).toMatch(pattern);
  });
});
