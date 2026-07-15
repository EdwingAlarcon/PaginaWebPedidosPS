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
let memorySequence = 0;

function toRecord(draft: LabelDraft): LabelRecord {
  const now = new Date().toISOString();
  return {
    ...draft,
    id: draft.id ?? crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
    pdfUrl: null,
    createdBy: null,
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
      const orderNumber = manual || formatOrderNumber(settings.orderNumberConfig, {
        date: new Date(`${draft.date}T00:00:00Z`),
        sequence: ++memorySequence,
        city: draft.recipient.city,
        department: draft.recipient.department,
      });
      const record = toRecord({ ...draft, orderNumber, status: "generado" });
      const index = memoryLabels.findIndex((label) => label.id === record.id);
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
      const scope = getSequenceScope(settings.orderNumberConfig.resetPolicy, new Date(`${draft.date}T00:00:00Z`));
      void scope;
      return formatOrderNumber(settings.orderNumberConfig, {
        date: new Date(`${draft.date}T00:00:00Z`),
        sequence: memorySequence + 1,
        city: draft.recipient.city,
        department: draft.recipient.department,
      });
    },
  };
}

export function getLabelStore(): LabelStore {
  return createLocalLabelStore();
}
