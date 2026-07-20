import { NextRequest } from "next/server";
import { renderLabelPdfBuffer } from "@/lib/pdf";
import { validateLabelDraft } from "@/lib/validation";
import { requireSession } from "@/lib/require-session";
import type { LabelDraft, LabelSettings } from "@/lib/types";

export const runtime = "nodejs";

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

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

export async function POST(request: NextRequest) {
  const session = await requireSession();
  if (!session) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const payload = await request.json().catch(() => null);
  if (!isObject(payload) || !isObject(payload.label) || !isObject(payload.settings)) {
    return Response.json({ error: "invalid_payload" }, { status: 400 });
  }

  const label = payload.label as LabelDraft;
  const settings = payload.settings as LabelSettings;
  if (!validateLabelDraft(label).valid) {
    return Response.json({ error: "invalid_label" }, { status: 422 });
  }

  const origin = request.nextUrl.origin;
  const pdf = await renderLabelPdfBuffer(label, settings, { origin });
  return pdfResponse(pdf, label.orderNumber);
}
