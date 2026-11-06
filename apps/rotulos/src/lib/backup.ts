import type { SupabaseClient } from "@supabase/supabase-js";
import { fetchAllPages } from "@/lib/paginate";

export type FullBackupPayload = {
  generatedAt: string;
  generatedBy: string;
  customers: unknown[];
  orders: unknown[];
  orderItems: unknown[];
  orderEdits: unknown[];
  /** Ausente en backups anteriores a la tabla order_payments. */
  orderPayments?: unknown[];
  productCodes: unknown[];
  products: unknown[];
  stockMovements: unknown[];
  labels: unknown[];
  settings: unknown[];
};

/**
 * Trae TODAS las filas de una tabla. Supabase corta en 1000 filas sin avisar:
 * un backup/export truncado en silencio seria peor que no tenerlo.
 * Todas las tablas del backup tienen `id` (se usa como orden estable).
 */
export async function selectAllRows(
  supabase: SupabaseClient,
  table: string,
): Promise<{ data: unknown[]; error: { message: string } | null }> {
  const result = await fetchAllPages<unknown>((from, to) =>
    supabase.from(table).select("*").order("id").range(from, to),
  );
  return {
    data: result.data,
    error: result.error ? { message: (result.error as { message?: string }).message ?? "query_failed" } : null,
  };
}

export async function buildFullBackupPayload(
  supabase: SupabaseClient,
  generatedBy: string,
): Promise<{ payload: FullBackupPayload } | { error: string }> {
  const [customers, orders, orderItems, orderEdits, productCodes, products, stockMovements, labels, settings] = await Promise.all([
    selectAllRows(supabase, "customers"),
    selectAllRows(supabase, "orders"),
    selectAllRows(supabase, "order_items"),
    selectAllRows(supabase, "order_edits"),
    selectAllRows(supabase, "product_codes"),
    selectAllRows(supabase, "products"),
    selectAllRows(supabase, "stock_movements"),
    selectAllRows(supabase, "labels"),
    selectAllRows(supabase, "settings"),
  ]);
  const failed = [customers, orders, orderItems, orderEdits, productCodes, products, stockMovements, labels, settings].find(
    (result) => result.error,
  );
  if (failed?.error) return { error: failed.error.message };

  // Tabla nueva (migracion 202609210001): si aun no existe no debe romper el backup.
  const orderPayments = await selectAllRows(supabase, "order_payments");

  return {
    payload: {
      generatedAt: new Date().toISOString(),
      generatedBy,
      customers: customers.data ?? [],
      orders: orders.data ?? [],
      orderItems: orderItems.data ?? [],
      orderEdits: orderEdits.data ?? [],
      orderPayments: orderPayments.error ? [] : (orderPayments.data ?? []),
      productCodes: productCodes.data ?? [],
      products: products.data ?? [],
      stockMovements: stockMovements.data ?? [],
      labels: labels.data ?? [],
      settings: settings.data ?? [],
    },
  };
}
