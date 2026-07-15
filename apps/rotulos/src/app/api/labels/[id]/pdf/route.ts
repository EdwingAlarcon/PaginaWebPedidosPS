import { NextRequest } from "next/server";
import { getLabelStore } from "@/lib/label-store";
import { renderLabelPdfBuffer } from "@/lib/pdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function fileName(orderNumber: string): string {
  const safe = orderNumber.replace(/[^a-z0-9._-]+/gi, "-").replace(/^-+|-+$/g, "") || "purpleshop";
  return `rotulo-${safe}.pdf`;
}

function pdfResponse(buffer: Buffer, orderNumber: string): Response {
  const body = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;
  return new Response(body, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${fileName(orderNumber)}"`,
      "Cache-Control": "no-store",
    },
  });
}

async function getServerLabel(id: string) {
  const store = getLabelStore();
  const label = await store.getLabel(id);
  if (!label) return null;
  return { label, settings: await store.getSettings() };
}

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const result = await getServerLabel(id);
  if (!result) return Response.json({ error: "label_not_found" }, { status: 404 });

  const pdf = await renderLabelPdfBuffer(result.label, result.settings, { origin: request.nextUrl.origin });
  return pdfResponse(pdf, result.label.orderNumber);
}
