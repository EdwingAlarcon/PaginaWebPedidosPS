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

const storageKeys = {
  labels: "purpleshop.rotulos.labels",
  settings: "purpleshop.rotulos.settings",
  sequences: "purpleshop.rotulos.sequences",
};
const memoryLabels: LabelRecord[] = [];
let memorySettings: LabelSettings = defaultSettings;
const memorySequences = new Map<string, number>();

function usesBrowserStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readStorage<T>(key: string, fallback: T): T {
  if (!usesBrowserStorage()) return fallback;
  const stored = window.localStorage.getItem(key);
  if (!stored) return fallback;
  try {
    return JSON.parse(stored) as T;
  } catch {
    return fallback;
  }
}

function writeStorage(key: string, value: unknown) {
  if (usesBrowserStorage()) window.localStorage.setItem(key, JSON.stringify(value));
}

function readLabels(): LabelRecord[] {
  return usesBrowserStorage() ? readStorage<LabelRecord[]>(storageKeys.labels, []) : [...memoryLabels];
}

function writeLabels(labels: LabelRecord[]) {
  if (usesBrowserStorage()) {
    writeStorage(storageKeys.labels, labels);
    return;
  }
  memoryLabels.splice(0, memoryLabels.length, ...labels);
}

function readSettings(): LabelSettings {
  return usesBrowserStorage() ? readStorage<LabelSettings>(storageKeys.settings, defaultSettings) : memorySettings;
}

function writeSettings(settings: LabelSettings) {
  if (usesBrowserStorage()) {
    writeStorage(storageKeys.settings, settings);
    return;
  }
  memorySettings = settings;
}

function readSequences(): Map<string, number> {
  if (!usesBrowserStorage()) return new Map(memorySequences);
  return new Map(Object.entries(readStorage<Record<string, number>>(storageKeys.sequences, {})));
}

function writeSequences(sequences: Map<string, number>) {
  if (usesBrowserStorage()) {
    writeStorage(storageKeys.sequences, Object.fromEntries(sequences));
    return;
  }
  memorySequences.clear();
  sequences.forEach((value, key) => memorySequences.set(key, value));
}

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

function getNextSequence(settings: LabelSettings, draft: LabelDraft, sequences: Map<string, number>): { scope: string; value: number } {
  const date = new Date(`${draft.date}T00:00:00Z`);
  const scope = getSequenceScope(settings.orderNumberConfig.resetPolicy, date);
  const currentValue = sequences.get(scope);
  return {
    scope,
    value: currentValue === undefined ? settings.orderNumberConfig.initialSequence : currentValue + 1,
  };
}

export function createLocalLabelStore(): LabelStore {
  return {
    async listLabels() {
      return readLabels().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },
    async getLabel(id) {
      return readLabels().find((label) => label.id === id) ?? null;
    },
    async saveLabel(draft, settings) {
      const labels = readLabels();
      const sequences = readSequences();
      const manual = draft.orderNumber.trim();
      if (manual && labels.some((label) => label.orderNumber === manual && label.id !== draft.id)) {
        throw new Error("duplicate_order_number");
      }
      const index = labels.findIndex((label) => label.id === draft.id);
      const existing = index >= 0 ? labels[index] : undefined;
      const nextSequence = manual ? undefined : getNextSequence(settings, draft, sequences);
      const orderNumber = manual || formatOrderNumber(settings.orderNumberConfig, {
        date: new Date(`${draft.date}T00:00:00Z`),
        sequence: nextSequence!.value,
        city: draft.recipient.city,
        department: draft.recipient.department,
      });
      if (nextSequence) {
        sequences.set(nextSequence.scope, nextSequence.value);
        writeSequences(sequences);
      }
      const status = existing ? draft.status : draft.status === "borrador" ? "generado" : draft.status;
      const record = toRecord({ ...draft, orderNumber, status }, existing);
      if (index >= 0) labels[index] = record;
      else labels.unshift(record);
      writeLabels(labels);
      return record;
    },
    async deleteLabel(id) {
      writeLabels(readLabels().filter((label) => label.id !== id));
    },
    async duplicateLabel(id) {
      const label = readLabels().find((item) => item.id === id);
      if (!label) return null;
      return {
        ...createBlankLabelDraft(),
        sender: label.sender,
        recipient: label.recipient,
        carrier: label.carrier,
        paymentMethod: label.paymentMethod,
        codAmount: label.codAmount,
        packageCount: label.packageCount,
      };
    },
    async getSettings() {
      return readSettings();
    },
    async saveSettings(settings) {
      writeSettings(settings);
      return settings;
    },
    async estimateNextOrderNumber(settings, draft) {
      const nextSequence = getNextSequence(settings, draft, readSequences());
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
