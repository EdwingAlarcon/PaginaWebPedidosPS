import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const MIGRATIONS_DIR = join(process.cwd(), "supabase", "migrations");

// Cada migracion que redefine una funcion la reemplaza entera, asi que solo la
// ultima cuenta. Estos tests leen esa ultima definicion y fallan si pierde una
// capacidad que una migracion anterior ya habia dado.
function latestDefinition(functionName: string): { file: string; sql: string } {
  const header = new RegExp(`create or replace function public\\.${functionName}\\(`, "i");
  const files = readdirSync(MIGRATIONS_DIR)
    .filter((name) => name.endsWith(".sql"))
    .sort();
  const definers = files.filter((name) => header.test(readFileSync(join(MIGRATIONS_DIR, name), "utf8")));
  const file = definers[definers.length - 1];
  return { file, sql: readFileSync(join(MIGRATIONS_DIR, file), "utf8") };
}

// 202609220001 se escribio sobre una base vieja y borro en produccion el alta de
// lineas nuevas, los movimientos de stock y la auditoria.
describe("definicion vigente de update_order", () => {
  const { file, sql } = latestDefinition("update_order");

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

// Sin telefono save_order no buscaba al cliente y creaba una ficha nueva en
// cada pedido, y el 85% de los clientes no tiene telefono.
describe("definicion vigente de save_order", () => {
  const { file, sql } = latestDefinition("save_order");

  it.each([
    ["busca por telefono", /where phone = v_phone/],
    ["reutiliza por nombre cuando no hay telefono", /elsif v_customer_name <> ''/],
    ["solo reutiliza si el nombre identifica a un unico cliente", /count\(\*\) over \(\)/],
    ["conserva las lineas de pedido con stock", /insert into public\.stock_movements/i],
  ])("%s (%s)", (_label, pattern) => {
    expect(sql, `migracion ${file}`).toMatch(pattern);
  });
});
