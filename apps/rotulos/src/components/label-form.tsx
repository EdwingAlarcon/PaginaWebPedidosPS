"use client";

import { useEffect, useMemo, useState } from "react";
import { createBlankLabelDraft, defaultSettings } from "@/lib/defaults";
import { getBusinessStore } from "@/lib/business-store";
import { buildLabelDraftFromOrder } from "@/lib/label-from-order";
import { getLabelStore } from "@/lib/label-store";
import { formatOrderNumber } from "@/lib/order-number";
import { validateLabelDraft } from "@/lib/validation";
import { LABEL_SIZES } from "@/lib/types";
import type { LabelDraft, LabelSettings } from "@/lib/types";
import { LabelActions } from "@/components/label-actions";
import { LabelPreview } from "@/components/label-preview";
import { OrderNumberPreview } from "@/components/order-number-preview";
import { RecipientFields } from "@/components/recipient-fields";
import { SenderFields } from "@/components/sender-fields";
import { ShipmentFields } from "@/components/shipment-fields";

export function LabelForm() {
  const [draft, setDraft] = useState<LabelDraft>(() => {
    const initial = createBlankLabelDraft();
    initial.sender = defaultSettings.defaultSender;
    return initial;
  });
  const [settings, setSettings] = useState<LabelSettings>(defaultSettings);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saveStatus, setSaveStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    let active = true;
    const store = getLabelStore();
    const params = new URLSearchParams(window.location.search);
    const labelId = params.get("id");
    const fromOrderId = params.get("fromOrderId");
    const shouldPrint = params.get("print") === "1";

    async function loadFallbackData() {
      const savedSettings = await store.getSettings();
      const existing = labelId ? await store.getLabel(labelId) : null;
      const fromOrder = !existing && fromOrderId
        ? (await getBusinessStore().listOrders()).find((order) => order.id === fromOrderId) ?? null
        : null;
      if (!active) return;
      setSettings(savedSettings);
      setDraft((current) => {
        if (existing) return existing;
        if (fromOrder) return buildLabelDraftFromOrder(fromOrder, savedSettings.defaultSender);
        const senderIsEmpty = !current.sender.phone && !current.sender.department && !current.sender.city && !current.sender.locality && !current.sender.neighborhood && !current.sender.address;
        return { ...current, sender: senderIsEmpty ? savedSettings.defaultSender : current.sender };
      });
      if (existing && shouldPrint) window.setTimeout(() => window.print(), 150);
    }

    void loadFallbackData();
    return () => {
      active = false;
    };
  }, []);

  const nextPreview = useMemo(() => formatOrderNumber(settings.orderNumberConfig, {
    date: new Date(`${draft.date}T00:00:00Z`),
    sequence: 1,
    city: draft.recipient.city,
    department: draft.recipient.department,
  }), [draft.date, draft.recipient.city, draft.recipient.department, settings.orderNumberConfig]);
  const errorEntries = Object.entries(errors);

  function focusField(fieldId: string) {
    const field = document.getElementById(fieldId);
    field?.scrollIntoView({ behavior: "smooth", block: "center" });
    field?.focus();
  }

  function validateDraft(): boolean {
    const result = validateLabelDraft(draft);
    setErrors(result.errors);
    const [firstInvalidField] = Object.keys(result.errors);
    if (firstInvalidField) focusField(firstInvalidField);
    return result.valid;
  }

  async function saveDraft() {
    if (saving || !validateDraft()) return;
    setSaving(true);
    try {
      const saved = await getLabelStore().saveLabel(draft, settings);
      setDraft(saved);
      setSaveStatus("Rotulo guardado.");
    } finally {
      setSaving(false);
    }
  }

  function printDraft() {
    if (!validateDraft()) return;
    const { widthCm, heightCm } = LABEL_SIZES[draft.size];
    const styleId = "dynamic-page-size";
    let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = `@page { size: ${widthCm}cm ${heightCm}cm; margin: 0; }`;
    window.print();
  }

  async function downloadPdf() {
    if (downloading || !validateDraft()) return;
    setDownloading(true);
    setSaveStatus("Generando PDF...");
    try {
      const response = await fetch("/api/labels/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: draft, settings }),
      });
      if (!response.ok) throw new Error("pdf_generation_failed");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `rotulo-${draft.orderNumber || "purpleshop"}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setSaveStatus("PDF descargado.");
    } catch {
      setSaveStatus("No se pudo generar el PDF.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="creator-grid">
      <div className="form-stack">
        <div className="validation-summary" aria-live="polite" role="status">
          {errorEntries.length ? (
            <>
              <p>Revisa {errorEntries.length} campo{errorEntries.length === 1 ? "" : "s"} antes de guardar:</p>
              <ul className="mt-1 list-disc pl-5">
                {errorEntries.map(([fieldId, message]) => (
                  <li key={fieldId}>
                    <a
                      href={`#${fieldId}`}
                      className="underline"
                      onClick={(event) => {
                        event.preventDefault();
                        focusField(fieldId);
                      }}
                    >
                      {message}
                    </a>
                  </li>
                ))}
              </ul>
            </>
          ) : saveStatus}
        </div>
        <OrderNumberPreview value={nextPreview} />
        <SenderFields value={draft.sender} onChange={(sender) => setDraft((current) => ({ ...current, sender: typeof sender === "function" ? sender(current.sender) : sender }))} errors={errors} />
        <RecipientFields value={draft.recipient} onChange={(recipient) => setDraft((current) => ({ ...current, recipient: typeof recipient === "function" ? recipient(current.recipient) : recipient }))} errors={errors} />
        <ShipmentFields value={draft} onChange={setDraft} errors={errors} allowManualEdit={settings.orderNumberConfig.allowManualEdit} />
        <LabelActions onSave={saveDraft} onPrint={printDraft} onDownloadPdf={downloadPdf} saving={saving} downloading={downloading} isEditing={Boolean(draft.id)} />
      </div>
      <div className="preview-rail print-area">
        <LabelPreview draft={draft} />
      </div>
    </div>
  );
}
