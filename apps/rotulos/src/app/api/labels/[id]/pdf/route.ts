import { NextRequest } from "next/server";
import { defaultSettings } from "@/lib/defaults";
import { getLabelStore } from "@/lib/label-store";
import { renderLabelPdfBuffer } from "@/lib/pdf";
import { createServiceClient } from "@/lib/supabase/server";
import type { LabelDraft, LabelRecord, LabelSettings } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type LabelRow = {
  id: string;
  order_number: string;
  sender: LabelDraft["sender"];
  recipient: LabelDraft["recipient"];
  shipment: { date?: string } | null;
  payment_method: LabelDraft["paymentMethod"];
  cod_amount: number | string;
  package_count: number;
  carrier: string;
  status: LabelDraft["status"];
  pdf_url: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

type SettingsRow = {
  default_sender: LabelSettings["defaultSender"];
  logo_url: string;
  qr_url: string;
  instagram_user: string;
  brand_phrase: string;
  brand_colors: LabelSettings["brandColors"];
  label_size: LabelSettings["labelSize"];
  default_template: LabelSettings["defaultTemplate"];
  order_number_config: LabelSettings["orderNumberConfig"];
};

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

function rowToLabel(row: LabelRow): LabelRecord {
  return {
    id: row.id,
    orderNumber: row.order_number,
    date: row.shipment?.date ?? row.created_at.slice(0, 10),
    sender: row.sender,
    recipient: row.recipient,
    carrier: row.carrier,
    paymentMethod: row.payment_method,
    codAmount: Number(row.cod_amount),
    packageCount: row.package_count,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    pdfUrl: row.pdf_url,
    createdBy: row.created_by,
  };
}

function rowToSettings(row: SettingsRow | null): LabelSettings {
  if (!row) return defaultSettings;
  return {
    defaultSender: row.default_sender,
    logoUrl: row.logo_url,
    qrUrl: row.qr_url,
    instagramUser: row.instagram_user,
    brandPhrase: row.brand_phrase,
    brandColors: row.brand_colors,
    labelSize: row.label_size,
    defaultTemplate: row.default_template,
    orderNumberConfig: row.order_number_config,
  };
}

async function getServerLabel(id: string): Promise<{ label: LabelRecord; settings: LabelSettings } | null> {
  const supabase = createServiceClient();
  if (supabase) {
    const { data: labelRow, error } = await supabase.from("labels").select("*").eq("id", id).single<LabelRow>();
    if (error || !labelRow) return null;
    const { data: settingsRow } = await supabase.from("settings").select("*").order("updated_at", { ascending: false }).limit(1).maybeSingle<SettingsRow>();
    return { label: rowToLabel(labelRow), settings: rowToSettings(settingsRow ?? null) };
  }

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
