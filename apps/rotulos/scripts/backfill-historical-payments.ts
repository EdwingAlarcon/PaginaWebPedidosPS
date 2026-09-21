// apps/rotulos/scripts/backfill-historical-payments.ts
//
// Registra como pagados los pedidos COMPLETADOS que todavia no tienen ningun
// abono en order_payments (pedidos historicos importados de Excel y pedidos ya
// despachados antes de existir el control de pagos). Un pago por pedido, por el
// total, con fecha = fecha del pedido, metodo "otro" (no se sabe cual fue) y la
// nota marcadora PAGO HISTORICO (ASUMIDO) para poder revertirlo.
//
// Es idempotente: solo toca pedidos completados sin pagos, asi que se puede
// volver a correr despues de cada `npm run import:excel`.
// NO toca pedidos pendientes ni cancelados (la deuda real sigue visible).
//
// Uso (desde apps/rotulos):
//   npx tsx --env-file=.env.local scripts/backfill-historical-payments.ts            (preview, no escribe)
//   npx tsx --env-file=.env.local scripts/backfill-historical-payments.ts --commit   (escribe en Supabase)
//   ... --until=2026-07-31   solo pedidos con fecha <= esa (deja fuera los mas recientes)
//
// Revertir (SQL Editor de Supabase):
//   delete from public.order_payments
//   where note = 'PAGO HISTORICO (ASUMIDO)' and created_by = 'sistema';
import { mkdirSync, writeFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

export const HISTORICAL_PAYMENT_NOTE = "PAGO HISTORICO (ASUMIDO)";

type OrderRow = {
  id: string;
  order_date: string;
  status: "pending" | "completed" | "cancelled";
  total: number | string;
  source: string | null;
  customer_snapshot: { fullName?: string } | null;
};

function readArg(name: string): string | undefined {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
}

function cop(value: number): string {
  return `$${Math.round(value).toLocaleString("es-CO")}`;
}

async function main() {
  const commit = process.argv.includes("--commit");
  const until = readArg("until");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    console.error("Faltan NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY en el entorno.");
    process.exit(1);
  }
  const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

  const [ordersResult, paymentsResult] = await Promise.all([
    supabase.from("orders").select("id, order_date, status, total, source, customer_snapshot").order("order_date"),
    supabase.from("order_payments").select("order_id, amount, note"),
  ]);
  if (ordersResult.error) throw ordersResult.error;
  if (paymentsResult.error) throw paymentsResult.error;

  const orders = (ordersResult.data ?? []) as OrderRow[];
  const paidOrderIds = new Set((paymentsResult.data ?? []).map((payment) => payment.order_id as string));

  const candidates: OrderRow[] = [];
  const skipped = { pending: 0, cancelled: 0, alreadyHasPayments: 0, zeroTotal: 0, afterUntil: 0 };
  for (const order of orders) {
    if (order.status === "pending") skipped.pending += 1;
    else if (order.status === "cancelled") skipped.cancelled += 1;
    else if (paidOrderIds.has(order.id)) skipped.alreadyHasPayments += 1;
    else if (Number(order.total) <= 0) skipped.zeroTotal += 1;
    else if (until && order.order_date > until) skipped.afterUntil += 1;
    else candidates.push(order);
  }

  const totalAmount = candidates.reduce((sum, order) => sum + Number(order.total), 0);
  const byYear = new Map<string, { count: number; amount: number }>();
  for (const order of candidates) {
    const year = order.order_date.slice(0, 4);
    const current = byYear.get(year) ?? { count: 0, amount: 0 };
    current.count += 1;
    current.amount += Number(order.total);
    byYear.set(year, current);
  }

  console.log(`Pedidos en total: ${orders.length}. Pagos existentes en order_payments: ${paymentsResult.data?.length ?? 0}.`);
  console.log(`Omitidos -> pendientes: ${skipped.pending}, cancelados: ${skipped.cancelled}, ya con pagos: ${skipped.alreadyHasPayments}, total 0: ${skipped.zeroTotal}, posteriores a --until: ${skipped.afterUntil}.`);
  console.log(`\nSe registrarian ${candidates.length} pagos por ${cop(totalAmount)}:`);
  for (const [year, info] of [...byYear.entries()].sort()) {
    console.log(`  ${year}: ${info.count} pedido(s), ${cop(info.amount)}`);
  }
  console.log("\nLos 8 mas recientes (revisalos antes de --commit):");
  for (const order of candidates.slice(-8)) {
    console.log(`  ${order.order_date}  ${(order.customer_snapshot?.fullName ?? "").padEnd(24)} ${cop(Number(order.total)).padStart(12)}  [${order.source ?? "app"}]`);
  }

  if (!commit) {
    console.log("\nModo preview (sin --commit). No se escribio nada en Supabase.");
    return;
  }
  if (candidates.length === 0) {
    console.log("\nNada que registrar.");
    return;
  }

  const rows = candidates.map((order) => ({
    order_id: order.id,
    amount: Number(order.total),
    method: "otro",
    paid_at: order.order_date,
    note: HISTORICAL_PAYMENT_NOTE,
    created_by: "sistema",
  }));

  // Constancia local de lo que se inserta (rollback tambien posible por la nota marcadora).
  mkdirSync("backups", { recursive: true });
  const receipt = `backups/backfill-payments-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
  writeFileSync(receipt, JSON.stringify({ generatedAt: new Date().toISOString(), until: until ?? null, rows }, null, 2));
  console.log(`\nConstancia guardada en ${receipt}`);

  let inserted = 0;
  for (let index = 0; index < rows.length; index += 50) {
    const batch = rows.slice(index, index + 50);
    const { data, error } = await supabase.from("order_payments").insert(batch).select("id");
    if (error) throw error;
    inserted += data?.length ?? 0;
  }
  console.log(`Pagos historicos registrados: ${inserted} de ${rows.length}.`);
  console.log(`Para revertir: delete from public.order_payments where note = '${HISTORICAL_PAYMENT_NOTE}' and created_by = 'sistema';`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
