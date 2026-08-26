import { NextRequest } from "next/server";
import { renderCatalogPdfBuffer } from "@/lib/catalog-pdf";
import { requireSession } from "@/lib/require-session";
import type { ProductCode } from "@/lib/business-types";
import type { LabelSettings } from "@/lib/types";

export const runtime = "nodejs";

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function isValidProduct(value: unknown): value is ProductCode {
  return isObject(value) && typeof value.productName === "string" && typeof value.unitPrice === "number";
}

function isValidSettings(value: unknown): value is LabelSettings {
  return isObject(value) && isObject(value.defaultSender);
}

export async function POST(request: NextRequest) {
  const session = await requireSession();
  if (!session) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const payload = await request.json().catch(() => null);
  if (!isObject(payload) || !Array.isArray(payload.products) || !payload.products.every(isValidProduct) || !isValidSettings(payload.settings)) {
    return Response.json({ error: "invalid_payload" }, { status: 400 });
  }

  const pdf = await renderCatalogPdfBuffer(payload.products, payload.settings);
  const body = pdf.buffer.slice(pdf.byteOffset, pdf.byteOffset + pdf.byteLength) as ArrayBuffer;
  return new Response(body, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="catalogo-purple-shop.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
