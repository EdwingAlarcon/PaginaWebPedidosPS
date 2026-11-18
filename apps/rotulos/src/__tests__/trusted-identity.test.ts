import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { hasTrustedIdentity } from "@/lib/supabase/trusted-identity";

describe("hasTrustedIdentity", () => {
  it("acepta una cuenta que inicio sesion con Microsoft", () => {
    expect(hasTrustedIdentity({ email: "a@b.co", app_metadata: { provider: "azure", providers: ["azure"] } })).toBe(true);
  });

  it("rechaza una cuenta creada por email y contrasena, aunque declare un email de la lista", () => {
    expect(hasTrustedIdentity({ email: "a@b.co", app_metadata: { provider: "email", providers: ["email"] } })).toBe(false);
  });

  it("rechaza usuarios sin email, sin metadata o nulos", () => {
    expect(hasTrustedIdentity(null)).toBe(false);
    expect(hasTrustedIdentity({ email: "a@b.co" })).toBe(false);
    expect(hasTrustedIdentity({ email: null, app_metadata: { providers: ["azure"] } })).toBe(false);
    expect(hasTrustedIdentity({ email: "a@b.co", app_metadata: { providers: "azure" } })).toBe(false);
  });
});

describe("migracion de lista de acceso en base de datos", () => {
  const sql = readFileSync(
    join(process.cwd(), "supabase", "migrations", "202611170001_enforce_allowlist_in_database.sql"),
    "utf8",
  );

  it("cubre todas las tablas de negocio con una politica restrictiva", () => {
    for (const table of [
      "customers", "orders", "order_items", "product_codes", "settings", "order_sequences",
      "labels", "products", "stock_movements", "order_edits", "order_payments", "backup_restore_runs",
    ]) {
      expect(sql).toContain(`'${table}'`);
    }
    expect(sql).toContain("as restrictive for all to authenticated");
  });

  it("protege storage y las funciones security definer con la guardia previa", () => {
    expect(sql).toContain("on storage.objects as restrictive");
    expect(sql).toContain("alter role authenticator set pgrst.db_pre_request = 'public.enforce_allowlist'");
    expect(sql).toContain("? 'azure'");
  });
});
