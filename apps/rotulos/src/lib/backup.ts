import type { SupabaseClient } from "@supabase/supabase-js";

export type FullBackupPayload = {
  generatedAt: string;
  generatedBy: string;
  customers: unknown[];
  orders: unknown[];
  orderItems: unknown[];
  productCodes: unknown[];
  products: unknown[];
  stockMovements: unknown[];
  labels: unknown[];
  settings: unknown[];
};

export async function buildFullBackupPayload(
  supabase: SupabaseClient,
  generatedBy: string,
): Promise<{ payload: FullBackupPayload } | { error: string }> {
  const [customers, orders, orderItems, productCodes, products, stockMovements, labels, settings] = await Promise.all([
    supabase.from("customers").select("*"),
    supabase.from("orders").select("*"),
    supabase.from("order_items").select("*"),
    supabase.from("product_codes").select("*"),
    supabase.from("products").select("*"),
    supabase.from("stock_movements").select("*"),
    supabase.from("labels").select("*"),
    supabase.from("settings").select("*"),
  ]);
  const failed = [customers, orders, orderItems, productCodes, products, stockMovements, labels, settings].find(
    (result) => result.error,
  );
  if (failed?.error) return { error: failed.error.message };

  return {
    payload: {
      generatedAt: new Date().toISOString(),
      generatedBy,
      customers: customers.data ?? [],
      orders: orders.data ?? [],
      orderItems: orderItems.data ?? [],
      productCodes: productCodes.data ?? [],
      products: products.data ?? [],
      stockMovements: stockMovements.data ?? [],
      labels: labels.data ?? [],
      settings: settings.data ?? [],
    },
  };
}
