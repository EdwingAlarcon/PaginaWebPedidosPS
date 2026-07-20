import { NextRequest } from "next/server";
import { requireSession } from "@/lib/require-session";
import { createServiceClient } from "@/lib/supabase/server";
import { toCsv } from "@/lib/export-csv";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CUSTOMER_COLUMNS = [
  "id", "full_name", "phone", "email", "department", "city", "locality",
  "address", "neighborhood", "source", "created_at", "updated_at",
];
const ORDER_COLUMNS = [
  "id", "customer_id", "customer_snapshot", "order_date", "status", "notes",
  "discount", "shipping_cost", "subtotal", "total", "source",
  "import_batch_id", "import_row_key", "created_by", "created_at", "updated_at",
];
const ORDER_ITEM_COLUMNS = [
  "id", "order_id", "product_code", "product_name", "category", "quantity",
  "unit_price", "total", "created_at",
];
const PRODUCT_CODE_COLUMNS = ["id", "code", "product_name", "category", "unit_price", "created_at", "updated_at"];

const CSV_TABLES = {
  customers: { table: "customers", columns: CUSTOMER_COLUMNS, filePrefix: "export-clientes" },
  orders: { table: "orders", columns: ORDER_COLUMNS, filePrefix: "export-pedidos" },
  "order-items": { table: "order_items", columns: ORDER_ITEM_COLUMNS, filePrefix: "export-order-items" },
  productos: { table: "product_codes", columns: PRODUCT_CODE_COLUMNS, filePrefix: "export-productos" },
} as const;

type CsvTableKey = keyof typeof CSV_TABLES;

function isCsvTableKey(value: string | null): value is CsvTableKey {
  return value !== null && Object.prototype.hasOwnProperty.call(CSV_TABLES, value);
}

function todayStamp() {
  return new Date().toISOString().slice(0, 10);
}

function csvResponse(csv: string, filename: string) {
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

function jsonFileResponse(payload: unknown, filename: string) {
  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

export async function GET(request: NextRequest) {
  const session = await requireSession();
  if (!session) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();
  if (!supabase) {
    return Response.json(
      { error: "export_backend_unavailable", detail: "Falta SUPABASE_SERVICE_ROLE_KEY en el entorno del servidor." },
      { status: 500 },
    );
  }

  const format = request.nextUrl.searchParams.get("format");
  const date = todayStamp();

  if (format === "json") {
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
    if (failed?.error) {
      return Response.json({ error: "export_failed", detail: failed.error.message }, { status: 500 });
    }

    const payload = {
      generatedAt: new Date().toISOString(),
      generatedBy: session.email,
      customers: customers.data ?? [],
      orders: orders.data ?? [],
      orderItems: orderItems.data ?? [],
      productCodes: productCodes.data ?? [],
      products: products.data ?? [],
      stockMovements: stockMovements.data ?? [],
      labels: labels.data ?? [],
      settings: settings.data ?? [],
    };
    return jsonFileResponse(payload, `backup-rotulos-${date}.json`);
  }

  const tableParam = request.nextUrl.searchParams.get("table");
  if (!isCsvTableKey(tableParam)) {
    return Response.json({ error: "invalid_table" }, { status: 400 });
  }

  const config = CSV_TABLES[tableParam];
  const { data, error } = await supabase.from(config.table).select("*");
  if (error) {
    return Response.json({ error: "export_failed", detail: error.message }, { status: 500 });
  }

  const rows = (data ?? []) as Record<string, unknown>[];
  const csv = toCsv(rows, config.columns);
  return csvResponse(csv, `${config.filePrefix}-${date}.csv`);
}
