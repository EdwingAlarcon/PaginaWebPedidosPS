"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import type { LabelRecord } from "@/lib/types";

type TrackingDialogProps = {
  label: LabelRecord | null;
  onOpenChange: (open: boolean) => void;
  onSave: (trackingNumber: string, trackingUrl: string) => Promise<void>;
};

type TrackingFormProps = {
  label: LabelRecord;
  onSave: (trackingNumber: string, trackingUrl: string) => Promise<void>;
};

function TrackingForm({ label, onSave }: TrackingFormProps) {
  const [trackingNumber, setTrackingNumber] = useState(label.trackingNumber ?? "");
  const [trackingUrl, setTrackingUrl] = useState(label.trackingUrl ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await onSave(trackingNumber.trim(), trackingUrl.trim());
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Dialog.Description className="mt-1 text-sm text-foreground-muted">
        Pedido {label.orderNumber} - {label.recipient.fullName}
      </Dialog.Description>
      <div className="mt-4 grid gap-3">
        <FormField label="Numero de guia">
          <Input value={trackingNumber} onChange={(event) => setTrackingNumber(event.target.value)} placeholder="Ej. 123456789" />
        </FormField>
        <FormField label="Link de rastreo (opcional)" hint="Pega el link que te da la transportadora.">
          <Input value={trackingUrl} onChange={(event) => setTrackingUrl(event.target.value)} placeholder="https://..." />
        </FormField>
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <Dialog.Close asChild>
          <Button type="button" variant="secondary" size="sm">
            Cancelar
          </Button>
        </Dialog.Close>
        <Button type="button" size="sm" loading={saving} onClick={handleSave} disabled={!trackingNumber.trim()}>
          Guardar
        </Button>
      </div>
    </>
  );
}

export function TrackingDialog({ label, onOpenChange, onSave }: TrackingDialogProps) {
  return (
    <Dialog.Root open={label !== null} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay fixed inset-0 z-40 bg-black/40" />
        <Dialog.Content className="dialog-content-center fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border bg-surface p-5 shadow-popover focus-visible:outline-none">
          <Dialog.Title className="text-card-title">Guia de rastreo</Dialog.Title>
          {label ? <TrackingForm key={label.id} label={label} onSave={onSave} /> : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
