"use client";

import { useEffect, useMemo, useState } from "react";
import { createBlankLabelDraft, defaultSettings } from "@/lib/defaults";
import { getLabelStore } from "@/lib/label-store";
import { formatOrderNumber } from "@/lib/order-number";
import { validateLabelDraft } from "@/lib/validation";
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

  useEffect(() => {
    let active = true;
    const store = getLabelStore();
    const labelId = new URLSearchParams(window.location.search).get("id");

    async function loadFallbackData() {
      const savedSettings = await store.getSettings();
      const existing = labelId ? await store.getLabel(labelId) : null;
      if (!active) return;
      setSettings(savedSettings);
      setDraft(existing ?? { ...createBlankLabelDraft(), sender: savedSettings.defaultSender });
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
  const errorMessages = Object.values(errors);

  function validateDraft(): boolean {
    const result = validateLabelDraft(draft);
    setErrors(result.errors);
    return result.valid;
  }

  async function saveDraft() {
    if (!validateDraft()) return;
    const saved = await getLabelStore().saveLabel(draft, settings);
    setDraft(saved);
    setSaveStatus("Rotulo guardado.");
  }

  function printDraft() {
    if (!validateDraft()) return;
    window.print();
  }

  return (
    <div className="creator-grid">
      <div className="form-stack">
        <div className="validation-summary" aria-live="polite" role="status">
          {errorMessages.length ? `Revisa ${errorMessages.length} campo${errorMessages.length === 1 ? "" : "s"} antes de guardar.` : saveStatus}
        </div>
        <OrderNumberPreview value={nextPreview} />
        <SenderFields value={draft.sender} onChange={(sender) => setDraft({ ...draft, sender })} errors={errors} />
        <RecipientFields value={draft.recipient} onChange={(recipient) => setDraft({ ...draft, recipient })} errors={errors} />
        <ShipmentFields value={draft} onChange={setDraft} errors={errors} allowManualEdit={settings.orderNumberConfig.allowManualEdit} />
        <LabelActions onSave={saveDraft} onPrint={printDraft} />
      </div>
      <div className="preview-rail print-area">
        <LabelPreview draft={draft} settings={settings} />
      </div>
    </div>
  );
}
