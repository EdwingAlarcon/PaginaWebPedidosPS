import { createBlankLabelDraft, defaultSettings } from "@/lib/defaults";
import { formatOrderNumber, getSequenceScope } from "@/lib/order-number";
import type { LabelDraft, LabelRecord, LabelSettings } from "@/lib/types";

export type LabelStore = {
  listLabels(): Promise<LabelRecord[]>;
  getLabel(id: string): Promise<LabelRecord | null>;
  saveLabel(draft: LabelDraft, settings: LabelSettings): Promise<LabelRecord>;
  deleteLabel(id: string): Promise<void>;
  duplicateLabel(id: string): Promise<LabelDraft | null>;
  getSettings(): Promise<LabelSettings>;
  saveSettings(settings: LabelSettings): Promise<LabelSettings>;
  estimateNextOrderNumber(settings: LabelSettings, draft: LabelDraft): Promise<string>;
};

const memoryLabels: LabelRecord[] = [];
let memorySettings: LabelSettings = defaultSettings;
const memorySequences = new Map<string, number>();

function toRecord(draft: LabelDraft, existing?: LabelRecord): LabelRecord {
  const now = new Date().toISOString();
  return {
    ...draft,
    id: existing?.id ?? draft.id ?? crypto.randomUUID(),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    pdfUrl: existing?.pdfUrl ?? null,
    createdBy: existing?.createdBy ?? null,
  };
}

function getNextSequence(settings: LabelSettings, draft: LabelDraft): { scope: string; value: number } {
  const date = new Date(`${draft.date}T00:00:00Z`);
  const scope = getSequenceScope(settings.orderNumberConfig.resetPolicy, date);
  const currentValue = memorySequences.get(scope);
  return {
    scope,
    value: currentValue === undefined ? settings.orderNumberConfig.initialSequence : currentValue + 1,
  };
}

export function createLocalLabelStore(): LabelStore {
  return {
    async listLabels() {
      return [...memoryLabels].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },
    async getLabel(id) {
      return memoryLabels.find((label) => label.id === id) ?? null;
    },
    async saveLabel(draft, settings) {
      const manual = draft.orderNumber.trim();
      if (manual && memoryLabels.some((label) => label.orderNumber === manual && label.id !== draft.id)) {
        throw new Error("duplicate_order_number");
      }
      const index = memoryLabels.findIndex((label) => label.id === draft.id);
      const existing = index >= 0 ? memoryLabels[index] : undefined;
      const nextSequence = manual ? undefined : getNextSequence(settings, draft);
      const orderNumber = manual || formatOrderNumber(settings.orderNumberConfig, {
        date: new Date(`${draft.date}T00:00:00Z`),
        sequence: nextSequence!.value,
        city: draft.recipient.city,
        department: draft.recipient.department,
      });
      if (nextSequence) memorySequences.set(nextSequence.scope, nextSequence.value);
      const status = existing ? draft.status : draft.status === "borrador" ? "generado" : draft.status;
      const record = toRecord({ ...draft, orderNumber, status }, existing);
      if (index >= 0) memoryLabels[index] = record;
      else memoryLabels.unshift(record);
      return record;
    },
    async deleteLabel(id) {
      const index = memoryLabels.findIndex((label) => label.id === id);
      if (index >= 0) memoryLabels.splice(index, 1);
    },
    async duplicateLabel(id) {
      const label = memoryLabels.find((item) => item.id === id);
      if (!label) return null;
      return { ...createBlankLabelDraft(), sender: label.sender, recipient: label.recipient, carrier: label.carrier, paymentMethod: label.paymentMethod, codAmount: label.codAmount, packageCount: label.packageCount };
    },
    async getSettings() {
      return memorySettings;
    },
    async saveSettings(settings) {
      memorySettings = settings;
      return settings;
    },
    async estimateNextOrderNumber(settings, draft) {
      const nextSequence = getNextSequence(settings, draft);
      return formatOrderNumber(settings.orderNumberConfig, {
        date: new Date(`${draft.date}T00:00:00Z`),
        sequence: nextSequence.value,
        city: draft.recipient.city,
        department: draft.recipient.department,
      });
    },
  };
}

export function getLabelStore(): LabelStore {
  return createLocalLabelStore();
}
