"use client";

import { useMemo, useState } from "react";
import { createBlankLabelDraft, defaultSettings } from "@/lib/defaults";
import { formatOrderNumber } from "@/lib/order-number";
import { validateLabelDraft } from "@/lib/validation";
import type { LabelDraft } from "@/lib/types";
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
    initial.orderNumber = formatOrderNumber(defaultSettings.orderNumberConfig, {
      date: new Date(`${initial.date}T00:00:00Z`),
      sequence: 1,
      city: initial.recipient.city,
      department: initial.recipient.department,
    });
    return initial;
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const nextPreview = useMemo(() => formatOrderNumber(defaultSettings.orderNumberConfig, {
    date: new Date(`${draft.date}T00:00:00Z`),
    sequence: 1,
    city: draft.recipient.city,
    department: draft.recipient.department,
  }), [draft.date, draft.recipient.city, draft.recipient.department]);
  const errorMessages = Object.values(errors);

  function saveDraft() {
    const result = validateLabelDraft(draft);
    setErrors(result.errors);
    if (!result.valid) return;
    window.alert("Rotulo validado. La persistencia se conecta en la siguiente tarea.");
  }

  return (
    <div className="creator-grid">
      <div className="form-stack">
        <div className="validation-summary" aria-live="polite" role="status">
          {errorMessages.length ? `Revisa ${errorMessages.length} campo${errorMessages.length === 1 ? "" : "s"} antes de guardar.` : null}
        </div>
        <OrderNumberPreview value={nextPreview} />
        <SenderFields value={draft.sender} onChange={(sender) => setDraft({ ...draft, sender })} errors={errors} />
        <RecipientFields value={draft.recipient} onChange={(recipient) => setDraft({ ...draft, recipient })} errors={errors} />
        <ShipmentFields value={draft} onChange={setDraft} errors={errors} allowManualEdit={defaultSettings.orderNumberConfig.allowManualEdit} />
        <LabelActions onSave={saveDraft} />
      </div>
      <div className="preview-rail print-area">
        <LabelPreview draft={draft} settings={defaultSettings} />
      </div>
    </div>
  );
}
